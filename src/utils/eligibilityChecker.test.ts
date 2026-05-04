/**
 * Unit Tests for Eligibility Checker
 * 
 * Tests Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import { describe, it, expect } from 'vitest';
import {
    checkEligibility,
    type CandidateProfile,
    type RequiredSkill,
    type EducationRequirement,
} from './eligibilityChecker';
import type { Campaign } from '../hooks/useSupabase';

// Helper function to create a minimal campaign
function createCampaign(overrides: Partial<Campaign> = {}): Campaign {
    return {
        id: 'test-campaign-id',
        employer_id: 'test-employer-id',
        job_id: 'test-job-id',
        name: 'Test Campaign',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        visibility: 'public',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        ...overrides,
    };
}

// Helper function to create a minimal candidate profile
function createCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
    return {
        id: 'test-candidate-id',
        skills: [],
        experience_years: 0,
        education: [],
        ...overrides,
    };
}

describe('Eligibility Checker - Matching Score', () => {
    it('should pass when matching score meets minimum threshold', () => {
        // Requirement 4.1
        const campaign = createCampaign({ min_matching_score: 70 });
        const candidate = createCandidate();
        const matchingScore = 75;

        const result = checkEligibility(candidate, campaign, matchingScore);

        expect(result.eligible).toBe(true);
        expect(result.unmetCriteria).toHaveLength(0);
    });

    it('should fail when matching score is below minimum threshold', () => {
        // Requirement 4.8
        const campaign = createCampaign({ min_matching_score: 70 });
        const candidate = createCandidate();
        const matchingScore = 65;

        const result = checkEligibility(candidate, campaign, matchingScore);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria).toHaveLength(1);
        expect(result.unmetCriteria[0].type).toBe('matching_score');
        expect(result.unmetCriteria[0].message).toContain('65%');
        expect(result.unmetCriteria[0].message).toContain('70%');
    });

    it('should pass when no minimum matching score is set', () => {
        const campaign = createCampaign({ min_matching_score: undefined });
        const candidate = createCandidate();
        const matchingScore = 30;

        const result = checkEligibility(candidate, campaign, matchingScore);

        expect(result.eligible).toBe(true);
    });

    it('should pass when minimum matching score is 0', () => {
        const campaign = createCampaign({ min_matching_score: 0 });
        const candidate = createCandidate();
        const matchingScore = 10;

        const result = checkEligibility(candidate, campaign, matchingScore);

        expect(result.eligible).toBe(true);
    });
});

describe('Eligibility Checker - Required Skills', () => {
    it('should pass when candidate has all required skills', () => {
        // Requirement 4.2
        const requiredSkills: RequiredSkill[] = [
            { name: 'JavaScript', proficiency: 'intermediate' },
            { name: 'React', proficiency: 'beginner' },
        ];
        const campaign = createCampaign({ required_skills: requiredSkills });
        const candidate = createCandidate({
            skills: ['JavaScript', 'React', 'TypeScript'],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
        expect(result.unmetCriteria).toHaveLength(0);
    });

    it('should fail when candidate is missing required skills', () => {
        // Requirement 4.7
        const requiredSkills: RequiredSkill[] = [
            { name: 'JavaScript', proficiency: 'intermediate' },
            { name: 'React', proficiency: 'beginner' },
            { name: 'Node.js', proficiency: 'advanced' },
        ];
        const campaign = createCampaign({ required_skills: requiredSkills });
        const candidate = createCandidate({
            skills: ['JavaScript', 'Python'],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria).toHaveLength(1);
        expect(result.unmetCriteria[0].type).toBe('skills');
        expect(result.unmetCriteria[0].message).toContain('React');
        expect(result.unmetCriteria[0].message).toContain('Node.js');
        expect(result.unmetCriteria[0].details.missing).toHaveLength(2);
    });

    it('should handle case-insensitive skill matching', () => {
        const requiredSkills: RequiredSkill[] = [
            { name: 'JavaScript', proficiency: 'intermediate' },
        ];
        const campaign = createCampaign({ required_skills: requiredSkills });
        const candidate = createCandidate({
            skills: ['javascript', 'REACT'],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });

    it('should pass when no required skills are set', () => {
        const campaign = createCampaign({ required_skills: [] });
        const candidate = createCandidate({ skills: [] });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });

    it('should handle candidate with no skills', () => {
        const requiredSkills: RequiredSkill[] = [
            { name: 'JavaScript', proficiency: 'beginner' },
        ];
        const campaign = createCampaign({ required_skills: requiredSkills });
        const candidate = createCandidate({ skills: undefined });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria[0].type).toBe('skills');
    });
});

describe('Eligibility Checker - Experience Range', () => {
    it('should pass when experience is within range', () => {
        // Requirement 4.3
        const campaign = createCampaign({
            min_experience: 2,
            max_experience: 5,
        });
        const candidate = createCandidate({ experience_years: 3 });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
        expect(result.unmetCriteria).toHaveLength(0);
    });

    it('should fail when experience is below minimum', () => {
        // Requirement 4.7
        const campaign = createCampaign({
            min_experience: 3,
            max_experience: 10,
        });
        const candidate = createCandidate({ experience_years: 1 });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria).toHaveLength(1);
        expect(result.unmetCriteria[0].type).toBe('experience');
        expect(result.unmetCriteria[0].message).toContain('1 years');
        expect(result.unmetCriteria[0].message).toContain('3 years');
    });

    it('should fail when experience exceeds maximum', () => {
        // Requirement 4.7
        const campaign = createCampaign({
            min_experience: 0,
            max_experience: 5,
        });
        const candidate = createCandidate({ experience_years: 8 });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria).toHaveLength(1);
        expect(result.unmetCriteria[0].type).toBe('experience');
        expect(result.unmetCriteria[0].message).toContain('8 years');
        expect(result.unmetCriteria[0].message).toContain('5 years');
    });

    it('should pass when only minimum experience is set and met', () => {
        const campaign = createCampaign({
            min_experience: 2,
            max_experience: undefined,
        });
        const candidate = createCandidate({ experience_years: 10 });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });

    it('should pass when only maximum experience is set and met', () => {
        const campaign = createCampaign({
            min_experience: undefined,
            max_experience: 5,
        });
        const candidate = createCandidate({ experience_years: 3 });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });

    it('should pass when no experience requirements are set', () => {
        const campaign = createCampaign({
            min_experience: undefined,
            max_experience: undefined,
        });
        const candidate = createCandidate({ experience_years: 0 });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });

    it('should handle candidate with undefined experience as 0', () => {
        const campaign = createCampaign({ min_experience: 1 });
        const candidate = createCandidate({ experience_years: undefined });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria[0].type).toBe('experience');
    });
});

describe('Eligibility Checker - Education Requirements', () => {
    it('should pass when candidate has required education level', () => {
        // Requirement 4.4
        const educationReqs: EducationRequirement[] = [
            { level: "Bachelor's" },
        ];
        const campaign = createCampaign({ education_requirements: educationReqs });
        const candidate = createCandidate({
            education: [
                {
                    id: '1',
                    school: 'Test University',
                    degree: "Bachelor's",
                    field: 'Computer Science',
                },
            ],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
        expect(result.unmetCriteria).toHaveLength(0);
    });

    it('should pass when candidate has higher education level than required', () => {
        const educationReqs: EducationRequirement[] = [
            { level: "Bachelor's" },
        ];
        const campaign = createCampaign({ education_requirements: educationReqs });
        const candidate = createCandidate({
            education: [
                {
                    id: '1',
                    school: 'Test University',
                    degree: "Master's",
                    field: 'Computer Science',
                },
            ],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });

    it('should fail when candidate education level is below required', () => {
        // Requirement 4.7
        const educationReqs: EducationRequirement[] = [
            { level: "Master's" },
        ];
        const campaign = createCampaign({ education_requirements: educationReqs });
        const candidate = createCandidate({
            education: [
                {
                    id: '1',
                    school: 'Test University',
                    degree: "Bachelor's",
                    field: 'Computer Science',
                },
            ],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria).toHaveLength(1);
        expect(result.unmetCriteria[0].type).toBe('education');
        expect(result.unmetCriteria[0].message).toContain("Master's");
    });

    it('should check field of study when specified', () => {
        const educationReqs: EducationRequirement[] = [
            { level: "Bachelor's", field: 'Computer Science' },
        ];
        const campaign = createCampaign({ education_requirements: educationReqs });
        const candidate = createCandidate({
            education: [
                {
                    id: '1',
                    school: 'Test University',
                    degree: "Bachelor's",
                    field: 'Computer Science',
                },
            ],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });

    it('should fail when field of study does not match', () => {
        const educationReqs: EducationRequirement[] = [
            { level: "Bachelor's", field: 'Computer Science' },
        ];
        const campaign = createCampaign({ education_requirements: educationReqs });
        const candidate = createCandidate({
            education: [
                {
                    id: '1',
                    school: 'Test University',
                    degree: "Bachelor's",
                    field: 'Business Administration',
                },
            ],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria[0].type).toBe('education');
    });

    it('should handle various education level formats', () => {
        const educationReqs: EducationRequirement[] = [
            { level: 'Bachelor' },
        ];
        const campaign = createCampaign({ education_requirements: educationReqs });

        // Test different variations
        const variations = ['Bachelor', 'Bachelors', "Bachelor's", 'BS', 'BA', 'BTech'];

        variations.forEach((variation) => {
            const candidate = createCandidate({
                education: [
                    {
                        id: '1',
                        school: 'Test University',
                        degree: variation,
                        field: 'Computer Science',
                    },
                ],
            });

            const result = checkEligibility(candidate, campaign, 80);
            expect(result.eligible).toBe(true);
        });
    });

    it('should pass when no education requirements are set', () => {
        const campaign = createCampaign({ education_requirements: [] });
        const candidate = createCandidate({ education: [] });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });

    it('should handle candidate with no education', () => {
        const educationReqs: EducationRequirement[] = [
            { level: "Bachelor's" },
        ];
        const campaign = createCampaign({ education_requirements: educationReqs });
        const candidate = createCandidate({ education: undefined });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria[0].type).toBe('education');
    });
});

describe('Eligibility Checker - Multiple Criteria', () => {
    it('should pass when all criteria are met', () => {
        // Requirement 4.5, 4.6
        const requiredSkills: RequiredSkill[] = [
            { name: 'JavaScript', proficiency: 'intermediate' },
        ];
        const educationReqs: EducationRequirement[] = [
            { level: "Bachelor's" },
        ];
        const campaign = createCampaign({
            min_matching_score: 70,
            required_skills: requiredSkills,
            min_experience: 2,
            max_experience: 5,
            education_requirements: educationReqs,
        });
        const candidate = createCandidate({
            skills: ['JavaScript', 'React'],
            experience_years: 3,
            education: [
                {
                    id: '1',
                    school: 'Test University',
                    degree: "Bachelor's",
                    field: 'Computer Science',
                },
            ],
        });

        const result = checkEligibility(candidate, campaign, 75);

        expect(result.eligible).toBe(true);
        expect(result.unmetCriteria).toHaveLength(0);
    });

    it('should fail and list all unmet criteria', () => {
        // Requirement 4.7
        const requiredSkills: RequiredSkill[] = [
            { name: 'JavaScript', proficiency: 'intermediate' },
            { name: 'React', proficiency: 'beginner' },
        ];
        const educationReqs: EducationRequirement[] = [
            { level: "Master's" },
        ];
        const campaign = createCampaign({
            min_matching_score: 80,
            required_skills: requiredSkills,
            min_experience: 5,
            max_experience: 10,
            education_requirements: educationReqs,
        });
        const candidate = createCandidate({
            skills: ['Python'],
            experience_years: 2,
            education: [
                {
                    id: '1',
                    school: 'Test University',
                    degree: "Bachelor's",
                    field: 'Computer Science',
                },
            ],
        });

        const result = checkEligibility(candidate, campaign, 65);

        expect(result.eligible).toBe(false);
        expect(result.unmetCriteria).toHaveLength(4);

        const criteriaTypes = result.unmetCriteria.map(c => c.type);
        expect(criteriaTypes).toContain('matching_score');
        expect(criteriaTypes).toContain('skills');
        expect(criteriaTypes).toContain('experience');
        expect(criteriaTypes).toContain('education');
    });

    it('should handle edge case with exact minimum values', () => {
        const campaign = createCampaign({
            min_matching_score: 70,
            min_experience: 2,
        });
        const candidate = createCandidate({
            experience_years: 2,
        });

        const result = checkEligibility(candidate, campaign, 70);

        expect(result.eligible).toBe(true);
    });

    it('should handle edge case with exact maximum values', () => {
        const campaign = createCampaign({
            max_experience: 5,
        });
        const candidate = createCandidate({
            experience_years: 5,
        });

        const result = checkEligibility(candidate, campaign, 100);

        expect(result.eligible).toBe(true);
    });
});

describe('Eligibility Checker - Edge Cases', () => {
    it('should handle campaign with no eligibility criteria', () => {
        const campaign = createCampaign({
            min_matching_score: undefined,
            required_skills: undefined,
            min_experience: undefined,
            max_experience: undefined,
            education_requirements: undefined,
        });
        const candidate = createCandidate();

        const result = checkEligibility(candidate, campaign, 0);

        expect(result.eligible).toBe(true);
        expect(result.unmetCriteria).toHaveLength(0);
    });

    it('should handle candidate with empty profile', () => {
        const campaign = createCampaign({
            min_matching_score: 50,
        });
        const candidate = createCandidate({
            skills: undefined,
            experience_years: undefined,
            education: undefined,
        });

        const result = checkEligibility(candidate, campaign, 60);

        expect(result.eligible).toBe(true);
    });

    it('should handle whitespace in skill names', () => {
        const requiredSkills: RequiredSkill[] = [
            { name: '  JavaScript  ', proficiency: 'intermediate' },
        ];
        const campaign = createCampaign({ required_skills: requiredSkills });
        const candidate = createCandidate({
            skills: ['JavaScript  ', '  React'],
        });

        const result = checkEligibility(candidate, campaign, 80);

        expect(result.eligible).toBe(true);
    });
});
