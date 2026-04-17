import React from 'react';

// Stylized HUD "global trace" background: equirectangular dot-grid with
// glowing investment-hub nodes. No world-map dependency — purely
// procedural so it stays under 2KB and renders on any device.

const NODES = [
  { id: 'nyc',   label: 'NYC · HQ',          lat:  40.71, lng:  -74.00, accent: '#3DA9FC' },
  { id: 'sfb',   label: 'SF Bay · Ventures', lat:  37.77, lng: -122.42, accent: '#00F0FF' },
  { id: 'lax',   label: 'Los Angeles',       lat:  34.05, lng: -118.24, accent: '#A78BFA' },
  { id: 'aus',   label: 'Austin · Siete',    lat:  30.27, lng:  -97.74, accent: '#FFB020' },
  { id: 'hou',   label: 'Houston · Starlab', lat:  29.76, lng:  -95.37, accent: '#00F0FF' },
  { id: 'lon',   label: 'London',            lat:  51.50, lng:   -0.12, accent: '#3DA9FC' },
  { id: 'sgp',   label: 'Singapore',         lat:   1.35, lng:  103.82, accent: '#00F0FF' },
];

const W = 1600;
const H = 800;

// Equirectangular: longitude → x, latitude → y.
function project(lat, lng) {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

// Procedural dot grid — mimics a globe graticule without needing a world map.
function DotGrid() {
  const dots = [];
  const stepLat = 6;
  const stepLng = 6;
  for (let lat = -60; lat <= 70; lat += stepLat) {
    for (let lng = -170; lng <= 170; lng += stepLng) {
      const [x, y] = project(lat, lng);
      const latitudeFade = 1 - Math.abs(lat) / 90;
      const r = 0.8 + latitudeFade * 0.6;
      dots.push(
        <circle
          key={`${lat}-${lng}`}
          cx={x}
          cy={y}
          r={r}
          fill="rgba(125, 198, 255, 0.12)"
        />
      );
    }
  }
  return <g>{dots}</g>;
}

function Meridians() {
  const lines = [];
  for (let lng = -150; lng <= 150; lng += 30) {
    const [x] = project(0, lng);
    lines.push(
      <line
        key={`m-${lng}`}
        x1={x}
        x2={x}
        y1={0}
        y2={H}
        stroke="rgba(125, 198, 255, 0.05)"
        strokeWidth={1}
      />
    );
  }
  return <g>{lines}</g>;
}

function Parallels() {
  const lines = [];
  for (let lat = -60; lat <= 60; lat += 20) {
    const [, y] = project(lat, 0);
    lines.push(
      <line
        key={`p-${lat}`}
        x1={0}
        x2={W}
        y1={y}
        y2={y}
        stroke="rgba(125, 198, 255, 0.05)"
        strokeWidth={1}
      />
    );
  }
  return <g>{lines}</g>;
}

function Arc({ a, b }) {
  // Great-circle-ish arc: use a quadratic curve with a control point
  // biased toward the upper/lower pole depending on latitude spread.
  const [x1, y1] = project(a.lat, a.lng);
  const [x2, y2] = project(b.lat, b.lng);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dy = Math.min(120, Math.hypot(x2 - x1, y2 - y1) * 0.22);
  const cx = mx;
  const cy = my - dy;
  const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  return (
    <path
      d={d}
      stroke="rgba(125, 198, 255, 0.28)"
      strokeWidth={1}
      fill="none"
      strokeDasharray="3 5"
    />
  );
}

export default function WorldMapBg() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.55 }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#3DA9FC" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#3DA9FC" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3DA9FC" stopOpacity="0" />
          </radialGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        <Parallels />
        <Meridians />
        <DotGrid />

        {/* Trace lines from NYC → each other node */}
        {NODES.filter((n) => n.id !== 'nyc').map((n) => {
          const nyc = NODES.find((x) => x.id === 'nyc');
          return <Arc key={n.id} a={nyc} b={n} />;
        })}

        {/* Node markers */}
        {NODES.map((n, i) => {
          const [x, y] = project(n.lat, n.lng);
          return (
            <g key={n.id} transform={`translate(${x}, ${y})`}>
              <circle r="22" fill="url(#node-glow)" />
              <circle
                r="3.5"
                fill={n.accent}
                style={{ filter: 'drop-shadow(0 0 6px currentColor)', color: n.accent }}
              >
                <animate
                  attributeName="r"
                  values="3.5; 6; 3.5"
                  dur="2.4s"
                  begin={`${i * 0.35}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1; 0.5; 1"
                  dur="2.4s"
                  begin={`${i * 0.35}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <text
                x="8"
                y="-8"
                fill="#9FB7D4"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                opacity="0.7"
                letterSpacing="0.08em"
              >
                {n.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
