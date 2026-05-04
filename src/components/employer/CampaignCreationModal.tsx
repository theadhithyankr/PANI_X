import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Briefcase, Target, Award } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../ui/DateTimePicker';
import { Checkbox } from '../ui/checkbox';
import { useJobs, useCampaigns } from '../../hooks/useSupabase';
import type { Campaign } from '../../hooks/useSupabase';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

interface CampaignCreationModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: (campaign: Campaign) => void;
}

const EDUCATION_LEVELS = [
    'High School',
    'Associate Degree',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'Doctorate',
    'Bootcamp',
    'Self-Taught'
];

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function CampaignCreationModal({ open, onClose, onSuccess }: CampaignCreationModalProps) {
    const { user } = useAuth();
    const { jobs, loading: jobsLoading } = useJobs();
    const { createCampaign } = useCampaigns();
    const toast = useToast();

    // Form state
    const [campaignName, setCampaignName] = useState('');
    const [linkedJobId, setLinkedJobId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'invite-only'>('public');

    // Entry criteria state
    const [minMatchingScore, setMinMatchingScore] = useState(0);
    const [requiredSkills, setRequiredSkills] = useState<Array<{ skill: string; proficiency: string }>>([]);
    const [skillInput, setSkillInput] = useState('');
    const [skillProficiency, setSkillProficiency] = useState('intermediate');
    const [minExperience, setMinExperience] = useState(0);
    const [maxExperience, setMaxExperience] = useState(20);
    const [educationRequirements, setEducationRequirements] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [dateError, setDateError] = useState('');

    // Filter jobs to only show employer's active jobs
    const employerJobs = jobs.filter(job => job.employer_id === user?.id && job.status === 'Active');

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setCampaignName('');
            setLinkedJobId('');
            setStartDate('');
            setEndDate('');
            setVisibility('public');
            setMinMatchingScore(0);
            setRequiredSkills([]);
            setSkillInput('');
            setSkillProficiency('intermediate');
            setMinExperience(0);
            setMaxExperience(20);
            setEducationRequirements([]);
            setDateError('');
        }
    }, [open]);

    // Validate dates
    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end <= start) {
                setDateError('End date must be after start date');
            } else {
                setDateError('');
            }
        } else {
            setDateError('');
        }
    }, [startDate, endDate]);

    const handleAddSkill = () => {
        const trimmedSkill = skillInput.trim();
        if (trimmedSkill && !requiredSkills.some(s => s.skill.toLowerCase() === trimmedSkill.toLowerCase())) {
            setRequiredSkills([...requiredSkills, { skill: trimmedSkill, proficiency: skillProficiency }]);
            setSkillInput('');
            setSkillProficiency('intermediate');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setRequiredSkills(requiredSkills.filter(s => s.skill !== skillToRemove));
    };

    const handleToggleEducation = (level: string) => {
        if (educationRequirements.includes(level)) {
            setEducationRequirements(educationRequirements.filter(e => e !== level));
        } else {
            setEducationRequirements([...educationRequirements, level]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!campaignName.trim()) {
            toast('Please enter a campaign name', 'error');
            return;
        }
        if (!linkedJobId) {
            toast('Please select a linked job', 'error');
            return;
        }
        if (!startDate) {
            toast('Please select a start date', 'error');
            return;
        }
        if (!endDate) {
            toast('Please select an end date', 'error');
            return;
        }
        if (dateError) {
            toast(dateError, 'error');
            return;
        }

        setSubmitting(true);

        try {
            const newCampaign = await createCampaign({
                job_id: linkedJobId,
                name: campaignName.trim(),
                start_date: startDate,
                end_date: endDate,
                visibility,
                min_matching_score: minMatchingScore,
                required_skills: requiredSkills,
                min_experience: minExperience,
                max_experience: maxExperience,
                education_requirements: educationRequirements,
            });

            toast('Campaign created successfully!', 'success');
            if (onSuccess && newCampaign) {
                onSuccess(newCampaign as Campaign);
            }
            onClose();
        } catch (error: any) {
            console.error('Error creating campaign:', error);
            toast(error?.message || 'Failed to create campaign', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
                    <h2 className="text-lg font-semibold text-foreground">Create Campaign</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="px-6 py-5 space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <span>Basic Information</span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="campaign-name">Campaign Name *</Label>
                                <Input
                                    id="campaign-name"
                                    placeholder="e.g. Summer 2024 Software Engineering Drive"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linked-job">Linked Job *</Label>
                                {jobsLoading ? (
                                    <div className="flex items-center gap-2 h-10 px-3 border border-input rounded-lg bg-muted/20">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Loading jobs...</span>
                                    </div>
                                ) : employerJobs.length === 0 ? (
                                    <div className="text-sm text-muted-foreground p-3 border border-border/60 rounded-lg bg-muted/20">
                                        No active jobs found. Please create a job first.
                                    </div>
                                ) : (
                                    <Select value={linkedJobId} onValueChange={setLinkedJobId} disabled={submitting}>
                                        <SelectTrigger id="linked-job">
                                            <SelectValue placeholder="Select a job" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employerJobs.map((job) => (
                                                <SelectItem key={job.id} value={job.id}>
                                                    {job.title || job.role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date *</Label>
                                    <DatePicker
                                        value={startDate}
                                        onChange={setStartDate}
                                        placeholder="Select start date"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date *</Label>
                                    <DatePicker
                                        value={endDate}
                                        onChange={setEndDate}
                                        placeholder="Select end date"
                                    />
                                </div>
                            </div>

                            {dateError && (
                                <p className="text-sm text-rose-400">{dateError}</p>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="visibility">Visibility</Label>
                                <Select value={visibility} onValueChange={(v) => setVisibility(v as 'public' | 'invite-only')} disabled={submitting}>
                                    <SelectTrigger id="visibility">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="invite-only">Invite Only</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {visibility === 'public'
                                        ? 'Campaign will be visible to all eligible candidates'
                                        : 'Campaign will only be visible to invited candidates'}
                                </p>
                            </div>
                        </div>

                        {/* Entry Criteria */}
                        <div className="space-y-4 pt-4 border-t border-border/60">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Target className="h-4 w-4 text-primary" />
                                <span>Entry Criteria</span>
                            </div>

                            {/* Min Matching Score */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="min-score">Minimum Matching Score</Label>
                                    <span className="text-sm font-semibold text-primary">{minMatchingScore}%</span>
                                </div>
                                <input
                                    id="min-score"
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={minMatchingScore}
                                    onChange={(e) => setMinMatchingScore(Number(e.target.value))}
                                    disabled={submitting}
                                    className="w-full accent-primary h-2 cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Candidates below this score will be automatically rejected
                                </p>
                            </div>

                            {/* Required Skills */}
                            <div className="space-y-3">
                                <Label>Required Skills</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. React, Python, AWS"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddSkill();
                                            }
                                        }}
                                        disabled={submitting}
                                        className="flex-1"
                                    />
                                    <Select value={skillProficiency} onValueChange={setSkillProficiency} disabled={submitting}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROFICIENCY_LEVELS.map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" onClick={handleAddSkill} disabled={submitting || !skillInput.trim()}>
                                        Add
                                    </Button>
                                </div>
                                {requiredSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {requiredSkills.map((skill) => (
                                            <div
                                                key={skill.skill}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm"
                                            >
                                                <Award className="h-3.5 w-3.5 text-primary" />
                                                <span className="text-foreground font-medium">{skill.skill}</span>
                                                <span className="text-xs text-muted-foreground">({skill.proficiency})</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill.skill)}
                                                    className="ml-1 text-muted-foreground hover:text-foreground"
                                                    disabled={submitting}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Experience Range */}
                            <div className="space-y-3">
                                <Label>Experience Range (years)</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Minimum</span>
                                            <span className="text-sm font-semibold text-foreground">{minExperience}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={20}
                                            step={1}
                                            value={minExperience}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setMinExperience(val);
                                                if (val > maxExperience) {
                                                    setMaxExperience(val);
                                                }
                                            }}
                                            disabled={submitting}
                                            className="w-full accent-primary h-2 cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Maximum</span>
                                            <span className="text-sm font-semibold text-foreground">{maxExperience}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={20}
                                            step={1}
                                            value={maxExperience}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setMaxExperience(val);
                                                if (val < minExperience) {
                                                    setMinExperience(val);
                                                }
                                            }}
                                            disabled={submitting}
                                            className="w-full accent-primary h-2 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Education Requirements */}
                            <div className="space-y-3">
                                <Label>Education Requirements</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {EDUCATION_LEVELS.map((level) => (
                                        <div key={level} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`edu-${level}`}
                                                checked={educationRequirements.includes(level)}
                                                onCheckedChange={() => handleToggleEducation(level)}
                                                disabled={submitting}
                                            />
                                            <label
                                                htmlFor={`edu-${level}`}
                                                className="text-sm text-foreground cursor-pointer select-none"
                                            >
                                                {level}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {educationRequirements.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Candidates must have at least one of the selected education levels
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/60 bg-card/50 shrink-0">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || !!dateError || employerJobs.length === 0} className="gap-2">
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4" />
                                    Create Campaign
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
