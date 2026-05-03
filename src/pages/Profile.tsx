import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    MapPin, Mail, Phone, Github, Linkedin,
    BadgeCheck, Pencil, Trash2, Plus, Sparkles, X, Loader2,
    CheckCircle2, RefreshCw, GitMerge, Briefcase, GraduationCap, Code2, FileText,
    Camera, Save,
} from 'lucide-react';
import { useProfile, useJobs, Profile as ProfileType, Experience, Education } from '../hooks/useSupabase';
import { supabase } from '../utils/supabase/client';
import { extractTextFromPDF } from '../utils/pdf';
import { parseResume } from '../utils/ai';
import { useToast } from '../contexts/ToastContext';
import ResumeViewerModal from '../components/common/ResumeViewerModal';
import ImageCropperDialog from '../components/common/ImageCropperDialog';

function Modal({ open, onClose, title, children, footer }: {
    open: boolean; onClose: () => void; title: string;
    children: React.ReactNode; footer: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-card border border-border/60 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-border" />
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">{children}</div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60">{footer}</div>
            </div>
        </div>
    );
}

function SuccessToast({ show, message, onClose }: { show: boolean; message: string; onClose: () => void }) {
    useEffect(() => {
        if (show) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }
    }, [show]);
    if (!show) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
    );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

interface ParsedResumeData {
    headline?: string;
    about?: string;
    skills?: string[];
    location?: string;
    experience_years?: number;
    experience?: Experience[];
    education?: Education[];
}

function DiffRow({ label, current, next }: { label: string; current?: string; next?: string }) {
    const changed = next && next !== current;
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {changed ? (
                <div className="flex flex-col gap-0.5">
                    {current && <p className="text-xs line-through text-muted-foreground/60">{current}</p>}
                    <p className="text-xs text-emerald-400 font-medium">{next}</p>
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">{next || current || '—'}</p>
            )}
        </div>
    );
}

async function uploadImage(bucket: string, path: string, file: File): Promise<string> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return `${publicUrl}?v=${Date.now()}`;
}

