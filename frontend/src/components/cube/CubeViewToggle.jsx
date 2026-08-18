import React from 'react';

const CubeViewToggle = ({ view = '2D', onViewChange }) => {
  return (
    <div className="flex items-center bg-gray-100/80 rounded-btn p-0.5 border border-subtle text-[12px] font-bold shadow-inner select-none">
      <button
        type="button"
        onClick={() => onViewChange('2D')}
        className={`px-3 py-1 rounded-sm font-sans transition-all duration-200 focus-visible:outline-none ${
          view === '2D'
            ? 'bg-white text-primary shadow-sm font-extrabold'
            : 'text-secondary hover:text-primary'
        }`}
      >
        2D Net
      </button>
      <button
        type="button"
        onClick={() => onViewChange('3D')}
        className={`px-3 py-1 rounded-sm font-sans transition-all duration-200 focus-visible:outline-none ${
          view === '3D'
            ? 'bg-white text-primary shadow-sm font-extrabold'
            : 'text-secondary hover:text-primary'
        }`}
      >
        3D View
      </button>
    </div>
  );
};

export default CubeViewToggle;
