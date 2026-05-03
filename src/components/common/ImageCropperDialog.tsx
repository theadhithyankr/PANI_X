import { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '../ui/button';
import {
    X, Circle, Square, FlipHorizontal, FlipVertical,
    RotateCcw, Sun, Contrast, ZoomIn, Loader2,
} from 'lucide-react';
import getCroppedImg from '../../utils/cropImage';
import { useToast } from '../../contexts/ToastContext';

interface Props {
    open: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onCropComplete: (croppedBlob: Blob) => void;
    variant?: 'avatar' | 'cover';
}

function Slider({ label, icon: Icon, value, min, max, step, onChange, unit = '' }: {
    label: string; icon: any; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; unit?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 w-24 shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="flex-1 accent-primary h-1.5 cursor-pointer"
            />
            <span className="text-xs font-mono text-foreground w-10 text-right">{value}{unit}</span>
        </div>
    );
}

export default function ImageCropperDialog({ open, imageSrc, onClose, onCropComplete, variant = 'avatar' }: Props) {
    const toast = useToast();

    const aspect = variant === 'cover' ? 3 : 1;
    const defaultShape: 'rect' | 'round' = variant === 'avatar' ? 'round' : 'rect';

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const croppedAreaPixelsRef = useRef<any>(null);
    const [cropShape, setCropShape] = useState<'rect' | 'round'>(defaultShape);
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset state when a new image is loaded
    useEffect(() => {
        if (open && imageSrc) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setCropShape(defaultShape);
            setFlip({ horizontal: false, vertical: false });
            setBrightness(100);
            setContrast(100);
            setPreviewUrl(null);
        }
    }, [open, imageSrc]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const onCropCompleteEvent = useCallback((_: any, cap: any) => {
        setCroppedAreaPixels(cap);
        croppedAreaPixelsRef.current = cap;
    }, []);

    // Regenerate live preview (debounced 400ms after any adjustment)
    useEffect(() => {
        if (!imageSrc || !croppedAreaPixels) return;
        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = setTimeout(async () => {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flip, brightness, contrast);
            if (blob) {
                const url = URL.createObjectURL(blob);
                setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
            }
        }, 400);
    }, [croppedAreaPixels, rotation, flip, brightness, contrast, imageSrc]);

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setFlip({ horizontal: false, vertical: false });
        setBrightness(100);
        setContrast(100);
    };

    const handleSave = async () => {
        const cap = croppedAreaPixelsRef.current;
        if (!imageSrc || !cap) return;
        setSaving(true);
        try {
            const blob = await getCroppedImg(imageSrc, cap, rotation, flip, brightness, contrast);
            if (blob) { onCropComplete(blob); onClose(); }
        } catch {
            toast('Something went wrong. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const filterStyle = (brightness !== 100 || contrast !== 100)
        ? { filter: `brightness(${brightness}%) contrast(${contrast}%)` }
        : {};

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3">
            <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[96vh]">

                {/* ── Header ─────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            {variant === 'avatar' ? 'Edit Profile Photo' : 'Edit Cover Photo'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {variant === 'avatar'
                                ? 'Drag to reposition · scroll to zoom'
                                : 'Drag to reposition · scroll to zoom · 3:1 ratio'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {variant === 'avatar' && (
                            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                                <button
                                    onClick={() => setCropShape('round')}
                                    title="Circle crop"
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${cropShape === 'round' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Circle className="h-3.5 w-3.5" /> Circle
                                </button>
                                <button
                                    onClick={() => setCropShape('rect')}
                                    title="Square crop"
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${cropShape === 'rect' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Square className="h-3.5 w-3.5" /> Square
                                </button>
                            </div>
                        )}
                        <button onClick={onClose} title="Close" className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted/40 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ── Cropper Canvas ──────────────────── */}
                <div className="relative bg-black/80 overflow-hidden shrink-0" style={{ height: variant === 'cover' ? '220px' : '320px' }}>
                    {imageSrc && (
                        <div style={filterStyle} className="absolute inset-0">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspect}
                                cropShape={variant === 'avatar' ? cropShape : 'rect'}
                                showGrid
                                onCropChange={setCrop}
                                onCropComplete={onCropCompleteEvent}
                                onZoomChange={setZoom}
                                style={{
                                    containerStyle: { background: 'transparent' },
                                }}
                            />
                        </div>
                    )}
                    {/* Overlay hint */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-white/50 pointer-events-none select-none">
                        scroll to zoom · drag to move
                    </div>
                </div>

                {/* ── Adjustments + Preview ───────────── */}
                <div className="flex gap-4 px-5 py-4 border-t border-border/40 overflow-y-auto">

                    {/* Sliders */}
                    <div className="flex-1 flex flex-col gap-3">
                        <Slider label="Zoom" icon={ZoomIn} value={zoom} min={1} max={3} step={0.05} onChange={setZoom} />
                        <Slider label="Rotation" icon={RotateCcw} value={rotation} min={0} max={360} step={1} onChange={setRotation} unit="°" />
                        <Slider label="Brightness" icon={Sun} value={brightness} min={50} max={150} step={1} onChange={setBrightness} unit="%" />
                        <Slider label="Contrast" icon={Contrast} value={contrast} min={50} max={150} step={1} onChange={setContrast} unit="%" />

                        {/* Flip buttons */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 w-24 shrink-0">
                                <FlipHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Flip</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFlip(f => ({ ...f, horizontal: !f.horizontal }))}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${flip.horizontal ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'}`}
                                >
                                    <FlipHorizontal className="h-3.5 w-3.5" /> Horizontal
                                </button>
                                <button
                                    onClick={() => setFlip(f => ({ ...f, vertical: !f.vertical }))}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${flip.vertical ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'}`}
                                >
                                    <FlipVertical className="h-3.5 w-3.5" /> Vertical
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-medium">Preview</span>
                        {variant === 'avatar' ? (
                            <div className={`overflow-hidden border-2 border-border/60 bg-muted/40 ${cropShape === 'round' ? 'rounded-full' : 'rounded-xl'}`}
                                style={{ width: 80, height: 80 }}>
                                {previewUrl
                                    ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-5 w-5 text-muted-foreground/50 animate-spin" /></div>
                                }
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-lg border-2 border-border/60 bg-muted/40" style={{ width: 144, height: 48 }}>
                                {previewUrl
                                    ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-4 w-4 text-muted-foreground/50 animate-spin" /></div>
                                }
                            </div>
                        )}
                        <span className="text-[10px] text-muted-foreground/60">
                            {variant === 'avatar' ? 'Profile photo' : 'Banner'}
                        </span>
                        {/* Second size preview for avatar */}
                        {variant === 'avatar' && (
                            <div className={`overflow-hidden border border-border/60 bg-muted/40 ${cropShape === 'round' ? 'rounded-full' : 'rounded-md'}`}
                                style={{ width: 36, height: 36 }}>
                                {previewUrl && <img src={previewUrl} alt="Preview small" className="w-full h-full object-cover" />}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ─────────────────────────── */}
                <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-border/60 shrink-0">
                    <button
                        onClick={handleReset}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {saving ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
