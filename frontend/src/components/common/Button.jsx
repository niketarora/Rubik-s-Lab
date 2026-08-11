import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary-black', // 'primary-black', 'primary-blue', 'primary-green', 'secondary', 'link'
  disabled = false,
  className = '',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans transition-colors focus-visible:outline-2 focus-visible:outline-accent-blue focus-visible:outline-offset-2';
  
  const variantStyles = {
    'primary-black': 'bg-accent-black hover:bg-black text-on-dark font-semibold rounded-btn border-0 py-[12px] px-[20px] text-[14px]',
    'primary-blue': 'bg-accent-blue hover:bg-blue-700 text-on-dark font-semibold rounded-btn border-0 py-[12px] px-[20px] text-[14px]',
    'primary-green': 'bg-accent-green hover:bg-green-700 text-on-dark font-semibold rounded-btn border-0 py-[12px] px-[20px] text-[14px]',
    secondary: 'bg-white hover:bg-gray-50 text-primary border border-subtle font-semibold rounded-btn py-[12px] px-[20px] text-[14px]',
    link: 'text-accent-blue hover:text-blue-700 font-medium bg-transparent border-0 p-0 hover:underline text-[14px]',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${disabledStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
