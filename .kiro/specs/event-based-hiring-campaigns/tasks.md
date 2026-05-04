# Implementation Plan: Event-Based Hiring Campaign System

## Overview

This implementation plan breaks down the Event-Based Hiring Campaign System into discrete, actionable coding tasks. The system adds time-bound recruitment campaigns with multi-round pipelines, AI-powered pipeline generation, eligibility validation, invitation management, and comprehensive progress tracking for both employers and candidates.

**Technology Stack**: TypeScript, React, Supabase (PostgreSQL), Groq AI API, existing email infrastructure

**Implementation Approach**: Build incrementally from database schema → backend services → frontend components, with checkpoints to validate functionality at each stage.

## Tasks

- [x] 1. Database schema and RLS policies
  - [x] 1.1 Create database migration file for all campaign tables
    - Create `supabase/create_campaign_tables.sql` with tables: `hiring_campaigns`, `campaign_rounds`, `campaign_applications`, `campaign_round_results`, `campaign_invitations`
    - Add foreign key constraints to `jobs` and `profiles` tables
    - Add indexes on frequently queried columns: `campaign_id`, `candidate_id`, `employer_id`, `status`
    - Include `created_at` and `updated_at` timestamp columns with defaults
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [x] 1.2 Add Row Level Security (RLS) policies for campaign tables
    - Enable RLS on all five campaign tables
    - `hiring_campaigns`: Employers can CRUD their own campaigns; candidates can read active/public campaigns or campaigns they're invited to
    - `campaign_rounds`: Employers can CRUD rounds for their campaigns; candidates can read rounds for campaigns they've applied to
    - `campaign_applications`: Candidates can create/read their own applications; employers can read/update applications for their campaigns
    - `campaign_round_results`: Employers can CRUD results for their campaigns; candidates can read their own results
    - `campaign_invitations`: Employers can create invitations; candidates can read/update invitations sent to them
    - _Requirements: 1.5, 1.6, 1.7, 5.1, 6.1, 7.1, 9.1_

- [x] 2. Backend API hooks and services
  - [x] 2.1 Create `useCampaigns` hook in `src/hooks/useSupabase.ts`
    - Implement `getCampaigns(filters)` - fetch campaigns with optional filters (status, visibility, employer_id)
    - Implement `getCampaignById(id)` - fetch single campaign with rounds
    - Implement `createCampaign(data)` - create new campaign with validation
    - Implement `updateCampaign(id, data)` - update campaign with status-based restrictions
    - Implement `deleteCampaign(id)` - soft delete campaign
    - Add real-time subscription for campaign updates
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8, 1.9_

  - [x] 2.2 Create `useCampaignRounds` hook in `src/hooks/useSupabase.ts`
    - Implement `getRounds(campaignId)` - fetch all rounds for a campaign
    - Implement `createRound(campaignId, data)` - add round with date validation
    - Implement `updateRound(id, data)` - update round details
    - Implement `deleteRound(id)` - remove round from pipeline
    - Implement `reorderRounds(campaignId, roundIds)` - update round_number for sequential ordering
    - Add validation: round dates must be sequential and within campaign dates
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 2.3 Create `useCampaignApplications` hook in `src/hooks/useSupabase.ts`
    - Implement `getApplications(filters)` - fetch applications with filters (campaign_id, candidate_id, status, current_round)
    - Implement `getApplicationById(id)` - fetch single application with round results
    - Implement `createApplication(campaignId, candidateId)` - create application with eligibility check
    - Implement `updateApplicationStatus(id, status)` - update application status
    - Implement `advanceToNextRound(applicationId)` - increment current_round
    - Implement `getApplicationStats(campaignId)` - get counts by round for funnel visualization
    - _Requirements: 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.4 Create `useCampaignRoundResults` hook in `src/hooks/useSupabase.ts`
    - Implement `getResults(applicationId)` - fetch all round results for an application
    - Implement `createResult(applicationId, roundId, data)` - record round result with score and status
    - Implement `updateResult(id, data)` - update result details
    - Add logic to automatically advance candidate when result status is "passed"
    - Add logic to lock subsequent rounds when result status is "failed"
    - _Requirements: 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 6.6, 6.7, 6.8, 6.9_

  - [x] 2.5 Create `useCampaignInvitations` hook in `src/hooks/useSupabase.ts`
    - Implement `getInvitations(filters)` - fetch invitations with filters (campaign_id, candidate_id, employer_id, status)
    - Implement `createInvitation(campaignId, candidateId, message)` - send invitation
    - Implement `respondToInvitation(id, status)` - accept or decline invitation
    - Implement `searchCandidates(filters)` - search candidates by skills, experience, location, role
    - When invitation is accepted, automatically create campaign application
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

