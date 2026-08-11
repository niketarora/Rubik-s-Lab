import React from 'react';

const DonutChart = ({
  percentage = 75,
  label = "Metric",
  valueLabel = "75%",
  color = "#16A34A", // green
  remainderColor = "#E5E7EB", // subtle gray
  legendItems = [], // Array of { label, value, color }
  className = '',
}) => {
  // SVG parameters
  const size = 120;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {/* SVG Ring */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={remainderColor}
            strokeWidth={strokeWidth}
          />
          {/* Segment circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Inner Label text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[16px] font-bold text-primary">
            {valueLabel}
          </span>
          <span className="text-[10px] uppercase font-semibold text-secondary tracking-wide">
            {label}
          </span>
        </div>
      </div>

      {/* Legend list */}
      {legendItems && legendItems.length > 0 && (
        <div className="flex flex-col gap-2 flex-grow">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-secondary font-sans">{item.label}</span>
              </div>
              <span className="font-mono font-bold text-primary ml-4">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
