import { getGroqChatCompletion } from './groq';

export interface GeneratedCampaignSettings {
    campaignName: string;
    startDate: string;
    endDate: string;
    visibility: 'public' | 'invite-only';
    minMatchingScore: number;
    requiredSkills: Array<{ name: string; proficiency: string }>;
    minExperience: number;
    maxExperience: number;
    educationRequirements: string[];
    rationale: string;
}

const VALID_PROFICIENCY = ['beginner', 'intermediate', 'advanced', 'expert'];
const VALID_EDUCATION = [
    'High School', 'Associate Degree', "Bachelor's Degree",
    "Master's Degree", 'Doctorate', 'Bootcamp', 'Self-Taught',
];

function offsetDate(base: string, days: number): string {
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(isNaN(val) ? min : val, min), max);
}

export async function generateCampaignSettings(
    jobTitle: string,
    jobDescription: string,
    jobSkills: string[],
    userPrompt: string
): Promise<GeneratedCampaignSettings> {
    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are an expert hiring manager configuring a structured hiring campaign.

Today's date: ${today}

Job: ${jobTitle}
Job Description: ${jobDescription.slice(0, 400)}
Job Skills: ${jobSkills.slice(0, 10).join(', ')}

Employer's Request: "${userPrompt}"

Generate a hiring campaign configuration as a JSON object:
{
  "campaignName": "descriptive campaign name",
  "startDate": "YYYY-MM-DD (at least 3 days from today)",
  "endDate": "YYYY-MM-DD (2–8 weeks after startDate)",
  "visibility": "public" or "invite-only",
  "minMatchingScore": integer 0–100,
  "requiredSkills": [{"skill": "name", "proficiency": "beginner|intermediate|advanced|expert"}],
  "minExperience": integer 0–20,
  "maxExperience": integer 0–20,
  "educationRequirements": ["Bachelor's Degree", etc — only genuinely required, can be empty array],
  "rationale": "one sentence explaining the key settings chosen"
}

Return ONLY valid JSON, no extra text.`;

    const timeout = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('Campaign generation timed out after 15 seconds')), 15000)
    );

    const response = await Promise.race([
        getGroqChatCompletion(prompt, 'llama-3.1-8b-instant', true),
        timeout,
    ]);

    let parsed: any;
    try { parsed = JSON.parse(response); } catch { throw new Error('Failed to parse AI response'); }

    const startDate = parsed.startDate?.slice(0, 10) || offsetDate(today, 5);
    let endDate = parsed.endDate?.slice(0, 10) || offsetDate(startDate, 28);
    if (endDate <= startDate) endDate = offsetDate(startDate, 28);

    const minExp = clamp(Number(parsed.minExperience), 0, 20);
    const maxExp = clamp(Number(parsed.maxExperience), 0, 20);

    return {
        campaignName: String(parsed.campaignName || `${jobTitle} Campaign`),
        startDate,
        endDate,
        visibility: parsed.visibility === 'invite-only' ? 'invite-only' : 'public',
        minMatchingScore: clamp(Number(parsed.minMatchingScore), 0, 100),
        requiredSkills: Array.isArray(parsed.requiredSkills)
            ? parsed.requiredSkills
                .filter((s: any) => (s?.name || s?.skill) && VALID_PROFICIENCY.includes(s?.proficiency))
                .map((s: any) => ({ name: s.name || s.skill, proficiency: s.proficiency }))
            : [],
        minExperience: minExp,
        maxExperience: Math.max(maxExp, minExp),
        educationRequirements: Array.isArray(parsed.educationRequirements)
            ? parsed.educationRequirements.filter((e: any) => VALID_EDUCATION.includes(e))
            : [],
        rationale: String(parsed.rationale || ''),
    };
}
