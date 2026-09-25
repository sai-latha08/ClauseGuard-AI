import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RiskBadge = ({ level = 'LOW', score, size = 'md', showIcon = true }) => {
  const normLevel = (level || 'LOW').toUpperCase();

  const styles = {
    CRITICAL: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-600',
      icon: ShieldAlert,
      label: 'Critical Risk',
    },
    HIGH: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-600',
      icon: AlertTriangle,
      label: 'High Risk',
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertCircle,
      label: 'Medium Risk',
    },
    LOW: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      label: 'Low Risk',
    },
    PENDING: {
      bg: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      icon: AlertCircle,
      label: 'Processing',
    }
  };

  const current = styles[normLevel] || styles.LOW;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3 py-1.5 gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${current.bg} ${sizeClasses[size] || sizeClasses.md} select-none transition-colors`}>
      {showIcon && <IconComponent className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{current.label}</span>
      {typeof score === 'number' && (
        <span className="opacity-75 font-mono text-[11px] border-l pl-1.5 border-current">
          {score}/100
        </span>
      )}
    </span>
  );
};
