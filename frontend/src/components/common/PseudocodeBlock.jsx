import React from 'react';

const PseudocodeBlock = ({
  title = "ALGORITHM PSEUDOCODE",
  code = "",
  className = '',
  ...props
}) => {
  return (
    <div className={`rounded-card overflow-hidden border border-slate-800 ${className}`} {...props}>
      {/* Header */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800">
        <span className="font-mono text-[11px] font-semibold tracking-wider text-yellow-500 uppercase">
          {title}
        </span>
      </div>
      {/* Code Area */}
      <div className="bg-code p-4 overflow-x-auto">
        <pre className="font-mono text-[13px] text-on-dark leading-relaxed whitespace-pre font-mono">
          {code}
        </pre>
      </div>
    </div>
  );
};

export default PseudocodeBlock;
