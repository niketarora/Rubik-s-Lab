import React from 'react';

const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || 'checkbox-' + Math.random().toString(36).substring(2, 9);
  
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 rounded border border-subtle text-accent-blue focus:ring-accent-blue focus:ring-offset-0 focus:outline-none accent-accent-blue cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          className={`text-[14px] text-primary font-medium font-sans cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
