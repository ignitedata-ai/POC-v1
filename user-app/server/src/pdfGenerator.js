/**
 * pdfGenerator.js
 *
 * Generates a filled-in CMS-2567 PDF from the blank template.
 * For each F-Tag deficiency, fills in:
 *   - Header fields (facility name, address, etc.)
 *   - ID Prefix Tag columns (left + right) with the F-Tag number
 *   - Summary Statement of Deficiencies with the deficiency narrative
 *   - Plan of Correction with the 4-step POC text
 *   - Completion Date
 *
 * When text overflows a single page, the template is duplicated with
 * "(to be continued)" / "(continued from previous page)" markers.
 */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.resolve(__dirname, '../assets/CMS-2567-1.pdf');

// Field rects from PDF inspection (in points). Y is from bottom of page.
// pdf-lib uses bottom-left origin while PyMuPDF reported top-left,
// so we use the form field objects directly by name instead of hardcoding coords.

const FONT_SIZE = 9;
const LINE_HEIGHT = FONT_SIZE * 1.35;
const PAGE_NUM_FONT_SIZE = 7;

// Measured field dimensions for text capacity estimation:
// "Summary Statement of Deficiencies": ~254pt wide x 314pt tall
// "Plan of Correction": ~253pt wide x 315pt tall
// Using conservative margins inside the field boxes
const FIELD_PADDING = 6;

const SUMMARY_FIELD = {
  x: 94.80 + FIELD_PADDING,
  width: 348.47 - 94.80 - FIELD_PADDING * 2,
  topY: 258.50 + FIELD_PADDING,
  bottomY: 572.45 - FIELD_PADDING,
};

const POC_FIELD = {
  x: 431.03 + FIELD_PADDING,
  width: 683.52 - 431.03 - FIELD_PADDING * 2,
  topY: 259.09 + FIELD_PADDING,
  bottomY: 573.63 - FIELD_PADDING,
};

const TAG_LEFT_FIELD = {
  x: 12.95 + FIELD_PADDING,
  width: 85.26 - 12.95 - FIELD_PADDING * 2,
  topY: 259.09 + FIELD_PADDING,
  bottomY: 573.04 - FIELD_PADDING,
};

const TAG_RIGHT_FIELD = {
  x: 356.84 + FIELD_PADDING,
  width: 420.89 - 356.84 - FIELD_PADDING * 2,
  topY: 258.50 + FIELD_PADDING,
  bottomY: 571.86 - FIELD_PADDING,
};

const DATE_FIELD = {
  x: 692.02 + FIELD_PADDING,
  width: 777.87 - 692.02 - FIELD_PADDING * 2,
  topY: 259.19 + FIELD_PADDING,
  bottomY: 574.12 - FIELD_PADDING,
};

/**
 * Wrap text to fit within a given width using a font and size.
 * Returns an array of lines.
 */
