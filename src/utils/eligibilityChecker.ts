/**
 * Eligibility Checker Utility
 * 
 * Validates candidate eligibility for hiring campaigns based on:
 * - Minimum matching score threshold
 * - Required skills with proficiency levels
 * - Experience range (min/max years)
 * - Education requirements
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import type { Campaign } from '../hooks/useSupabase';

/**
 * Candidate profile interface for eligibility checking
 */
export interface CandidateProfile {
    id: string;
    skills?: string[];
    experience_years?: number;
    education?: Array<{
        id: string;
        school: string;
        degree: string;
        field?: string;
        start_year?: string;
        end_year?: string;
    }>;
}

/**
 * Required skill with proficiency level
 */
export interface RequiredSkill {
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * Education requirement
 */
export interface EducationRequirement {
    level: string; // e.g., "Bachelor's", "Master's", "PhD", "High School"
    field?: string; // Optional field of study
}

/**
 * Unmet criterion details
 */
export interface UnmetCriterion {
    type: 'matching_score' | 'skills' | 'experience' | 'education';
    message: string;
    details?: any;
}

/**
 * Eligibility check result
 */
export interface EligibilityResult {
    eligible: boolean;
    unmetCriteria: UnmetCriterion[];
}

/**
 * Check if candidate meets minimum matching score threshold
 * Requirement 4.1, 4.8
 */
function checkMatchingScore(
    candidateScore: number,
    minScore: number
): UnmetCriterion | null {
    if (candidateScore < minScore) {
        return {
            type: 'matching_score',
            message: `Matching score ${candidateScore}% is below the minimum required ${minScore}%`,
            details: { current: candidateScore, required: minScore }
        };
    }
    return null;
}

/**
 * Check if candidate has required skills with proficiency levels
 * Requirement 4.2
 */
function checkRequiredSkills(
    candidateSkills: string[] = [],
    requiredSkills: RequiredSkill[] = []
): UnmetCriterion | null {
    if (requiredSkills.length === 0) {
        return null;
    }

    // Normalize candidate skills to lowercase for case-insensitive comparison
    const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase().trim());

    // Find missing skills
    const missingSkills: RequiredSkill[] = [];

    for (const required of requiredSkills) {
        const normalizedRequired = required.name.toLowerCase().trim();
        if (!normalizedCandidateSkills.includes(normalizedRequired)) {
            missingSkills.push(required);
        }
    }

    if (missingSkills.length > 0) {
        const skillList = missingSkills
            .map(s => `${s.name} (${s.proficiency})`)
            .join(', ');

        return {
            type: 'skills',
            message: `Missing required skills: ${skillList}`,
            details: { missing: missingSkills }
        };
    }

    return null;
}

/**
 * Check if candidate meets experience range requirements
 * Requirement 4.3
 */
function checkExperienceRange(
    candidateExperience: number = 0,
    minExperience?: number,
    maxExperience?: number
): UnmetCriterion | null {
    // If no experience requirements are set, candidate passes
    if (minExperience === undefined && maxExperience === undefined) {
        return null;
    }

    // Check minimum experience
    if (minExperience !== undefined && candidateExperience < minExperience) {
        return {
            type: 'experience',
            message: `Experience of ${candidateExperience} years is below the minimum required ${minExperience} years`,
            details: { current: candidateExperience, min: minExperience, max: maxExperience }
        };
    }

    // Check maximum experience
    if (maxExperience !== undefined && candidateExperience > maxExperience) {
        return {
            type: 'experience',
            message: `Experience of ${candidateExperience} years exceeds the maximum allowed ${maxExperience} years`,
            details: { current: candidateExperience, min: minExperience, max: maxExperience }
        };
    }

    return null;
}

/**
 * Normalize education level for comparison
 */
function normalizeEducationLevel(level: string): string {
    const normalized = level.toLowerCase().trim();

    // Map common variations to standard levels
    const levelMap: Record<string, string> = {
        'high school': 'high school',
        'highschool': 'high school',
        'hs': 'high school',
        'diploma': 'high school',

        'associate': 'associate',
        'associates': 'associate',
        "associate's": 'associate',

        'bachelor': 'bachelor',
        'bachelors': 'bachelor',
        "bachelor's": 'bachelor',
        'bs': 'bachelor',
        'ba': 'bachelor',
        'bsc': 'bachelor',
        'btech': 'bachelor',
        'be': 'bachelor',

        'master': 'master',
        'masters': 'master',
        "master's": 'master',
        'ms': 'master',
        'ma': 'master',
        'msc': 'master',
        'mtech': 'master',
        'mba': 'master',

        'phd': 'phd',
        'ph.d': 'phd',
        'doctorate': 'phd',
        'doctoral': 'phd'
    };

    return levelMap[normalized] || normalized;
}

