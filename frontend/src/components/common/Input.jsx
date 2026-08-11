import React from 'react';

const Input = React.forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  monospace = false,
  error,
  required = false,
  className = '',
  labelClassName = '',
  rightLabelAction,
  ...props
}, ref) => {
  const fontClass = monospace ? 'font-mono text-[13px]' : 'font-sans text-[14px]';
  const borderClass = error ? 'border-accent-red focus-visible:outline-accent-red' : 'border-subtle focus-visible:outline-accent-blue';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {(label || rightLabelAction) && (
        <div className="flex justify-between items-center">
          {label && (
            <label className={`text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans ${labelClassName}`}>
              {label} {required && <span className="text-accent-red">*</span>}
            </label>
          )}
          {rightLabelAction && (
            <div className="flex-shrink-0">
              {rightLabelAction}
            </div>
          )}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`bg-white border rounded-btn py-[10px] px-[12px] text-primary placeholder-muted transition-colors ${fontClass} ${borderClass}`}
        {...props}
      />
      {error && (
        <span className="text-[12px] text-accent-red font-medium font-sans">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