function wrapText(text, font, fontSize, maxWidth) {
  if (!text) return [];
  const lines = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

/**
 * Calculate how many lines fit in a field's vertical space.
 */
function linesPerField(field) {
  const height = field.bottomY - field.topY;
  return Math.floor(height / LINE_HEIGHT);
}

/**
 * Split wrapped lines into page chunks, adding continuation markers.
 * Returns an array of string chunks, one per page.
 */
function paginateText(text, font, fontSize, field) {
  const lines = wrapText(text, font, fontSize, field.width);
  const maxLines = linesPerField(field);

  if (lines.length <= maxLines) {
    return [lines.join('\n')];
  }

  const continuedHeader = '(continued from previous page)';
  const continuedFooter = '(to be continued)';

  // First page gets fewer lines to leave room for the footer marker
  const firstPageLines = maxLines - 2;
  // Subsequent pages lose lines for both header and footer markers
  const middlePageLines = maxLines - 4;
  // Last page loses lines only for the header marker
  const lastPageHeaderLines = 2;

  const chunks = [];
  let offset = 0;

  // First page
  const firstChunk = lines.slice(offset, offset + firstPageLines);
  firstChunk.push('', continuedFooter);
  chunks.push(firstChunk.join('\n'));
  offset += firstPageLines;

  // Middle and last pages
  while (offset < lines.length) {
    const remaining = lines.length - offset;
    const availableLines = maxLines - lastPageHeaderLines;

    if (remaining <= availableLines) {
      // Last page
      const lastChunk = [continuedHeader, '', ...lines.slice(offset)];
      chunks.push(lastChunk.join('\n'));
      break;
    } else {
      // Middle page
      const chunk = [continuedHeader, '', ...lines.slice(offset, offset + middlePageLines), '', continuedFooter];
      chunks.push(chunk.join('\n'));
      offset += middlePageLines;
    }
  }

  return chunks;
}

/**
 * Draw multiline text into a field area on a page.
 * Uses bottom-left PDF coordinates: the field topY from inspection is actually
 * measured from the TOP of the page, so we need to convert.
 */
function drawTextField(page, text, field, font, fontSize, pageHeight) {
  if (!text) return;

  const lines = text.split('\n');
  // Convert from top-origin to bottom-origin coordinates
  const startY = pageHeight - field.topY - fontSize;
  let y = startY;

  for (const line of lines) {
    if (y < pageHeight - field.bottomY) break;
    page.drawText(line, {
      x: field.x,
      y,
      size: fontSize,
      font,
      color: rgb(0.05, 0.05, 0.15),
    });
    y -= LINE_HEIGHT;
  }
}

// Map from header_json keys to PDF form field names
const HEADER_FORM_FIELDS = {
  providerNumber: 'Provider/Supplier/CLIA ID Number',
  building: 'Multiple Construction - Building',
  wing: 'Multiple Construction - Wing',
  dateSurveyCompleted: 'Date Survey Completed_af_date',
  facilityName: 'Name of Facility Surveyed',
  facilityAddress: 'Facility Address',
  accreditingOrg: 'Name of AO Performing Survey (if applicable)',
};

const HEADER_FONT_SIZE = 12;

/**
 * Generate the filled CMS-2567 PDF for a session.
 *
 * @param {Object} session - Session row from DB (includes header_json)
 * @param {Object[]} deficiencies - Array of deficiency objects with steps
 * @returns {Promise<Uint8Array>} The PDF bytes
 */
async function generateCms2567Pdf(session, deficiencies) {
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const outputDoc = await PDFDocument.create();
  const font = await outputDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await outputDoc.embedFont(StandardFonts.HelveticaBold);

  let header = null;
  try { header = session.header_json ? JSON.parse(session.header_json) : null; } catch (e) {}

  let totalPages = 0;

  for (const def of deficiencies) {
    // Build the full POC text from the 4 steps
    const pocText = buildPocText(def.steps);
    const narrativeText = def.narrative || '';
    const completionDate = getLatestCompletionDate(def.steps) || def.completion_date || null;

    // Paginate both columns
    const narrativeChunks = paginateText(narrativeText, font, FONT_SIZE, SUMMARY_FIELD);
    const pocChunks = paginateText(pocText, font, FONT_SIZE, POC_FIELD);
    const pageCount = Math.max(narrativeChunks.length, pocChunks.length, 1);

    for (let i = 0; i < pageCount; i++) {
      // Load fresh template for each page
      const templateDoc = await PDFDocument.load(templateBytes);
      const templateForm = templateDoc.getForm();

      // Fill header fields via form fields BEFORE flattening
      if (header) {
        if (i === 0 && totalPages === 0) {
          console.log('[PDF] Header data:', JSON.stringify(header));
        }
        for (const [key, formFieldName] of Object.entries(HEADER_FORM_FIELDS)) {
          if (header[key]) {
            try {
              const field = templateForm.getTextField(formFieldName);
              field.setFontSize(HEADER_FONT_SIZE);
              field.setText(String(header[key]));
            } catch (e) {
              console.warn(`[PDF] Could not set header field "${formFieldName}":`, e.message);
            }
          }
        }
      }

      // Flatten form fields (renders filled values into the page)
      templateForm.flatten();

      const [copiedPage] = await outputDoc.copyPages(templateDoc, [0]);
      outputDoc.addPage(copiedPage);
      totalPages++;

      const pageHeight = copiedPage.getHeight();

      // Fill F-Tag in left and right tag columns
      drawTextField(copiedPage, def.f_tag, TAG_LEFT_FIELD, boldFont, 9, pageHeight);
      drawTextField(copiedPage, def.f_tag, TAG_RIGHT_FIELD, boldFont, 9, pageHeight);

      // Fill narrative (left column)
      if (narrativeChunks[i]) {
        drawTextField(copiedPage, narrativeChunks[i], SUMMARY_FIELD, font, FONT_SIZE, pageHeight);
      }

      // Fill POC (right column)
      if (pocChunks[i]) {
        drawTextField(copiedPage, pocChunks[i], POC_FIELD, font, FONT_SIZE, pageHeight);
      }

      // Fill completion date only on the first page of each deficiency
      if (i === 0 && completionDate) {
        drawTextField(copiedPage, completionDate, DATE_FIELD, font, FONT_SIZE, pageHeight);
      }

      // Page number at bottom
      const pageLabel = `Page ${totalPages}`;
      copiedPage.drawText(pageLabel, {
        x: 370,
        y: 18,
        size: PAGE_NUM_FONT_SIZE,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  return await outputDoc.save();
}

/**
 * Build combined POC text from the 4 step objects.
 */
function buildPocText(steps) {
  if (!steps || steps.length === 0) return '(Not yet drafted)';

  return steps.map((s) => {
    const content = s.user_content || s.ai_suggestion || '(Not yet drafted)';
    const dateStr = s.completion_date ? `\nCompletion Date: ${s.completion_date}` : '';
    return `${s.step_number}.   ${content}${dateStr}`;
  }).join('\n');
}

/**
 * Get the latest completion date across all steps.
 */
function getLatestCompletionDate(steps) {
  if (!steps || steps.length === 0) return null;
  const dates = steps.map((s) => s.completion_date).filter(Boolean);
  if (dates.length === 0) return null;
  dates.sort();
  return dates[dates.length - 1];
}

module.exports = { generateCms2567Pdf };
