import { getGemmaCompletion } from '../services/huggingface';

export async function generateJobDescription(prompt: string) {
    const systemInstruction = `You are an expert HR assistant. Generate detailed job posting data in strict JSON format.
    Return ONLY raw JSON. Do not use Markdown code blocks.
    Structure:
    {
        "title": "Job Title",
        "type": "Full Time/Part Time/Contract",
        "location": "City, Country",
        "description": "Detailed 3 paragraph description...",
        "experience_level": "Entry/Junior/Mid/Senior/Lead",
        "skills": ["Skill1", "Skill2", "Skill3"],
        "salary_range": "e.g. $50k - $80k or Competitive",
        "work_mode": "On-site/Hybrid/Remote",
        "openings": 1
    }`;

    const fullPrompt = `${systemInstruction}\n\nUser Request: ${prompt}`;

    try {
        const text = await getGemmaCompletion(fullPrompt, {
            jsonMode: true,
            task: 'job_description'
        });
        
        // Clean up text if it contains markdown formatting
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("AI Generation Failed:", error);

        // Fallback Mock if independent service is down, to ensure Demo never breaks
        console.warn("Falling back to Mock Data");
        return {
            title: "Senior Role (Mock)",
            type: "Full Time",
            location: "Remote",
            experience_level: "Senior",
            skills: ["React", "TypeScript", "Node.js"],
            salary_range: "Competitive",
            work_mode: "Remote",
            openings: 1,
            description: "AI Service was busy, but here is a placeholder. \n\nWe are looking for a skilled professional to join our team. You should have strong experience in the specific technologies mentioned."
        };
    }
}

export async function parseResume(resumeText: string) {
    const systemInstruction = `You are an expert Resume Parser. Extract a structured profile from the resume text.
Return ONLY raw JSON. No markdown, no explanation.

CRITICAL SEPARATION RULES — follow exactly:
1. "experience" = WORK HISTORY ONLY: jobs, internships, freelance, part-time roles at companies/startups/organizations. Each entry MUST have a company/employer name and a job title. Do NOT include schools, universities, or colleges here.
2. "education" = ACADEMIC HISTORY ONLY: universities, colleges, schools, bootcamps, certifications. Each entry MUST have a school/institution name and a degree or program. Do NOT include employers or job titles here.
3. "experience_years" = total years of professional WORK experience only (do not count student years; internships count as 0.5 per year).

JSON structure (follow field names exactly):
{
  "headline": "Professional Headline based on most recent job",
  "about": "2-3 sentence professional summary",
  "skills": ["Skill1", "Skill2"],
  "experience_years": 3,
  "location": "City, Country",
  "experience": [
    { "id": "1", "title": "Software Engineer", "company": "Acme Corp", "start_date": "Jan 2022", "end_date": "Present", "description": "Key responsibilities and achievements" }
  ],
  "education": [
    { "id": "1", "school": "MIT", "degree": "B.Tech", "field": "Computer Science", "start_year": "2018", "end_year": "2022" }
  ]
}
IMPORTANT: Never use future years. All dates must be ${new Date().getFullYear()} or earlier. Do NOT invent or extrapolate years — use only what is explicitly written in the resume.`;

    const fullPrompt = `${systemInstruction}\n\nResume Text:\n${resumeText.substring(0, 3000)}`;

    try {
        const text = await getGemmaCompletion(fullPrompt, { jsonMode: true, task: 'resume_parse' });
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        return sanitizeResumeParseResult(parsed);
    } catch (error) {
        console.error("Resume Parsing Failed:", error);
        return {
            headline: "Candidate (AI Parse Failed)",
            about: "Could not auto-generate bio. Please fill manually.",
            skills: [],
            experience_years: 0,
            location: "",
            experience: [],
            education: [],
        };
    }
}

const EDU_KEYWORDS = ['university', 'college', 'school', 'institute', 'academy', 'polytechnic', 'iit', 'nit', 'bits', 'mit', 'stanford', 'btech', 'b.tech', 'bachelor', 'master', 'mba', 'phd'];
const WORK_KEYWORDS = ['inc', 'ltd', 'llc', 'corp', 'pvt', 'technologies', 'solutions', 'software', 'systems', 'services', 'labs', 'studio', 'agency', 'startup', 'consulting'];

