INSERT INTO clients (first_name, last_name, date_of_birth, phone, email, language, gender, household_size, is_active) VALUES
('Maria', 'Gonzalez', '1985-03-12', '480-555-0101', 'maria.g@example.com', 'Spanish', 'Female', 4, true),
('James', 'Carter', '1972-07-24', '480-555-0102', 'jcarter@example.com', 'English', 'Male', 1, true),
('Aisha', 'Johnson', '1990-11-05', '480-555-0103', 'aisha.j@example.com', 'English', 'Female', 3, true),
('Roberto', 'Reyes', '1968-02-18', '480-555-0104', 'rreyes@example.com', 'Spanish', 'Male', 6, true),
('Linda', 'Park', '1995-09-30', '480-555-0105', 'lpark@example.com', 'English', 'Female', 2, true),
('Darius', 'Williams', '1983-04-14', '480-555-0106', 'dwilliams@example.com', 'English', 'Male', 1, true),
('Sofia', 'Martinez', '2001-06-22', '480-555-0107', 'sofia.m@example.com', 'Spanish', 'Female', 5, true),
('Kevin', 'Thompson', '1978-12-01', '480-555-0108', 'kthompson@example.com', 'English', 'Male', 2, true),
('Fatima', 'Hassan', '1993-08-17', '480-555-0109', 'fhassan@example.com', 'English', 'Female', 4, true),
('Andre', 'Davis', '1965-01-09', '480-555-0110', 'adavis@example.com', 'English', 'Male', 3, true),
('Carmen', 'Lopez', '1988-05-28', '480-555-0111', 'clopez@example.com', 'Spanish', 'Female', 2, true),
('Marcus', 'Brown', '1977-10-15', '480-555-0112', 'mbrown@example.com', 'English', 'Male', 1, true);

-- Demo service entries (linked to clients by position, will need actual UUIDs in prod)
-- These use a subquery to get client IDs by name
INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-01', 'Food Assistance',
  'Maria came in with her family of 4. They have been struggling since her husband lost his job last month. Provided 2-week food supply. She mentioned youngest child has dietary restrictions (no gluten). Referred to job placement services.',
  'Client received food assistance for family of 4 following job loss. Dietary needs noted for youngest child. Job placement referral made.',
  '["Follow up on job placement referral in 2 weeks", "Note gluten-free dietary restriction for future food supplies"]',
  '["Financial instability - primary earner unemployed"]'
FROM clients WHERE first_name = 'Maria' AND last_name = 'Gonzalez';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-05', 'Housing Support',
  'James is facing eviction notice - landlord gave 30-day notice. He is currently unemployed and behind 2 months on rent. Connected him with emergency rental assistance program. He seemed very stressed and mentioned not sleeping well.',
  'Client facing imminent eviction after 2 months of missed rent. Connected to emergency rental assistance. Client showing signs of stress and sleep disruption.',
  '["Follow up on emergency rental assistance application within 1 week", "Screen for mental health support needs", "Check on utility assistance eligibility"]',
  '["Imminent housing loss", "Mental health concern - stress and sleep disruption"]'
FROM clients WHERE first_name = 'James' AND last_name = 'Carter';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-08', 'Counseling',
  'Aisha attended her third counseling session. She reports improvement in managing anxiety related to her divorce proceedings. Currently working and supporting two children. Discussed coping strategies. Will continue weekly sessions.',
  'Third counseling session showing positive progress in anxiety management. Client is employed and supporting two children through divorce proceedings.',
  '["Schedule next weekly counseling session", "Provide resource list for single parent support groups"]',
  '[]'
FROM clients WHERE first_name = 'Aisha' AND last_name = 'Johnson';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-10', 'Food Assistance',
  'Roberto came in for monthly food distribution. Family of 6 including elderly mother. He mentioned his mother has been having trouble with her medications and they cannot always afford them. Provided food supply and gave information about prescription assistance programs.',
  'Monthly food distribution for family of 6. Elderly family member experiencing medication affordability issues. Prescription assistance information provided.',
  '["Follow up on prescription assistance program enrollment", "Check if elderly mother needs additional health services"]',
  '["Medication access issue for elderly family member"]'
FROM clients WHERE first_name = 'Roberto' AND last_name = 'Reyes';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-12', 'Job Training',
  'Linda completed the resume writing workshop. She has been unemployed for 6 months after being laid off from retail. She is motivated and interested in healthcare aide certification program. Enrolled her in the next cohort starting April 1st.',
  'Client completed resume workshop and enrolled in healthcare aide certification starting April 1st. Motivated job seeker with 6 months unemployment.',
  '["Confirm enrollment confirmation for April 1st healthcare program", "Check in one week before program starts"]',
  '[]'
FROM clients WHERE first_name = 'Linda' AND last_name = 'Park';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-14', 'Crisis Intervention',
  'Darius called the crisis line and was referred to walk-in. He disclosed that he has been having thoughts of self-harm. Conducted full mental health assessment. He agreed to voluntary safety plan. Connected with crisis counselor. Follow up appointment scheduled for tomorrow.',
  'Client presented with self-harm ideation. Safety plan established. Crisis counseling initiated. Emergency follow-up scheduled for next day.',
  '["Crisis follow-up appointment tomorrow - HIGH PRIORITY", "Confirm safety plan adherence", "Contact emergency services if no-show"]',
  '["Active self-harm ideation - HIGH RISK", "Requires immediate follow-up"]'
