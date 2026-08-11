import React from 'react';

const StatusBadge = ({
  status, // 'SOLVED', 'SUCCESS', 'FAILED', 'TIMEOUT', 'RUNNING', 'QUEUED', 'CANCELLED'
  className = '',
  ...props
}) => {
  const normalizedStatus = status ? status.toUpperCase() : 'UNKNOWN';

  let themeClasses = 'bg-gray-100 text-gray-800';

  if (normalizedStatus === 'SOLVED' || normalizedStatus === 'SUCCESS') {
    themeClasses = 'bg-accent-green-bg text-accent-green';
  } else if (normalizedStatus === 'FAILED' || normalizedStatus === 'TIMEOUT' || normalizedStatus === 'MEMORY_LIMIT' || normalizedStatus === 'SOLVER_CRASHED') {
    themeClasses = 'bg-accent-red-bg text-accent-red';
  } else if (normalizedStatus === 'RUNNING' || normalizedStatus === 'QUEUED') {
    themeClasses = 'bg-accent-blue-bg text-accent-blue';
  } else if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'CANCELLING') {
    themeClasses = 'bg-orange-100 text-accent-orange';
  }

  // Readable status labels
  const labelMap = {
    SOLVED: 'SOLVED',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMED OUT',
    MEMORY_LIMIT: 'OOM LIMIT',
    SOLVER_CRASHED: 'CRASHED',
    RUNNING: 'RUNNING',
    QUEUED: 'QUEUED',
    CANCELLED: 'CANCELLED',
    CANCELLING: 'CANCELLING',
  };

  const displayText = labelMap[normalizedStatus] || normalizedStatus;

  return (
    <span
      className={`inline-flex items-center px-[10px] py-[4px] rounded-full text-[11px] font-semibold tracking-wider uppercase font-sans ${themeClasses} ${className}`}
      {...props}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;
