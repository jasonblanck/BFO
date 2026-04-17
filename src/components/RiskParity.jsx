import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { ShieldAlert } from 'lucide-react';

const riskData = [
  { axis: 'Equity',     target: 30, current: 38 },
  { axis: 'Venture',    target: 25, current: 31 },
  { axis: 'Cash',       target: 10, current: 6  },
  { axis: 'Fixed Inc.', target: 15, current: 11 },
  { axis: 'Crypto',     target: 10, current: 8  },
  { axis: 'Real Asset', target: 10, current: 6  },
];

export default function RiskParity() {
  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-accent-amber" />
          <div>
            <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">Risk Parity</div>
            <div className="text-[14.5px] font-semibold text-slate-100">Allocation Drift</div>
          </div>
        </div>
        <span className="chip text-accent-amber border-accent-amber/30 bg-accent-amber/5">
          +6.2 pts drift
        </span>
      </div>

      <div className="h-[220px] px-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={riskData} outerRadius="75%">
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: '#8296B2', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar
              name="Target"
              dataKey="target"
              stroke="#3DA9FC"
              fill="#3DA9FC"
              fillOpacity={0.08}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Radar
              name="Current"
              dataKey="current"
              stroke="#00FFA3"
              fill="#00FFA3"
              fillOpacity={0.22}
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,163,0.5))' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3 mono">
          <span className="flex items-center gap-1.5 text-accent-green">
            <span className="h-2 w-2 rounded-full bg-accent-green shadow-glow-green" /> Current
          </span>
          <span className="flex items-center gap-1.5 text-accent-blue">
            <span className="h-2 w-2 rounded-full bg-accent-blue shadow-glow-blue" /> Target
          </span>
        </div>
        <span className="text-slate-400 mono">σ · 11.4% · 3y</span>
      </div>
    </section>
  );
}
