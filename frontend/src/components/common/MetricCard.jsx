import React from 'react';

/**
 * Reusable Metric/Telemetry Card Component
 *
 * @param {object} props
 * @param {string} props.label - Metric title/label
 * @param {string|number} props.value - Metric value to display prominently
 * @param {React.ReactNode} [props.icon] - Optional lucide icon
 * @param {string} [props.unit] - Optional unit of measurement
 * @param {string} [props.subtext] - Optional helper text
 * @param {string} [props.className] - Optional custom styling
 */
export const MetricCard = ({
  label,
  value,
  icon,
  unit,
  subtext,
  className = '',
}) => {
  return (
    <div className={`bg-white/85 backdrop-blur-sm p-4 rounded-2xl border border-stone-100 shadow-xs hover:border-emerald-200 transition-all ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block truncate">
          {label}
        </span>
        {icon && <div className="text-emerald-600 shrink-0">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-stone-900 tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs text-stone-500 font-semibold">{unit}</span>}
      </div>
      {subtext && <p className="text-[11px] text-stone-400 mt-1 truncate">{subtext}</p>}
    </div>
  );
};

export default MetricCard;
