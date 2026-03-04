/**
 * seedData.js
 *
 * Contains the full F-578 and F-655 packet templates as TipTap JSON.
 * Each packet includes all sections: Plan of Correction, Policy,
 * Practice Guideline, Validation Checklist, In-Service Training Guide,
 * Training Attendance Form, and QA Committee Audit Form.
 *
 * Placeholders are represented as inline nodes of type "placeholder"
 * with structured attributes (key, label, type, required, helpText, options).
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Helper to create a placeholder node in TipTap JSON format.
 */
function ph(key, label, type = 'text', required = false, helpText = '', options = []) {
  return {
    type: 'placeholder',
    attrs: {
      id: uuidv4(),
      key,
      label,
      type,
      required,
      helpText,
      options,
    },
  };
}

/**
 * Helper to create a text node.
 */
function text(content, marks = []) {
  const node = { type: 'text', text: content };
  if (marks.length > 0) {
    node.marks = marks;
  }
  return node;
}

/**
 * Helper for bold text.
 */
function bold(content) {
  return text(content, [{ type: 'bold' }]);
}

/**
 * Helper for italic text.
 */
function italic(content) {
  return text(content, [{ type: 'italic' }]);
}

/**
 * Helper for bold+italic text.
 */
function boldItalic(content) {
  return text(content, [{ type: 'bold' }, { type: 'italic' }]);
}

// ---------------------------------------------------------------------------
// F-578 FULL PACKET
// ---------------------------------------------------------------------------

