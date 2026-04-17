import React, { useState, useMemo, useCallback, useEffect } from 'react';
import MacroTicker from './components/MacroTicker';
import Header from './components/Header';
import InstitutionsTable from './components/InstitutionsTable';
import PulseChart from './components/PulseChart';
import PredictionFeed from './components/PredictionFeed';
import WeatherWidget from './components/WeatherWidget';
import MissionControl from './components/MissionControl';
import LiquidityLadder from './components/LiquidityLadder';
import RiskParity from './components/RiskParity';
import DeepDiveModal from './components/DeepDiveModal';
import DeveloperPanel from './components/DeveloperPanel';
import CommandLog from './components/CommandLog';
import WorldMapBg from './components/WorldMapBg';
import ScanBar from './components/ScanBar';
import SystemLog from './components/SystemLog';
import { institutions, totalAssets } from './data/portfolio';

export default function App() {
  const baseAum = useMemo(() => totalAssets(), []);
  const [aum, setAum] = useState(baseAum);
  const [selected, setSelected] = useState(() => ({
    account: institutions[0].accounts[0],
    institution: institutions[0],
  }));
  const [deepDive, setDeepDive] = useState(null);
  const [log, setLog] = useState([]);

  // Live AUM jitter — drives the Heartbeat pulse on the header figure.
  useEffect(() => {
    const t = setInterval(() => {
      const drift = (Math.random() - 0.48) * 40000;
      setAum((v) => Math.round(Math.max(baseAum * 0.97, Math.min(baseAum * 1.03, v + drift))));
    }, 3400);
    return () => clearInterval(t);
  }, [baseAum]);

  const onSelectAccount = useCallback((account, institution) => {
    setSelected({ account, institution });
  }, []);

  const onCommand = useCallback((cmd) => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    let result = 'OK';
    const parts = cmd.trim().split(/\s+/);
    const op = (parts[0] || '').toLowerCase();
    if (op === '/update' && parts.length >= 3) {
      result = `adjusted ${parts[1]} by ${parts[2]}`;
    } else if (op === '/rebalance') {
      result = `rebalance queued → ${parts.slice(1).join(' ')}`;
    } else if (op === '/mark') {
      result = `venture ${parts[1]} marked ${parts[2]}`;
    } else if (op.startsWith('/')) {
      result = 'queued for review';
    } else {
      result = 'unknown command';
    }
    setLog((l) => [...l, { time, cmd, result }]);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 relative">
      <WorldMapBg />
      <ScanBar />

      <MacroTicker />
      <Header totalAUM={aum} onCommand={onCommand} />

      <main className="px-4 pb-10 pt-4 space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <InstitutionsTable
              selectedAccountId={selected.account.id}
              onSelectAccount={onSelectAccount}
            />
            <PulseChart account={selected.account} institution={selected.institution} />
            <MissionControl onOpenDeepDive={setDeepDive} />
          </div>

          <aside className="space-y-4">
            <PredictionFeed />
            <LiquidityLadder />
            <RiskParity />
            <WeatherWidget />
          </aside>
        </div>

        <SystemLog />
        <CommandLog entries={log} />
        <DeveloperPanel />

        <footer className="flex items-center justify-between mono text-[11px] text-emerald-300/50 px-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-hud-emerald shadow-glow-green animate-pulse-dot" />
            bci-os v3.0.0 · all systems nominal
          </div>
          <div>
            signal · plaid · morgan stanley · tiaa · fidelity · ny 529 · bofa · chase · citi · pe
          </div>
        </footer>
      </main>

      <DeepDiveModal venture={deepDive} onClose={() => setDeepDive(null)} />
    </div>
  );
}