const CURRENT_YEAR = new Date().getFullYear();

function clampYear(yearStr: string): string {
    if (!yearStr) return yearStr;
    const y = parseInt(yearStr, 10);
    if (isNaN(y)) return yearStr;
    return y > CURRENT_YEAR ? String(CURRENT_YEAR) : yearStr;
}

function clampDateYear(dateStr: string): string {
    if (!dateStr || dateStr.toLowerCase() === 'present') return dateStr;
    return dateStr.replace(/\b(\d{4})\b/, (_, y) => {
        const yr = parseInt(y, 10);
        return yr > CURRENT_YEAR ? String(CURRENT_YEAR) : y;
    });
}

function looksLikeSchool(name: string): boolean {
    const lower = (name || '').toLowerCase();
    return EDU_KEYWORDS.some(k => lower.includes(k));
}

function looksLikeCompany(name: string): boolean {
    const lower = (name || '').toLowerCase();
    return WORK_KEYWORDS.some(k => lower.includes(k));
}

function sanitizeResumeParseResult(parsed: any) {
    const experience: any[] = [];
    const education: any[] = [];

    for (const item of (parsed.experience || [])) {
        // If AI put a school in the experience array, move it to education
        if (looksLikeSchool(item.company) && !looksLikeCompany(item.company)) {
            education.push({
                id: item.id,
                school: item.company,
                degree: item.title,
                field: item.description?.substring(0, 60) || '',
                start_year: clampYear(item.start_date?.replace(/[^0-9]/g, '').substring(0, 4) || ''),
                end_year: clampYear(item.end_date?.replace(/[^0-9]/g, '').substring(0, 4) || ''),
            });
        } else {
            experience.push({
                ...item,
                start_date: clampDateYear(item.start_date || ''),
                end_date: clampDateYear(item.end_date || ''),
            });
        }
    }

    for (const item of (parsed.education || [])) {
        // If AI put a job in the education array, move it to experience
        if (looksLikeCompany(item.school) && !looksLikeSchool(item.school)) {
            experience.push({
                id: item.id,
                title: item.degree || item.field || 'Role',
                company: item.school,
                start_date: clampDateYear(item.start_year || ''),
                end_date: clampDateYear(item.end_year || ''),
                description: '',
            });
        } else {
            education.push({
                ...item,
                start_year: clampYear(item.start_year || ''),
                end_year: clampYear(item.end_year || ''),
            });
        }
    }

    const maxExp = CURRENT_YEAR - 1960;
    if (parsed.experience_years != null) {
        parsed.experience_years = Math.min(parsed.experience_years, maxExp);
    }

    return { ...parsed, experience, education };
}

const SKILL_CASING: Record<string, string> = {
    'javascript': 'JavaScript', 'typescript': 'TypeScript',
    'html': 'HTML', 'css': 'CSS', 'sql': 'SQL', 'nosql': 'NoSQL',
    'nodejs': 'Node.js', 'node': 'Node.js', 'reactjs': 'React.js',
    'react': 'React', 'vuejs': 'Vue.js', 'vue': 'Vue',
    'nextjs': 'Next.js', 'next': 'Next.js', 'nestjs': 'NestJS',
    'graphql': 'GraphQL', 'mongodb': 'MongoDB', 'postgresql': 'PostgreSQL',
    'mysql': 'MySQL', 'redis': 'Redis', 'aws': 'AWS', 'gcp': 'GCP',
    'git': 'Git', 'docker': 'Docker', 'kubernetes': 'Kubernetes',
    'firebase': 'Firebase', 'supabase': 'Supabase', 'tailwindcss': 'Tailwind CSS',
    'tailwind': 'Tailwind CSS', 'figma': 'Figma', 'python': 'Python',
    'java': 'Java', 'go': 'Go', 'rust': 'Rust', 'php': 'PHP',
    'fastapi': 'FastAPI', 'django': 'Django', 'flask': 'Flask',
    'express': 'Express', 'expressjs': 'Express.js', 'angular': 'Angular',
    'svelte': 'Svelte', 'scss': 'SCSS', 'sass': 'Sass', 'jest': 'Jest',
    'webpack': 'Webpack', 'vite': 'Vite', 'linux': 'Linux', 'git bash': 'Git Bash',
    'c++': 'C++', 'c#': 'C#', 'unity': 'Unity', 'unreal': 'Unreal Engine',
    'swift': 'Swift', 'kotlin': 'Kotlin', 'flutter': 'Flutter', 'dart': 'Dart',
    'react native': 'React Native', 'expo': 'Expo', 'postman': 'Postman',
};

