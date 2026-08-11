import React from 'react';

const ProgressBar = ({
  value = 0, // 0 to 100
  max = 100,
  label,
  colorClass = 'bg-accent-blue',
  showPercentage = true,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`} {...props}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-[12px] font-sans">
          {label && <span className="font-semibold text-secondary">{label}</span>}
          {showPercentage && <span className="font-mono text-primary font-medium">{percentage}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
