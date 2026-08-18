import React from 'react';

const LandingPagePreviewCube = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Stylized 3x3 Cube Face Preview with rounded beveled stickers on dark plastic */}
      <div className="w-[140px] h-[140px] rounded-2xl p-2 bg-[#0E1015] border border-slate-800 shadow-2xl grid grid-cols-3 grid-rows-3 gap-1.5">
        <div className="bg-cube-blue rounded-[6px] shadow-sm"></div>
        <div className="bg-cube-blue rounded-[6px] shadow-sm"></div>
        <div className="bg-cube-blue rounded-[6px] shadow-sm"></div>
        <div className="bg-cube-yellow rounded-[6px] shadow-sm"></div>
        <div className="bg-cube-yellow rounded-[6px] shadow-sm"></div>
        <div className="bg-cube-yellow rounded-[6px] shadow-sm"></div>
        <div className="bg-cube-red rounded-[6px] shadow-sm"></div>
        <div className="bg-cube-red rounded-[6px] shadow-sm"></div>
        <div className="bg-cube-red rounded-[6px] shadow-sm"></div>
      </div>
      
      {/* Monospace Caption */}
      <div className="font-mono text-[13px] font-medium text-secondary flex items-center gap-1.5 select-none">
        <span>Initial State S_0</span>
        <span className="text-accent-green">&rarr;</span>
        <span className="text-accent-green font-bold">Solved State G</span>
      </div>
    </div>
  );
};

export default LandingPagePreviewCube;