- [x] 3. Eligibility checker service
  - [x] 3.1 Create `src/utils/eligibilityChecker.ts` utility
    - Implement `checkEligibility(candidate, campaign)` function
    - Check minimum matching score threshold
    - Check required skills with proficiency levels
    - Check experience range (min/max years)
    - Check education requirements
    - Return eligibility status (boolean) and list of unmet criteria
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 3.2 Write unit tests for eligibility checker
    - Test matching score validation
    - Test skills matching with different proficiency levels
    - Test experience range validation (min, max, within range)
    - Test education requirements validation
    - Test edge cases (missing data, null values)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Checkpoint - Validate database and backend services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. AI pipeline generation service
  - [x] 5.1 Create `src/services/aiPipelineBuilder.ts` service
    - Implement `generatePipeline(roleTitle, seniorityLevel, department)` function
    - Use Groq API (similar to existing `src/services/groq.ts` pattern)
    - Construct prompt requesting 3-6 rounds with: round name, type, date offset, passing criteria
    - Parse AI response into structured round objects
    - Validate round types: aptitude test, technical assessment, HR interview, technical interview, group discussion
    - Order rounds from least to most selective
    - Add timeout of 10 seconds for API call
    - Return suggested pipeline array
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [x] 5.2 Write unit tests for AI pipeline builder
    - Test successful pipeline generation
    - Test timeout handling
    - Test invalid response parsing
    - Test round ordering validation
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 6. Email notification service integration
  - [x] 6.1 Create `src/services/campaignNotifications.ts` service
    - Implement `sendInvitationEmail(candidate, campaign, message)` - send invitation notification
    - Implement `sendRoundReminderEmail(candidate, campaign, round)` - send 24-hour reminder
    - Implement `sendResultEmail(candidate, campaign, round, result)` - send pass/fail notification
    - Use existing email infrastructure pattern from the project
    - Include campaign name, round details, dates, and direct links in emails
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 6.2 Write integration tests for notification service
    - Test invitation email sending
    - Test reminder email scheduling
    - Test result email with pass/fail status
    - Test email content includes required fields
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 7. Employer campaign creation and management UI
  - [x] 7.1 Create `src/pages/employer/EmployerCampaigns.tsx` page
    - Display list of all campaigns created by employer
    - Show campaign cards with: name, linked job, date range, status, applicant count
    - Add "Create Campaign" button to open campaign creation modal
    - Add filter/sort options: status (draft/active/completed), date range
    - Add campaign actions dropdown: Edit, View Dashboard, Delete
    - Use existing UI components pattern from `EmployerJobs.tsx`
    - _Requirements: 1.1, 1.3, 1.4, 1.8_

  - [x] 7.2 Create campaign creation modal component
    - Add form fields: campaign name, linked job (dropdown), start date, end date, visibility (public/invite-only)
    - Add entry criteria section: min matching score slider, required skills multi-select, experience range, education requirements
    - Validate end date is after start date
    - Set initial status to "draft"
    - Call `createCampaign` hook on submit
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 7.3 Create AI pipeline builder modal component
    - Add input fields: role title, seniority level (dropdown), department
    - Add "Generate Pipeline" button that calls `generatePipeline` service
    - Show loading state during generation (10 second timeout)
    - Display suggested rounds in editable list with: round name, type, date, passing score
    - Allow employer to accept, modify, or reject suggestions
    - Show warning if more than 6 rounds suggested
    - On accept, populate manual pipeline builder with suggested rounds
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 7.4 Create manual pipeline builder component
    - Display list of rounds with drag-and-drop reordering
    - Add "Add Round" button to insert new round
    - For each round: editable fields for name, type (dropdown), scheduled date/time, min passing score
    - Add "Remove Round" button for each round
    - Validate round dates are sequential and within campaign date range
    - Show warning if more than 6 rounds
    - Add "Save as Template" button to store custom pipeline
    - Add "Load Template" dropdown to apply saved templates
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 7.5 Add campaign management to employer navigation
    - Add "Campaigns" menu item to `EmployerSideMenu.tsx`
    - Add route in `App.tsx` for `/employer/campaigns`
    - Update `EmployerLayout.tsx` to highlight campaigns route when active
    - _Requirements: 1.1_

