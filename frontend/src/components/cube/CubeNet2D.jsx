import React from 'react';
import { SOLVED_STATE } from '../../utils/cube';

const ColorLegend = () => {
  const legendItems = [
    { label: 'U - Yellow', color: 'bg-cube-yellow' },
    { label: 'L - Orange', color: 'bg-cube-orange' },
    { label: 'F - Green', color: 'bg-cube-green' },
    { label: 'R - Red', color: 'bg-cube-red' },
    { label: 'B - Blue', color: 'bg-cube-blue' },
    { label: 'D - White', color: 'bg-cube-white' },
  ];

  return (
    <div className="flex flex-col gap-2.5 pl-4 border-l border-subtle min-w-[105px] select-none self-center">
      <span className="text-[10px] font-bold text-secondary uppercase font-sans tracking-wider">
        Legend
      </span>
      <div className="flex flex-col gap-2">
        {legendItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded-[3px] border border-black/25 shadow-[inset_0_-1px_1.5px_rgba(0,0,0,0.15)] ${item.color}`} />
            <span className="text-[11px] font-semibold text-secondary font-sans leading-none">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CubeNet2D = ({
  stickers = SOLVED_STATE,
  className = '',
  onScrambleReset,
  ...props
}) => {
  // Helper to map color character to Tailwind classes
  const getColorClass = (char) => {
    switch (char) {
      case 'U': return 'bg-cube-yellow';
      case 'D': return 'bg-cube-white';
      case 'L': return 'bg-cube-orange';
      case 'F': return 'bg-cube-green';
      case 'R': return 'bg-cube-red';
      case 'B': return 'bg-cube-blue';
      default: return 'bg-gray-300';
    }
  };

  // Helper to render one 3x3 face
  const renderFace = (faceIdx, label) => {
    const offset = faceIdx * 9;
    const faceStickers = stickers.slice(offset, offset + 9);

    return (
      <div className="flex flex-col items-center gap-1 select-none">
        <div className="text-[10px] font-bold text-secondary uppercase font-sans tracking-wide">
          {label}
        </div>
        <div className="grid grid-cols-3 grid-rows-3 gap-[3px] p-[3px] bg-slate-950 border border-slate-900 rounded-[4px] shadow-sm">
          {faceStickers.map((sticker, idx) => (
            <div
              key={idx}
              className={`w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] border-[0.5px] border-black/35 rounded-[3px] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.25),inset_0_-1.5px_2px_rgba(0,0,0,0.15)] ${getColorClass(sticker)}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col border border-subtle bg-surface rounded-card p-6 relative ${className}`} {...props}>
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-subtle pl-9">
        {/* Scramble/Reset quadrant icon button */}
        <button
          type="button"
          onClick={onScrambleReset}
          className="absolute top-5 left-6 w-8 h-8 rounded-full border border-subtle bg-surface hover:bg-page transition-all active:scale-95 flex items-center justify-center shadow-sm hover:shadow focus-visible:outline-2 focus-visible:outline-accent-blue"
          aria-label="Generate scramble or reset cube"
          title="Generate scramble or reset cube"
        >
          <div className="w-4 h-4 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/15 rotate-45">
            <div className="bg-cube-red" />
            <div className="bg-cube-blue" />
            <div className="bg-cube-yellow" />
            <div className="bg-cube-green" />
          </div>
        </button>

        <h3 className="text-[15px] font-bold text-primary font-sans leading-none">
          2D Cube Net Sticker Map
        </h3>
        <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider font-sans leading-none">
          Flat projection
        </span>
      </div>

      {/* 2D Net cross layout and Legend */}
      <div className="flex flex-row items-stretch justify-between gap-6 py-2 overflow-x-auto">
        <div className="flex-1 flex justify-center py-2">
          <div className="grid grid-cols-4 grid-rows-3 gap-x-4 gap-y-2 min-w-[280px]">
            {/* Row 1 */}
            <div className="col-start-2 row-start-1">
              {renderFace(0, 'U (Yellow)')}
            </div>

            {/* Row 2 */}
            <div className="col-start-1 row-start-2">
              {renderFace(1, 'L (Orange)')}
            </div>
            <div className="col-start-2 row-start-2">
              {renderFace(2, 'F (Green)')}
            </div>
            <div className="col-start-3 row-start-2">
              {renderFace(3, 'R (Red)')}
            </div>
            <div className="col-start-4 row-start-2">
              {renderFace(4, 'B (Blue)')}
            </div>

            {/* Row 3 */}
            <div className="col-start-2 row-start-3">
              {renderFace(5, 'D (White)')}
            </div>
          </div>
        </div>

        {/* Vertical Color Legend */}
        <ColorLegend />
      </div>
    </div>
  );
};

export default CubeNet2D;
