import React, { useState, useMemo, useCallback, useEffect } from 'react';
import MacroTicker from './components/MacroTicker';
import Header from './components/Header';
import WealthHero from './components/WealthHero';
import InstitutionalView from './components/InstitutionalView';
import LiabilitiesPanel from './components/LiabilitiesPanel';
import PulseChart from './components/PulseChart';
import PredictionFeed from './components/PredictionFeed';
import WeatherWidget from './components/WeatherWidget';
import MissionControl from './components/MissionControl';
import LiquidityTreemap from './components/LiquidityTreemap';
import RiskParity from './components/RiskParity';
import DeepDiveModal from './components/DeepDiveModal';
import DeveloperPanel from './components/DeveloperPanel';
import CommandLog from './components/CommandLog';
import WorldMapBg from './components/WorldMapBg';
import ScanBar from './components/ScanBar';
import SystemLog from './components/SystemLog';
import HeroHUD from './components/HeroHUD';
import { institutions, totalWealth } from './data/portfolio';

export default function App() {
  const baseWealth = useMemo(() => totalWealth(), []);
  const [wealth, setWealth] = useState(baseWealth);
  const [selected, setSelected] = useState(() => ({
    account: institutions[0].accounts[0],
    institution: institutions[0],
  }));
  const [deepDive, setDeepDive] = useState(null);
  const [log, setLog] = useState([]);

  // Live wealth jitter — drives the Heartbeat pulse on the header figure.
  useEffect(() => {
    const t = setInterval(() => {
      const drift = (Math.random() - 0.48) * 60000;
      setWealth((v) => Math.round(Math.max(baseWealth * 0.97, Math.min(baseWealth * 1.03, v + drift))));
    }, 3400);
    return () => clearInterval(t);
  }, [baseWealth]);

  const onSelectAccount = useCallback((account, institution) => {
    setSelected({ account, institution });
  }, []);

  const onCommand = useCallback((cmd) => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    let result = 'OK';
    const parts = cmd.trim().split(/\s+/);
    const op = (parts[0] || '').toLowerCase();
    if (op === '/update' && parts.length >= 3) result = `adjusted ${parts[1]} by ${parts[2]}`;
    else if (op === '/rebalance') result = `rebalance queued → ${parts.slice(1).join(' ')}`;
    else if (op === '/mark') result = `venture ${parts[1]} marked ${parts[2]}`;
    else if (op.startsWith('/')) result = 'queued for review';
    else result = 'unknown command';
    setLog((l) => [...l, { time, cmd, result }]);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 relative">
      <WorldMapBg />
      <ScanBar />

      <MacroTicker />
      <Header totalAUM={wealth} onCommand={onCommand} />

      <main className="px-2 sm:px-4 pb-10 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
        {/* 1. MS-style wealth hero */}
        <WealthHero />

        {/* 2. Main body — institutional view dominates */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 sm:gap-4">
          <div className="space-y-3 sm:space-y-4">
            <InstitutionalView
              selectedAccountId={selected.account.id}
              onSelectAccount={onSelectAccount}
            />
            <LiabilitiesPanel />
            <PulseChart account={selected.account} institution={selected.institution} />
            <MissionControl onOpenDeepDive={setDeepDive} />
          </div>

          {/* 3. Right rail — analytics + real-time HUD flavor */}
          <aside className="space-y-3 sm:space-y-4">
            <HeroHUD />
            <LiquidityTreemap />
            <PredictionFeed />
            <RiskParity />
            <SystemLog />
            <WeatherWidget />
          </aside>
        </div>

        <CommandLog entries={log} />
        <DeveloperPanel />

        <footer className="flex items-center justify-between mono text-[11px] text-slate-500 px-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gain-500 shadow-glow-green animate-pulse-dot" />
            blanck capital OS · v3.1 · all systems nominal
          </div>
          <div>
            signal · morgan stanley · tiaa · fidelity · ny 529 · bofa · chase · citi · manual
          </div>
        </footer>
      </main>

      <DeepDiveModal venture={deepDive} onClose={() => setDeepDive(null)} />
    </div>
  );
}
