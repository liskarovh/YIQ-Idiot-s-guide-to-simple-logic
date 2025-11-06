import React from 'react';
import MarkX from './marks/markX.jsx';

const MiniX = ({ size = 'clamp(18px, 1.8vw, 28px)' }) =>
  <MarkX style={{ width: size, height: size }} color="#FF6B6B" />;

const Ghost = ({ size = 'clamp(18px, 1.8vw, 28px)' }) =>
  <div style={{ width: size, height: size, opacity: 0 }} />;

export default function ConnectOptions() {
  const S = {
    cell:  'clamp(44px, 6.2vw, 64px)',
    gapIn: 'clamp(4px, 0.9vw, 8px)',
    gapOut:'clamp(10px, 2.4vw, 22px)'
  };

  const cell = {
    width: S.cell,
    height: S.cell,
    display: 'grid',
    placeItems: 'center',
    aspectRatio: 1,
    boxSizing: 'border-box',
    flex: '0 0 auto'
  };

  return (
    <div
      style={{
        display: 'grid',
        gridAutoFlow: 'column',   // vždy v řádku
        alignItems: 'center',
        columnGap: S.gapOut,
        minWidth: 0
      }}
    >
      {/* 1) dvě X vedle sebe */}
      <div style={cell}>
        <div style={{ display: 'flex', gap: S.gapIn }}>
          <MiniX /><MiniX />
        </div>
      </div>

      {/* 2) dvě X nad sebou */}
      <div style={cell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: S.gapIn }}>
          <MiniX /><MiniX />
        </div>
      </div>

      {/* 3) dvě X diagonálně (ghost na [0,1] a [1,0]) */}
      <div style={cell}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            justifyItems: 'center',
            alignItems: 'center',
            gap: S.gapIn,
            width: '100%',
            height: '100%'
          }}
        >
          <div style={{ gridColumn: 1, gridRow: 1 }}><MiniX /></div>
          <div style={{ gridColumn: 2, gridRow: 1 }}><Ghost /></div>
          <div style={{ gridColumn: 1, gridRow: 2 }}><Ghost /></div>
          <div style={{ gridColumn: 2, gridRow: 2 }}><MiniX /></div>
        </div>
      </div>
    </div>
  );
}