export function normalizeSkillName(skill: string): string {
    const lower = skill.toLowerCase().trim();
    if (SKILL_CASING[lower]) return SKILL_CASING[lower];
    return lower.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function calculateJobMatch(job: any, profile: any) {
    if (!profile) return { score: 10, reason: "Complete your profile to get matches.", details: [] };

    let score = 0;
    const details: { label: string; type: 'success' | 'warning' | 'neutral'; score?: string; category?: 'role' | 'skills' | 'experience' | 'location' }[] = [];

    // 0. Keyword/Role Match (CRITICAL - 30 pts)
    const jobTitle = (job.title || job.role || '').toLowerCase();
    const profileHeadline = (profile.headline || profile.role || '').toLowerCase();

    const stopWords = ['a', 'an', 'the', 'senior', 'junior', 'level', 'developer', 'engineer', 'manager', 'lead', 'intern', 'remote'];
    const jobTokens = jobTitle.split(/[\s/\-,]+/).filter((w: string) => w.length > 2 && !stopWords.includes(w));
    const profileTokens = profileHeadline.split(/[\s/\-,]+/).filter((w: string) => w.length > 2 && !stopWords.includes(w));

    const titleMatches = jobTokens.filter((token: string) => profileTokens.some((pt: string) => pt.includes(token) || token.includes(pt)));

    if (titleMatches.length > 0) {
        score += 30;
        details.push({ label: `Role Match: ${job.title || job.role}`, type: 'success', score: '+30%', category: 'role' });
    }

    // 1. Skill Match (40 pts)
    const jobSkillsOriginal: string[] = job.skills || [];
    const jobSkills = jobSkillsOriginal.map((s: string) => s.toLowerCase());
    const profileSkills = (profile.skills || []).map((s: string) => s.toLowerCase());

    if (jobSkills.length > 0) {
        const matchingSkillsLc = jobSkills.filter((s: string) => profileSkills.some((ps: string) => ps.includes(s) || s.includes(ps)));
        const missingSkillsLc = jobSkills.filter((s: string) => !profileSkills.some((ps: string) => ps.includes(s) || s.includes(ps)));

        const matchRatio = matchingSkillsLc.length / jobSkills.length;
        const skillPoints = matchRatio * 40;
        score += skillPoints;

        const perSkill = matchingSkillsLc.length > 0 ? Math.round(skillPoints / matchingSkillsLc.length) : 0;

        matchingSkillsLc.forEach((lc: string) => {
            const original = jobSkillsOriginal.find((s: string) => s.toLowerCase() === lc) || lc;
            details.push({ label: normalizeSkillName(original), type: 'success', score: `+${perSkill}%`, category: 'skills' });
        });
        missingSkillsLc.slice(0, 3).forEach((lc: string) => {
            const original = jobSkillsOriginal.find((s: string) => s.toLowerCase() === lc) || lc;
            details.push({ label: normalizeSkillName(original), type: 'warning', score: '0%', category: 'skills' });
        });
    } else {
        if (titleMatches.length > 0) score += 10;
    }

    // 2. Experience Match (20 pts)
    const levelMap: Record<string, number> = {
        'entry level': 0, 'junior': 1, 'mid-level': 3, 'senior': 5, 'lead': 7
    };
    const jobExp = levelMap[job.experience_level?.toLowerCase()] || 2;
    // Only trust experience_years when actual work history entries exist.
    // Check both column names — profile page saves as 'experience', legacy uses 'work_experience'.
    const workHistoryArr = Array.isArray(profile.work_experience) ? profile.work_experience
        : Array.isArray(profile.experience) ? profile.experience : null;
    const hasConfirmedWorkHistory = workHistoryArr !== null && workHistoryArr.length > 0;
    const storedExp: number =
        typeof profile.experience_years === 'number' ? profile.experience_years :
        typeof profile.experience === 'number' ? profile.experience : 0;
    const userExp = hasConfirmedWorkHistory ? storedExp : 0;

    if (userExp >= jobExp) {
        score += 20;
        details.push({ label: `Experience Met (${userExp} yrs)`, type: 'success', score: '+20%', category: 'experience' });
    } else if (userExp >= jobExp - 1) {
        score += 10;
        details.push({ label: `Experience Close (${userExp}/${jobExp} yrs)`, type: 'neutral', score: '+10%', category: 'experience' });
    } else {
        details.push({ label: `Experience Gap (${userExp} vs ${jobExp} yrs)`, type: 'warning', score: '0%', category: 'experience' });
    }

    // 3. Location (10 pts)
    let locationScore = 0;
    if (job.location && profile.location) {
        const jobLoc = job.location.toLowerCase();
        const userLoc = profile.location.toLowerCase();
        if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) {
            locationScore = 10;
            details.push({ label: "Location Match", type: 'success', score: '+10%', category: 'location' });
        }
    }
    if (job.work_mode === 'Remote' || (job.location && job.location.toLowerCase().includes('remote'))) {
        if (locationScore < 10) {
            locationScore = 10;
            details.push({ label: "Remote Friendly", type: 'success', score: '+10%', category: 'location' });
        }
    }
    score += locationScore;

    if (titleMatches.length === 0 && score < 40) score = Math.min(score, 25);
    score = Math.min(98, Math.floor(score));
    score = Math.max(10, score);

    return {
        score,
        reason: details.filter(d => d.type === 'success').map(d => d.label).slice(0, 3).join(' • '),
        details,
    };
}

