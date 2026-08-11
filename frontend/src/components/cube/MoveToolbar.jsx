import React from 'react';

const MoveToolbar = ({
  onMove,
  onUndo,
  onRedo,
  onReset,
  canUndo = false,
  canRedo = false,
  className = '',
}) => {
  const moves = ['U', 'D', 'L', 'R', 'F', 'B', "U'", "D'", "L'", "R'", "F'", "B'"];

  return (
    <div className={`flex flex-col gap-4 items-center w-full border border-subtle bg-surface rounded-card p-4 select-none ${className}`}>
      {/* 12 Move Buttons */}
      <div className="flex flex-wrap justify-center gap-1.5 w-full">
        {moves.map((move) => (
          <button
            key={move}
            onClick={() => onMove && onMove(move)}
            className="h-8 min-w-10 border border-subtle bg-white text-primary font-mono text-[13px] font-semibold hover:bg-gray-50 active:bg-gray-100 rounded-btn transition-colors px-2 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-accent-blue"
          >
            {move}
          </button>
        ))}
      </div>

      {/* Undo / Redo / Reset Actions */}
      <div className="flex items-center gap-6 border-t border-subtle pt-3 w-full justify-center text-[13px] font-semibold">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`text-accent-orange hover:text-orange-700 transition-colors bg-transparent border-0 p-0 font-sans focus-visible:underline ${!canUndo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          Undo
        </button>
        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`text-accent-orange hover:text-orange-700 transition-colors bg-transparent border-0 p-0 font-sans focus-visible:underline ${!canRedo ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          Redo
        </button>
        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
        <button
          onClick={onReset}
          className="text-accent-blue hover:text-blue-700 transition-colors bg-transparent border-0 p-0 font-sans cursor-pointer focus-visible:underline"
        >
          Reset to Solved
        </button>
      </div>
    </div>
  );
};

export default MoveToolbar;
