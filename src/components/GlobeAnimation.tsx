import { useEffect, useRef, useState } from 'react';

/* ── Constants ───────────────────────────────────────────────────────── */
const R = 160;
const CX = 200;
const CY = 200;

/* ── Full 3D projection (rotY + rotX axes) ───────────────────────────── */
function project(lat: number, lon: number, rotY: number, rotX: number) {
    // Spherical → Cartesian
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = lon        * (Math.PI / 180);
    let x = R * Math.sin(phi) * Math.cos(theta);
    let y = R * Math.cos(phi);
    let z = R * Math.sin(phi) * Math.sin(theta);

    // Rotate around Y axis (left/right)
    const ry = rotY * (Math.PI / 180);
    const x1 = x * Math.cos(ry) - z * Math.sin(ry);
    const z1 = x * Math.sin(ry) + z * Math.cos(ry);
    const y1 = y;

    // Rotate around X axis (up/down)
    const rx = rotX * (Math.PI / 180);
    const y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
    const z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);
    const x2 = x1;

    return { x: CX + x2, y: CY - y2, visible: z2 > -20 };
}

/* ── Arc path between two projected points ───────────────────────────── */
function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
    const mx   = (a.x + b.x) / 2;
    const my   = (a.y + b.y) / 2;
    const dx   = b.x - a.x;
    const dy   = b.y - a.y;
    const len  = Math.hypot(dx, dy) || 1;
    const pull = Math.max(20, len * 0.45);
    const cx   = mx + (-dy / len) * pull * 0.4;
    const cy   = my + (dx  / len) * pull * 0.4 - pull * 0.55;
    return `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
}

/* ── Grid lines ──────────────────────────────────────────────────────── */
function buildGrid(rotY: number, rotX: number) {
    let d = '';
    for (let lat = -60; lat <= 60; lat += 30) {
        const pts: string[] = [];
        for (let lon = -180; lon <= 180; lon += 4) {
            const p = project(lat, lon, rotY, rotX);
            if (p.visible) pts.push(`${p.x},${p.y}`);
            else if (pts.length) { d += `M${pts.join('L')} `; pts.length = 0; }
        }
        if (pts.length) d += `M${pts.join('L')} `;
    }
    for (let lon = -180; lon < 180; lon += 30) {
        const pts: string[] = [];
        for (let lat = -85; lat <= 85; lat += 4) {
            const p = project(lat, lon, rotY, rotX);
            if (p.visible) pts.push(`${p.x},${p.y}`);
            else if (pts.length) { d += `M${pts.join('L')} `; pts.length = 0; }
        }
        if (pts.length) d += `M${pts.join('L')} `;
    }
    return d;
}

/* ── Data ────────────────────────────────────────────────────────────── */
const CITIES = [
    { name: 'New York',  lat: 40.7,  lon: -74.0, jobs: 4820 },
    { name: 'London',    lat: 51.5,  lon: -0.12, jobs: 3910 },
    { name: 'Tokyo',     lat: 35.7,  lon: 139.7, jobs: 3250 },
    { name: 'Berlin',    lat: 52.5,  lon: 13.4,  jobs: 2100 },
    { name: 'Singapore', lat: 1.35,  lon: 103.8, jobs: 1980 },
    { name: 'Bangalore', lat: 12.9,  lon: 77.6,  jobs: 3620 },
    { name: 'São Paulo', lat: -23.5, lon: -46.6, jobs: 1430 },
    { name: 'Sydney',    lat: -33.9, lon: 151.2, jobs: 1760 },
    { name: 'Toronto',   lat: 43.7,  lon: -79.4, jobs: 2340 },
    { name: 'Dubai',     lat: 25.2,  lon: 55.3,  jobs: 1870 },
];

const CONNECTIONS = [
    [0,1],[0,3],[1,3],[1,4],[2,4],[2,7],
    [5,4],[5,1],[5,9],[0,8],[6,0],[9,4],[3,9],[2,5],
];

const COLORS = ['#a78bfa','#60a5fa','#34d399','#fb923c','#f472b6'];

/* ── Component ───────────────────────────────────────────────────────── */
export default function GlobeAnimation() {
    const [rotY,    setRotY]    = useState(20);
    const [rotX,    setRotX]    = useState(-15);
    const [hovered, setHovered] = useState<number | null>(null);
    const [arcOff,  setArcOff]  = useState(0);

    const rotRef  = useRef({ y: 20, x: -15 });
    const drag    = useRef({ active: false, startX: 0, startY: 0, initY: 20, initX: -15 });
    const rafRef  = useRef<number>(0);
    const lastT   = useRef(0);

    /* Auto-rotate (Y axis only when idle) */
    useEffect(() => {
        let alive = true;
        const tick = (t: number) => {
            if (!alive) return;
            if (!drag.current.active) {
                const dt = lastT.current ? t - lastT.current : 0;
                rotRef.current.y = (rotRef.current.y + dt * 0.010) % 360;
                setRotY(rotRef.current.y);
            }
            lastT.current = t;
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { alive = false; cancelAnimationFrame(rafRef.current); };
    }, []);

    /* Arc animation */
    useEffect(() => {
        let v = 0;
        const id = setInterval(() => { v = (v + 2) % 200; setArcOff(v); }, 20);
        return () => clearInterval(id);
    }, []);

    /* Drag handlers — track BOTH X and Y mouse delta */
    const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        drag.current = { active: true, startX: clientX, startY: clientY, initY: rotRef.current.y, initX: rotRef.current.x };
    };
    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drag.current.active) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const dY = (clientX - drag.current.startX) * 0.4;
        const dX = (clientY - drag.current.startY) * 0.4;
        rotRef.current.y = drag.current.initY + dY;
        rotRef.current.x = Math.max(-80, Math.min(80, drag.current.initX + dX));
        setRotY(rotRef.current.y);
        setRotX(rotRef.current.x);
    };
    const onEnd = () => { drag.current.active = false; };

    const grid     = buildGrid(rotY, rotX);
    const cityProj = CITIES.map(c => project(c.lat, c.lon, rotY, rotX));

    return (
        <div className="relative w-full flex items-center justify-center select-none">
            {/* Ambient glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-72 h-72 rounded-full bg-violet-600/20 blur-[80px]" />
            </div>

            <svg
                width="400" height="400" viewBox="0 0 400 400"
                className="cursor-grab active:cursor-grabbing drop-shadow-2xl touch-none"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
                onTouchStart={onMouseDown}
                onTouchMove={onMouseMove}
                onTouchEnd={onEnd}
            >
                <defs>
                    <radialGradient id="sphereGrad" cx="38%" cy="35%" r="65%">
                        <stop offset="0%"   stopColor="#eef2ff" />
                        <stop offset="100%" stopColor="#c7d2fe" />
                    </radialGradient>
                    <radialGradient id="glowRing" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"    />
                    </radialGradient>
                    <filter id="blur4"><feGaussianBlur stdDeviation="4" /></filter>
                    <clipPath id="sphereClip">
                        <circle cx={CX} cy={CY} r={R} />
                    </clipPath>
                </defs>

                {/* Outer glow */}
                <circle cx={CX} cy={CY} r={R + 12} fill="url(#glowRing)" filter="url(#blur4)" />

                {/* Sphere */}
                <circle cx={CX} cy={CY} r={R} fill="url(#sphereGrad)" stroke="#7c3aed" strokeOpacity="0.5" strokeWidth="1" />

                {/* Grid */}
                <g clipPath="url(#sphereClip)">
                    <path d={grid} fill="none" stroke="#7c3aed" strokeWidth="0.4" strokeOpacity="0.45" />
                </g>

                {/* Connection arcs */}
                <g clipPath="url(#sphereClip)">
                    {CONNECTIONS.map(([a, b], i) => {
                        const pa = cityProj[a], pb = cityProj[b];
                        if (!pa.visible || !pb.visible) return null;
                        const color  = COLORS[i % COLORS.length];
                        const d      = arcPath(pa, pb);
                        const offset = (arcOff + i * 22) % 200;
                        return (
                            <g key={i}>
                                <path d={d} fill="none" stroke={color} strokeWidth="0.7" strokeOpacity="0.18" />
                                <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeOpacity="0.8"
                                    strokeDasharray="12 188" strokeDashoffset={-offset} strokeLinecap="round" />
                            </g>
                        );
                    })}
                </g>

                {/* City markers */}
                {CITIES.map((city, i) => {
                    const p = cityProj[i];
                    if (!p.visible) return null;
                    const color = COLORS[i % COLORS.length];
                    const isHov = hovered === i;
                    // Tooltip position — flip left if near right edge
                    const tipX = p.x > 290 ? p.x - 104 : p.x + 8;
                    return (
                        <g key={city.name} className="cursor-pointer"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}>
                            {/* Pulse halo */}
                            <circle cx={p.x} cy={p.y} r={isHov ? 14 : 8}
                                fill={color} fillOpacity={0.08}
                                stroke={color} strokeOpacity={isHov ? 0.5 : 0.25} strokeWidth="1" />
                            {/* Dot */}
                            <circle cx={p.x} cy={p.y} r={isHov ? 5 : 3.5}
                                fill={color} fillOpacity="0.95" />
                            {/* Hover tooltip */}
                            {isHov && (
                                <g>
                                    <rect x={tipX} y={p.y - 24} width={96} height={32} rx={6}
                                        fill="#ffffff" stroke={color} strokeOpacity="0.45" strokeWidth="1" />
                                    <text x={tipX + 6} y={p.y - 11} fontSize="8.5" fill="#1f2937" fontWeight="bold">{city.name}</text>
                                    <text x={tipX + 6} y={p.y + 2}  fontSize="7.5" fill={color}>{city.jobs.toLocaleString()} open jobs</text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Specular sheen */}
                <ellipse cx={CX - 52} cy={CY - 52} rx={50} ry={34} fill="white" fillOpacity="0.04" />
                <ellipse cx={CX - 58} cy={CY - 60} rx={18} ry={12} fill="white" fillOpacity="0.06" />
            </svg>
        </div>
    );
}
