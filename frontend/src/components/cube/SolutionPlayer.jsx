import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import Button from '../common/Button';
import { isSolved } from '../../utils/cube';

const SolutionPlayer = ({
  solution = [], // Array of move notation (e.g., ["R", "U", "R'", "F2"])
  onStepChange,  // Callback (stepIndex) => void, where stepIndex is 0 to solution.length (0 means initial scrambled state)
  cubeState,     // Current stickers array, used for final solved verification
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0); // 0 = start (scrambled state), 1 = after 1st move, etc.
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1 = 1s per move, 2 = 0.5s, 0.5 = 2s
  const timerRef = useRef(null);

  const totalSteps = solution.length;
  const hasSolution = totalSteps > 0;

  // Reset player when solution changes
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    if (onStepChange) onStepChange(0);
  }, [solution]);

  // Handle auto playback
  useEffect(() => {
    if (isPlaying && hasSolution) {
      const delay = 1000 / speed;
      timerRef.current = setTimeout(() => {
        if (currentStep < totalSteps) {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          if (onStepChange) onStepChange(nextStep);
        } else {
          setIsPlaying(false);
        }
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, speed, totalSteps, hasSolution]);

  const handlePlayPause = () => {
    if (currentStep >= totalSteps && !isPlaying) {
      // If at end, restart first
      setCurrentStep(0);
      if (onStepChange) onStepChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStep > 0) {
      const nextStep = currentStep - 1;
      setCurrentStep(nextStep);
      if (onStepChange) onStepChange(nextStep);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (onStepChange) onStepChange(nextStep);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    if (onStepChange) onStepChange(0);
  };

  const handleSliderChange = (e) => {
    setIsPlaying(false);
    const step = parseInt(e.target.value, 10);
    setCurrentStep(step);
    if (onStepChange) onStepChange(step);
  };

  if (!hasSolution) {
    return (
      <div className={`border border-subtle bg-surface rounded-card p-6 flex items-center justify-center min-h-[100px] select-none ${className}`}>
        <p className="text-[14px] text-secondary italic font-sans">
          Solve a cube to see the move-by-move replay.
        </p>
      </div>
    );
  }

  // Verification at the final move
  const isFinalStep = currentStep === totalSteps;
  const stateCheckPassed = isFinalStep ? isSolved(cubeState) : false;

  return (
    <div className={`border border-subtle bg-surface rounded-card p-6 flex flex-col gap-4 select-none ${className}`}>
      {/* Title / Status row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-subtle pb-3">
        <div className="flex items-center gap-3">
          <span className="bg-accent-blue-bg text-accent-blue font-bold px-[8px] py-[3px] rounded-full text-[10px] tracking-wider uppercase font-sans">
            SOLUTION REPLAY
          </span>
          <span className="font-sans text-[13px] font-semibold text-secondary">
            Move {currentStep} of {totalSteps}
          </span>
        </div>
        {/* Verification badge */}
        {isFinalStep && (
          <div>
            {stateCheckPassed ? (
              <span className="bg-accent-green-bg text-accent-green font-bold text-[11px] px-[10px] py-[4px] rounded-full tracking-wider uppercase font-sans">
                ✓ VERIFIED SOLVED
              </span>
            ) : (
              <span className="bg-accent-red-bg text-accent-red font-bold text-[11px] px-[10px] py-[4px] rounded-full tracking-wider uppercase font-sans">
                ⚠ REPLAY STATE MISMATCH
              </span>
            )}
          </div>
        )}
      </div>

      {/* Move list sequence */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-subtle rounded-btn overflow-x-auto min-h-[48px] max-h-[100px]">
        {solution.map((move, idx) => {
          const isPassed = idx < currentStep;
          const isActive = idx === currentStep - 1;
          return (
            <span
              key={idx}
              className={`font-mono text-[14px] font-bold px-1.5 py-0.5 rounded transition-all font-mono ${
                isActive
                  ? 'bg-accent-blue text-on-dark shadow-sm'
                  : isPassed
                  ? 'text-gray-400 font-normal line-through'
                  : 'text-primary'
              }`}
            >
              {move}
            </span>
          );
        })}
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleRestart} className="p-2 h-9 w-9" title="Restart">
            <RotateCcw className="w-4 h-4 text-primary" />
          </Button>
          <Button variant="secondary" onClick={handlePrev} disabled={currentStep === 0} className="p-2 h-9 w-9">
            <ChevronLeft className="w-4 h-4 text-primary" />
          </Button>
          <Button
            variant="primary-black"
            onClick={handlePlayPause}
            className="h-9 px-4 flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 text-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" />
                <span>Play</span>
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={handleNext} disabled={currentStep === totalSteps} className="p-2 h-9 w-9">
            <ChevronRight className="w-4 h-4 text-primary" />
          </Button>
        </div>

        {/* Slider */}
        <div className="flex-grow flex items-center gap-3 w-full md:w-auto px-4">
          <span className="font-mono text-[12px] text-secondary font-mono">S_0</span>
          <input
            type="range"
            min={0}
            max={totalSteps}
            value={currentStep}
            onChange={handleSliderChange}
            className="flex-grow accent-accent-blue cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
          />
          <span className="font-mono text-[12px] text-secondary font-mono">G</span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] font-semibold text-secondary uppercase font-sans">Speed</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="bg-white border border-subtle rounded-btn px-2 py-1 text-[13px] font-semibold text-primary focus-visible:outline-accent-blue"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
            <option value={5}>5.0x</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SolutionPlayer;
