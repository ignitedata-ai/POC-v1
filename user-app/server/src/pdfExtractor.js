/**
 * pdfExtractor.js
 *
 * Extracts text from PDF buffers using pdfjs-dist.
 * Returns both full text and left-column-only text.
 *
 * CMS-2567 is a two-column form: the left column contains F-Tag numbers
 * with severity/scope info, the right column contains narrative findings.
 * We use x-coordinates from pdfjs-dist to isolate left-column text,
 * so F-Tag references in the right-column narrative are ignored.
 */

async function extractTextFromPdf(pdfBuffer) {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

  const uint8Array = new Uint8Array(pdfBuffer);
  const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  const fullPageTexts = [];
  const leftColumnTexts = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    // The left column in CMS-2567 is roughly the left 40% of the page.
    // Using 45% as threshold to be safe with slight variations.
    const leftColumnThreshold = viewport.width * 0.45;

    const allStrings = [];
    const leftStrings = [];

    for (const item of content.items) {
      if (!item.str) continue;
      allStrings.push(item.str);

      // item.transform[4] = x-coordinate of the text item
      const x = item.transform[4];
      if (x < leftColumnThreshold) {
        leftStrings.push(item.str);
      }
    }

    fullPageTexts.push(allStrings.join(' '));
    leftColumnTexts.push(leftStrings.join(' '));
  }

  return {
    fullText: fullPageTexts.join('\n\n'),
    leftColumnText: leftColumnTexts.join('\n\n'),
  };
}

module.exports = { extractTextFromPdf };