const f578Content = {
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
      content: [text('F-578 \u2013 Request/Refuse/Discontinue Treatment')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Tag Cited: '),
        text('F-578'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Regulatory Reference: '),
        text('\u00A7483.10(c)(6) \u2013 Request/Refuse/Discontinue Treatment'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Issue Cited: '),
        ph('issue_cited_f578', 'Issue Cited', 'text', true, 'The specific issue cited by the surveyor'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        italic('Preparation and/or execution of this plan does not constitute admission or agreement by the provider that a deficiency exists. This response is also not to be construed as an admission of fault by the facility, its employees, agents or other individuals who draft or may be discussed in this response and plan of correction. This plan of correction is submitted as the facility\'s credible allegation of compliance.'),
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
        text('The medical record for Resident #'),
        ph('resident_identifier', 'Resident Identifier', 'text', true, 'Resident number referenced in the citation'),
        text(' was reviewed. The physician was contacted, and new orders were obtained as needed. The resident\'s current code status and advance directive preferences were verified and documented in the medical record. Communication of the resident\'s code status was updated in all designated sections of the record including '),
        ph('designated_record_sections', 'Designated Record Sections', 'text', false, 'Specific sections of the medical record where code status is documented'),
        text('.'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        text('The resident and/or the resident\'s representative were informed of the resident\'s right to formulate an advance directive and to accept or refuse medical treatment. The discussion and outcome were documented in the medical record.'),
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
        text('The facility has determined that all residents have the potential to be affected.'),
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
        text('All licensed nurses will be re-educated on the facility\'s advance directive policy, which includes:'),
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('Informing residents and/or representatives of the right to formulate an advance directive.')] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('Accurately documenting code status and advance directive preferences in the medical record.')] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('Ensuring consistent communication of code status across all care documentation and designated record sections.')] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('Procedures for notifying the physician and updating orders when a resident\'s code status or advance directive preferences change.')] }],
        },
      ],
    },
    // Section 4
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [text('4. How the corrective action(s) will be monitored to ensure the practice will not reoccur:')],
    },
    {
      type: 'paragraph',
      content: [
        text('The Director of Nursing Services (DNS), or designee, will complete random weekly audits of advance directive documentation and code status communication for '),
        ph('audit_duration_weeks', 'Audit Duration (Weeks)', 'number', true, 'Number of consecutive weeks for auditing'),
        text(' consecutive weeks. Random chart audits will be completed to ensure:'),
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('Code status is accurately documented and consistently communicated across all designated sections of the medical record.')] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('Advance directive discussions are taking place and being documented.')] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('Physician orders reflect the current code status.')] }],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        text('Audit records will be reviewed by the Risk Management/Quality Assurance Committee until such time consistent substantial compliance has been achieved as determined by the committee.'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        text('Audit results will be shared with the Resident/Family Group Council for comment and suggestions.'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Corrective action completion date: '),
        ph('completion_date_f578', 'Completion Date', 'date', true, 'Target date for completing all corrective actions'),
        text('.'),
      ],
    },

    // ===== SECTION 2: POLICY =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('Advance Directives / Code Status Communication Policy')],
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
            { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_date_implemented_f578', 'Date Implemented', 'date', false)] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_date_reviewed_f578', 'Date Reviewed/Revised', 'date', false)] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_reviewed_by_f578', 'Reviewed/Revised By', 'text', false)] }] },
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
      content: [
        text('The facility will inform and provide each resident, or the resident\'s representative, with information concerning the resident\'s right to accept or refuse medical or surgical treatment, including the right to formulate advance directives. The facility will communicate each resident\'s code status and advance directive preferences consistently throughout the medical record and in all care-related documentation.'),
      ],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [bold('Policy Explanation and Compliance Guidelines:')],
    },
    {
      type: 'orderedList',
      content: [
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('Upon admission, the facility will:')] },
            {
              type: 'orderedList',
              attrs: { start: 1 },
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Inform the resident and/or resident\'s representative of the right to formulate an advance directive, including the right to accept or refuse medical or surgical treatment.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document the discussion and the resident\'s decision regarding advance directives in the medical record.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Obtain and document the resident\'s code status (e.g., Full Code, DNR, DNI, Comfort Measures Only).')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('If the resident provides an advance directive, place a copy in the medical record.')] }] },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('The resident\'s code status shall be communicated and documented in the following locations:')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Physician orders.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Care plan.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Face sheet or demographic record.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Electronic health record (EHR) alerts or flags, if applicable.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any additional facility-designated sections.')] }] },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('When a change in code status occurs, the licensed nurse on duty shall update all designated documentation locations and notify the attending physician to obtain updated orders.')] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('The facility shall not condition the provision of care or otherwise discriminate against a resident based on whether or not the resident has executed an advance directive.')] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [text('The Social Services Director, or designee, will ensure advance directive information is communicated upon admission and updated as needed during the resident\'s stay.')] }],
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [bold('References:')],
    },
    {
      type: 'paragraph',
      content: [
        text('Centers for Medicare & Medicaid Services, Department of Health and Human Services. '),
        italic('State Operations Manual (SOM): Appendix PP Guidance to Surveyors for Long Term Care Facilities.'),
        text(' F578 \u2013 Request/Refuse/Discontinue Treatment.'),
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
      content: [text('Advance Directives and Code Status Communication')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [bold('Why It\'s Done:')],
    },
    {
      type: 'paragraph',
      content: [text('To provide a consistent process for documenting, communicating, and honoring each resident\'s advance directive preferences and code status throughout their medical record.')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [bold('What You Need:')],
    },
    {
      type: 'orderedList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Medical record.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Advance directive documents (if provided by resident or representative).')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Current physician orders.')] }] },
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
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('Review the current clinical information:')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Current code status in physician orders.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Advance directive documents on file.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Code status documented in the care plan.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Code status on face sheet or demographic record.')] }] },
              ],
            },
          ],
        },
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
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('Upon admission:')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Discuss advance directive rights with the resident and/or representative.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document the discussion and decision in the medical record.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Obtain and document the code status.')] }] },
              ],
            },
          ],
        },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Ensure the code status is documented consistently in all designated record sections.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('When code status changes, update all documentation locations and notify the physician for updated orders.')] }] },
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
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document the advance directive discussion and outcome.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document code status in physician orders, care plan, and face sheet.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('If advance directive documents are provided, file copies in the medical record.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document any changes to code status and the notification of the physician.')] }] },
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
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Discrepancies in code status documentation across record sections.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Refusals to discuss or document advance directive preferences.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Changes in code status or advance directive preferences.')] }] },
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
      content: [text('Advance Directives and Code Status Communication')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Purpose: '),
        text('To determine if the interdisciplinary team is following the facility\'s advance directive and code status communication policy. Record results of review below. Provide corrective action/measures as needed.'),
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('#')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Resident Name')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('AD Documented (Y/N/NA)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Code Status Consistent (Y/N)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Corrective Action if Indicated')] }] },
          ],
        },
        ...Array.from({ length: 10 }, (_, i) => ({
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text(`${i + 1}.`)] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
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
        bold('Reviewed By: '),
        ph('checklist_reviewer_f578', 'Checklist Reviewer', 'text', false),
        text('    '),
        bold('Date: '),
        ph('checklist_date_f578', 'Checklist Date', 'date', false),
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
      content: [text('F-578 \u2013 Request/Refuse/Discontinue Treatment')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [boldItalic('Review Regulation(s):')],
    },
    {
      type: 'paragraph',
      content: [
        bold('\u00A7483.10(c)(6) \u2013 '),
        text('The resident has the right to request, refuse, and/or discontinue treatment, to participate in or refuse to participate in experimental research, and to formulate an advance directive.'),
      ],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [boldItalic('Review Intent:')],
    },
    {
      type: 'paragraph',
      content: [
        text('To ensure the facility informs residents of their rights regarding advance directives and accurately documents and communicates code status across all sections of the medical record, preventing errors in emergency care situations.'),
      ],
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
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Advance Directives / Code Status Communication \u2013 Plan of Correction.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Advance Directives / Code Status Communication \u2013 Policy.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Advance Directives / Code Status Communication \u2013 Practice Guideline.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Advance Directives / Code Status Communication \u2013 Validation Checklist.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Advance Directives / Code Status Communication \u2013 QA Committee Audit Form.')] }] },
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
        text('The following personnel attended the Advance Directives and Code Status Communication in-service training program conducted on '),
        ph('training_date_f578', 'Training Date', 'date', true, 'Date the in-service training was conducted'),
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
        ph('training_time_started_f578', 'Time Started', 'text', false),
        text('    '),
        bold('Time Ended: '),
        ph('training_time_ended_f578', 'Time Ended', 'text', false),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Instructor (Printed Name): '),
        ph('instructor_name_f578', 'Instructor Name', 'text', false),
        text('    '),
        bold('Instructor (Signature): '),
        ph('instructor_signature_f578', 'Instructor Signature', 'text', false),
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
      content: [text('F-578 \u2013 Request/Refuse/Discontinue Treatment')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Confidential Data: Risk Management/QA Committee Audit Form'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Purpose: '),
        text('To determine if the interdisciplinary team is following the facility\'s policy for advance directives and code status communication.'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Instructions: '),
        text('Randomly select charts for audit. Record results below. Record additional information in the "Comments" section. Provide completed report to the Risk Management/QA Committee. Use additional copies of this form as necessary.'),
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('#')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Resident')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('AD on File (Y/N)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Code Status Consistent (Y/N)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Discussion Documented (Y/N)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Comments')] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('0')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('EXAMPLE: Smith, Marvin')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('Y')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('Y')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('Y')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
          ],
        },
        ...Array.from({ length: 10 }, (_, i) => ({
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text(`${i + 1}`)] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
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
        text('* If NO, provide explanation in "Comments" column.'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Reviewer Name: '),
        ph('qa_reviewer_name_f578', 'QA Reviewer Name', 'text', false),
        text('    '),
        bold('Title: '),
        ph('qa_reviewer_title_f578', 'QA Reviewer Title', 'text', false),
        text('    '),
        bold('Date: '),
        ph('qa_review_date_f578', 'QA Review Date', 'date', false),
      ],
    },
  ],
};


// ---------------------------------------------------------------------------
// F-655 FULL PACKET
// ---------------------------------------------------------------------------

const f655Content = {
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
      content: [text('F-655 \u2013 Baseline Care Plans')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Tag Cited: '),
        text('F-655'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Regulatory Reference: '),
        text('\u00A7483.21(a)(3) \u2013 Baseline Care Plans'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Issue Cited: '),
        ph('issue_cited_f655', 'Issue Cited', 'text', true, 'The specific issue cited by the surveyor'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        italic('Preparation and/or execution of this plan does not constitute admission or agreement by the provider that a deficiency exists. This response is also not to be construed as an admission of fault by the facility, its employees, agents or other individuals who draft or may be discussed in this response and plan of correction. This plan of correction is submitted as the facility\'s credible allegation of compliance.'),
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
        text('Resident #'),
        ph('resident_identifier_f655', 'Resident Identifier', 'text', true, 'Resident number referenced in the citation'),
        text(' was given a summary of their baseline care plan. A copy of the summary, signed by the resident, resident\'s representative if applicable, and a facility representative was placed in the medical record.'),
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
      content: [text('The facility has determined that all residents have the potential to be affected.')],
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
        text('All interdisciplinary care plan team members responsible for writing baseline care plans will be re-educated on the facility\'s policy and procedure for developing '),
        italic('Baseline Care Plans'),
        text(', which includes procedures for providing the resident a written summary of their baseline care plan.'),
      ],
    },
    // Section 4
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [text('4. How the corrective action(s) will be monitored to ensure the practice will not reoccur:')],
    },
    {
      type: 'paragraph',
      content: [
        text('The Director of Nursing Services (DNS), or designee, will complete random weekly audits of baseline care plans for '),
        ph('audit_duration_weeks_f655', 'Audit Duration (Weeks)', 'number', true, 'Number of consecutive weeks for auditing'),
        text(' consecutive weeks. Random audits will be completed to ensure that baseline care plan summaries are being provided to residents, and that a copy has been placed in the medical record.'),
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
        bold('Corrective action completion date: '),
        ph('completion_date_f655', 'Completion Date', 'date', true, 'Target date for completing all corrective actions'),
        text('.'),
      ],
    },

    // ===== SECTION 2: POLICY =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('Baseline Care Plan Policy')],
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
            { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_date_implemented_f655', 'Date Implemented', 'date', false)] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_date_reviewed_f655', 'Date Reviewed/Revised', 'date', false)] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [ph('policy_reviewed_by_f655', 'Reviewed/Revised By', 'text', false)] }] },
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
      content: [text('The facility will develop and implement a baseline care plan for each resident that includes the instructions needed to provide effective and person-centered care of the resident that meet professional standards of quality care.')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [bold('Policy Explanation and Compliance Guidelines:')],
    },
    {
      type: 'orderedList',
      content: [
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('The baseline care plan will:')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Be developed within 48 hours of a resident\'s admission.')] }] },
                {
                  type: 'listItem',
                  content: [
                    { type: 'paragraph', content: [text('Include the minimum healthcare information necessary to properly care for a resident including, but not limited to:')] },
                    {
                      type: 'orderedList',
                      content: [
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Initial goals based on admission orders.')] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Physician orders.')] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Dietary orders.')] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Therapy services.')] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Social services.')] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('PASARR recommendation, if applicable.')] }] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('The admitting nurse, or supervising nurse on duty, shall gather information from the admission physical assessment, hospital transfer information, physician orders, and discussion with the resident and resident representative, if applicable.')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Once gathered, initial goals shall be established that reflect the resident\'s stated goals and objectives.')] }] },
                {
                  type: 'listItem',
                  content: [
                    { type: 'paragraph', content: [text('Interventions shall be initiated that address the resident\'s current needs including:')] },
                    {
                      type: 'orderedList',
                      content: [
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any health and safety concerns to prevent decline or injury, such as elopement, fall, or pressure injury risk.')] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any identified needs for supervision, behavioral interventions, and assistance with activities of daily living.')] }] },
                        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any special needs such as for IV therapy, dialysis, or wound care.')] }] },
                      ],
                    },
                  ],
                },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Once established, goals and interventions shall be documented in the designated format.')] }] },
              ],
            },
          ],
        },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('A supervising nurse shall verify within 48 hours that a baseline care plan has been developed.')] }] },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('A written summary of the baseline care plan shall be provided to the resident and representative in a language that the resident/representative can understand. The summary shall include, at a minimum, the following:')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('The initial goals of the resident.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('A summary of the resident\'s medications and dietary instructions.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any services and treatments to be administered by the facility and personnel acting on behalf of the facility.')] }] },
              ],
            },
          ],
        },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('A supervising nurse or MDS nurse/designee is responsible for providing the written summary of the baseline care plan to the resident and representative. This will be provided by completion of the comprehensive care plan.')] }] },
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('The person providing the written summary of the baseline care plan shall:')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Obtain a signature from the resident/representative to verify that the summary was provided.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Make a copy of the summary for the medical record.')] }] },
              ],
            },
          ],
        },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('If the summary was provided via telephone, the nurse shall indicate the discussion, sign the summary document, and make a copy of the written summary before mailing the summary to the resident/representative.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('In the event that the comprehensive assessment and comprehensive care plan identified a change in the resident\'s goals, or physical, mental, or psychosocial functioning, which was otherwise not identified in the baseline care plan, those changes shall be incorporated into an updated summary provided to the resident and his or her representative, if applicable. This will be provided by the MDS nurse/designee by the completion date of the comprehensive care plan.')] }] },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [bold('References:')],
    },
    {
      type: 'paragraph',
      content: [
        text('Centers for Medicare & Medicaid Services, Department of Health and Human Services. '),
        italic('State Operations Manual (SOM): Appendix PP Guidance to Surveyors for Long Term Care Facilities.'),
        text(' (August 2024) F655 \u2013 Baseline Care Plan.'),
      ],
    },

    // ===== SECTION 3: BASELINE CARE PLAN SUMMARY (Initial) =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('Baseline Care Plan Summary')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Resident Name: '),
        ph('resident_name_f655', 'Resident Name', 'text', true, 'Full name of the resident'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Admission Date: '),
        ph('admission_date_f655', 'Admission Date', 'date', true),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Resident Representative: '),
        ph('resident_representative_f655', 'Resident Representative', 'text', false),
      ],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [text('Initial Goals:')],
    },
    {
      type: 'paragraph',
      content: [ph('initial_goals_f655', 'Initial Goals', 'text', true, 'Document the initial goals for the resident')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [text('Medications and Dietary Information:')],
    },
    {
      type: 'paragraph',
      content: [ph('medications_dietary_f655', 'Medications and Dietary Information', 'text', true, 'Summary of medications and dietary instructions')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [text('Services and Treatments:')],
    },
    {
      type: 'paragraph',
      content: [ph('services_treatments_f655', 'Services and Treatments', 'text', true, 'Services and treatments to be administered')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Resident Signature: '),
        ph('resident_signature_f655', 'Resident Signature', 'text', false),
        text('    '),
        bold('Date: '),
        ph('resident_signature_date_f655', 'Signature Date', 'date', false),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Resident Representative: '),
        ph('rep_signature_f655', 'Representative Signature', 'text', false),
        text('    '),
        bold('Date: '),
        ph('rep_signature_date_f655', 'Rep Signature Date', 'date', false),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Facility Representative: '),
        ph('facility_rep_signature_f655', 'Facility Representative Signature', 'text', false),
        text('    '),
        bold('Date: '),
        ph('facility_rep_date_f655', 'Facility Rep Date', 'date', false),
      ],
    },
    {
      type: 'paragraph',
      content: [italic('*Make a copy of this form. Original goes to resident/representative. File copy in medical record.')],
    },

    // ===== SECTION 4: BASELINE CARE PLAN SUMMARY (Updated) =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('Baseline Care Plan Summary (Updated)')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Resident Name: '),
        ph('resident_name_updated_f655', 'Resident Name', 'text', true),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Resident Representative: '),
        ph('resident_rep_updated_f655', 'Resident Representative', 'text', false),
      ],
    },
    {
      type: 'paragraph',
      content: [bold('The following changes have been made to your initial care plan:')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [text('Goals:')],
    },
    {
      type: 'paragraph',
      content: [ph('updated_goals_f655', 'Updated Goals', 'text', false, 'Document updated goals')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [text('Medications and Dietary Information:')],
    },
    {
      type: 'paragraph',
      content: [ph('updated_medications_f655', 'Updated Medications and Dietary', 'text', false)],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [text('Services and Treatments:')],
    },
    {
      type: 'paragraph',
      content: [ph('updated_services_f655', 'Updated Services and Treatments', 'text', false)],
    },
    {
      type: 'paragraph',
      content: [
        bold('Resident Signature: '),
        ph('updated_resident_sig_f655', 'Resident Signature', 'text', false),
        text('    '),
        bold('Date: '),
        ph('updated_resident_sig_date_f655', 'Signature Date', 'date', false),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Resident Representative: '),
        ph('updated_rep_sig_f655', 'Representative Signature', 'text', false),
        text('    '),
        bold('Date: '),
        ph('updated_rep_sig_date_f655', 'Rep Signature Date', 'date', false),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Facility Representative: '),
        ph('updated_facility_sig_f655', 'Facility Representative Signature', 'text', false),
        text('    '),
        bold('Date: '),
        ph('updated_facility_sig_date_f655', 'Facility Rep Date', 'date', false),
      ],
    },
    {
      type: 'paragraph',
      content: [italic('Make a copy of this form. Original goes to resident/representative. File copy in medical record.')],
    },

    // ===== SECTION 5: PRACTICE GUIDELINE =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('Practice Guideline')],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [text('Baseline Care Plan Summary')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [bold('Why It\'s Done:')],
    },
    {
      type: 'paragraph',
      content: [text('To provide a consistent process for reviewing and providing a baseline care plan summary to the resident and resident representative.')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [bold('What You Need:')],
    },
    {
      type: 'orderedList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Medical record.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Minimum healthcare information necessary to properly care for a resident.')] }] },
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
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('Review the current clinical information thoroughly:')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Initial goals based on admission orders.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Physician orders.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Dietary orders.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Therapy services.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Social services.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('PASARR recommendation(s) if applicable.')] }] },
              ],
            },
          ],
        },
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
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [text('Upon admission:')] },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Notify the admitting or supervising nurse on duty.')] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [text('Gather information from the admission physical assessment, hospital transfer information, physician\'s orders, and discussion with the resident and resident representative.')] }] },
              ],
            },
          ],
        },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Establish initial goals reflecting resident\'s stated goals and objectives.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Verify baseline care plan has been established within 48 hours.')] }] },
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
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document the Baseline Care Plan Summary.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Document that a written summary of the Baseline Care Plan was provided to the resident/resident representative.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Obtain a signature from the resident/resident representative to verify the summary was provided.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Make a copy of the Baseline Care Plan Summary for the medical record.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('If provided via telephone, document the discussion, sign the summary document, and make a copy of the written summary before mailing the summary to the resident/representative.')] }] },
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
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Refusals by resident/resident representative to sign acknowledging a summary was provided.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('A change in the resident\'s goals, or physical, mental, or psychosocial functioning, which was otherwise not identified in the baseline care plan. Incorporate into an updated summary and provide to the resident and his or her representative, if applicable upon completion of the comprehensive care plan.')] }] },
      ],
    },

    // ===== SECTION 6: VALIDATION CHECKLIST =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('Validation Checklist')],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [text('Failure to Provide Resident with a Baseline Care Plan Summary')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Purpose: '),
        text('To determine if the interdisciplinary team is following the facility\'s Baseline Care Plan policy for providing residents with a summary of their baseline care plan. Record results of review below. Provide corrective action/measures as needed.'),
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('#')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Baseline Care Plan (Resident Name)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Summary Provided (Y/N/NA)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Corrective Action if Indicated')] }] },
          ],
        },
        ...Array.from({ length: 10 }, (_, i) => ({
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
        bold('Reviewed By: '),
        ph('checklist_reviewer_f655', 'Checklist Reviewer', 'text', false),
        text('    '),
        bold('Date: '),
        ph('checklist_date_f655', 'Checklist Date', 'date', false),
      ],
    },

    // ===== SECTION 7: IN-SERVICE TRAINING GUIDE =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('In-Service Training Guide')],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [text('F-655 \u2013 Comprehensive Person-Centered Care Planning')],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [boldItalic('Review Regulation(s):')],
    },
    {
      type: 'paragraph',
      content: [
        bold('\u00A7483.21(a)(3) \u2013 '),
        text('The facility must provide the resident and their representative with a summary of the baseline care plan that includes but is not limited to:'),
      ],
    },
    {
      type: 'orderedList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('The initial goals of the resident.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('A summary of the resident\'s medications and dietary instructions.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any services and treatments to be administered by the facility and personnel acting on behalf of the facility.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Any updated information based on the details of the comprehensive care plan, as necessary.')] }] },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [boldItalic('Review Intent:')],
    },
    {
      type: 'paragraph',
      content: [text('Completion and implementation of the baseline care plan within 48 hours of a resident\'s admission is intended to promote continuity of care and communication among nursing home staff, increase resident safety, and safeguard against adverse events that are most likely to occur right after admission; and to ensure the resident and representative, if applicable, are informed of the initial plan for delivery of care and services by receiving a written summary of the baseline care plan.')],
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
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Failure to Provide Resident with Baseline Care Plan Summary \u2013 Plan of Correction.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Baseline Care Plan \u2013 Policy.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Failure to Provide Resident with Baseline Care Plan Summary \u2013 Practice Guideline.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Failure to Provide Resident with Baseline Care Plan Summary \u2013 Validation Checklist.')] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [text('Facility\'s Failure to Provide Resident with Baseline Care Plan Summary \u2013 QA Committee Audit Form.')] }] },
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

    // ===== SECTION 8: TRAINING ATTENDANCE FORM =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('Record of In-Service Training and Attendance Form')],
    },
    {
      type: 'paragraph',
      content: [
        text('The following personnel attended the Providing Residents with a Baseline Care Plan Summary in-service training program conducted on '),
        ph('training_date_f655', 'Training Date', 'date', true, 'Date the in-service training was conducted'),
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
        ph('training_time_started_f655', 'Time Started', 'text', false),
        text('    '),
        bold('Time Ended: '),
        ph('training_time_ended_f655', 'Time Ended', 'text', false),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Instructor (Printed Name): '),
        ph('instructor_name_f655', 'Instructor Name', 'text', false),
        text('    '),
        bold('Instructor (Signature): '),
        ph('instructor_signature_f655', 'Instructor Signature', 'text', false),
      ],
    },
    {
      type: 'paragraph',
      content: [italic('Use additional sheets as necessary.')],
    },

    // ===== SECTION 9: QA COMMITTEE AUDIT FORM =====
    { type: 'horizontalRule' },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [text('QA Committee Audit Form')],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [text('F-655 \u2013 Baseline Care Plans')],
    },
    {
      type: 'paragraph',
      content: [bold('Confidential Data: Risk Management/QA Committee Audit Form')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Purpose: '),
        text('To determine if the interdisciplinary team is following the facility\'s policy for providing residents a summary of their baseline care plan in accordance with the Baseline Care Plan policy.'),
      ],
    },
    {
      type: 'paragraph',
      content: [
        bold('Instructions: '),
        text('Randomly select care plans for audit. Record results below. Record additional information in the "Comments" section. Provide completed report to the Risk Management/QA Committee. Use additional copies of this form as necessary.'),
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('#')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Resident Care Plan')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Complete (Y/N)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Summary Provided (Y/N)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Signed Copy in Record (Y/N)')] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [bold('Comments')] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('0')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('EXAMPLE: Smith, Marvin')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('Y')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('Y')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text('Y')] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
          ],
        },
        ...Array.from({ length: 10 }, (_, i) => ({
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [text(`${i + 1}`)] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
          ],
        })),
      ],
    },
    {
      type: 'paragraph',
      content: [text('* If NO, provide explanation in "Comments" column.')],
    },
    {
      type: 'paragraph',
      content: [
        bold('Reviewer Name: '),
        ph('qa_reviewer_name_f655', 'QA Reviewer Name', 'text', false),
        text('    '),
        bold('Title: '),
        ph('qa_reviewer_title_f655', 'QA Reviewer Title', 'text', false),
        text('    '),
        bold('Date: '),
        ph('qa_review_date_f655', 'QA Review Date', 'date', false),
      ],
    },
  ],
};

module.exports = {
  f578: {
    f_tag: 'F-578',
    title: 'Request/Refuse/Discontinue Treatment',
    content: f578Content,
  },
  f655: {
    f_tag: 'F-655',
    title: 'Baseline Care Plans',
    content: f655Content,
  },
};
