'use client';

import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';

interface RoundIndicatorProps {
  round: number;
  totalRounds: number;
  consensusScore?: number;
  language?: Language;
}

export function RoundIndicator({
  round,
  totalRounds,
  consensusScore,
  language = 'en',
}: RoundIndicatorProps) {
  const isLastRound = round === totalRounds;
  const isFinalRound = round >= totalRounds && totalRounds >= 4;

  const getRoundLabel = () => {
    if (language === 'de') {
      if (round === 1) return 'Erste Einschätzungen';
      if (isFinalRound) return 'Finale Konsensrunde';
      return 'Experten-Austausch';
    }
    if (round === 1) return 'Initial Assessments';
    if (isFinalRound) return 'Final Consensus';
    return 'Expert Cross-Examination';
  };

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />

      {/* Round badge */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium',
          isFinalRound
            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        )}
      >
        <span>
          {isFinalRound ? '🤝' : round === 1 ? '🔥' : '🎯'} {t('round.indicator', language)} {round}
        </span>
        <span className="text-slate-400 dark:text-slate-500">·</span>
        <span>{getRoundLabel()}</span>
      </div>

      {/* Line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />

      {/* Consensus indicator */}
      {consensusScore !== undefined && consensusScore > 0 && (
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs',
            consensusScore >= 0.8
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : consensusScore >= 0.5
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
          )}
        >
          <span>{t('round.consensus', language)}:</span>
          <span className="font-semibold">{Math.round(consensusScore * 100)}%</span>
        </div>
      )}
    </div>
  );
}
