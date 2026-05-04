# Requirements Document

## Introduction

The Event-Based Hiring Campaign System transforms traditional continuous hiring into time-bound recruitment events with transparent, multi-round pipelines. Similar to campus placement drives, this system allows employers to create structured hiring campaigns where candidates see all rounds upfront with specific dates, enabling better planning and transparency. The system includes AI-powered pipeline generation to accelerate campaign setup while maintaining full manual control for customization.

## Glossary

- **Campaign_System**: The event-based hiring campaign management system
- **Employer**: A user with employer role who creates and manages hiring campaigns
- **Candidate**: A user with candidate role who applies to and participates in campaigns
- **Campaign**: A time-bound recruitment event linked to a job posting with a multi-round pipeline
- **Pipeline**: A sequential series of assessment rounds within a campaign
- **Round**: A single assessment stage in a pipeline (e.g., aptitude test, technical interview)
- **AI_Pipeline_Builder**: The AI service that generates suggested pipelines based on role parameters
- **Eligibility_Checker**: The component that validates candidate qualifications against campaign criteria
- **Invitation_System**: The component that manages employer-initiated candidate invitations
- **Notification_Service**: The service that sends email notifications to users
- **Round_Result**: The outcome (score/status) of a candidate's performance in a specific round
- **Matching_Score**: The percentage match between a candidate's profile and job requirements

## Requirements

### Requirement 1: Campaign Creation and Management

**User Story:** As an Employer, I want to create time-bound hiring campaigns linked to job postings, so that I can run structured recruitment events with clear start and end dates.

#### Acceptance Criteria

1. WHEN an Employer creates a campaign, THE Campaign_System SHALL require a campaign name, start date, end date, and linked job posting
2. THE Campaign_System SHALL enforce that the end date is after the start date
3. THE Campaign_System SHALL support campaign status values of draft, active, and completed
4. WHEN an Employer creates a campaign, THE Campaign_System SHALL set the initial status to draft
5. THE Campaign_System SHALL allow Employers to set campaign visibility to either public or invite-only
6. WHEN campaign visibility is public, THE Campaign_System SHALL display the campaign to all eligible candidates
7. WHEN campaign visibility is invite-only, THE Campaign_System SHALL display the campaign only to invited candidates
8. THE Campaign_System SHALL allow Employers to update campaign details while status is draft
9. THE Campaign_System SHALL prevent modification of start date, end date, and pipeline structure when status is active or completed

### Requirement 2: AI-Powered Pipeline Generation

**User Story:** As an Employer, I want AI to suggest a complete pipeline based on role parameters, so that I can quickly create appropriate assessment rounds without manual configuration.

#### Acceptance Criteria

1. WHEN an Employer provides role title, seniority level, and department, THE AI_Pipeline_Builder SHALL generate a suggested pipeline within 10 seconds
2. THE AI_Pipeline_Builder SHALL include between 3 and 6 rounds in the suggested pipeline
3. FOR EACH suggested round, THE AI_Pipeline_Builder SHALL specify round name, round type, suggested date offset from campaign start, and suggested passing criteria
4. THE AI_Pipeline_Builder SHALL support round types: aptitude test, technical assessment, HR interview, technical interview, and group discussion
5. THE AI_Pipeline_Builder SHALL order rounds from least to most selective (e.g., aptitude test before technical interview)
6. WHEN the AI_Pipeline_Builder suggests more than 6 rounds, THE Campaign_System SHALL display a warning to the Employer
7. THE Campaign_System SHALL allow Employers to accept, modify, or reject the AI-generated pipeline

### Requirement 3: Manual Pipeline Builder

**User Story:** As an Employer, I want to manually build or customize pipelines, so that I can create assessment rounds that match my specific hiring process.

#### Acceptance Criteria

1. THE Campaign_System SHALL allow Employers to create pipelines without using AI_Pipeline_Builder
2. THE Campaign_System SHALL allow Employers to add rounds to a pipeline
3. THE Campaign_System SHALL allow Employers to remove rounds from a pipeline
4. THE Campaign_System SHALL allow Employers to reorder rounds in a pipeline
5. FOR EACH round, THE Campaign_System SHALL require round name, round type, scheduled date and time, and minimum passing score
6. THE Campaign_System SHALL enforce that round dates are sequential (Round N date is before Round N+1 date)
7. THE Campaign_System SHALL enforce that all round dates fall between campaign start date and end date
8. WHEN a pipeline contains more than 6 rounds, THE Campaign_System SHALL display a warning message
9. THE Campaign_System SHALL allow Employers to save custom pipelines as reusable templates
10. THE Campaign_System SHALL allow Employers to load previously saved pipeline templates

