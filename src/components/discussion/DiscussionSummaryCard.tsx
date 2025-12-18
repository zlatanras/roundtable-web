'use client';

import { DiscussionSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DiscussionSummaryCardProps {
  summary: DiscussionSummary;
}

const sentimentConfig = {
  positive: { label: 'Positiv', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', emoji: '😊' },
  neutral: { label: 'Neutral', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', emoji: '😐' },
  mixed: { label: 'Gemischt', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', emoji: '🤔' },
  negative: { label: 'Kritisch', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', emoji: '😟' },
};

function ConsensusBar({ level }: { level: number }) {
  const percentage = Math.round(level * 100);
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">Konsens-Level</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function DiscussionSummaryCard({ summary }: DiscussionSummaryCardProps) {
  const sentiment = sentimentConfig[summary.sentiment] || sentimentConfig.neutral;

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/50 dark:to-slate-900">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-xl">Zusammenfassung</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Moderator-Analyse der Diskussion
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sentiment & Consensus Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{sentiment.emoji}</span>
              <Badge className={sentiment.color}>{sentiment.label}</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {summary.sentimentExplanation}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <ConsensusBar level={summary.consensusLevel} />
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {summary.consensusExplanation}
            </p>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Wichtigste Erkenntnisse
          </h3>
          <ul className="space-y-2">
            {summary.keyTakeaways.map((takeaway, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-300">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="text-lg">✅</span>
            To-Dos / Action Items
          </h3>
          <ul className="space-y-2">
            {summary.actionItems.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-slate-700 dark:text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="p-4 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-2">
            <span className="text-lg">🚀</span>
            Nächste Schritte
          </h3>
          <p className="text-indigo-800 dark:text-indigo-200">
            {summary.nextSteps}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
