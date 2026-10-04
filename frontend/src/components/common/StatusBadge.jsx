import React from 'react';

/**
 * Reusable Status Badge Component
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Badge label content
 * @param {'healthy'|'warning'|'danger'|'info'|'neutral'} [props.variant='neutral'] - Color style
 * @param {string} [props.className=''] - Optional additional classes
 */
export const StatusBadge = ({ children, variant = 'neutral', className = '' }) => {
  const variantStyles = {
    healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const currentStyle = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${currentStyle} ${className}`}
    >
      {children}
    </span>
  );
};

export default StatusBadge;
