/**
 * seedHistory.js
 *
 * Seeds the database with realistic mock CMS-2567 sessions for demo purposes.
 * 3 past surveys from the same facility, all 100% complete POCs.
 *
 * Run:
 *   Local:  cd user-app/server && node src/seedHistory.js
 *   Docker: docker exec -it tcs-plan-of-correction node /app/user-app/server/src/seedHistory.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.resolve(__dirname, '../data/poc.db');
const db = new Database(DB_PATH);

const STEP_TITLES = [
  'What Went Wrong / Immediate Action Taken',
  'Scope and Impact Assessment',
  'Education and Prevention Measures',
  'Ongoing Monitoring Plan',
];

// Single facility for all sessions
const FACILITY = {
  name: 'Sunrise Senior Living Center',
  address: '1420 Oak Park Blvd, Sacramento, CA 95822',
  provider: '055123',
  building: '2',
  wing: 'North',
  accreditingOrg: 'The Joint Commission',
};

// F-Tags with realistic narratives (10 unique tags)
const FTAG_DATA = {
  'F-880': {
    narrative: 'Based on observation, interview, and record review, the facility failed to establish and maintain an infection prevention and control program designed to provide a safe, sanitary, and comfortable environment and to help prevent the development and transmission of communicable diseases and infections. Specifically, staff were observed not performing proper hand hygiene between resident contacts on multiple occasions during the survey period. Additionally, shared medical equipment was not properly sanitized between uses.',
    severity: 'D', scope: 'Pattern',
    steps: [
      'The facility identified that infection prevention protocols were not consistently followed by nursing staff on units 2A and 3B. Immediate corrective actions included conducting an emergency in-service for all nursing staff on proper hand hygiene techniques and equipment sanitization procedures. Hand sanitizer stations were verified at all resident doorways.',
      'An audit of all nursing units revealed that 3 out of 8 units had inconsistent compliance with hand hygiene protocols. Environmental services confirmed that equipment sanitization logs were incomplete for 2 units. A total of 12 staff members were identified as needing remedial training.',
      'All nursing staff completed mandatory infection control re-education by the Infection Preventionist. New competency checklists were implemented. Posters on hand hygiene technique were placed at all nursing stations. The facility updated its Infection Control Policy (IC-201) to include specific sanitization timelines for shared equipment.',
      'The Infection Preventionist will conduct weekly hand hygiene audits on all units for 8 weeks, then monthly for 6 months. Results will be reported to the Quality Assurance and Performance Improvement (QAPI) committee monthly. Non-compliant staff will receive immediate re-education and documented counseling.',
    ],
  },
  'F-689': {
    narrative: 'Based on observation, interview, and record review, the facility failed to ensure that the resident environment remained as free of accident hazards as possible. Specifically, the facility failed to implement fall prevention interventions for 3 of 15 sampled residents (Residents #45, #67, and #102) who had been identified as being at high risk for falls. Fall risk assessments were not updated following falls, and care plans did not reflect current interventions.',
    severity: 'G', scope: 'Pattern',
    steps: [
      'The facility acknowledged that fall prevention care plans for Residents #45, #67, and #102 were not updated after their most recent falls. Immediate actions included updating all three care plans with current interventions including bed alarms, non-skid footwear, and supervised ambulation. All high-risk residents had fall risk reassessments completed within 24 hours.',
      'A comprehensive review of all 87 current residents identified 23 residents at high risk for falls. Of these, 5 additional residents had outdated fall prevention care plans. The Director of Nursing reviewed all fall incident reports from the past 90 days and identified gaps in the post-fall assessment process.',
      'All licensed nursing staff received education on the facility\'s updated Fall Prevention Program, including proper documentation of post-fall assessments and timely care plan updates. A new Fall Prevention Champion was designated for each unit to serve as a resource and monitor compliance.',
      'The Director of Nursing or designee will audit 10 high-risk fall residents\' care plans weekly for 4 weeks, then monthly for 90 days. Post-fall huddles will be conducted within 1 hour of any fall event. Results will be tracked and reported to the QAPI committee.',
    ],
  },
  'F-684': {
    narrative: 'Based on record review, interview, and observation, the facility failed to provide the necessary care and services to maintain or improve the quality of care for 2 of 10 sampled residents (Residents #23 and #89). Specifically, the facility failed to ensure timely physician notification of changes in condition and failed to implement physician orders in a timely manner.',
    severity: 'D', scope: 'Isolated',
    steps: [
      'The facility confirmed that nursing staff failed to notify the attending physician of a significant change in condition for Resident #23 within the required timeframe. Immediate actions included contacting the physicians for both residents to review current status and updating all active orders.',
      'A review of all change-of-condition notifications for the past 60 days revealed 4 instances where notification exceeded the facility\'s 2-hour standard. Root cause analysis identified staffing transitions during shift change as the primary contributing factor.',
      'All nursing staff were re-educated on the facility\'s Change in Condition Notification Policy (NS-305), including documentation requirements and escalation procedures. A standardized SBAR communication tool was implemented for all physician notifications.',
      'The Director of Nursing will audit change-of-condition notifications weekly for 4 weeks, then bi-weekly for 3 months. Shift change handoff procedures now include a dedicated change-of-condition review. Findings will be presented at monthly QAPI meetings.',
    ],
  },
  'F-578': {
    narrative: 'Based on interviews and medical record review, the facility failed to honor Resident #159\'s Advanced Directive for DNR, resulting in inappropriate resuscitative measures. The facility\'s policies titled RESIDENT BILL OF RIGHTS, ADVANCE DIRECTIVES, and Cardio Pulmonary Resuscitation (CPR) were not followed, and the facility failed to honor the resident\'s end-of-life wishes.',
    severity: 'J', scope: 'Isolated',
    steps: [
      'The facility acknowledges the failure to honor Resident #159\'s Advanced Directive for DNR. Immediate corrective actions included reviewing the medical record to confirm DNR status, notifying the physician, and ensuring all relevant documentation was updated to reflect the resident\'s end-of-life wishes.',
      'An audit of all current residents\' advance directive documentation was completed. Of 94 residents, 8 were found to have incomplete or inconsistent advance directive documentation across the medical record, physician orders, and electronic health record.',
      'All clinical staff received mandatory education on the facility\'s Advance Directive Policy including proper identification, documentation, and honoring of resident wishes. Color-coded advance directive alerts were implemented in the electronic health record system.',
      'The Administrator will conduct monthly audits of 20 resident advance directive records for 6 months. New admissions will have advance directive verification within 24 hours. Results will be reported to the QAPI committee and the Medical Director.',
    ],
  },
  'F-655': {
    narrative: 'Based on record review and interview, the facility failed to develop a comprehensive baseline care plan for 4 of 12 sampled residents within 48 hours of admission. Specifically, care plans for Residents #12, #34, #56, and #78 were not initiated until 5-7 days post-admission, resulting in delayed identification of care needs.',
    severity: 'D', scope: 'Pattern',
    steps: [
      'The facility identified that baseline care plans for 4 residents were not completed within the required 48-hour window. Immediate actions included completing all outstanding baseline care plans and implementing an admission tracking log to monitor care plan initiation timelines.',
      'A retrospective review of 30 admissions over the past 90 days revealed that 9 (30%) had baseline care plans initiated after the 48-hour requirement. Contributing factors included high admission volume and lack of a standardized admission workflow.',
      'The MDS Coordinator provided re-education to all licensed nurses on baseline care plan requirements and timelines. A new Admission Care Plan Checklist was developed and integrated into the admission packet. Unit managers received training on monitoring compliance.',
      'The MDS Coordinator will review all new admissions weekly for compliance with the 48-hour baseline care plan requirement for 8 weeks, then monthly for 6 months. Non-compliance will be addressed with the responsible nurse within 24 hours.',
    ],
  },
  'F-812': {
    narrative: 'Based on observation and interview, the facility failed to ensure that food was prepared, stored, and served under sanitary conditions. During kitchen observation, staff were noted preparing food without proper hair restraints, cutting boards were not color-coded for raw and cooked foods, and the walk-in refrigerator temperature log showed 3 days of missed readings in the past week.',
    severity: 'E', scope: 'Pattern',
    steps: [
      'The facility took immediate action to address all observed food safety violations. All kitchen staff were provided new hair restraints. Color-coded cutting boards were purchased and labeled. The refrigerator temperature monitoring system was reset and backup staff were designated for daily readings.',
      'A full kitchen inspection by the Dietary Manager identified 6 additional areas of concern including improper food storage in the dry pantry, expired condiments, and incomplete cleaning logs for the ice machine. All issues were corrected within 48 hours.',
      'All dietary staff completed the ServSafe Food Handler certification course. The Dietary Manager conducted hands-on training on proper food handling, cross-contamination prevention, and temperature monitoring. New kitchen SOPs were posted at all workstations.',
      'The Dietary Manager will conduct daily kitchen walkthroughs for 4 weeks, then 3 times weekly for 3 months. Temperature logs will be reviewed daily by the Dietary Manager. Monthly kitchen audits will be reported to the QAPI committee.',
    ],
  },
  'F-725': {
    narrative: 'Based on record review and interview, the facility failed to maintain sufficient nursing staff to provide nursing and related services to attain or maintain the highest practicable physical, mental, and psychosocial well-being of each resident. Staffing records reviewed for the 2-week period prior to the survey showed that 8 of 14 days had staffing levels below the facility\'s own staffing plan.',
    severity: 'F', scope: 'Widespread',
    steps: [
      'The facility acknowledged that staffing levels fell below the established staffing plan on multiple days. Immediate actions included activating the facility\'s emergency staffing protocol, contacting agency staffing services, and implementing mandatory overtime authorization for the interim period.',
      'Analysis of staffing data over the past 6 months revealed a pattern of understaffing primarily on evening shifts and weekends. Contributing factors included 4 unfilled CNA positions and higher-than-average call-off rates. Agency usage had increased 35% over the prior quarter.',
      'The Human Resources department launched an aggressive recruitment campaign including signing bonuses, referral bonuses, and partnerships with 3 local CNA training programs. A retention committee was formed to address staff satisfaction concerns identified in a recent survey.',
      'The Director of Nursing will review daily staffing reports and compare against the staffing plan. Weekly staffing compliance reports will be submitted to the Administrator. Staffing levels and recruitment progress will be standing agenda items at monthly QAPI meetings for 12 months.',
    ],
  },
  'F-740': {
    narrative: 'Based on observation and interview, the facility failed to ensure that residents received behavioral health services as indicated in their comprehensive assessments. Specifically, 3 of 8 residents with documented behavioral health diagnoses (Residents #22, #55, and #91) did not receive their scheduled counseling sessions for 3 consecutive weeks due to the departure of the contracted behavioral health provider.',
    severity: 'D', scope: 'Pattern',
    steps: [
      'The facility identified the gap in behavioral health services following the departure of the contracted provider. Immediate actions included arranging interim telehealth behavioral health consultations for all affected residents and contacting two new behavioral health provider agencies.',
      'A review of all residents with behavioral health service needs identified 11 residents total. All 11 were assessed by the interim telehealth provider within 5 business days. Care plans were reviewed and updated to reflect the interim service delivery model.',
      'The Social Services Director educated all nursing staff on identifying signs of behavioral health decline and the escalation process for urgent behavioral health needs. The Administrator negotiated a new contract with a behavioral health provider with a guaranteed service level agreement.',
      'The Social Services Director will track all scheduled behavioral health appointments weekly and verify attendance. Monthly compliance reports will be generated. The new provider contract includes monthly performance reviews for the first 6 months.',
    ],
  },
  'F-686': {
    narrative: 'Based on record review and interview, the facility failed to ensure that a resident who was admitted without pressure ulcers did not develop pressure ulcers unless clinically unavoidable. Resident #33, admitted with intact skin, developed a Stage 2 pressure injury on the sacrum within 3 weeks of admission. The medical record lacked evidence of timely repositioning and skin assessments.',
    severity: 'G', scope: 'Isolated',
    steps: [
      'The facility confirmed that Resident #33 developed an avoidable Stage 2 pressure injury due to inconsistent repositioning. Immediate interventions included implementing a 2-hour repositioning schedule with documentation, applying a pressure-relieving mattress overlay, and initiating wound care per facility protocol.',
      'A review of all residents at risk for pressure injuries (Braden Scale score 18 or below) identified 19 residents. Chart audits revealed that 4 additional residents had gaps in repositioning documentation. All pressure prevention care plans were reviewed and updated.',
      'All CNAs and licensed nurses received hands-on training on proper positioning techniques, pressure injury staging, and documentation requirements. The Wound Care Nurse conducted skills demonstrations on each unit. New turn clocks were placed in all high-risk residents\' rooms.',
      'The Wound Care Nurse will conduct weekly skin integrity rounds on all at-risk residents for 8 weeks, then bi-weekly for 3 months. Repositioning documentation will be audited daily by charge nurses. Weekly wound care reports will be submitted to the Director of Nursing.',
    ],
  },
  'F-758': {
    narrative: 'Based on record review and interview, the facility failed to ensure that residents were free from unnecessary medications. Specifically, 2 of 10 sampled residents (Residents #18 and #73) were receiving psychotropic medications without adequate clinical indications documented, and gradual dose reduction attempts had not been made as required.',
    severity: 'D', scope: 'Pattern',
    steps: [
      'The facility identified that Residents #18 and #73 were receiving psychotropic medications without adequate documentation of clinical indications. The attending physicians were contacted immediately to review and update medication orders with appropriate clinical justification or initiate gradual dose reductions.',
      'The Consultant Pharmacist conducted an emergency review of all residents receiving psychotropic medications. Of 34 residents on psychotropics, 7 were identified as needing updated clinical justifications and 5 required gradual dose reduction attempts per regulatory requirements.',
      'The Director of Nursing and Consultant Pharmacist provided education to all prescribers and nursing staff on psychotropic medication use regulations, documentation requirements, and the gradual dose reduction process. A psychotropic medication monitoring flowsheet was developed.',
      'The Consultant Pharmacist will review all psychotropic medication orders monthly. The Director of Nursing will audit psychotropic documentation compliance weekly for 4 weeks, then monthly. Findings will be discussed at the monthly Pharmacy and Therapeutics committee meeting.',
    ],
  },
};

// ─── 3 Sessions: same facility, all 100% complete ─────────────────────────────
// Survey 1: Beginning of last year (Feb 2025)
// Survey 2: Mid last year (Jul 2025)
// Survey 3: Last month (Feb 2026)
const MOCK_SESSIONS = [
  {
    fileName: 'CMS2567_Sunrise_Feb2025.pdf',
    surveyDate: '02/12/2025',
    createdAt: '2025-02-18 09:30:00',
    fTags: ['F-880', 'F-689', 'F-578', 'F-812'],
  },
  {
    fileName: 'CMS2567_Sunrise_Jul2025.pdf',
    surveyDate: '07/15/2025',
    createdAt: '2025-07-20 14:00:00',
    fTags: ['F-684', 'F-655', 'F-725', 'F-740'],
  },
  {
    fileName: 'CMS2567_Sunrise_Feb2026.pdf',
    surveyDate: '02/05/2026',
    createdAt: '2026-02-10 10:15:00',
    fTags: ['F-686', 'F-758', 'F-689', 'F-880'],
  },
];

function seed() {
  console.log('Seeding mock history data...');
  console.log(`Facility: ${FACILITY.name}`);
  console.log(`Sessions: ${MOCK_SESSIONS.length} (all 100% complete)\n`);

  // Clear previous seed data (if re-running) — matches both old and new naming
  const existingMockSessions = db.prepare(
    `SELECT id FROM sessions WHERE file_name LIKE 'CMS2567_%'`
  ).all();

  if (existingMockSessions.length > 0) {
    console.log(`  Clearing ${existingMockSessions.length} existing mock session(s)...`);
    for (const s of existingMockSessions) {
      const defIds = db.prepare(`SELECT id FROM deficiencies WHERE session_id = ?`).all(s.id);
      for (const d of defIds) {
        db.prepare(`DELETE FROM poc_steps WHERE deficiency_id = ?`).run(d.id);
      }
      db.prepare(`DELETE FROM deficiencies WHERE session_id = ?`).run(s.id);
      db.prepare(`DELETE FROM sessions WHERE id = ?`).run(s.id);
    }
    console.log('  Cleared.\n');
  }

  const insertSession = db.prepare(
    `INSERT INTO sessions (id, file_name, full_text, header_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertDef = db.prepare(
    `INSERT INTO deficiencies (id, session_id, f_tag, narrative, severity, scope, summary, key_points, completion_date, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertStep = db.prepare(
    `INSERT INTO poc_steps (id, deficiency_id, step_number, step_title, ai_suggestion, user_content, completion_date, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const mock of MOCK_SESSIONS) {
    const sessionId = uuidv4();
    const headerJson = JSON.stringify({
      providerNumber: FACILITY.provider,
      facilityName: FACILITY.name,
      facilityAddress: FACILITY.address,
      dateSurveyCompleted: mock.surveyDate,
      building: FACILITY.building,
      wing: FACILITY.wing,
      accreditingOrg: FACILITY.accreditingOrg,
    });

    // POC completed ~7 days after session created
    const updatedAt = new Date(new Date(mock.createdAt).getTime() + 7 * 86400000)
      .toISOString().replace('T', ' ').slice(0, 19);

    insertSession.run(
      sessionId, mock.fileName,
      `(Mock CMS-2567 survey text for ${FACILITY.name} — ${mock.surveyDate})`,
      headerJson, mock.createdAt, updatedAt
    );

    console.log(`  Survey ${mock.surveyDate}: ${mock.fTags.join(', ')}`);

    for (const fTag of mock.fTags) {
      const defId = uuidv4();
      const tagData = FTAG_DATA[fTag];
      if (!tagData) continue;

      // Completion date 5-10 days after session creation
      const completionDate = new Date(
        new Date(mock.createdAt).getTime() + (Math.floor(Math.random() * 6) + 5) * 86400000
      ).toISOString().slice(0, 10);

      const summary = tagData.narrative.slice(0, 120) + '...';
      const keyPoints = JSON.stringify([
        'Immediate corrective action taken',
        'Scope assessment completed',
        'Staff education provided',
        'Monitoring plan established',
      ]);

      insertDef.run(
        defId, sessionId, fTag, tagData.narrative,
        tagData.severity, tagData.scope, summary, keyPoints,
        completionDate, 'complete', mock.createdAt, updatedAt
      );

      // All 4 steps complete
      for (let stepNum = 1; stepNum <= 4; stepNum++) {
        const stepId = uuidv4();
        const stepContent = tagData.steps[stepNum - 1];

        insertStep.run(
          stepId, defId, stepNum, STEP_TITLES[stepNum - 1],
          stepContent,     // ai_suggestion
          stepContent,     // user_content (same = accepted)
          completionDate,  // all steps completed
          'completed',
          updatedAt
        );
      }
    }
  }

  const totalDefs = MOCK_SESSIONS.reduce((s, m) => s + m.fTags.length, 0);
  const uniqueTags = [...new Set(MOCK_SESSIONS.flatMap(m => m.fTags))];

  console.log(`\nSummary:`);
  console.log(`  Sessions: ${MOCK_SESSIONS.length}`);
  console.log(`  Deficiencies: ${totalDefs}`);
  console.log(`  Unique F-Tags: ${uniqueTags.length} (${uniqueTags.join(', ')})`);
  console.log(`  Completion: 100%`);
  console.log('\nDone!');
}

seed();
