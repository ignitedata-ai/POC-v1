/**
 * genericTemplate.js
 *
 * The generic F-Tag correction packet template stored as TipTap JSON.
 * This is the hidden template used by "Create from Template" — it is
 * NOT stored in the database and does NOT appear in the repo list.
 *
 * When a user creates from this template, the F-Tag number and title
 * are auto-replaced in headings. All fill-in blanks are represented
 * as placeholder nodes.
 *
 * Structure (mirrors the 7-section packet):
 *   1. Plan of Correction
 *   2. Policy
 *   3. Practice Guideline
 *   4. Validation Checklist
 *   5. In-Service Training Guide
 *   6. Training Attendance Form
 *   7. QA Committee Audit Form
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate the generic template with the user's F-Tag and title substituted.
 *
 * @param {string} fTagNumber - e.g., "600" (just the number part)
 * @param {string} fTagTitle  - e.g., "Infection Control"
 * @returns {Object} TipTap document JSON
 */
function generateGenericTemplate(fTagNumber, fTagTitle) {
  function ph(key, label, type = 'text', required = false, helpText = '') {
    return {
      type: 'placeholder',
      attrs: {
        id: uuidv4(),
        key,
        label,
        type,
        required,
        helpText,
        options: [],
      },
    };
  }

  function text(content, marks = []) {
    const node = { type: 'text', text: content };
    if (marks.length > 0) node.marks = marks;
    return node;
  }

  function bold(content) {
    return text(content, [{ type: 'bold' }]);
  }

  function italic(content) {
    return text(content, [{ type: 'italic' }]);
  }

  function boldItalic(content) {
    return text(content, [{ type: 'bold' }, { type: 'italic' }]);
  }

  const fTag = `F-${fTagNumber}`;

  return {
    type: 'doc',
    content: [
      // ===== SECTION 1: PLAN OF CORRECTION =====
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [text('Plan of Correction/Allegation of Compliance')],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [text(`${fTag} \u2013 ${fTagTitle}`)],
      },
      {
        type: 'paragraph',
        content: [
          bold('Tag Cited: '),
          text(fTag),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Regulatory Reference: '),
          ph('regulatory_section', 'Regulatory Section', 'text', true, 'e.g., \u00A7483.10(c)(6)'),
          text(` \u2013 ${fTagTitle}`),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Issue Cited: '),
          ph('issue_cited', 'Specific Concern Cited', 'text', true, 'The specific issue cited by the surveyor'),
        ],
      },
      {
        type: 'paragraph',
        content: [
          italic('Preparation and/or execution of this plan do not constitute admission or agreement by the provider that a deficiency exists. This response is also not to be construed as an admission of fault by the facility, its employees, agents or other individuals who draft or may be discussed in this response and plan of correction. This plan of correction is submitted as the facility\'s credible allegation of compliance.'),
        ],
      },
      // Section 1
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [text('1. Immediate action(s) taken for the resident(s) found to have been affected include:')],
      },
      {
        type: 'paragraph',
        content: [
          ph('immediate_actions', 'Immediate Actions Taken', 'text', true, 'Include actions performed to address the citation and the date corrective actions were completed. May require the use of outside resources.'),
        ],
      },
      // Section 2
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [text('2. Identification of other residents having the potential to be affected was accomplished by:')],
      },
      {
        type: 'paragraph',
        content: [
          text('The facility has determined that '),
          ph('affected_residents', 'Affected Residents Category', 'text', true, 'Insert percentage/category/type of residents'),
          text(' residents have the potential to be affected.'),
        ],
      },
      {
        type: 'paragraph',
        content: [
          ph('identification_actions', 'Identification Actions', 'text', false, 'Include actions performed to verify similar occurrences do not occur and the date those actions were completed.'),
        ],
      },
      // Section 3
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [text('3. Actions taken/systems put into place to reduce the risk of future occurrence include:')],
      },
      {
        type: 'paragraph',
        content: [
          text('All '),
          ph('staff_category', 'Staff Category/Department/Credentials', 'text', true, 'Insert staff category/department/credentials'),
          text(' were in-serviced regarding the facility policy for '),
          ph('policy_topic', 'Policy Topic', 'text', true),
          text('.'),
        ],
      },
      {
        type: 'paragraph',
        content: [
          ph('additional_actions', 'Additional Details', 'text', false, 'Include education that was provided, and by whom. Include any policy and procedural changes that were implemented and any effective dates.'),
        ],
      },
      // Section 4
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [text('4. How the corrective action(s) will be monitored to ensure the practice will not recur:')],
      },
      {
        type: 'paragraph',
        content: [
          text('The '),
          ph('monitoring_responsible', 'Responsible Person/Title', 'text', true, 'DON/Administrator/Dietary Manager/Social Services Directors, etc.'),
          text(' will complete random weekly audits for '),
          ph('audit_duration', 'Audit Duration', 'text', true, 'Insert length of time, e.g., six (6)'),
          text(' consecutive weeks of: '),
          ph('audit_scope', 'Audit Scope', 'text', true, 'What will be audited'),
          text('.'),
        ],
      },
      {
        type: 'paragraph',
        content: [
          text('Validation checklists will be reviewed by: '),
          ph('checklist_reviewer', 'Checklist Reviewer', 'text', false),
          text('.'),
        ],
      },
      {
        type: 'paragraph',
        content: [text('Audit records will be reviewed by the Risk Management/Quality Assurance Committee until such time consistent substantial compliance has been achieved as determined by the committee.')],
      },
      {
        type: 'paragraph',
        content: [text('Audit results will be shared with the Resident/Family Group Council for comment and suggestions.')],
      },
      {
        type: 'paragraph',
        content: [
          ph('additional_monitoring', 'Additional Correction Actions', 'text', false, 'Insert additional correction actions, which may include monitoring efforts such as rounds and systems checks, including frequency and the responsible individuals.'),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Corrective action completion date: '),
          ph('completion_date', 'Completion Date', 'date', true, 'Target date for completing all corrective actions'),
          text('.'),
        ],
      },

      // ===== SECTION 2: POLICY =====
      { type: 'horizontalRule' },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [text(`${fTagTitle} Policy`)],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [italic('Date Implemented:')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [italic('Date Reviewed/Revised:')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [italic('Reviewed/Revised By:')] }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_date_implemented', 'Date Implemented', 'date')] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_date_reviewed', 'Date Reviewed/Revised', 'date')] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_reviewed_by', 'Reviewed/Revised By', 'text')] }] },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('Policy:')],
      },
      {
        type: 'paragraph',
        content: [text('Gather and review any pertinent policies regarding the citation, as well as other aspects within the F-tag that were not cited to ensure full compliance at the time of re-survey. Make any changes to current policies as needed. Educate staff who will be responsible for adhering to these policies.')],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('Policy Explanation and Compliance Guidelines:')],
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [ph('guideline_1', 'Guideline 1', 'text', false, 'Enter first compliance guideline')] }] },
        ],
      },

      // ===== SECTION 3: PRACTICE GUIDELINE =====
      { type: 'horizontalRule' },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [text('Practice Guideline')],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [text(fTagTitle)],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('Why It\'s Done:')],
      },
      {
        type: 'paragraph',
        content: [
          text('To '),
          ph('practice_purpose', 'Purpose (assure/prevent/promote/etc.)', 'text', true),
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('First Things First:')],
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Read: '), ph('first_read', 'What to Read', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Gather: '), ph('first_gather', 'What to Gather', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Review: '), ph('first_review', 'What to Review', 'text')] }] },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('What You Need:')],
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Information regarding: '), ph('need_info', 'Information Topic', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Assessment of: '), ph('need_assessment', 'Assessment Topic', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Medical record to include: '), ph('need_medical_record', 'Medical Record Items', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility policies and procedures.')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Contact information of person(s) to be notified.')] }] },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('How You Do It:')],
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Follow: '), ph('howto_follow', 'Procedure to Follow', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Explain: '), ph('howto_explain', 'What to Explain', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Educate: '), ph('howto_educate', 'Education Topic', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Monitor: '), ph('howto_monitor', 'Monitoring Process', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Review: '), ph('howto_review', 'Review Process', 'text')] }] },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('Write It Down:')],
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document: '), ph('doc_1', 'Documentation Item 1', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document: '), ph('doc_2', 'Documentation Item 2', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Record: '), ph('doc_3', 'Record Item', 'text')] }] },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('Report:')],
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Significant change in: '), ph('report_change', 'Change to Report', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any actions related to: '), ph('report_actions', 'Related Actions', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any issues/problems related to: '), ph('report_issues', 'Related Issues', 'text')] }] },
        ],
      },

      // ===== SECTION 4: VALIDATION CHECKLIST =====
      { type: 'horizontalRule' },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [text('Validation Checklist')],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [text(fTagTitle)],
      },
      {
        type: 'paragraph',
        content: [
          bold('Purpose: '),
          text('To '),
          ph('checklist_purpose', 'Checklist Purpose', 'text', false, 'assure/determine/etc.'),
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('#')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Evaluation Item')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Correct (Y/N)')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Comments')] }] },
            ],
          },
          ...Array.from({ length: 7 }, (_, i) => ({
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [text(`${i + 1}.`)] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
            ],
          })),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Reviewer Name: '),
          ph('val_reviewer_name', 'Reviewer Name', 'text'),
          text('    '),
          bold('Title: '),
          ph('val_reviewer_title', 'Reviewer Title', 'text'),
          text('    '),
          bold('Date: '),
          ph('val_review_date', 'Review Date', 'date'),
        ],
      },

      // ===== SECTION 5: IN-SERVICE TRAINING GUIDE =====
      { type: 'horizontalRule' },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [text('In-Service Training Guide')],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [text(`${fTag} \u2013 ${fTagTitle}`)],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [boldItalic('Review Regulation(s):')],
      },
      {
        type: 'paragraph',
        content: [
          ph('regulation_reference', 'Regulation Reference', 'text', true, 'e.g., \u00A7483.21(a)(3)'),
          text(' \u2013 '),
          ph('regulation_text', 'Regulation Text', 'text', false, 'Full text of the regulation'),
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [boldItalic('Review Intent of Regulation:')],
      },
      {
        type: 'paragraph',
        content: [text('The intent of this requirement is that:')],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('Each resident\'s: '), ph('intent_resident', 'Resident Rights/Care Requirement', 'text')] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text('To assure: '), ph('intent_assurance', 'Assurance Statement', 'text')] }] },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('Review Interpretive Guidelines:')],
      },
      {
        type: 'paragraph',
        content: [ph('interpretive_guidelines', 'Interpretive Guidelines', 'text', false, 'Insert guidance on how surveyors interpret the regulations')],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('Facility Policy and Practice')],
      },
      {
        type: 'paragraph',
        content: [boldItalic('Review:')],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [text(`Facility's ${fTagTitle} \u2013 Plan of Correction.`)] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text(`Facility's ${fTagTitle} \u2013 Policy.`)] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text(`Facility's ${fTagTitle} \u2013 Practice Guideline.`)] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text(`Facility's ${fTagTitle} \u2013 Validation Checklist.`)] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [text(`Facility's ${fTagTitle} \u2013 QA Committee Audit Form.`)] }] },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [bold('Record of Training')],
      },
      {
        type: 'paragraph',
        content: [text('Complete Record of In-service Training and Attendance Form. Be sure all participants sign-in.')],
      },

      // ===== SECTION 6: TRAINING ATTENDANCE FORM =====
      { type: 'horizontalRule' },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [text('Record of In-Service Training and Attendance Form')],
      },
      {
        type: 'paragraph',
        content: [
          text(`The following personnel attended the ${fTagTitle} in-service training program conducted on `),
          ph('training_date', 'Training Date', 'date', true, 'Date the in-service training was conducted'),
          text('.'),
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Printed Name')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Signature')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('License Number (as applicable)')] }] },
            ],
          },
          ...Array.from({ length: 10 }, () => ({
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
            ],
          })),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Time Started: '),
          ph('training_time_started', 'Time Started', 'text'),
          text('    '),
          bold('Time Ended: '),
          ph('training_time_ended', 'Time Ended', 'text'),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Instructor (Printed Name): '),
          ph('instructor_name', 'Instructor Name', 'text'),
          text('    '),
          bold('Instructor (Signature): '),
          ph('instructor_signature', 'Instructor Signature', 'text'),
        ],
      },
      {
        type: 'paragraph',
        content: [italic('Use additional sheets as necessary.')],
      },

      // ===== SECTION 7: QA COMMITTEE AUDIT FORM =====
      { type: 'horizontalRule' },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [text('QA Committee Audit Form')],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [text(`${fTag} \u2013 ${fTagTitle}`)],
      },
      {
        type: 'paragraph',
        content: [bold('Confidential Data: Risk Management/QA Committee Audit Form')],
      },
      {
        type: 'paragraph',
        content: [
          bold('Purpose: '),
          text('To determine if '),
          ph('qa_purpose', 'QA Audit Purpose', 'text', false),
          text('.'),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Instructions: '),
          text('Randomly select '),
          ph('qa_sample_type', 'Sample Type', 'text', false, 'residents/medical records/staff members, etc.'),
          text('. Evaluate: '),
          ph('qa_evaluate', 'Evaluation Criteria', 'text', false),
          text('. Record information below. Provide completed report to the Risk Management/QA Committee.'),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Week of: '),
          ph('qa_week_of', 'Week Of', 'date'),
          text('    '),
          bold('Date Communicated to QAA Committee: '),
          ph('qa_communicated_date', 'Date Communicated', 'date'),
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('#')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Item')] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Comments')] }] },
            ],
          },
          ...Array.from({ length: 10 }, (_, i) => ({
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [text(`${i + 1}`)] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
            ],
          })),
        ],
      },
      {
        type: 'paragraph',
        content: [
          bold('Signature of Reviewer: '),
          ph('qa_reviewer_signature', 'Reviewer Signature', 'text'),
        ],
      },
    ],
  };
}

module.exports = { generateGenericTemplate };
