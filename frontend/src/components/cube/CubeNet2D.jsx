import React from 'react';
import { SOLVED_STATE } from '../../utils/cube';

const CubeNet2D = ({
  stickers = SOLVED_STATE,
  className = '',
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
        <div className="grid grid-cols-3 grid-rows-3 gap-[2px] p-[2px] bg-slate-900 border border-slate-900 rounded-sm">
          {faceStickers.map((sticker, idx) => (
            <div
              key={idx}
              className={`w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] border-[0.5px] border-black/20 rounded-[2px] ${getColorClass(sticker)}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col border border-subtle bg-surface rounded-card p-6 ${className}`} {...props}>
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-subtle">
        <h3 className="text-[15px] font-bold text-primary font-sans">
          2D Cube Net Sticker Map
        </h3>
        <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider font-sans">
          Flat sticker net projection
        </span>
      </div>

      {/* 2D Net cross layout */}
      <div className="flex justify-center py-4 overflow-x-auto">
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
    </div>
  );
};

export default CubeNet2D;
