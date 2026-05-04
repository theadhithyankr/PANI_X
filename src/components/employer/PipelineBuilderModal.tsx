import { useState } from 'react';
import { X, Loader2, Sparkles, Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useCampaignRounds } from '../../hooks/useSupabase';
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

export default function PipelineBuilderModal({ open, onClose, campaign }: PipelineBuilderModalProps) {
    const { createRound } = useCampaignRounds();
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
        if (!campaign.start_date) return;
        const startDate = new Date(campaign.start_date);
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
    };

    const moveRound = (index: number, direction: 'up' | 'down') => {
        const newRounds = [...manualRounds];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newRounds.length) return;
        [newRounds[index], newRounds[swapIndex]] = [newRounds[swapIndex], newRounds[index]];
        setManualRounds(newRounds);
    };

    const validateRounds = (): string | null => {
        const start = new Date(campaign.start_date);
        const end = new Date(campaign.end_date);

        for (let i = 0; i < manualRounds.length; i++) {
            const r = manualRounds[i];
            if (!r.name.trim()) return `Round ${i + 1} is missing a name`;
            if (!r.scheduled_date) return `Round ${i + 1} is missing a date`;
            const d = new Date(r.scheduled_date);
            if (d < start || d > end) {
                return `Round ${i + 1} date must be within campaign dates (${campaign.start_date} – ${campaign.end_date})`;
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
            toast('Pipeline saved successfully!', 'success');
            onClose();
        } catch (error: any) {
            toast(error?.message || 'Failed to save pipeline', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Build Pipeline</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{campaign.name}</p>
                    </div>
                    <button
                        onClick={onClose}
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Role Title</Label>
                                    <Input
                                        placeholder="e.g. Software Engineer"
                                        value={roleTitle}
                                        onChange={(e) => setRoleTitle(e.target.value)}
                                        disabled={generating}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Seniority Level</Label>
                                    <Select value={seniorityLevel} onValueChange={setSeniorityLevel} disabled={generating}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
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
                                        onChange={(e) => setDepartment(e.target.value)}
                                        disabled={generating}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                                    {generating ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
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

                            {!generating && editedSuggested.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Fill in the details above and click "Generate Pipeline" to get AI-suggested rounds.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div className="space-y-4">
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
                                                        <Input
                                                            type="date"
                                                            value={round.scheduled_date}
                                                            onChange={(e) => updateManualRound(index, 'scheduled_date', e.target.value)}
                                                            min={campaign.start_date}
                                                            max={campaign.end_date}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Min Passing Score (0–100)</Label>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={round.min_passing_score}
                                                            onChange={(e) => updateManualRound(index, 'min_passing_score', Number(e.target.value))}
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
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
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
        </div>
    );
}
