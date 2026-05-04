# Bugfix Requirements Document

## Introduction

This document addresses a critical data synchronization bug where matching scores for the same candidate-job pairing display inconsistently across different pages in the employer interface. Specifically, Arnold Godson Correya shows a 77% match on the Candidates page but a 100% match on the Applications page for the "2D Game Developer - Mobile Action/Adventure" role. This inconsistency undermines trust in the matching algorithm and creates confusion for employers evaluating candidates.

The bug stems from different calculation contexts: the Candidates page calculates the best match across all employer jobs, while the Applications page calculates the match for the specific job the candidate applied to. When these are different jobs, or when the calculation is performed with different data snapshots, scores diverge.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an employer views a candidate on the Candidates page THEN the system displays a match score calculated against the best-matching job from all the employer's active jobs

1.2 WHEN an employer views the same candidate's application on the Applications page THEN the system displays a match score calculated against the specific job the candidate applied to

1.3 WHEN the best-matching job (from Candidates page) differs from the applied job (from Applications page) THEN the system shows different match scores for what appears to be the same candidate-job relationship

1.4 WHEN a candidate appears on the Candidates page with a specific match score THEN there is no indication which job that score corresponds to, making it impossible to verify consistency

1.5 WHEN match scores are calculated at different times with potentially different profile or job data THEN the system may show inconsistent scores even for the same candidate-job pair

### Expected Behavior (Correct)

2.1 WHEN an employer views a candidate who has applied to one of their jobs THEN the system SHALL display the same match score on both the Candidates page and the Applications page for that specific candidate-job pairing

2.2 WHEN a candidate has applied to multiple jobs THEN the system SHALL clearly indicate which job each match score corresponds to on the Candidates page

2.3 WHEN calculating match scores for display THEN the system SHALL use a consistent data snapshot and calculation method across all pages to ensure identical inputs produce identical outputs

2.4 WHEN a candidate appears on the Candidates page THEN the system SHALL display the match score for the job they applied to (if they have applied), rather than the best match across all jobs

2.5 WHEN match scores are displayed THEN the system SHALL include the job title or context so employers can understand what the score represents

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a candidate has not applied to any jobs THEN the system SHALL CONTINUE TO display the best match score across all active employer jobs on the Candidates page

3.2 WHEN calculating match scores THEN the system SHALL CONTINUE TO use the existing `calculateJobMatch()` function from `src/utils/ai.ts` without modifying its core algorithm

3.3 WHEN displaying match score breakdowns THEN the system SHALL CONTINUE TO show detailed match criteria (skills, experience, location, role match) in the MatchBreakdownModal

3.4 WHEN a candidate's profile or job requirements are updated THEN the system SHALL CONTINUE TO recalculate match scores dynamically

3.5 WHEN filtering or sorting candidates THEN the system SHALL CONTINUE TO use match scores as a valid sorting criterion

3.6 WHEN displaying candidates who have been hired THEN the system SHALL CONTINUE TO show their hired status and the job title they were hired for
