import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-surface border border-subtle rounded-card p-6 shadow-none ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-subtle">
          <div>
            {title && <h3 className="text-[17px] font-bold text-primary font-sans">{title}</h3>}
            {subtitle && <p className="text-[13px] text-secondary mt-0.5 font-sans">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