### Requirement 4: Entry Criteria and Eligibility Validation

**User Story:** As an Employer, I want to set minimum qualifications for campaign entry, so that only qualified candidates can apply and I can reduce unqualified applications.

#### Acceptance Criteria

1. THE Campaign_System SHALL allow Employers to set a minimum Matching_Score threshold between 0 and 100
2. THE Campaign_System SHALL allow Employers to specify required skills with proficiency levels (beginner, intermediate, advanced, expert)
3. THE Campaign_System SHALL allow Employers to specify minimum and maximum years of experience
4. THE Campaign_System SHALL allow Employers to specify required education levels
5. WHEN a Candidate views a campaign, THE Eligibility_Checker SHALL calculate whether the Candidate meets all entry criteria
6. THE Campaign_System SHALL display eligibility status to the Candidate before they apply
7. WHEN a Candidate does not meet minimum criteria, THE Campaign_System SHALL display which criteria are not met
8. WHEN a Candidate applies and does not meet minimum Matching_Score, THE Campaign_System SHALL automatically reject the application with transparent feedback
9. THE Campaign_System SHALL allow Candidates who meet all criteria to submit applications

### Requirement 5: Candidate Application and Progress Tracking

**User Story:** As a Candidate, I want to see all campaign rounds upfront and track my progress, so that I can plan my schedule and understand where I stand in the process.

#### Acceptance Criteria

1. THE Campaign_System SHALL display all active public campaigns to Candidates
2. FOR EACH campaign, THE Campaign_System SHALL display campaign name, linked job title, all round names with dates, and eligibility requirements
3. WHEN a Candidate views a campaign, THE Eligibility_Checker SHALL display whether the Candidate qualifies
4. THE Campaign_System SHALL allow qualified Candidates to apply to campaigns
5. THE Campaign_System SHALL enforce that each Candidate can submit only one application per campaign
6. WHEN a Candidate applies, THE Campaign_System SHALL create a campaign application record with status pending
7. FOR EACH round in the pipeline, THE Campaign_System SHALL display round status to the Candidate (locked, upcoming, in-progress, passed, or failed)
8. THE Campaign_System SHALL set Round 1 status to upcoming after application approval
9. WHEN a Candidate passes Round N, THE Campaign_System SHALL unlock Round N+1 and set its status to upcoming
10. WHEN a Candidate fails a round, THE Campaign_System SHALL set all subsequent rounds to locked
11. THE Campaign_System SHALL display the Candidate's score and result for completed rounds
12. THE Campaign_System SHALL prevent Candidates from accessing Round N+1 until Round N is marked as passed

### Requirement 6: Employer Campaign Dashboard

**User Story:** As an Employer, I want a dashboard showing all candidates in my campaign with filtering by round, so that I can efficiently manage large applicant pools and track conversion rates.

#### Acceptance Criteria

1. THE Campaign_System SHALL display a dashboard for each campaign showing all applicants
2. THE Campaign_System SHALL allow Employers to filter applicants by current round
3. FOR EACH round filter, THE Campaign_System SHALL display the count of candidates in that round
4. THE Campaign_System SHALL display a conversion funnel visualization showing candidate counts at each round
5. THE Campaign_System SHALL allow Employers to view candidate details including name, Matching_Score, and current round status
6. THE Campaign_System SHALL allow Employers to manually enter scores for each candidate for each round
7. THE Campaign_System SHALL allow Employers to mark a candidate as passed or failed for a round
8. WHEN an Employer marks a candidate as passed for Round N, THE Campaign_System SHALL unlock Round N+1 for that candidate
9. WHEN an Employer marks a candidate as failed for a round, THE Campaign_System SHALL lock all subsequent rounds for that candidate
10. THE Campaign_System SHALL prevent candidates from auto-advancing to the next round without Employer approval

### Requirement 7: Invitation System

