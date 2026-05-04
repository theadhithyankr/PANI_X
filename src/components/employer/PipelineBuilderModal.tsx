import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Sparkles, Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../ui/DateTimePicker';
import { useCampaignRounds, useCampaigns } from '../../hooks/useSupabase';
import type { Campaign } from '../../hooks/useSupabase';
import { generatePipeline, VALID_ROUND_TYPES } from '../../services/aiPipelineBuilder';
import type { SuggestedRound } from '../../services/aiPipelineBuilder';
import { useToast } from '../../contexts/ToastContext';

interface PipelineBuilderModalProps {
    open: boolean;
    onClose: () => void;
    campaign: Campaign | null;
}

type RoundType = typeof VALID_ROUND_TYPES[number];

interface ManualRound {
    name: string;
    type: RoundType;
    scheduled_date: string;
    min_passing_score: number;
}

interface ExtendPrompt {
    roundIndex?: number; // undefined = top-level banner (e.g. from Accept All)
    newEndDate?: string;
    newStartDate?: string;
    extending: boolean;
}

// Strip time/timezone from any ISO date string → "yyyy-mm-dd"
function toDateStr(d: string | undefined): string {
    return d ? d.slice(0, 10) : '';
}

export default function PipelineBuilderModal({ open, onClose, campaign }: PipelineBuilderModalProps) {
    const { createRound } = useCampaignRounds();
    const { updateCampaign } = useCampaigns();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

    const [roleTitle, setRoleTitle] = useState(campaign?.job?.title || '');
    const [seniorityLevel, setSeniorityLevel] = useState('Mid-level');
    const [department, setDepartment] = useState('');
    const [generating, setGenerating] = useState(false);
    const [aiWarning, setAiWarning] = useState('');
    const [editedSuggested, setEditedSuggested] = useState<SuggestedRound[]>([]);

    const [manualRounds, setManualRounds] = useState<ManualRound[]>([]);

    const [saving, setSaving] = useState(false);
    const [showOverride, setShowOverride] = useState(false);
    const [showActivatePrompt, setShowActivatePrompt] = useState(false);
    const [activating, setActivating] = useState(false);

    // Track effective campaign dates locally (normalized to yyyy-mm-dd)
    const [localStart, setLocalStart] = useState(toDateStr(campaign?.start_date));
    const [localEnd, setLocalEnd] = useState(toDateStr(campaign?.end_date));
    const [extendPrompt, setExtendPrompt] = useState<ExtendPrompt | null>(null);

    const autoGenerateRef = useRef<string | null>(null);

    // Keep local dates in sync with campaign prop (normalize ISO → yyyy-mm-dd)
    useEffect(() => {
        if (campaign) {
            setLocalStart(toDateStr(campaign.start_date));
            setLocalEnd(toDateStr(campaign.end_date));
        }
    }, [campaign?.start_date, campaign?.end_date]);

    useEffect(() => {
        if (!open || !campaign) return;
        if (autoGenerateRef.current === campaign.id) return;
        autoGenerateRef.current = campaign.id;

        const expToSeniority: Record<string, string> = {
            'entry level': 'Junior',
            'junior': 'Junior',
            'mid-level': 'Mid-level',
            'mid level': 'Mid-level',
            'senior': 'Senior',
            'lead': 'Lead',
        };
        const expLevel = (campaign.job?.experience_level || '').toLowerCase().trim();
        const derivedSeniority = Object.entries(expToSeniority).find(([k]) => expLevel.includes(k))?.[1] || 'Mid-level';
        const derivedRole = campaign.job?.title || campaign.job?.role || '';
        const derivedDept = 'Engineering';

        setRoleTitle(derivedRole);
        setSeniorityLevel(derivedSeniority);
        setDepartment(derivedDept);
        setEditedSuggested([]);
        setAiWarning('');
        setActiveTab('ai');
        setManualRounds([]);

        if (!derivedRole.trim()) return;

        setGenerating(true);
        generatePipeline(derivedRole, derivedSeniority, derivedDept)
            .then(result => {
                setEditedSuggested(result.rounds.map(r => ({ ...r })));
                if (result.warning) setAiWarning(result.warning);
            })
            .catch(error => {
                toast(error?.message || 'Failed to auto-generate pipeline', 'error');
            })
            .finally(() => setGenerating(false));
    }, [open, campaign?.id]);

    if (!open || !campaign) return null;

    const handleGenerate = async () => {
        if (!roleTitle.trim() || !department.trim()) {
            toast('Please fill in role title and department', 'error');
            return;
        }
        setGenerating(true);
        setAiWarning('');
        setEditedSuggested([]);
        try {
            const result = await generatePipeline(roleTitle, seniorityLevel, department);
            setEditedSuggested(result.rounds.map(r => ({ ...r })));
            if (result.warning) {
                setAiWarning(result.warning);
            }
        } catch (error: any) {
            toast(error?.message || 'Failed to generate pipeline', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleAcceptAll = () => {
        const effectiveStart = localStart || toDateStr(campaign.start_date);
        if (!effectiveStart) return;
        const startDate = new Date(effectiveStart + 'T00:00:00');
        const converted: ManualRound[] = editedSuggested.map((r) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + r.dateOffsetDays);
            return {
                name: r.roundName,
                type: r.roundType,
                scheduled_date: date.toISOString().split('T')[0],
                min_passing_score: 60,
            };
        });
        setManualRounds(converted);
        setActiveTab('manual');
        setExtendPrompt(null);

        // Check if any round falls outside the campaign window
        const maxDate = converted.reduce((m, r) => r.scheduled_date > m ? r.scheduled_date : m, '');
        const minDate = converted.reduce((m, r) => !m || r.scheduled_date < m ? r.scheduled_date : m, '');
        const effectiveEnd = localEnd || toDateStr(campaign.end_date);

        if (effectiveEnd && maxDate > effectiveEnd) {
            setExtendPrompt({ newEndDate: maxDate, extending: false });
        } else if (effectiveStart && minDate < effectiveStart) {
            setExtendPrompt({ newStartDate: minDate, extending: false });
        }
    };

    const handleClearAI = () => {
        setEditedSuggested([]);
        setAiWarning('');
    };

    const updateEditedRound = (index: number, field: keyof SuggestedRound, value: string | number) => {
        setEditedSuggested(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    };

    const addManualRound = () => {
        setManualRounds(prev => [...prev, {
            name: '',
            type: 'aptitude test',
            scheduled_date: '',
            min_passing_score: 60,
        }]);
    };

    const removeManualRound = (index: number) => {
        setManualRounds(prev => prev.filter((_, i) => i !== index));
    };

    const updateManualRound = (index: number, field: keyof ManualRound, value: string | number) => {
        setManualRounds(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));

        if (field === 'scheduled_date' && typeof value === 'string' && value) {
            if (localEnd && value > localEnd) {
                setExtendPrompt({ roundIndex: index, newEndDate: value, extending: false });
            } else if (localStart && value < localStart) {
                setExtendPrompt({ roundIndex: index, newStartDate: value, extending: false });
            } else if (extendPrompt?.roundIndex === index) {
                setExtendPrompt(null); // clear prompt when date becomes valid
            }
        }
    };

    const handleExtend = async () => {
        if (!extendPrompt || !campaign) return;
        setExtendPrompt(prev => prev ? { ...prev, extending: true } : null);
        try {
            if (extendPrompt.newEndDate) {
                await updateCampaign(campaign.id, { end_date: extendPrompt.newEndDate });
                setLocalEnd(extendPrompt.newEndDate);
                toast('Campaign end date extended to ' + extendPrompt.newEndDate, 'success');
            } else if (extendPrompt.newStartDate) {
                await updateCampaign(campaign.id, { start_date: extendPrompt.newStartDate });
                setLocalStart(extendPrompt.newStartDate);
                toast('Campaign start date moved to ' + extendPrompt.newStartDate, 'success');
            }
            setExtendPrompt(null);
        } catch (error: any) {
            toast(error?.message || 'Failed to update campaign dates', 'error');
            setExtendPrompt(prev => prev ? { ...prev, extending: false } : null);
        }
    };

    const moveRound = (index: number, direction: 'up' | 'down') => {
        const newRounds = [...manualRounds];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newRounds.length) return;
        [newRounds[index], newRounds[swapIndex]] = [newRounds[swapIndex], newRounds[index]];
        setManualRounds(newRounds);
    };

    const validateRounds = (): string | null => {
        const start = new Date(localStart);
        const end = new Date(localEnd);

        for (let i = 0; i < manualRounds.length; i++) {
            const r = manualRounds[i];
            if (!r.name.trim()) return `Round ${i + 1} is missing a name`;
            if (!r.scheduled_date) return `Round ${i + 1} is missing a date`;
            const d = new Date(r.scheduled_date);
            if (d < start || d > end) {
                return `Round ${i + 1} date must be within campaign dates (${localStart} – ${localEnd})`;
            }
            if (i > 0) {
                const prev = new Date(manualRounds[i - 1].scheduled_date);
                if (d <= prev) {
                    return `Round ${i + 1} date must be after Round ${i}`;
                }
            }
        }
        return null;
    };

    const handleSave = async () => {
        if (manualRounds.length === 0) {
            toast('Add at least one round before saving', 'error');
            return;
        }
        const validationError = validateRounds();
        if (validationError) {
            toast(validationError, 'error');
            return;
        }

        setSaving(true);
        try {
            for (let i = 0; i < manualRounds.length; i++) {
                const r = manualRounds[i];
                await createRound(campaign.id, {
                    name: r.name,
                    type: r.type,
                    scheduled_date: r.scheduled_date,
                    min_passing_score: r.min_passing_score,
                });
            }
            // If campaign is still draft, prompt to activate
            if (campaign.status === 'draft') {
                setShowActivatePrompt(true);
            } else {
                toast('Pipeline saved successfully!', 'success');
                onClose();
            }
        } catch (error: any) {
            toast(error?.message || 'Failed to save pipeline', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async () => {
        setActivating(true);
        try {
            await updateCampaign(campaign.id, { status: 'active' });
            toast('Campaign activated! Candidates can now discover and apply.', 'success');
        } catch {
            toast('Pipeline saved. You can activate the campaign from the campaigns list.', 'success');
        } finally {
            setActivating(false);
            autoGenerateRef.current = null;
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Build Pipeline</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{campaign.name}</p>
                    </div>
                    <button
                        onClick={() => { autoGenerateRef.current = null; onClose(); }}
                        className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex border-b border-border/60 shrink-0">
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ai' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        AI Generate
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'manual' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Manual Build
                        {manualRounds.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{manualRounds.length}</span>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {activeTab === 'ai' && (
                        <div className="space-y-5">
                            {/* Collapsible override settings */}
                            <div className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowOverride(o => !o)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/20 transition-colors"
                                    disabled={generating}
                                >
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        <span>
                                            <span className="font-medium text-foreground">{roleTitle || 'Role'}</span>
                                            {' · '}<span>{seniorityLevel}</span>
                                            {' · '}<span>{department || 'Engineering'}</span>
                                        </span>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showOverride ? 'rotate-180' : ''}`} />
                                </button>
                                {showOverride && (
                                    <div className="px-4 pb-4 border-t border-border/60 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Role Title</Label>
                                            <Input
                                                placeholder="e.g. Software Engineer"
                                                value={roleTitle}
                                                onChange={e => setRoleTitle(e.target.value)}
                                                disabled={generating}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Seniority Level</Label>
                                            <Select value={seniorityLevel} onValueChange={setSeniorityLevel} disabled={generating}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['Junior', 'Mid-level', 'Senior', 'Lead'].map(l => (
                                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Department</Label>
                                            <Input
                                                placeholder="e.g. Engineering"
                                                value={department}
                                                onChange={e => setDepartment(e.target.value)}
                                                disabled={generating}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                                    {generating ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                                    ) : editedSuggested.length > 0 ? (
                                        <><Sparkles className="h-4 w-4" />Regenerate</>
                                    ) : (
                                        <><Sparkles className="h-4 w-4" />Generate Pipeline</>
                                    )}
                                </Button>
                                {editedSuggested.length > 0 && (
                                    <Button variant="ghost" onClick={handleClearAI} disabled={generating}>
                                        Clear
                                    </Button>
                                )}
                            </div>

                            {aiWarning && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-400/10 border border-amber-400/30 text-sm text-amber-400">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{aiWarning}</span>
                                </div>
                            )}

                            {editedSuggested.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-foreground">{editedSuggested.length} rounds suggested</p>
                                        <Button size="sm" onClick={handleAcceptAll}>Accept All</Button>
                                    </div>
                                    <div className="space-y-3">
                                        {editedSuggested.map((round, index) => (
                                            <div key={index} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-muted-foreground w-6">#{index + 1}</span>
                                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <Input
                                                            value={round.roundName}
                                                            onChange={(e) => updateEditedRound(index, 'roundName', e.target.value)}
                                                            placeholder="Round name"
                                                        />
                                                        <Select
                                                            value={round.roundType}
                                                            onValueChange={(v) => updateEditedRound(index, 'roundType', v)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {VALID_ROUND_TYPES.map(t => (
                                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="pl-8 flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                    <span>Day {round.dateOffsetDays}</span>
                                                    <span>{round.passingCriteria}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {generating && editedSuggested.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm">AI is designing your hiring pipeline…</p>
                                </div>
                            )}
                            {!generating && editedSuggested.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Adjust the fields above and click "Generate Pipeline" to get AI-suggested rounds.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div className="space-y-4">
                            {/* Campaign window indicator */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                <span>Campaign window:</span>
                                <span className="font-medium text-foreground">{localStart}</span>
                                <span>→</span>
                                <span className="font-medium text-foreground">{localEnd}</span>
                            </div>

                            {/* Top-level extend prompt (from Accept All or bulk operations) */}
                            {extendPrompt && extendPrompt.roundIndex === undefined && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                    <span className="text-amber-300 flex-1">
                                        {extendPrompt.newEndDate
                                            ? `Some rounds exceed the campaign end date (${localEnd}). Extend campaign end to ${extendPrompt.newEndDate}?`
                                            : `Some rounds start before the campaign start (${localStart}). Move campaign start to ${extendPrompt.newStartDate}?`
                                        }
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleExtend}
                                        disabled={extendPrompt.extending}
                                        className="px-2.5 py-1 rounded-md bg-amber-400 text-black text-xs font-semibold hover:bg-amber-300 disabled:opacity-60 transition-colors shrink-0"
                                    >
                                        {extendPrompt.extending ? 'Updating…' : 'Yes, Extend'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExtendPrompt(null)}
                                        disabled={extendPrompt.extending}
                                        className="px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground text-xs font-medium hover:text-foreground transition-colors shrink-0"
                                    >
                                        Keep
                                    </button>
                                </div>
                            )}

                            {manualRounds.length > 6 && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-400/10 border border-amber-400/30 text-sm text-amber-400">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>More than 6 rounds may reduce candidate experience. Consider simplifying the pipeline.</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                {manualRounds.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No rounds yet. Add rounds manually or generate them with AI first.
                                    </p>
                                ) : (
                                    manualRounds.map((round, index) => (
                                        <div key={index} className="p-4 rounded-xl border border-border/60 bg-muted/20">
                                            <div className="flex items-start gap-2">
                                                <div className="flex flex-col gap-1 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveRound(index, 'up')}
                                                        disabled={index === 0}
                                                        className="p-0.5 rounded hover:bg-muted/40 text-muted-foreground disabled:opacity-30"
                                                    >
                                                        <ChevronUp className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveRound(index, 'down')}
                                                        disabled={index === manualRounds.length - 1}
                                                        className="p-0.5 rounded hover:bg-muted/40 text-muted-foreground disabled:opacity-30"
                                                    >
                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Round Name</Label>
                                                        <Input
                                                            value={round.name}
                                                            onChange={(e) => updateManualRound(index, 'name', e.target.value)}
                                                            placeholder="e.g. Coding Challenge"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Type</Label>
                                                        <Select
                                                            value={round.type}
                                                            onValueChange={(v) => updateManualRound(index, 'type', v as RoundType)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {VALID_ROUND_TYPES.map(t => (
                                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Scheduled Date</Label>
                                                        <DatePicker
                                                            value={round.scheduled_date}
                                                            onChange={v => updateManualRound(index, 'scheduled_date', v)}
                                                            placeholder="Pick a date"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Min Passing Score (0–100)</Label>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={round.min_passing_score || ''}
                                                            onChange={(e) => updateManualRound(index, 'min_passing_score', e.target.value === '' ? 0 : Math.min(100, Math.max(0, Number(e.target.value))))}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeManualRound(index)}
                                                    className="p-1.5 rounded-md hover:bg-rose-400/10 text-muted-foreground hover:text-rose-400 transition-colors mt-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            {/* Extend campaign prompt (per-round, for manual date edits) */}
                                            {extendPrompt?.roundIndex === index && extendPrompt.roundIndex !== undefined && (
                                                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                                    <span className="text-amber-300 flex-1">
                                                        {extendPrompt.newEndDate
                                                            ? `This date is after the campaign end (${localEnd}). Extend campaign end to ${extendPrompt.newEndDate}?`
                                                            : `This date is before the campaign start (${localStart}). Move campaign start to ${extendPrompt.newStartDate}?`
                                                        }
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleExtend}
                                                        disabled={extendPrompt.extending}
                                                        className="px-2.5 py-1 rounded-md bg-amber-400 text-black text-xs font-semibold hover:bg-amber-300 disabled:opacity-60 transition-colors shrink-0"
                                                    >
                                                        {extendPrompt.extending ? 'Updating…' : 'Yes, Extend'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExtendPrompt(null)}
                                                        disabled={extendPrompt.extending}
                                                        className="px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground text-xs font-medium hover:text-foreground transition-colors shrink-0"
                                                    >
                                                        Keep
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <Button variant="outline" onClick={addManualRound} className="gap-2 w-full">
                                <Plus className="h-4 w-4" />
                                Add Round
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/60 bg-card/50 shrink-0">
                    <Button variant="ghost" onClick={() => { autoGenerateRef.current = null; onClose(); }} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || manualRounds.length === 0} className="gap-2">
                        {saving ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
                        ) : (
                            'Save Pipeline'
                        )}
                    </Button>
                </div>
            </div>

            {/* Activate campaign prompt — shown after pipeline save */}
            {showActivatePrompt && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
                    <div className="bg-card border border-border/60 rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-sm flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-base font-semibold text-foreground">Pipeline saved!</h3>
                            <p className="text-sm text-muted-foreground">
                                Activate the campaign now so candidates can discover and apply to it. You can also activate it later from the campaigns list.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                className="flex-1"
                                disabled={activating}
                                onClick={() => { autoGenerateRef.current = null; onClose(); }}
                            >
                                Later
                            </Button>
                            <Button
                                className="flex-1 gap-2"
                                disabled={activating}
                                onClick={handleActivate}
                            >
                                {activating
                                    ? <><Loader2 className="h-4 w-4 animate-spin" />Activating…</>
                                    : 'Activate Campaign'
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
