import React from 'react';
import { Info } from 'lucide-react';

export const DisclaimerBanner = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-cream-100/90 border border-cream-300 text-xs text-burgundy-950/80 ${className}`}>
      <Info className="w-4 h-4 text-burgundy-700 shrink-0" />
      <p>
        <strong className="font-bold text-burgundy-950">Legal Notice:</strong> ClauseGuard AI provides automated informational analysis and does not constitute formal legal counsel.
      </p>
    </div>
  );
};
