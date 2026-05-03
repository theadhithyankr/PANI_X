import { useState } from 'react';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, Sparkles, MoreVertical, Pencil, Trash2, EyeOff, Eye, Loader2, X, ShieldCheck } from 'lucide-react';
import { generateJobDescription } from '../../utils/ai';
import { useJobs, Job } from '../../hooks/useSupabase';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';

const JOB_TYPE_OPTIONS = ['Full Time', 'Part Time', 'Contract'];
const EXP_OPTIONS = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead'];
const WORK_MODE_OPTIONS = ['On-site', 'Hybrid', 'Remote'];

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={label}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
            >
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <button onClick={onClose} title="Close modal" aria-label="Close modal" className="text-muted-foreground hover:text-foreground p-1 rounded-md">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/50">{footer}</div>
            </div>
        </div>
    );
}

export default function EmployerJobs() {
    const { user } = useAuth();
    const { jobs, loading, createJob, updateJob, deleteJob } = useJobs({ activeOnly: false });
    const toast = useToast();
    const employerJobs = jobs.filter((job) => job.employer_id === user?.id);

    const [open, setOpen] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

    const [jobData, setJobData] = useState({
        title: '',
        type: 'Full Time',
        location: '',
        description: '',
        experience_level: 'Mid-Level',
        skills: [] as string[],
        salary_range: '',
        work_mode: 'On-site',
        openings: 1,
        blind_hiring: false,
    });
    const [skillInput, setSkillInput] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');

    const resetForm = () => {
        setJobData({ title: '', type: 'Full Time', location: '', description: '', experience_level: 'Mid-Level', skills: [], salary_range: '', work_mode: 'On-site', openings: 1, blind_hiring: false });
        setSkillInput('');
        setIsEditing(false);
        setSelectedJobId(null);
    };

    const handleEdit = (job: Job) => {
        setJobData({
            title: job.role || job.title || '',
            type: job.type,
            location: job.location,
            description: job.description,
            experience_level: job.experience_level || 'Mid-Level',
            skills: job.skills || [],
            salary_range: job.salary_range || '',
            work_mode: job.work_mode || 'On-site',
            openings: job.openings || 1,
            blind_hiring: job.blind_hiring || false,
        });
        setIsEditing(true);
        setSelectedJobId(job.id);
        setOpen(true);
    };

    const handleToggleStatus = async (job: Job) => {
        const newStatus = job.status === 'Active' ? 'Closed' : 'Active';
        await updateJob(job.id, { status: newStatus });
    };

    const handleDelete = async (job: Job) => {
        setDeleteTarget(job);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteJob(deleteTarget.id);
            toast('Job deleted successfully.', 'success');
            setDeleteTarget(null);
        } catch (error: any) {
            toast('Failed to delete job: ' + (error?.message || 'Unknown error'), 'error');
        }
    };

    const handlePostJob = async () => {
        try {
            if (isEditing && selectedJobId) {
                await updateJob(selectedJobId, jobData);
            } else {
                await createJob({ ...jobData, status: 'Active', applicants: 0 });
            }
            toast(isEditing ? 'Job updated successfully!' : 'Job posted successfully!', 'success');
            setOpen(false);
        } catch (error: any) {
            toast('Error saving job: ' + error.message, 'error');
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const generated = await generateJobDescription(aiPrompt);
            setJobData({
                title: generated.title || '', type: generated.type || 'Full Time', location: generated.location || '',
                description: generated.description || '', experience_level: generated.experience_level || 'Mid-Level',
                skills: generated.skills || [], salary_range: generated.salary_range || '',
                work_mode: generated.work_mode || 'On-site', openings: generated.openings || 1,
                blind_hiring: false,
            });
            setAiOpen(false);
            setOpen(true);
        } catch (error: any) {
            toast('Failed to generate job description. Try again.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !jobData.skills.includes(skillInput.trim())) {
            setJobData({ ...jobData, skills: [...jobData.skills, skillInput.trim()] });
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setJobData({ ...jobData, skills: jobData.skills.filter((s) => s !== skill) });
    };

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="hidden md:block">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Jobs</h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your job postings and find the perfect candidate.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" className="gap-2 text-sm" onClick={() => setAiOpen(true)}>
                            <Sparkles className="h-4 w-4 text-primary" />
                            Post with AI
                        </Button>
                        <Button className="gap-2 text-sm" onClick={() => { resetForm(); setOpen(true); }}>
                            <Plus className="h-4 w-4" />
                            Post Job
                        </Button>
                    </div>
                </div>

                {/* Desktop Table */}
                <Card className="bg-card border-border/60 hidden md:block">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Location</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Posted</th>
                                        <th className="text-center px-4 py-3 text-muted-foreground font-medium">Applicants</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && employerJobs.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></td></tr>
                                    ) : employerJobs.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No jobs posted yet.</td></tr>
                                    ) : (
                                        employerJobs.map((job) => (
                                            <tr key={job.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors relative ${job.status === 'Closed' ? 'opacity-50' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-foreground">{job.title}</p>
                                                        {job.blind_hiring && (
                                                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md border border-violet-400/30 bg-violet-400/10 text-violet-400">
                                                                <ShieldCheck className="h-3 w-3" /> Blind
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{job.experience_level || 'Mid-Level'} · {job.work_mode || 'On-site'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{job.type}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{job.location}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{new Date(job.posted_at || Date.now()).toLocaleDateString('en-GB')}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full border border-border text-xs text-muted-foreground">{job.applicants_count || 0}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${job.status === 'Active' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' : 'bg-muted text-muted-foreground border-border'}`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground" title="Open job actions" aria-label="Open job actions">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" sideOffset={8} className="w-44">
                                                            <DropdownMenuItem onClick={() => handleEdit(job)}><Pencil className="h-3.5 w-3.5" />Edit Details</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(job)}>
                                                                {job.status === 'Active' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                                {job.status === 'Active' ? 'Close Job' : 'Re-open Job'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDelete(job)} className="text-rose-400 focus:text-rose-400"><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Mobile Card List */}
                <div className="md:hidden flex flex-col gap-3">
                    {loading && employerJobs.length === 0 ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : employerJobs.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground text-sm">No jobs posted yet.</p>
                    ) : (
                        employerJobs.map((job) => (
                            <Card key={job.id} className={`bg-card border-border/60 ${job.status === 'Closed' ? 'opacity-50' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-foreground text-sm">{job.title}</p>
                                                {job.blind_hiring && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md border border-violet-400/30 bg-violet-400/10 text-violet-400">
                                                        <ShieldCheck className="h-3 w-3" /> Blind
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">{job.experience_level || 'Mid-Level'} · {job.work_mode || 'On-site'} · {job.location}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${job.status === 'Active' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' : 'bg-muted text-muted-foreground border-border'}`}>
                                                {job.status}
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground" title="Open job actions" aria-label="Open job actions">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" sideOffset={8} className="w-44">
                                                    <DropdownMenuItem onClick={() => handleEdit(job)}><Pencil className="h-3.5 w-3.5" />Edit Details</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(job)}>
                                                        {job.status === 'Active' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                        {job.status === 'Active' ? 'Close Job' : 'Re-open Job'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(job)} className="text-rose-400 focus:text-rose-400"><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                        <span>{job.type}</span>
                                        <span>·</span>
                                        <span>{job.applicants_count || 0} applicants</span>
                                        <span>·</span>
                                        <span>{new Date(job.posted_at || Date.now()).toLocaleDateString('en-GB')}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* AI Modal */}
            <Modal
                open={aiOpen}
                onClose={() => setAiOpen(false)}
                title="✨ Magic Job Post"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setAiOpen(false)}>Cancel</Button>
                        <Button onClick={handleGenerate} disabled={!aiPrompt || isGenerating} className="gap-2">
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {isGenerating ? 'Generating...' : 'Generate Draft'}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground mb-3">Describe the role in plain English and we'll draft the full posting.</p>
                <textarea
                    autoFocus
                    rows={5}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                    placeholder="e.g. I need a Senior React Native Dev. Should have Expo & Supabase experience. Salary ~120k. Hybrid in New York."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                />
            </Modal>

            {/* Job Form Modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={isEditing ? 'Edit Job Posting' : 'Post a New Job'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handlePostJob}>{isEditing ? 'Save Changes' : 'Post Job'}</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <Label>Job Title</Label>
                        <Input placeholder="e.g. Senior Software Engineer" value={jobData.title} onChange={(e) => setJobData({ ...jobData, title: e.target.value })} />
                    </div>
                    <Select label="Experience Level" value={jobData.experience_level} onChange={(v) => setJobData({ ...jobData, experience_level: v })} options={EXP_OPTIONS} />
                    <Select label="Work Mode" value={jobData.work_mode} onChange={(v) => setJobData({ ...jobData, work_mode: v })} options={WORK_MODE_OPTIONS} />
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input placeholder="City, Country" value={jobData.location} onChange={(e) => setJobData({ ...jobData, location: e.target.value })} />
                    </div>
                    <Select label="Job Type" value={jobData.type} onChange={(v) => setJobData({ ...jobData, type: v })} options={JOB_TYPE_OPTIONS} />
                    <div className="space-y-2">
                        <Label>Salary Range</Label>
                        <Input placeholder="e.g. $80k - $120k" value={jobData.salary_range} onChange={(e) => setJobData({ ...jobData, salary_range: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Number of Openings</Label>
                        <Input type="number" value={jobData.openings} onChange={(e) => setJobData({ ...jobData, openings: Number(e.target.value) })} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={jobData.blind_hiring}
                                    onChange={(e) => setJobData({ ...jobData, blind_hiring: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
                                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-violet-400" />
                                    Blind Hiring Mode
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Hide candidate names and photos when reviewing applications for this job to reduce bias.
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <Label>Required Skills</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a skill and press Add"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                            />
                            <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
                        </div>
                        {jobData.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {jobData.skills.map((skill) => (
                                    <span key={skill} className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border text-xs text-foreground">
                                        {skill}
                                        <button
                                            onClick={() => removeSkill(skill)}
                                            title={`Remove ${skill}`}
                                            aria-label={`Remove ${skill}`}
                                            className="text-muted-foreground hover:text-foreground ml-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label>Job Description</Label>
                        <textarea
                            rows={6}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                            placeholder="Describe the role responsibilities and requirements..."
                            value={jobData.description}
                            onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Job"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Job
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">Delete this job? This cannot be undone.</p>
                {deleteTarget?.title && (
                    <p className="mt-3 text-sm font-medium text-foreground">{deleteTarget.title}</p>
                )}
            </Modal>
        </EmployerLayout>
    );
}
