import { useState, useEffect } from 'react';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';
import { useProfile } from '../../hooks/useSupabase';
import { supabase } from '../../utils/supabase/client';
import ImageCropperDialog from '../../components/common/ImageCropperDialog';
import { useToast } from '../../contexts/ToastContext';

export default function EmployerCompany() {
    const { profile, loading, updateProfile } = useProfile();
    const toast = useToast();
    const [formData, setFormData] = useState({
        company_name: '',
        website: '',
        location: '',
        about: '',
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [selectedFileType, setSelectedFileType] = useState<string>('image/jpeg');

    useEffect(() => {
        if (profile) {
            setFormData({
                company_name: profile.company_name || '',
                website: profile.website || '',
                location: profile.location || '',
                about: profile.about || '',
            });
            // Always sync logo from profile (permanent URL takes priority over stale blob URL)
            if (profile.logo_url) setPreviewUrl(profile.logo_url);
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile(formData);
            toast('Company details updated successfully!', 'success');
        } catch (error: any) {
            toast('Failed to update details: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFileType(file.type);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setSelectedImageSrc(reader.result?.toString() || null);
                setCropperOpen(true);
                event.target.value = '';
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        try {
            setUploading(true);
            setCropperOpen(false);

            // Show instant blob preview while uploading
            const objectUrl = URL.createObjectURL(croppedBlob);
            setPreviewUrl(objectUrl);

            const fileExt = selectedFileType.split('/')[1] || 'jpeg';
            // Use a timestamp-based name so CDN cache is always busted
            const fileName = `logo_${Date.now()}.${fileExt}`;
            const filePath = `${profile?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, croppedBlob, {
                    contentType: selectedFileType || 'image/jpeg',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
            // Switch preview to the permanent URL before saving to DB
            setPreviewUrl(data.publicUrl);
            await updateProfile({ logo_url: data.publicUrl });
            toast('Logo updated!', 'success');
        } catch (error: any) {
            // Revert preview on failure
            setPreviewUrl(profile?.logo_url || null);
            const msg = error?.message?.includes('Bucket not found')
                ? 'Storage not set up. Ask your admin to run supabase/setup_logos_bucket.sql in the Supabase dashboard.'
                : 'Error uploading logo: ' + error.message;
            toast(msg, 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <EmployerLayout>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </EmployerLayout>
        );
    }

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-3xl font-bold text-foreground">Company Profile</h1>
                    <p className="text-muted-foreground mt-1">Manage your company information and branding.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logo Card */}
                    <Card className="bg-card border-border/60">
                        <CardContent className="pt-8 flex flex-col items-center gap-4">
                            <div className="h-24 w-24 rounded-full bg-violet-400/10 flex items-center justify-center text-violet-400 font-bold text-4xl overflow-hidden border-2 border-border/40">
                                {previewUrl
                                    ? <img src={previewUrl} alt="Company logo" className="h-full w-full object-cover" />
                                    : (profile?.company_name?.[0]?.toUpperCase() || profile?.full_name?.[0]?.toUpperCase() || 'C')}
                            </div>
                            <label className="cursor-pointer">
                                <Button variant="outline" size="sm" asChild disabled={uploading}>
                                    <span>{uploading ? 'Uploading...' : 'Change Logo'}</span>
                                </Button>
                                <input hidden accept="image/*" type="file" onChange={handleFileSelect} />
                            </label>
                        </CardContent>
                    </Card>

                    {/* Form Card */}
                    <Card className="md:col-span-2 bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Company Details</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input name="company_name" value={formData.company_name} onChange={handleChange} placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="space-y-2">
                                <Label>Website</Label>
                                <Input name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" />
                            </div>
                            <div className="space-y-2">
                                <Label>About Company</Label>
                                <textarea
                                    name="about"
                                    value={formData.about}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Tell us about your company..."
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ImageCropperDialog
                open={cropperOpen}
                imageSrc={selectedImageSrc}
                onClose={() => setCropperOpen(false)}
                onCropComplete={handleCropComplete}
            />
        </EmployerLayout>
    );
}