export default function Profile() {
    const { profile, loading, updateProfile } = useProfile();
    const { jobs } = useJobs({ activeOnly: true });
    const toast = useToast();

    // Modal state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<Partial<ProfileType>>({});
    const [openExpDialog, setOpenExpDialog] = useState(false);
    const [currentExp, setCurrentExp] = useState<Partial<Experience>>({});
    const [openEduDialog, setOpenEduDialog] = useState(false);
    const [currentEdu, setCurrentEdu] = useState<Partial<Education>>({});
    const [showResumeViewer, setShowResumeViewer] = useState(false);

    // Toast
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Profile updated successfully!');

    // Uploads
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Cropper state
    const [cropperSrc, setCropperSrc] = useState<string | null>(null);
    const [cropperVariant, setCropperVariant] = useState<'avatar' | 'cover'>('avatar');

    // Open to work
    const [togglingWork, setTogglingWork] = useState(false);

    // Skills raw input (avoids comma-eating bug)
    const [skillsRaw, setSkillsRaw] = useState('');

    // Inline About editing
    const [editingAbout, setEditingAbout] = useState(false);
    const [aboutDraft, setAboutDraft] = useState('');

    // Inline link editing
    const [editingLinks, setEditingLinks] = useState(false);
    const [linksDraft, setLinksDraft] = useState({ phone: '', github: '', linkedin: '' });

    // Resume preview
    const [pendingResume, setPendingResume] = useState<{ aiData: ParsedResumeData; resumeUrl: string } | null>(null);
    const [applying, setApplying] = useState(false);

    const success = (msg: string) => { setSuccessMessage(msg); setShowSuccess(true); };

    const handleOpenEdit = () => {
        if (profile) {
            setEditForm(profile);
            setSkillsRaw(Array.isArray(profile.skills) ? profile.skills.join(', ') : '');
            setIsEditOpen(true);
        }
    };

    const toggleOpenToWork = async () => {
        if (!profile || togglingWork) return;
        setTogglingWork(true);
        const next = !(profile.open_to_work ?? true);
        try {
            await updateProfile({ open_to_work: next });
            success(next ? 'You are now visible to employers.' : 'You are now hidden from employers.');
        } catch { toast('Failed to update. Please try again.', 'error'); }
        finally { setTogglingWork(false); }
    };

    const openCropper = (e: React.ChangeEvent<HTMLInputElement>, variant: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        const reader = new FileReader();
        reader.onload = () => {
            setCropperSrc(reader.result as string);
            setCropperVariant(variant);
        };
        reader.readAsDataURL(file);
    };

    const handleCropDone = async (blob: Blob) => {
        if (!profile) return;
        const isAvatar = cropperVariant === 'avatar';
        if (isAvatar) setUploadingAvatar(true); else setUploadingCover(true);
        try {
            const ext = 'jpg';
            const bucket = isAvatar ? 'avatars' : 'covers';
            const path = `${profile.id}/${isAvatar ? 'avatar' : 'cover'}.${ext}`;
            const file = new File([blob], `${isAvatar ? 'avatar' : 'cover'}.${ext}`, { type: 'image/jpeg' });
            const url = await uploadImage(bucket, path, file);
            await updateProfile(isAvatar ? { avatar_url: url } : { cover_url: url });
            success(isAvatar ? 'Profile picture updated!' : 'Cover photo updated!');
        } catch { toast(`Failed to upload ${isAvatar ? 'photo' : 'cover'}.`, 'error'); }
        finally {
            if (isAvatar) setUploadingAvatar(false); else setUploadingCover(false);
            setCropperSrc(null);
        }
    };

    const handleSaveAbout = async () => {
        try {
            await updateProfile({ about: aboutDraft });
            setEditingAbout(false);
            success('About updated!');
        } catch { toast('Failed to save.', 'error'); }
    };

    const handleSaveLinks = async () => {
        try {
            await updateProfile({
                phone: linksDraft.phone,
                github: linksDraft.github,
                linkedin: linksDraft.linkedin,
            });
            setEditingLinks(false);
            success('Contact info updated!');
        } catch { toast('Failed to save.', 'error'); }
    };

    const handleSave = async () => {
        try {
            await updateProfile({
                ...editForm,
                skills: skillsRaw.split(',').map(s => s.trim()).filter(Boolean),
            });
            setIsEditOpen(false);
            success('Profile updated!');
        } catch { toast('Failed to update profile', 'error'); }
    };

    const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const inputEl = event.target;
        try {
            setAnalyzing(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile?.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file, { upsert: true });
            if (uploadError) console.error('Resume upload failed:', uploadError);
            const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
            const text = await extractTextFromPDF(file);
            const aiData = await parseResume(text);
            setPendingResume({ aiData, resumeUrl: urlData.publicUrl });
        } catch {
            toast('Error reading resume. Please try again.', 'error');
        } finally {
            setAnalyzing(false);
            inputEl.value = '';
        }
    };

    const applyResume = async (mode: 'overwrite' | 'merge') => {
        if (!pendingResume) return;
        const { aiData, resumeUrl } = pendingResume;
        setApplying(true);
        try {
            let updates: Partial<ProfileType>;
            if (mode === 'overwrite') {
                updates = {
                    resume_url: resumeUrl,
                    headline: aiData.headline ?? profile?.headline,
                    about: aiData.about ?? profile?.about,
                    skills: aiData.skills?.length ? aiData.skills : profile?.skills,
                    location: aiData.location ?? profile?.location,
                    experience_years: aiData.experience_years ?? profile?.experience_years,
                    experience: aiData.experience?.length ? aiData.experience : profile?.experience ?? [],
                    education: aiData.education?.length ? aiData.education : profile?.education ?? [],
                };
            } else {
                const mergedSkills = [...new Set([...(profile?.skills ?? []), ...(aiData.skills ?? [])])];
                const existingExp = profile?.experience ?? [];
                const newExp = (aiData.experience ?? []).filter(ne =>
                    !existingExp.some(ee => ee.title?.toLowerCase() === ne.title?.toLowerCase() && ee.company?.toLowerCase() === ne.company?.toLowerCase())
                );
                const existingEdu = profile?.education ?? [];
                const newEdu = (aiData.education ?? []).filter(ne =>
                    !existingEdu.some(ee => ee.school?.toLowerCase() === ne.school?.toLowerCase() && ee.degree?.toLowerCase() === ne.degree?.toLowerCase())
                );
                updates = {
                    resume_url: resumeUrl,
                    headline: aiData.headline || profile?.headline,
                    about: aiData.about || profile?.about,
                    skills: mergedSkills.length ? mergedSkills : profile?.skills,
                    location: aiData.location || profile?.location,
                    experience_years: aiData.experience_years || profile?.experience_years,
                    experience: [...existingExp, ...newExp],
                    education: [...existingEdu, ...newEdu],
                };
            }
            await updateProfile(updates);
            setPendingResume(null);
            success(mode === 'overwrite' ? 'Profile replaced with resume data ✨' : 'Resume data merged into profile ✨');
        } catch {
            toast('Failed to apply resume data.', 'error');
        } finally {
            setApplying(false);
        }
    };

    const handleSaveExperience = async () => {
        try {
            const list = [...(profile?.experience || [])];
            const idx = list.findIndex(e => e.id === currentExp.id);
            if (idx >= 0) list[idx] = currentExp as Experience; else list.push(currentExp as Experience);
            await updateProfile({ experience: list });
            setOpenExpDialog(false);
        } catch { toast('Failed to save experience.', 'error'); }
    };

    const handleDeleteExperience = async (id: string) => {
        if (!confirm('Delete this experience?')) return;
        await updateProfile({ experience: (profile?.experience || []).filter(e => e.id !== id) });
    };

    const handleSaveEducation = async () => {
        try {
            const list = [...(profile?.education || [])];
            const idx = list.findIndex(e => e.id === currentEdu.id);
            if (idx >= 0) list[idx] = currentEdu as Education; else list.push(currentEdu as Education);
            await updateProfile({ education: list });
            setOpenEduDialog(false);
        } catch { toast('Failed to save education.', 'error'); }
    };

    const handleDeleteEducation = async (id: string) => {
        if (!confirm('Delete this education?')) return;
        await updateProfile({ education: (profile?.education || []).filter(e => e.id !== id) });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }
    if (!profile) {
        return <DashboardLayout><p className="text-muted-foreground">Profile not found.</p></DashboardLayout>;
    }

    const openToWork = profile.open_to_work ?? true;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">

                {/* ── Hero Card ─────────────────────────────────────────── */}
                <Card className="bg-card border-border/60 overflow-hidden">
                    {/* Cover Image */}
                    <div className="relative h-44 group">
                        {profile.cover_url ? (
                            <img src={profile.cover_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-700/70 via-blue-700/50 to-indigo-900/60" />
                        )}
                        {/* Cover upload button */}
                        <label className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium cursor-pointer hover:bg-black/70 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100">
                            {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                            {uploadingCover ? 'Uploading…' : 'Change cover'}
                            <input ref={coverInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => openCropper(e, 'cover')} />
                        </label>
                    </div>

                    <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                        {/* Avatar row only */}
                        <div className="-mt-12 sm:-mt-14 mb-1">
                            <div className="relative group/avatar shrink-0 inline-block">
                                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-card overflow-hidden bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                                    {profile.avatar_url
                                        ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                        : profile.full_name?.charAt(0)
                                    }
                                </div>
                                {/* Hover overlay */}
                                <label className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-0.5 bg-black/50 opacity-0 group-hover/avatar:opacity-100 cursor-pointer transition-opacity">
                                    {uploadingAvatar
                                        ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                                        : <Camera className="h-5 w-5 text-white" />
                                    }
                                    <span className="text-[10px] text-white font-medium">Change</span>
                                    <input ref={avatarInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => openCropper(e, 'avatar')} />
                                </label>
                                <BadgeCheck className="absolute bottom-1 right-1 h-6 w-6 text-primary bg-card rounded-full" />
                            </div>
                        </div>

                        {/* Name / info */}
                        <div className="mt-3">
                            <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">{profile.headline || 'Add a headline'}</p>
                            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{profile.location || 'Add location'}</span>
                                <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{profile.email}</span>
                            </div>
                            {/* Open to work */}
                            <button
                                onClick={toggleOpenToWork}
                                disabled={togglingWork}
                                className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                    openToWork
                                        ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20'
                                        : 'bg-muted/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full transition-colors ${openToWork ? 'bg-emerald-400' : 'bg-muted-foreground/50'}`} />
                                {togglingWork ? 'Updating…' : openToWork ? 'Open to work' : 'Not looking for jobs'}
                            </button>

                            {/* Action buttons */}
                            <div className="flex gap-2 flex-wrap mt-4">
                                <label>
                                    <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer rounded-xl" asChild disabled={analyzing}>
                                        <span>
                                            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                            {analyzing ? 'Analyzing…' : 'Auto-Fill Resume'}
                                        </span>
                                    </Button>
                                    <input hidden accept="application/pdf" type="file" onChange={handleResumeUpload} />
                                </label>
                                {profile.resume_url && (
                                    <Button variant="ghost" size="sm" className="rounded-xl gap-1.5" onClick={() => setShowResumeViewer(true)}>
                                        <FileText className="h-3.5 w-3.5" /> View Resume
                                    </Button>
                                )}
                                <Button size="sm" className="gap-1.5 rounded-xl" onClick={handleOpenEdit}>
                                    <Pencil className="h-3.5 w-3.5" /> Edit Profile
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Body Grid ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* ── Left column ───────── */}
                    <div className="flex flex-col gap-5">

                        {/* About */}
                        <Card className="bg-card border-border/60">
                            <CardContent className="pt-5">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-foreground">About</h3>
                                    {!editingAbout && (
                                        <button
                                            onClick={() => { setAboutDraft(profile.about || ''); setEditingAbout(true); }}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            <Pencil className="h-3 w-3" /> Edit
                                        </button>
                                    )}
                                </div>
                                {editingAbout ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            rows={5}
                                            value={aboutDraft}
                                            onChange={e => setAboutDraft(e.target.value)}
                                            placeholder="Tell employers about yourself…"
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingAbout(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/40">Cancel</button>
                                            <Button size="sm" className="gap-1 rounded-lg h-7 text-xs px-3" onClick={handleSaveAbout}>
                                                <Save className="h-3 w-3" /> Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {profile.about || <span className="italic">Add a bio to tell employers about yourself.</span>}
                                    </p>
                                )}

                                <div className="h-px bg-border/60 my-4" />

                                {/* Contact links */}
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                                    {!editingLinks && (
                                        <button
                                            onClick={() => { setLinksDraft({ phone: profile.phone || '', github: profile.github || '', linkedin: profile.linkedin || '' }); setEditingLinks(true); }}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            <Pencil className="h-3 w-3" /> Edit
                                        </button>
                                    )}
                                </div>
                                {editingLinks ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <Input
                                                value={linksDraft.phone}
                                                onChange={e => setLinksDraft({ ...linksDraft, phone: e.target.value })}
                                                placeholder="+1 555 000 0000"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Github className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <Input
                                                value={linksDraft.github}
                                                onChange={e => setLinksDraft({ ...linksDraft, github: e.target.value })}
                                                placeholder="github.com/username"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Linkedin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <Input
                                                value={linksDraft.linkedin}
                                                onChange={e => setLinksDraft({ ...linksDraft, linkedin: e.target.value })}
                                                placeholder="linkedin.com/in/username"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingLinks(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/40">Cancel</button>
                                            <Button size="sm" className="gap-1 rounded-lg h-7 text-xs px-3" onClick={handleSaveLinks}>
                                                <Save className="h-3 w-3" /> Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                        {profile.phone
                                            ? <a href={`tel:${profile.phone}`} className="flex items-center gap-2 hover:text-foreground transition-colors"><Phone className="h-3.5 w-3.5 shrink-0" />{profile.phone}</a>
                                            : <span className="flex items-center gap-2 opacity-50 italic"><Phone className="h-3.5 w-3.5 shrink-0" />Add phone</span>
                                        }
                                        {profile.github
                                            ? <a href={`https://${profile.github.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors"><Github className="h-3.5 w-3.5 shrink-0" />{profile.github}</a>
                                            : <span className="flex items-center gap-2 opacity-50 italic"><Github className="h-3.5 w-3.5 shrink-0" />Add GitHub</span>
                                        }
                                        {profile.linkedin
                                            ? <a href={`https://${profile.linkedin.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors"><Linkedin className="h-3.5 w-3.5 shrink-0" />{profile.linkedin}</a>
                                            : <span className="flex items-center gap-2 opacity-50 italic"><Linkedin className="h-3.5 w-3.5 shrink-0" />Add LinkedIn</span>
                                        }
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Skills */}
                        <Card className="bg-card border-border/60">
                            <CardContent className="pt-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-foreground">Skills</h3>
                                    <button onClick={handleOpenEdit} className="text-xs text-primary hover:underline flex items-center gap-1">
                                        <Pencil className="h-3 w-3" /> Edit
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(profile.skills?.length ? profile.skills : ['Add', 'Your', 'Skills']).map((skill, i) => (
                                        <span key={i} className="px-2.5 py-1 text-xs rounded-full border border-border text-muted-foreground">{skill}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Right column ──────── */}
                    <div className="md:col-span-2 flex flex-col gap-5">

                        {/* Work Experience */}
                        <Card className="bg-card border-border/60">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-amber-400" /> Work Experience
                                    </CardTitle>
                                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setCurrentExp({ id: Math.random().toString(36).substr(2, 9) }); setOpenExpDialog(true); }}>
                                        <Plus className="h-3.5 w-3.5" /> Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!profile.experience?.length ? (
                                    <p className="text-sm text-muted-foreground">No experience added yet.</p>
                                ) : (
                                    <div className="flex flex-col gap-0">
                                        {profile.experience.map((exp, idx) => (
                                            <div key={exp.id} className="flex gap-4 pb-6 last:pb-0 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className={`h-3 w-3 rounded-full mt-1 shrink-0 ${idx === 0 ? 'bg-amber-400' : 'bg-muted-foreground/40'}`} />
                                                    {idx < profile.experience!.length - 1 && <div className="w-0.5 bg-border flex-1 mt-1" />}
                                                </div>
                                                <div className="flex-1 pb-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-semibold text-foreground text-sm">{exp.title}</p>
                                                            <p className="text-xs text-muted-foreground">{exp.company}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{exp.start_date} – {exp.end_date || 'Present'}</p>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <button onClick={() => { setCurrentExp(exp); setOpenExpDialog(true); }} className="p-1 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                                            <button onClick={() => handleDeleteExperience(exp.id)} className="p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                    </div>
                                                    {exp.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Education */}
                        <Card className="bg-card border-border/60">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-emerald-400" /> Education
                                    </CardTitle>
                                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setCurrentEdu({ id: Math.random().toString(36).substr(2, 9) }); setOpenEduDialog(true); }}>
                                        <Plus className="h-3.5 w-3.5" /> Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!profile.education?.length ? (
                                    <p className="text-sm text-muted-foreground">No education added yet.</p>
                                ) : (
                                    <div className="flex flex-col gap-0">
                                        {profile.education.map((edu, idx) => (
                                            <div key={edu.id} className="flex gap-4 pb-6 last:pb-0">
                                                <div className="flex flex-col items-center">
                                                    <div className={`h-3 w-3 rounded-full mt-1 shrink-0 ${idx === 0 ? 'bg-emerald-400' : 'bg-muted-foreground/40'}`} />
                                                    {idx < profile.education!.length - 1 && <div className="w-0.5 bg-border flex-1 mt-1" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-semibold text-foreground text-sm">{edu.school}</p>
                                                            <p className="text-xs text-muted-foreground">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{edu.start_year} – {edu.end_year || 'Present'}</p>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <button onClick={() => { setCurrentEdu(edu); setOpenEduDialog(true); }} className="p-1 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                                            <button onClick={() => handleDeleteEducation(edu.id)} className="p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ── Resume Preview Modal ──────────────────────────────── */}
            {pendingResume && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-card border border-border/60 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-border" /></div>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Resume Parsed</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Choose how to apply the extracted data.</p>
                            </div>
                            <button onClick={() => setPendingResume(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-4">
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 grid grid-cols-2 gap-3">
                                <DiffRow label="Headline" current={profile.headline} next={pendingResume.aiData.headline} />
                                <DiffRow label="Location" current={profile.location} next={pendingResume.aiData.location} />
                                <DiffRow label="Experience" current={profile.experience_years ? `${profile.experience_years} yrs` : undefined} next={pendingResume.aiData.experience_years ? `${pendingResume.aiData.experience_years} yrs` : undefined} />
                                <DiffRow label="About" current={profile.about?.slice(0, 40)} next={pendingResume.aiData.about?.slice(0, 40)} />
                            </div>
                            {(pendingResume.aiData.skills?.length ?? 0) > 0 && (
                                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5" /> Skills ({pendingResume.aiData.skills!.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {pendingResume.aiData.skills!.map(s => {
                                            const isNew = !(profile.skills ?? []).includes(s);
                                            return <span key={s} className={`px-2 py-0.5 text-xs rounded-full border font-medium ${isNew ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400' : 'border-border text-muted-foreground'}`}>{s}{isNew ? ' +new' : ''}</span>;
                                        })}
                                    </div>
                                </div>
                            )}
                            {(pendingResume.aiData.experience?.length ?? 0) > 0 && (
                                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Experience ({pendingResume.aiData.experience!.length} roles)</p>
                                    <div className="flex flex-col gap-1">{pendingResume.aiData.experience!.map((e, i) => <p key={i} className="text-xs text-foreground">{e.title} <span className="text-muted-foreground">at {e.company}</span></p>)}</div>
                                </div>
                            )}
                            {(pendingResume.aiData.education?.length ?? 0) > 0 && (
                                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Education ({pendingResume.aiData.education!.length})</p>
                                    <div className="flex flex-col gap-1">{pendingResume.aiData.education!.map((e, i) => <p key={i} className="text-xs text-foreground">{e.degree}{e.field ? ` in ${e.field}` : ''} <span className="text-muted-foreground">· {e.school}</span></p>)}</div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                <div className="rounded-xl border border-border/60 p-3">
                                    <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 text-rose-400" /> Replace All</p>
                                    <p>Wipes existing data and replaces everything with extracted resume data.</p>
                                </div>
                                <div className="rounded-xl border border-border/60 p-3">
                                    <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><GitMerge className="h-3.5 w-3.5 text-emerald-400" /> Merge</p>
                                    <p>Adds new skills and entries while keeping your existing data.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-border/60">
                            <Button variant="ghost" className="flex-1" onClick={() => setPendingResume(null)} disabled={applying}>Cancel</Button>
                            <Button variant="outline" className="flex-1 gap-1.5 border-rose-400/40 text-rose-400 hover:bg-rose-400/10 rounded-xl" onClick={() => applyResume('overwrite')} disabled={applying}>
                                {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Replace All
                            </Button>
                            <Button className="flex-1 gap-1.5 rounded-xl" onClick={() => applyResume('merge')} disabled={applying}>
                                {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitMerge className="h-3.5 w-3.5" />} Merge
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Profile Modal ──────────────────────────────── */}
            <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profile"
                footer={<><Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save Changes</Button></>}>
                <FieldGroup label="Full Name">
                    <Input value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Headline">
                    <Input placeholder="e.g. Flutter Developer" value={editForm.headline || ''} onChange={e => setEditForm({ ...editForm, headline: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Location">
                    <Input value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Experience (years)">
                    <Input type="number" min={0} value={editForm.experience_years ?? ''} onChange={e => setEditForm({ ...editForm, experience_years: Number(e.target.value) })} />
                </FieldGroup>
                <FieldGroup label="Skills (comma separated)">
                    <Input
                        placeholder="React, Node.js, Python"
                        value={skillsRaw}
                        onChange={e => setSkillsRaw(e.target.value)}
                    />
                </FieldGroup>
                <FieldGroup label="About">
                    <textarea rows={4} value={editForm.about || ''} onChange={e => setEditForm({ ...editForm, about: e.target.value })}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground" />
                </FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Phone">
                        <Input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                    </FieldGroup>
                    <FieldGroup label="Email">
                        <Input value={editForm.email || ''} disabled />
                    </FieldGroup>
                </div>
                <FieldGroup label="GitHub URL">
                    <Input placeholder="github.com/username" value={editForm.github || ''} onChange={e => setEditForm({ ...editForm, github: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="LinkedIn URL">
                    <Input placeholder="linkedin.com/in/username" value={editForm.linkedin || ''} onChange={e => setEditForm({ ...editForm, linkedin: e.target.value })} />
                </FieldGroup>
            </Modal>

            {/* ── Experience Modal ──────────────────────────────── */}
            <Modal open={openExpDialog} onClose={() => setOpenExpDialog(false)}
                title={currentExp.title ? 'Edit Experience' : 'Add Experience'}
                footer={<><Button variant="ghost" onClick={() => setOpenExpDialog(false)}>Cancel</Button><Button onClick={handleSaveExperience}>Save</Button></>}>
                <FieldGroup label="Job Title">
                    <Input value={currentExp.title || ''} onChange={e => setCurrentExp({ ...currentExp, title: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Company">
                    <Input value={currentExp.company || ''} onChange={e => setCurrentExp({ ...currentExp, company: e.target.value })} />
                </FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Start Date">
                        <Input placeholder="e.g. Jan 2022" value={currentExp.start_date || ''} onChange={e => setCurrentExp({ ...currentExp, start_date: e.target.value })} />
                    </FieldGroup>
                    <FieldGroup label="End Date">
                        <Input placeholder="Leave blank for Present" value={currentExp.end_date || ''} onChange={e => setCurrentExp({ ...currentExp, end_date: e.target.value })} />
                    </FieldGroup>
                </div>
                <FieldGroup label="Description">
                    <textarea rows={3} value={currentExp.description || ''} onChange={e => setCurrentExp({ ...currentExp, description: e.target.value })}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground" />
                </FieldGroup>
            </Modal>

            {/* ── Education Modal ──────────────────────────────── */}
            <Modal open={openEduDialog} onClose={() => setOpenEduDialog(false)}
                title={currentEdu.school ? 'Edit Education' : 'Add Education'}
                footer={<><Button variant="ghost" onClick={() => setOpenEduDialog(false)}>Cancel</Button><Button onClick={handleSaveEducation}>Save</Button></>}>
                <FieldGroup label="School / University">
                    <Input value={currentEdu.school || ''} onChange={e => setCurrentEdu({ ...currentEdu, school: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Degree">
                    <Input value={currentEdu.degree || ''} onChange={e => setCurrentEdu({ ...currentEdu, degree: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Field of Study">
                    <Input value={currentEdu.field || ''} onChange={e => setCurrentEdu({ ...currentEdu, field: e.target.value })} />
                </FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Start Year">
                        <Input placeholder="e.g. 2019" value={currentEdu.start_year || ''} onChange={e => setCurrentEdu({ ...currentEdu, start_year: e.target.value })} />
                    </FieldGroup>
                    <FieldGroup label="End Year">
                        <Input placeholder="Leave blank for Present" value={currentEdu.end_year || ''} onChange={e => setCurrentEdu({ ...currentEdu, end_year: e.target.value })} />
                    </FieldGroup>
                </div>
            </Modal>

            <ImageCropperDialog
                open={!!cropperSrc}
                imageSrc={cropperSrc}
                onClose={() => setCropperSrc(null)}
                onCropComplete={handleCropDone}
                variant={cropperVariant}
            />

            <SuccessToast show={showSuccess} message={successMessage} onClose={() => setShowSuccess(false)} />

            {profile.resume_url && (
                <ResumeViewerModal
                    open={showResumeViewer}
                    onClose={() => setShowResumeViewer(false)}
                    resumeUrl={profile.resume_url}
                    candidateName={profile.full_name || 'My'}
                    profile={profile}
                    viewerRole="candidate"
                    availableJobs={jobs}
                />
            )}
        </DashboardLayout>
    );
}