FROM clients WHERE first_name = 'Darius' AND last_name = 'Williams';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-15', 'Crisis Follow-up',
  'Follow-up with Darius. He came in as scheduled. Reports feeling more stable. No active ideation today. Continuing safety plan. Scheduled for weekly check-ins for the next month. He mentioned he started walking his dog daily which helps his mood.',
  'Follow-up shows stabilization. No active ideation. Safety plan maintained. Weekly check-ins established. Positive coping activity (daily walks) identified.',
  '["Weekly check-in next week", "Monitor safety plan adherence", "Reinforce positive coping behaviors"]',
  '["Monitor closely - recent crisis history"]'
FROM clients WHERE first_name = 'Darius' AND last_name = 'Williams';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-16', 'Food Assistance',
  'Sofia is a 24-year-old single mother with 3 kids. She is working two part-time jobs but still struggling. Provided monthly food supply. She mentioned the youngest is not enrolled in school yet - turning 5 in August. Gave her school enrollment information.',
  'Young single mother with 3 children receiving food assistance despite working two jobs. Provided school enrollment information for child turning 5.',
  '["Share school enrollment deadline information", "Check eligibility for childcare assistance programs"]',
  '["Working poverty - two jobs insufficient for family needs"]'
FROM clients WHERE first_name = 'Sofia' AND last_name = 'Martinez';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-18', 'Housing Support',
  'Kevin needs help with utility bills - electricity was cut off last week. Has two young children at home. Emergency utility assistance provided. Also discussed budget counseling options. He was embarrassed to ask for help but said a neighbor told him about our services.',
  'Emergency utility restoration for family with two young children. Client connected through word-of-mouth. Budget counseling discussed.',
  '["Enroll in budget counseling program", "Confirm utility reconnection within 48 hours", "Check for additional utility assistance programs this winter"]',
  '["Children in home without heat/electricity - urgent"]'
FROM clients WHERE first_name = 'Kevin' AND last_name = 'Thompson';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-20', 'Counseling',
  'Fatima is a refugee who arrived 8 months ago. Today was her second counseling session focusing on trauma processing. Her English is improving but still limited - used interpreter for parts of session. She is adjusting well to the community and her children are in school.',
  'Refugee client in trauma counseling, 8 months post-arrival. Language barrier partially managed with interpreter. Children enrolled in school, community integration progressing positively.',
  '["Schedule interpreter for all future sessions", "Connect with refugee community organization", "Continue bi-weekly trauma counseling"]',
  '["Trauma history - ongoing processing needed", "Language barrier requires accommodation"]'
FROM clients WHERE first_name = 'Fatima' AND last_name = 'Hassan';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-22', 'Senior Services',
  'Andre is 61 and recently lost his wife of 30 years. He came in for general assistance. He is isolated and not eating regularly. Connected him with senior meal delivery program and grief support group that meets Tuesdays. He was receptive and seemed relieved to talk to someone.',
  'Recent widower showing signs of isolation and nutritional neglect. Connected to senior meal delivery and grief support group. First engagement with services.',
  '["Confirm enrollment in Tuesday grief support group", "Check in after first meal delivery", "Assess for depression screening at next visit"]',
  '["Social isolation", "Nutritional neglect", "Recent bereavement - depression risk"]'
FROM clients WHERE first_name = 'Andre' AND last_name = 'Davis';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-24', 'Food Assistance',
  'Carmen came for her regular monthly food pickup. She is doing well - got a promotion at work last month. Asked about volunteering to give back. Gave her volunteer coordinator contact information. Her household is stabilizing.',
  'Long-term client showing positive trajectory - recent promotion and interest in volunteering. Household stable. Client transitioning to self-sufficiency.',
  '["Connect with volunteer coordinator", "Begin transition planning for reduced service dependence"]',
  '[]'
FROM clients WHERE first_name = 'Carmen' AND last_name = 'Lopez';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-26', 'Job Training',
  'Marcus enrolled in commercial driving license (CDL) training program today. He has been driving for a rideshare company but wants more stable employment. The CDL program is 6 weeks. He is excited about the opportunity and asked good questions about the curriculum.',
  'Client enrolled in 6-week CDL training program. Motivated career advancement from rideshare to commercial driving. Strong engagement in enrollment process.',
  '["Schedule mid-program check-in at week 3", "Provide list of local trucking companies for post-certification job search"]',
  '[]'
FROM clients WHERE first_name = 'Marcus' AND last_name = 'Brown';

-- A few more recent entries for demo freshness
INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-27', 'Food Assistance',
  'Maria came in again. Husband still job searching but had two interviews this week - she seemed more hopeful. Gluten-free items included in food package as noted. She mentioned the oldest child has been getting into trouble at school.',
  'Follow-up visit showing improved outlook. Dietary accommodations fulfilled. Emerging concern about child behavioral issues at school.',
  '["Follow up on school situation for oldest child", "Provide school counselor referral information", "Check on job search progress next visit"]',
  '["Child behavioral concern at school"]'
FROM clients WHERE first_name = 'Maria' AND last_name = 'Gonzalez';

INSERT INTO service_entries (client_id, service_date, service_type, notes, ai_summary, ai_action_items, ai_risk_flags)
SELECT id, '2026-03-28', 'Housing Support',
  'James received emergency rental assistance approval. He was very emotional and grateful. Still needs to find employment. Connected him with a job fair happening this Friday at the community center. He seems more stable and said he has been sleeping better.',
  'Emergency rental assistance approved - immediate crisis resolved. Client stabilizing emotionally. Job fair referral provided for Friday.',
  '["Check job fair attendance on Monday", "Begin regular case management check-ins now that crisis is resolved"]',
  '[]'
FROM clients WHERE first_name = 'James' AND last_name = 'Carter';
