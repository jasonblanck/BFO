import React from 'react';

// Vertical HUD sweep — translates top→bottom every 8s, then fades.
// Low-opacity so it doesn't distract; pointer-events disabled.
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
            'linear-gradient(180deg, transparent 0%, rgba(0, 255, 65, 0.0) 20%, rgba(0, 255, 65, 0.16) 48%, rgba(0, 255, 65, 0.28) 50%, rgba(0, 255, 65, 0.16) 52%, rgba(0, 255, 65, 0.0) 80%, transparent 100%)',
          filter: 'blur(1.2px)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
