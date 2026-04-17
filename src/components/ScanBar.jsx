import React from 'react';

// Vertical HUD sweep — translates top→bottom every 10s, then fades.
// MS-blue tinted and lower opacity than the original emerald version.
export default function ScanBar() {
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 pointer-events-none z-[55]"
      style={{ height: '100vh' }}
    >
      <div
        className="absolute left-0 right-0 h-[140px] animate-scan-v"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(0, 94, 184, 0.0) 20%, rgba(61, 169, 252, 0.10) 48%, rgba(61, 169, 252, 0.18) 50%, rgba(61, 169, 252, 0.10) 52%, rgba(0, 94, 184, 0.0) 80%, transparent 100%)',
          filter: 'blur(1.4px)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
