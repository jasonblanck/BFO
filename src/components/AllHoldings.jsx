import React from 'react';
import { ArrowLeft, Layers } from 'lucide-react';
import HoldingsRollup from './HoldingsRollup';

// Dedicated page shell for the master holdings rollup. Accessible from
// the footer's "All Holdings" link. Renders the same HoldingsRollup
// component used inside InstitutionalView's "Investment Details" tab,
// just with a page header.
export default function AllHoldings({ onBack }) {
  return (
    <div className="min-h-screen pt-[40px] px-2 sm:px-4 pb-24">
      <header className="panel hud-corners mt-3 sm:mt-4 px-4 sm:px-5 py-4 relative">
        <span className="corner-tl" /><span className="corner-br" />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="h-8 w-8 flex items-center justify-center border border-white/10 bg-black/40 text-slate-300 hover:text-white hover:border-ms-600/40 transition rounded-sm"
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <div className="mono text-[10px] tracking-[0.32em] text-slate-400 uppercase">
                Blanck Capital · Master View
              </div>
              <h1 className="text-[18px] sm:text-[20px] font-semibold text-slate-100 leading-tight">
                All Holdings
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip chip-ms">
              <Layers size={10} /> Equities · ETFs · Fixed Income · Cash
            </span>
          </div>
        </div>
      </header>

      <section className="panel mt-4 overflow-hidden">
        <HoldingsRollup />
      </section>

      <div className="mt-3 px-2 mono text-[10px] text-slate-500 tracking-wider">
        Manual private deals (SPVs · real estate · collectibles) are shown under
        Mission Control on the main dashboard · this page rolls up only
        symbol-denominated positions.
      </div>
    </div>
  );
}
