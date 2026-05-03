import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

function useDropdownStyle(ref: React.RefObject<HTMLButtonElement>, open: boolean, dropWidth: number) {
    const [style, setStyle] = useState<React.CSSProperties>({});
    useEffect(() => {
        if (!open || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow >= 280) {
            setStyle({ position: 'fixed', top: rect.bottom + 6, left: rect.left, width: dropWidth, zIndex: 9999 });
        } else {
            setStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + 6, left: rect.left, width: dropWidth, zIndex: 9999 });
        }
    }, [open]);
    return style;
}

interface DatePickerProps {
    value: string; // yyyy-mm-dd
    onChange: (val: string) => void;
    placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const today = new Date();
    const parsed = value ? new Date(value + 'T00:00:00') : null;
    const [view, setView] = useState({ month: parsed?.getMonth() ?? today.getMonth(), year: parsed?.getFullYear() ?? today.getFullYear() });

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const firstDay = new Date(view.year, view.month, 1).getDay();

    const prevMonth = () => setView(v => v.month === 0 ? { month: 11, year: v.year - 1 } : { ...v, month: v.month - 1 });
    const nextMonth = () => setView(v => v.month === 11 ? { month: 0, year: v.year + 1 } : { ...v, month: v.month + 1 });

    const select = (day: number) => {
        const m = String(view.month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        onChange(`${view.year}-${m}-${d}`);
        setOpen(false);
    };

    const displayValue = parsed
        ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2 w-full h-10 rounded-lg border px-3 text-sm transition-colors ${open ? 'border-primary ring-2 ring-primary/20' : 'border-input hover:border-primary/50'} bg-background text-left ${displayValue ? 'text-foreground' : 'text-muted-foreground'}`}
            >
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1">{displayValue || placeholder}</span>
            </button>

            {open && (
                <div className="absolute z-50 mt-1.5 w-72 rounded-xl border border-border/60 bg-card shadow-xl p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={prevMonth} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold text-foreground">
                            {MONTHS[view.month]}, {view.year}
                        </span>
                        <button onClick={nextMonth} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {DAYS.map(d => (
                            <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">{d}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const isSelected = parsed &&
                                parsed.getDate() === day &&
                                parsed.getMonth() === view.month &&
                                parsed.getFullYear() === view.year;
                            const isToday = today.getDate() === day &&
                                today.getMonth() === view.month &&
                                today.getFullYear() === view.year;
                            return (
                                <button
                                    key={day}
                                    onClick={() => select(day)}
                                    className={`h-8 w-8 mx-auto rounded-lg text-xs font-medium transition-colors
                                        ${isSelected ? 'bg-primary text-primary-foreground' :
                                          isToday ? 'border border-primary/40 text-primary' :
                                          'hover:bg-muted text-foreground'}`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
                        <button onClick={() => { onChange(''); setOpen(false); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
                        <button onClick={() => {
                            const t = new Date();
                            const m = String(t.getMonth() + 1).padStart(2, '0');
                            const d = String(t.getDate()).padStart(2, '0');
                            onChange(`${t.getFullYear()}-${m}-${d}`);
                            setOpen(false);
                        }} className="ml-auto text-xs text-primary hover:text-primary/80 font-medium transition-colors">Today</button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface TimePickerProps {
    value: string; // HH:mm (24h)
    onChange: (val: string) => void;
    placeholder?: string;
}

export function TimePicker({ value, onChange, placeholder = 'Select time' }: TimePickerProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Parse 24h value to display
    let displayHour = '09';
    let displayMinute = '00';
    let displayPeriod = 'AM';
    if (value) {
        const [h, m] = value.split(':');
        const hNum = parseInt(h);
        displayPeriod = hNum >= 12 ? 'PM' : 'AM';
        const h12 = hNum === 0 ? 12 : hNum > 12 ? hNum - 12 : hNum;
        displayHour = String(h12).padStart(2, '0');
        displayMinute = m || '00';
    }

    const [selHour, setSelHour] = useState(displayHour);
    const [selMin, setSelMin] = useState(displayMinute);
    const [selPeriod, setSelPeriod] = useState(displayPeriod);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const commit = (h: string, m: string, p: string) => {
        let h24 = parseInt(h);
        if (p === 'AM' && h24 === 12) h24 = 0;
        if (p === 'PM' && h24 !== 12) h24 += 12;
        onChange(`${String(h24).padStart(2, '0')}:${m}`);
    };

    const displayValue = value
        ? `${selHour}:${selMin} ${selPeriod}`
        : '';

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2 w-full h-10 rounded-lg border px-3 text-sm transition-colors ${open ? 'border-primary ring-2 ring-primary/20' : 'border-input hover:border-primary/50'} bg-background text-left ${displayValue ? 'text-foreground' : 'text-muted-foreground'}`}
            >
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1">{displayValue || placeholder}</span>
            </button>

            {open && (
                <div className="absolute z-50 mt-1.5 w-64 rounded-xl border border-border/60 bg-card shadow-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Select Time</p>

                    <div className="flex gap-2">
                        {/* Hours */}
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1.5 text-center">Hour</p>
                            <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto pr-0.5">
                                {HOURS.map(h => (
                                    <button
                                        key={h}
                                        onClick={() => { setSelHour(h); commit(h, selMin, selPeriod); }}
                                        className={`rounded-lg py-1.5 text-sm font-medium transition-colors ${selHour === h ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
                                    >{h}</button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px bg-border/60 self-stretch" />

                        {/* Minutes */}
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1.5 text-center">Min</p>
                            <div className="flex flex-col gap-0.5">
                                {MINUTES.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => { setSelMin(m); commit(selHour, m, selPeriod); }}
                                        className={`rounded-lg py-1.5 text-sm font-medium transition-colors ${selMin === m ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
                                    >{m}</button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px bg-border/60 self-stretch" />

                        {/* AM/PM */}
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1.5 text-center">Period</p>
                            <div className="flex flex-col gap-0.5">
                                {PERIODS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => { setSelPeriod(p); commit(selHour, selMin, p); }}
                                        className={`rounded-lg py-1.5 text-sm font-medium transition-colors ${selPeriod === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
                                    >{p}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setOpen(false)}
                        className="mt-3 w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}
