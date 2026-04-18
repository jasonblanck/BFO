import React from 'react';
import { CloudSun, Droplets, Wind, MapPin, Sunrise } from 'lucide-react';

const forecast = [
  { d: 'Wed', hi: 58, lo: 41, icon: '☀️' },
  { d: 'Thu', hi: 62, lo: 44, icon: '⛅' },
  { d: 'Fri', hi: 55, lo: 39, icon: '🌧' },
  { d: 'Sat', hi: 60, lo: 42, icon: '☀️' },
  { d: 'Sun', hi: 64, lo: 46, icon: '⛅' },
];

export default function WeatherWidget() {
  return (
    <section className="panel p-5 overflow-hidden relative">
      <div
        className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FFB020 0%, transparent 70%)' }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin size={12} />
          <span className="text-[10px] tracking-[0.24em] uppercase">New York · NY</span>
        </div>
        <span className="chip text-accent-amber border-accent-amber/30 bg-accent-amber/5">
          <Sunrise size={10} /> 06:18
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <CloudSun size={44} className="text-accent-amber drop-shadow-[0_0_10px_rgba(255,176,32,0.4)]" />
        <div>
          <div className="mono text-[36px] leading-none font-semibold text-slate-100">
            57<span className="text-[16px] text-slate-400">°F</span>
          </div>
          <div className="text-[11.5px] text-slate-400 mt-1">Partly cloudy · Feels 55°</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Droplets size={12} className="text-accent-blue" /> 42% humidity
        </div>
        <div className="flex items-center gap-2">
          <Wind size={12} className="text-accent-green" /> 6 mph NW
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {forecast.map((f) => (
          <div
            key={f.d}
            className="flex-1 rounded-lg bg-navy-900/60 border border-white/5 px-1.5 py-2 text-center"
          >
            <div className="text-[9.5px] tracking-[0.16em] text-slate-500 uppercase">{f.d}</div>
            <div className="text-[14px] my-0.5">{f.icon}</div>
            <div className="mono text-[11px] text-slate-200">
              {f.hi}° <span className="text-slate-500">{f.lo}°</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
