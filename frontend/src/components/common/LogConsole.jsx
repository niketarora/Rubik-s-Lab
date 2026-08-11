import React, { useEffect, useRef } from 'react';

const LogConsole = ({
  logs = [], // Array of { id, type, message, timestamp }
  className = '',
  maxHeight = '240px',
  ...props
}) => {
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getTag = (type) => {
    switch (type ? type.toLowerCase() : '') {
      case 'ok':
      case 'success':
        return <span className="text-accent-green font-semibold">[OK]</span>;
      case 'run':
      case 'solve':
        return <span className="text-accent-blue font-semibold">[RUN]</span>;
      case 'info':
        return <span className="text-gray-400 font-semibold">[info]</span>;
      case 'stats':
        return <span className="text-purple-600 font-semibold">[stats]</span>;
      case 'warn':
        return <span className="text-accent-orange font-semibold">[WARN]</span>;
      case 'error':
      case 'fail':
        return <span className="text-accent-red font-semibold">[ERR]</span>;
      default:
        return <span className="text-gray-400 font-semibold">[trace]</span>;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-gray-50 border border-subtle rounded-card p-4 overflow-y-auto shadow-inner text-primary ${className}`}
      style={{ maxHeight, ...props.style }}
      {...props}
    >
      {logs.length === 0 ? (
        <div className="font-mono text-[13px] text-muted italic">Console idle...</div>
      ) : (
        <div className="flex flex-col gap-1">
          {logs.map((log, index) => (
            <div key={log.id || index} className="font-mono text-[12px] leading-relaxed flex items-start gap-2">
              {log.timestamp && (
                <span className="text-gray-400 select-none flex-shrink-0">
                  {log.timestamp}
                </span>
              )}
              <span className="flex-shrink-0 select-none">{getTag(log.type)}</span>
              <span className="text-code break-all font-mono whitespace-pre-wrap">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogConsole;