- [x] 8. Employer campaign dashboard UI
  - [x] 8.1 Create `src/pages/employer/EmployerCampaignDashboard.tsx` page
    - Display campaign header: name, job title, date range, status
    - Show conversion funnel visualization with candidate counts at each round
    - Display applicant table with columns: candidate name, matching score, current round, status
    - Add filter dropdown: "All Rounds" or specific round names
    - Add search bar to filter by candidate name
    - Show round-specific candidate count when filter is applied
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 8.2 Create candidate review modal for round scoring
    - Display candidate details: name, headline, matching score, key skills
    - Show current round information: name, type, scheduled date
    - Add score input field (0-100)
    - Add pass/fail radio buttons
    - Add optional feedback textarea
    - On submit, call `createResult` hook
    - If passed, automatically unlock next round for candidate
    - If failed, lock all subsequent rounds
    - _Requirements: 6.6, 6.7, 6.8, 6.9, 6.10_

  - [x] 8.3 Create conversion funnel visualization component
    - Display horizontal funnel chart showing candidate flow through rounds
    - Each funnel segment shows: round name, candidate count, percentage of previous round
    - Use color gradient to indicate drop-off rates
    - Make segments clickable to filter applicant table by round
    - _Requirements: 6.4_

- [x] 9. Checkpoint - Test employer campaign creation and management
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Employer invitation system UI
  - [x] 10.1 Create `src/pages/employer/EmployerCampaignInvitations.tsx` page
    - Display campaign header with invitation stats: sent, accepted, declined, pending
    - Show candidate search interface with filters: skills, experience years, location, role
    - Display search results table: candidate name, headline, matching score, key skills
    - Add checkbox selection for bulk invitations
    - Add "Send Invitation" button to open invitation modal
    - Show sent invitations table with status tracking
    - _Requirements: 7.1, 7.2, 7.3, 7.9_

  - [x] 10.2 Create invitation modal component
    - Display selected candidate(s) information
    - Add campaign selection dropdown (if accessed from general invitations page)
    - Add custom message textarea with character limit
    - Add "Send Invitation" button
    - Call `createInvitation` hook on submit
    - Trigger invitation email notification
    - _Requirements: 7.3, 7.4, 7.5_

  - [x] 10.3 Add invitation management to campaign dashboard
    - Add "Invitations" tab to campaign dashboard
    - Display invitation list with: candidate name, status, sent date, responded date
    - Add "Invite Candidates" button to open search interface
    - _Requirements: 7.9, 7.10_

- [x] 11. Candidate campaign browsing UI
  - [x] 11.1 Create `src/pages/CandidateCampaigns.tsx` page
    - Display list of active public campaigns
    - Show campaign cards with: name, company, job title, date range, number of rounds
    - Display eligibility status badge for each campaign (Eligible / Not Eligible)
    - Show unmet criteria tooltip when not eligible
    - Add "View Details" button to open campaign details modal
    - Add filter options: eligibility status, date range, job type
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 11.2 Create campaign details modal component
    - Display campaign overview: name, job title, company, description, date range
    - Show complete pipeline with all rounds: name, type, scheduled date
    - Display entry criteria: min matching score, required skills, experience, education
    - Show candidate's eligibility status with detailed breakdown
    - Add "Apply Now" button (enabled only if eligible)
    - Prevent duplicate applications (check if already applied)
    - Call `createApplication` hook on apply
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 9.6, 9.7_

  - [x] 11.3 Add campaigns to candidate navigation
    - Add "Campaigns" menu item to `SideMenu.tsx`
    - Add route in `App.tsx` for `/campaigns`
    - Update `DashboardLayout.tsx` to highlight campaigns route when active
    - _Requirements: 5.1_

- [x] 12. Candidate application and progress tracking UI
  - [x] 12.1 Create `src/pages/CandidateCampaignProgress.tsx` page
    - Display list of campaigns candidate has applied to
    - Show campaign cards with: name, job title, current round, overall status
    - Add "View Progress" button to open progress tracker modal
    - Filter options: status (in-progress, completed, rejected)
    - _Requirements: 5.6_

  - [x] 12.2 Create progress tracker modal component
    - Display campaign header: name, job title, date range
    - Show vertical timeline of all rounds with status indicators
    - Round statuses: locked (gray), upcoming (blue), in-progress (yellow), passed (green), failed (red)
    - For completed rounds, display: score, result (pass/fail), feedback
    - For upcoming rounds, display: scheduled date/time, round type
    - For locked rounds, show lock icon and "Complete previous rounds to unlock"
    - Highlight current round
    - _Requirements: 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 9.1, 9.3_

  - [x] 12.3 Create round detail view component
    - Display round information: name, type, scheduled date, passing score
    - Show candidate's result if completed: score, pass/fail status, feedback
    - Display next round information if current round is passed
    - Show "Round Locked" message if previous round not completed
    - _Requirements: 5.11, 5.12, 9.1_

