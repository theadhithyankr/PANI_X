import { getGroqChatCompletion } from './groq';

/**
 * Valid round types for campaign pipelines
 */
export const VALID_ROUND_TYPES = [
    'aptitude test',
    'technical assessment',
    'HR interview',
    'technical interview',
    'group discussion'
] as const;

export type RoundType = typeof VALID_ROUND_TYPES[number];

/**
 * Structure of a suggested pipeline round
 */
export interface SuggestedRound {
    roundName: string;
    roundType: RoundType;
    dateOffsetDays: number;
    passingCriteria: string;
}

/**
 * Response from the AI pipeline builder
 */
export interface PipelineGenerationResult {
    rounds: SuggestedRound[];
    warning?: string;
}

/**
 * Validates that a round type is one of the allowed types
 */
function isValidRoundType(type: string): type is RoundType {
    return VALID_ROUND_TYPES.includes(type as RoundType);
}

/**
 * Validates a single round object from AI response
 */
function validateRound(round: any): SuggestedRound | null {
    if (!round || typeof round !== 'object') {
        return null;
    }

    const { roundName, roundType, dateOffsetDays, passingCriteria } = round;

    // Validate required fields
    if (!roundName || typeof roundName !== 'string') {
        return null;
    }

    if (!roundType || typeof roundType !== 'string' || !isValidRoundType(roundType)) {
        return null;
    }

    if (typeof dateOffsetDays !== 'number' || dateOffsetDays < 0) {
        return null;
    }

    if (!passingCriteria || typeof passingCriteria !== 'string') {
        return null;
    }

    return {
        roundName: roundName.trim(),
        roundType,
        dateOffsetDays,
        passingCriteria: passingCriteria.trim()
    };
}

/**
 * Orders rounds from least to most selective based on typical hiring pipeline flow
 */
function orderRoundsBySelectivity(rounds: SuggestedRound[]): SuggestedRound[] {
    const typeOrder: Record<RoundType, number> = {
        'aptitude test': 1,
        'technical assessment': 2,
        'group discussion': 3,
        'HR interview': 4,
        'technical interview': 5
    };

    return [...rounds].sort((a, b) => {
        const orderDiff = typeOrder[a.roundType] - typeOrder[b.roundType];
        if (orderDiff !== 0) {
            return orderDiff;
        }
        // If same type, maintain original order (or sort by date offset)
        return a.dateOffsetDays - b.dateOffsetDays;
    });
}

/**
 * Constructs the prompt for AI pipeline generation
 */
function buildPrompt(roleTitle: string, seniorityLevel: string, department: string): string {
    return `You are an expert hiring manager designing a multi-round recruitment pipeline for a structured hiring campaign.

Role Details:
- Title: ${roleTitle}
- Seniority Level: ${seniorityLevel}
- Department: ${department}

Generate a hiring pipeline with 3-6 assessment rounds. Each round should be appropriate for the role's seniority and department.

Requirements:
1. Include between 3 and 6 rounds
2. Order rounds from least to most selective (e.g., aptitude test before technical interview)
3. Each round must have:
   - roundName: A descriptive name for the round (e.g., "Coding Challenge", "System Design Interview")
   - roundType: Must be one of: "aptitude test", "technical assessment", "HR interview", "technical interview", "group discussion"
   - dateOffsetDays: Number of days from campaign start date (must be positive integer, sequential)
   - passingCriteria: Clear criteria for passing this round (e.g., "Score 70% or higher", "Demonstrate strong problem-solving skills")

4. Ensure dateOffsetDays are sequential and spaced appropriately (e.g., 0, 3, 7, 10, 14, 21)

Return ONLY a valid JSON object with this exact structure:
{
  "rounds": [
    {
      "roundName": "string",
      "roundType": "aptitude test" | "technical assessment" | "HR interview" | "technical interview" | "group discussion",
      "dateOffsetDays": number,
      "passingCriteria": "string"
    }
  ]
}`;
}

/**
 * Generates a suggested hiring pipeline using AI based on role parameters
 * 
 * @param roleTitle - The job title/role (e.g., "Senior Software Engineer")
 * @param seniorityLevel - The seniority level (e.g., "Senior", "Junior", "Mid-level")
 * @param department - The department (e.g., "Engineering", "Product", "Design")
 * @returns Promise resolving to pipeline generation result with suggested rounds
 * @throws Error if API call fails or times out
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.7**
 */
export async function generatePipeline(
    roleTitle: string,
    seniorityLevel: string,
    department: string
): Promise<PipelineGenerationResult> {
    // Validate inputs
    if (!roleTitle?.trim() || !seniorityLevel?.trim() || !department?.trim()) {
        throw new Error('Role title, seniority level, and department are required');
    }

    // Construct the prompt
    const prompt = buildPrompt(roleTitle.trim(), seniorityLevel.trim(), department.trim());

    try {
        // Create a timeout promise (10 seconds as per requirement 2.1)
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('AI pipeline generation timed out after 10 seconds')), 10000);
        });

        // Race between API call and timeout
        const responseText = await Promise.race([
            getGroqChatCompletion(prompt, 'llama-3.1-8b-instant', true),
            timeoutPromise
        ]);

        // Parse JSON response
        let parsedResponse: any;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Failed to parse AI response as JSON');
        }

        // Validate response structure
        if (!parsedResponse.rounds || !Array.isArray(parsedResponse.rounds)) {
            throw new Error('Invalid AI response: missing or invalid rounds array');
        }

        // Validate and filter rounds
        const validatedRounds: SuggestedRound[] = [];
        for (const round of parsedResponse.rounds) {
            const validatedRound = validateRound(round);
            if (validatedRound) {
                validatedRounds.push(validatedRound);
            }
        }

        // Check if we have valid rounds
        if (validatedRounds.length === 0) {
            throw new Error('No valid rounds generated by AI');
        }

        // Check round count (requirement 2.2: between 3 and 6 rounds)
        let warning: string | undefined;
        if (validatedRounds.length < 3) {
            warning = 'AI generated fewer than 3 rounds. Consider adding more rounds manually.';
        } else if (validatedRounds.length > 6) {
            warning = 'AI generated more than 6 rounds. Consider removing some rounds for better candidate experience.';
        }

        // Order rounds by selectivity (requirement 2.5)
        const orderedRounds = orderRoundsBySelectivity(validatedRounds);

        return {
            rounds: orderedRounds,
            warning
        };
    } catch (error) {
        // Re-throw with more context
        if (error instanceof Error) {
            throw new Error(`AI pipeline generation failed: ${error.message}`);
        }
        throw new Error('AI pipeline generation failed with unknown error');
    }
}