**User Story:** As an Employer, I want to search for and invite specific candidates to my campaigns, so that I can proactively recruit high-potential talent.

#### Acceptance Criteria

1. THE Invitation_System SHALL allow Employers to search candidates by skills, experience years, location, and role
2. THE Invitation_System SHALL display search results with candidate names, headlines, Matching_Score, and key skills
3. THE Invitation_System SHALL allow Employers to select candidates and send campaign invitations
4. WHEN an Employer sends an invitation, THE Invitation_System SHALL create an invitation record with status pending
5. THE Invitation_System SHALL allow Employers to include a custom message with invitations
6. THE Invitation_System SHALL allow Candidates to accept or decline invitations
7. WHEN a Candidate accepts an invitation, THE Invitation_System SHALL update invitation status to accepted and create a campaign application
8. WHEN a Candidate declines an invitation, THE Invitation_System SHALL update invitation status to declined
9. THE Invitation_System SHALL display invitation status to Employers (pending, accepted, declined)
10. THE Campaign_System SHALL allow invited Candidates to view and apply to invite-only campaigns

### Requirement 8: Email Notifications

**User Story:** As a Candidate, I want to receive email notifications for campaign events, so that I don't miss important deadlines and updates.

#### Acceptance Criteria

1. WHEN an Employer sends a campaign invitation, THE Notification_Service SHALL send an email to the Candidate within 5 minutes
2. WHEN a round is scheduled within 24 hours, THE Notification_Service SHALL send a reminder email to all Candidates with that round upcoming
3. WHEN an Employer publishes a Round_Result, THE Notification_Service SHALL send an email to the Candidate within 5 minutes
4. THE Notification_Service SHALL include campaign name, round name, and date in reminder emails
5. THE Notification_Service SHALL include pass/fail status and score in result notification emails
6. WHEN a Candidate passes a round, THE Notification_Service SHALL include next round details in the result email
7. THE Notification_Service SHALL include a direct link to the campaign in all emails

### Requirement 9: Sequential Round Progression and Security

**User Story:** As an Employer, I want to enforce sequential round progression with manual approval, so that I can prevent resume fraud and maintain hiring process integrity.

#### Acceptance Criteria

1. THE Campaign_System SHALL enforce that Candidates cannot access Round N+1 until Round N is marked as passed
2. THE Campaign_System SHALL require Employer approval before advancing a Candidate to the next round
3. THE Campaign_System SHALL prevent Candidates from skipping rounds
4. THE Campaign_System SHALL require email verification before allowing Candidates to apply to campaigns
5. WHEN a Candidate attempts to apply without email verification, THE Campaign_System SHALL display an error message and prevent application submission
6. THE Campaign_System SHALL enforce that each Candidate can have only one active application per campaign
7. WHEN a Candidate attempts to apply to a campaign they have already applied to, THE Campaign_System SHALL display an error message

### Requirement 10: Database Schema and Integration

**User Story:** As a developer, I want a simple database schema that integrates with existing tables, so that the system is maintainable and leverages existing infrastructure.

#### Acceptance Criteria

1. THE Campaign_System SHALL create a hiring_campaigns table with columns: id, employer_id, job_id, name, start_date, end_date, status, visibility, min_matching_score, required_skills, min_experience, max_experience, education_requirements, created_at, updated_at
2. THE Campaign_System SHALL create a campaign_rounds table with columns: id, campaign_id, round_number, name, type, scheduled_date, min_passing_score, created_at
3. THE Campaign_System SHALL create a campaign_applications table with columns: id, campaign_id, candidate_id, job_id, status, current_round, applied_at, updated_at
4. THE Campaign_System SHALL create a campaign_round_results table with columns: id, application_id, round_id, score, status, feedback, completed_at
5. THE Campaign_System SHALL create a campaign_invitations table with columns: id, campaign_id, employer_id, candidate_id, status, message, sent_at, responded_at
6. THE Campaign_System SHALL reference the existing jobs table via job_id foreign key
7. THE Campaign_System SHALL reference the existing profiles table via candidate_id and employer_id foreign keys
8. THE Campaign_System SHALL enforce foreign key constraints on all reference columns
9. THE Campaign_System SHALL create indexes on frequently queried columns: campaign_id, candidate_id, employer_id, status