- [x] 13. Candidate invitation management UI
  - [x] 13.1 Add invitation notifications to candidate dashboard
    - Display invitation cards in dashboard with: campaign name, company, employer message, sent date
    - Add "Accept" and "Decline" buttons
    - Call `respondToInvitation` hook on action
    - If accepted, create application and redirect to campaign progress page
    - If declined, update invitation status and remove from view
    - _Requirements: 7.6, 7.7, 7.8_

  - [x] 13.2 Create invite-only campaign access
    - Allow candidates to view invite-only campaigns they've been invited to
    - Display "Invited" badge on campaign cards
    - Show employer's custom invitation message in campaign details
    - _Requirements: 1.7, 7.10_

- [x] 14. Email notification triggers and scheduling
  - [x] 14.1 Implement invitation email trigger
    - Add email notification call in `createInvitation` hook
    - Pass candidate email, campaign details, and custom message
    - Ensure email sent within 5 minutes of invitation creation
    - _Requirements: 8.1_

  - [x] 14.2 Implement round reminder email scheduling
    - Create background job or database trigger to check upcoming rounds
    - Query rounds scheduled within next 24 hours
    - Send reminder emails to candidates with upcoming rounds
    - Include campaign name, round name, scheduled date/time, and campaign link
    - _Requirements: 8.2, 8.4_

  - [x] 14.3 Implement result notification email trigger
    - Add email notification call in `createResult` hook
    - Send email when employer publishes round result
    - Include pass/fail status, score, and feedback
    - If passed, include next round details
    - Ensure email sent within 5 minutes of result publication
    - _Requirements: 8.3, 8.5, 8.6, 8.7_

- [x] 15. Security and validation enforcement
  - [x] 15.1 Add email verification check for campaign applications
    - Check `user.email_confirmed_at` before allowing application submission
    - Display error message if email not verified
    - Add "Verify Email" link to error message
    - _Requirements: 9.4, 9.5_

  - [x] 15.2 Enforce sequential round progression
    - Validate in `advanceToNextRound` that previous round is marked as passed
    - Prevent API calls to access Round N+1 if Round N not completed
    - Add frontend validation to disable locked rounds
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 15.3 Prevent duplicate applications
    - Check existing applications before creating new one
    - Display error message if candidate already applied
    - Add database unique constraint on (campaign_id, candidate_id)
    - _Requirements: 5.5, 9.6, 9.7_

  - [x] 15.4 Add campaign status-based edit restrictions
    - Disable editing of start date, end date, and pipeline when status is active or completed
    - Allow editing of campaign name and description in any status
    - Show warning message when attempting to edit restricted fields
    - _Requirements: 1.8, 1.9_

- [x] 16. Integration and final wiring
  - [x] 16.1 Connect all campaign components to routing
    - Add all campaign routes to `App.tsx`
    - Ensure proper authentication guards for employer and candidate routes
    - Test navigation flow from job posting to campaign creation
    - Test navigation from campaign list to dashboard to invitations
    - _Requirements: 1.1, 5.1, 6.1, 7.1_

  - [x] 16.2 Add campaign links to existing job pages
    - Add "Create Campaign" button to `EmployerJobs.tsx` for each active job
    - Add "View Campaigns" link to job detail pages
    - Display campaign count badge on jobs with active campaigns
    - _Requirements: 1.1_

  - [x] 16.3 Integrate campaign applications with existing applications system
    - Ensure campaign applications appear in `EmployerApplications.tsx`
    - Add "Campaign" badge to distinguish campaign applications from regular applications
    - Link campaign applications to campaign dashboard for detailed tracking
    - _Requirements: 5.6, 6.1_

  - [x] 16.4 Write end-to-end integration tests
    - Test complete employer flow: create campaign → build pipeline → invite candidates → review applications → score rounds
    - Test complete candidate flow: browse campaigns → check eligibility → apply → track progress → receive notifications
    - Test invitation flow: employer invites → candidate accepts → application created
    - Test sequential progression: candidate passes round → next round unlocked
    - _Requirements: All requirements_

- [x] 17. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- The implementation follows existing project patterns (TypeScript, React, Supabase, Groq AI)
- Database schema must be created first as all other components depend on it
- Backend hooks should be implemented before frontend components
- Email notifications are integrated at the end to avoid blocking core functionality
- Security validations are implemented as a dedicated phase to ensure comprehensive coverage