/**
 * Get education level hierarchy rank (higher number = higher level)
 */
function getEducationRank(level: string): number {
    const normalized = normalizeEducationLevel(level);

    const ranks: Record<string, number> = {
        'high school': 1,
        'associate': 2,
        'bachelor': 3,
        'master': 4,
        'phd': 5
    };

    return ranks[normalized] || 0;
}

/**
 * Check if candidate meets education requirements
 * Requirement 4.4
 */
function checkEducationRequirements(
    candidateEducation: CandidateProfile['education'] = [],
    educationRequirements: EducationRequirement[] = []
): UnmetCriterion | null {
    if (educationRequirements.length === 0) {
        return null;
    }

    // Get the highest education level the candidate has
    const candidateHighestRank = Math.max(
        0,
        ...candidateEducation.map(edu => getEducationRank(edu.degree))
    );

    // Check each requirement
    const unmetRequirements: EducationRequirement[] = [];

    for (const requirement of educationRequirements) {
        const requiredRank = getEducationRank(requirement.level);

        // Check if candidate meets the level requirement
        if (candidateHighestRank < requiredRank) {
            unmetRequirements.push(requirement);
            continue;
        }

        // If a specific field is required, check if candidate has it
        if (requirement.field) {
            const normalizedRequiredField = requirement.field.toLowerCase().trim();
            const hasMatchingField = candidateEducation.some(edu => {
                const eduRank = getEducationRank(edu.degree);
                const normalizedEduField = (edu.field || '').toLowerCase().trim();

                // Must meet both level and field requirements
                return eduRank >= requiredRank && normalizedEduField.includes(normalizedRequiredField);
            });

            if (!hasMatchingField) {
                unmetRequirements.push(requirement);
            }
        }
    }

    if (unmetRequirements.length > 0) {
        const reqList = unmetRequirements
            .map(r => r.field ? `${r.level} in ${r.field}` : r.level)
            .join(', ');

        return {
            type: 'education',
            message: `Missing required education: ${reqList}`,
            details: { missing: unmetRequirements }
        };
    }

    return null;
}

/**
 * Check candidate eligibility for a campaign
 * 
 * Requirements: 4.5, 4.6, 4.7
 * 
 * @param candidate - Candidate profile with skills, experience, and education
 * @param campaign - Campaign with eligibility criteria
 * @param matchingScore - Candidate's matching score for the job (0-100)
 * @returns Eligibility result with status and list of unmet criteria
 */
export function checkEligibility(
    candidate: CandidateProfile,
    campaign: Campaign,
    matchingScore: number
): EligibilityResult {
    const unmetCriteria: UnmetCriterion[] = [];

    // Check matching score (Requirement 4.1, 4.8)
    if (campaign.min_matching_score !== undefined && campaign.min_matching_score > 0) {
        const scoreCheck = checkMatchingScore(matchingScore, campaign.min_matching_score);
        if (scoreCheck) {
            unmetCriteria.push(scoreCheck);
        }
    }

    // Check required skills (Requirement 4.2)
    if (campaign.required_skills && Array.isArray(campaign.required_skills)) {
        const skillsCheck = checkRequiredSkills(
            candidate.skills,
            campaign.required_skills as RequiredSkill[]
        );
        if (skillsCheck) {
            unmetCriteria.push(skillsCheck);
        }
    }

    // Check experience range (Requirement 4.3)
    const experienceCheck = checkExperienceRange(
        candidate.experience_years,
        campaign.min_experience,
        campaign.max_experience
    );
    if (experienceCheck) {
        unmetCriteria.push(experienceCheck);
    }

    // Check education requirements (Requirement 4.4)
    if (campaign.education_requirements && Array.isArray(campaign.education_requirements)) {
        const educationCheck = checkEducationRequirements(
            candidate.education,
            campaign.education_requirements as EducationRequirement[]
        );
        if (educationCheck) {
            unmetCriteria.push(educationCheck);
        }
    }

    // Requirement 4.5, 4.6, 4.7: Return eligibility status and unmet criteria
    return {
        eligible: unmetCriteria.length === 0,
        unmetCriteria
    };
}