export async function analyzeResumeGap(job: any, profile: any): Promise<{
    missing_skills: string[];
    actions: string[];
    resume_tips: string[];
}> {
    const prompt = `You are a career coach. Analyze the gap between a candidate and a job posting and provide specific, actionable advice.

Job: ${job.title || job.role}
Required Skills: ${(job.skills || []).join(', ')}
Experience Level: ${job.experience_level || 'Not specified'}
Work Mode: ${job.work_mode || 'Not specified'}

Candidate Skills: ${(profile?.skills || []).join(', ') || 'none listed'}
Candidate Experience: ${profile?.experience_years || 0} years
Candidate Headline: ${profile?.headline || 'not set'}

Return ONLY raw JSON with exactly this structure:
{
  "missing_skills": ["skill1", "skill2"],
  "actions": ["Specific thing to do to improve this application", "Another action"],
  "resume_tips": ["Specific resume improvement tip", "Another tip"]
}

Be specific and practical. Maximum 3 items per array. Missing skills only if truly absent from candidate.`;

    try {
        const text = await getGemmaCompletion(prompt, { jsonMode: true, task: 'chat' });
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch {
        return { missing_skills: [], actions: [], resume_tips: [] };
    }
}

export async function generateCoverLetter(job: any, profile: any) {
    const prompt = `Write a professional, concise cover letter (100-150 words) for a ${job.role} position at ${job.company_name || 'the company'}.
    Candidate: ${profile.full_name}.
    Skills: ${profile.skills?.join(', ')}.
    Experience: ${profile.experience_years} years.
    Job Description Snippet: ${job.description?.substring(0, 200)}...
    
    Tone: Professional, enthusiastic, confident.
    Output: ONLY the body of the letter. No greeting/signature placeholders if possible, or standard ones.`;

    try {
        const text = await getGemmaCompletion(prompt, { task: 'chat' });
        return text;
    } catch (e) {
        console.error(e);
        return `I am writing to express my strong interest in the ${job.role} position. With ${profile.experience_years} years of experience and expertise in ${profile.skills?.slice(0, 3).join(', ')}, I believe I would be a valuable asset to your team.\n\nThank you for considering my application.`;
    }
}

export interface ProfileAnalysis {
    strengths: string[];
    weaknesses: { issue: string; suggestion: string; }[];
    suggestions: string[];
    overall_summary: string;
    hire_recommendation?: string;
    ats_score?: number;
}

export async function analyzeProfileStrengths(
    profile: any,
    viewerRole: 'employer' | 'candidate',
    jobContext?: any,
    resumeText?: string,
    targetJobTitle?: string
): Promise<ProfileAnalysis> {
    const jobInfo = jobContext
        ? `\nTarget Job: ${jobContext.title || jobContext.role || 'General'}\nRequired Skills: ${(jobContext.skills || []).join(', ')}\nExperience Level: ${jobContext.experience_level || 'Not specified'}`
        : targetJobTitle ? `\nTarget Job: ${targetJobTitle}` : '';

    const perspective = viewerRole === 'employer'
        ? 'You are an advanced ATS (Applicant Tracking System) and senior technical recruiter evaluating a candidate. Perform a rigorous resume scan against the target job (if provided) or general industry standards. Be exact, analytical, and objective.'
        : 'You are a strict but helpful ATS (Applicant Tracking System) simulator and career coach. Your goal is to optimize the candidate\'s resume. Identify exact formatting issues, keyword density gaps, missing action verbs, and suggest ideal jobs based on their profile.';

    const expYears = typeof profile.experience_years === 'number' ? profile.experience_years : typeof profile.experience === 'number' ? profile.experience : 0;

    const prompt = `${perspective}

Profile Data:
Name: ${profile.full_name || profile.name || 'Unknown'}
Experience: ${expYears} years
Skills: ${(profile.skills || []).join(', ') || 'None listed'}
Has Resume Uploaded: ${profile.resume_url ? 'Yes' : 'No'}${jobInfo}

${resumeText ? `\n--- START RESUME TEXT ---\n${resumeText.substring(0, 4000)}\n--- END RESUME TEXT ---\n` : '\n(No raw resume text provided, using basic profile data)\n'}

Return ONLY raw JSON with this exact structure (compute all values from the actual resume/profile data — do NOT copy example numbers):
{
  "ats_score": <integer 0-100 computed from actual resume quality, keyword density, and completeness — NOT a fixed value>,
  "strengths": ["Clear quantifiable metric (e.g. increased X by Y%)", "Strong ATS keyword match for Z", "Proper use of action verbs"],
  "weaknesses": [
    {
      "issue": "Missing exact keyword matches for X, Y",
      "suggestion": "${viewerRole === 'employer' ? 'Ask candidate about their experience with X, Y during interview' : 'Add keywords X and Y to your skills section and describe how you used them.'}"
    },
    {
      "issue": "Formatting issue: inconsistent dates",
      "suggestion": "${viewerRole === 'employer' ? 'Request clarification on employment timeline' : 'Standardize all dates to MM/YYYY format for better ATS parsing.'}"
    }
  ],
  "suggestions": ["${viewerRole === 'employer' ? 'Conduct technical screen for Phaser 3' : 'Ideal Roles: Senior Game Developer, Interactive Engineer'}"],
  "overall_summary": "[1 sentence exact summary of ATS scan]",
  "hire_recommendation": "${viewerRole === 'employer' ? 'Strong Hire / Hire / Maybe / Pass' : ''}"
}

Be brutally honest, analytical, and specific. Reference actual text from the resume. Max 3 items per array.`;

    try {
        const text = await getGemmaCompletion(prompt, { jsonMode: true, task: 'chat' });
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch {
        return generateLocalAnalysis(profile, viewerRole);
    }
}

function generateLocalAnalysis(profile: any, viewerRole: 'employer' | 'candidate'): ProfileAnalysis {
    const strengths: string[] = [];
    const weaknesses: { issue: string; suggestion: string; }[] = [];
    const suggestions: string[] = [];

    const skills = profile.skills || [];
    const experience = typeof profile.experience_years === 'number' ? profile.experience_years : typeof profile.experience === 'number' ? profile.experience : 0;
    const workExp = Array.isArray(profile.work_experience) ? profile.work_experience : Array.isArray(profile.experience) ? profile.experience : [];
    const education = Array.isArray(profile.education_history) ? profile.education_history : Array.isArray(profile.education) ? profile.education : [];

    if (skills.length >= 5) strengths.push(`Strong skill set with ${skills.length} listed technologies`);
    else if (skills.length > 0) strengths.push(`Has relevant skills: ${skills.slice(0, 3).join(', ')}`);

    if (experience >= 3) strengths.push(`Solid ${experience} years of professional experience`);
    else if (experience >= 1) strengths.push(`${experience} year(s) of hands-on experience`);

    if (workExp.length >= 2) strengths.push(`Multiple work experiences showing career progression`);
    if (education.length > 0) strengths.push(`Formal education in ${education[0]?.field || education[0]?.degree || 'relevant field'}`);
    if (profile.resume_url) strengths.push('Resume uploaded and available for review');
    if (profile.about || profile.bio) strengths.push('Has a professional summary/bio');

    if (skills.length < 3) weaknesses.push({ issue: 'Limited skills listed — profile may appear incomplete', suggestion: 'Add at least 3-5 core technical skills' });
    if (experience < 1) weaknesses.push({ issue: 'Little to no professional experience documented', suggestion: 'Add any relevant internships or personal projects' });
    if (workExp.length === 0) weaknesses.push({ issue: 'No work experience entries added', suggestion: 'Detail your past work history with specific achievements' });
    if (education.length === 0) weaknesses.push({ issue: 'No education history provided', suggestion: 'Add your highest degree or relevant certifications' });
    if (!profile.resume_url) weaknesses.push({ issue: 'No resume uploaded', suggestion: 'Upload a PDF resume for better visibility' });
    if (!(profile.about || profile.bio)) weaknesses.push({ issue: 'Missing professional summary or bio', suggestion: 'Write a short 2-3 sentence professional summary' });

    if (viewerRole === 'candidate') {
        if (skills.length < 5) suggestions.push('Add more skills to increase visibility in job matches');
        if (!profile.resume_url) suggestions.push('Upload your resume to enable AI-powered profile auto-fill');
        if (workExp.length === 0) suggestions.push('Add at least one work experience entry, even internships count');
        if (!(profile.about || profile.bio)) suggestions.push('Write a compelling bio highlighting your career goals');
        suggestions.push('Keep your profile updated regularly to improve match scores');
    } else {
        if (experience < 2) suggestions.push('Consider for junior/entry-level positions');
        if (skills.length >= 5) suggestions.push('Skills align well — schedule a technical screening');
        if (workExp.length > 0) suggestions.push('Review work experience descriptions for relevant project impact');
        suggestions.push('Check resume for additional details not captured in profile');
    }

    const overall_summary = viewerRole === 'employer'
        ? `${profile.full_name || 'Candidate'} has ${experience} years of experience with ${skills.length} listed skills. ${strengths.length > weaknesses.length ? 'Profile appears strong overall.' : 'Profile could be more complete.'}`
        : `Your profile shows ${experience} years of experience. ${strengths.length > weaknesses.length ? 'You have a solid foundation — keep building!' : 'A few improvements would significantly boost your visibility.'}`;

    const ats_score = Math.min(95, Math.max(30,
        (skills.length >= 5 ? 20 : skills.length * 4) +
        (experience >= 3 ? 25 : experience * 8) +
        (workExp.length >= 2 ? 20 : workExp.length * 10) +
        (education.length > 0 ? 15 : 0) +
        (profile.resume_url ? 10 : 0) +
        ((profile.about || profile.bio) ? 10 : 0)
    ));

    return {
        strengths: strengths.slice(0, 4),
        weaknesses: weaknesses.slice(0, 4),
        suggestions: suggestions.slice(0, 4),
        overall_summary,
        ats_score,
        hire_recommendation: viewerRole === 'employer'
            ? (strengths.length >= 4 ? 'Hire' : strengths.length >= 2 ? 'Maybe' : 'Pass')
            : undefined,
    };
}
