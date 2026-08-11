import React from 'react';

const LandingPagePreviewCube = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* 2x2 grid of colors */}
      <div className="w-[120px] h-[120px] rounded-lg overflow-hidden border border-subtle grid grid-cols-2 grid-rows-2">
        <div className="bg-cube-yellow border-[0.5px] border-black/10"></div>
        <div className="bg-cube-blue border-[0.5px] border-black/10"></div>
        <div className="bg-cube-red border-[0.5px] border-black/10"></div>
        <div className="bg-cube-green border-[0.5px] border-black/10"></div>
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
