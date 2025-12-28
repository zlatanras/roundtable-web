/**
 * Simple i18n utility for multi-language support
 */

export type Language = 'en' | 'de';

const translations: Record<Language, Record<string, string>> = {
  en: {
    'discussion.topic': 'Discussion Topic',
    'discussion.start': 'Start the discussion to see expert responses',
    'discussion.complete': 'Discussion Complete',
    'discussion.consensusScore': 'Final consensus score',
    'round.indicator': 'Round',
    'round.of': 'of',
    'round.consensus': 'Consensus',
    'moderator.placeholder': 'Add your comment or question...',
    'moderator.skip': 'Skip',
    'moderator.send': 'Send',
    'expert.thinking': 'thinking...',
    'summary.title': 'Discussion Summary',
    'summary.keyTakeaways': 'Key Takeaways',
    'summary.actionItems': 'Action Items',
    'summary.sentiment': 'Sentiment',
    'summary.consensus': 'Consensus Level',
    'summary.nextSteps': 'Next Steps',
    'export.markdown': 'Export Markdown',
    'export.text': 'Export Text',
    'error.occurred': 'An error occurred',
  },
  de: {
    'discussion.topic': 'Diskussionsthema',
    'discussion.start': 'Starten Sie die Diskussion, um Expertenantworten zu sehen',
    'discussion.complete': 'Diskussion abgeschlossen',
    'discussion.consensusScore': 'Endgültiger Konsens-Score',
    'round.indicator': 'Runde',
    'round.of': 'von',
    'round.consensus': 'Konsens',
    'moderator.placeholder': 'Fügen Sie Ihren Kommentar oder Ihre Frage hinzu...',
    'moderator.skip': 'Überspringen',
    'moderator.send': 'Senden',
    'expert.thinking': 'denkt nach...',
    'summary.title': 'Diskussionszusammenfassung',
    'summary.keyTakeaways': 'Wichtigste Erkenntnisse',
    'summary.actionItems': 'Handlungsempfehlungen',
    'summary.sentiment': 'Stimmung',
    'summary.consensus': 'Konsensgrad',
    'summary.nextSteps': 'Nächste Schritte',
    'export.markdown': 'Markdown exportieren',
    'export.text': 'Text exportieren',
    'error.occurred': 'Ein Fehler ist aufgetreten',
  },
};

/**
 * Get translation for a key in the specified language
 */
export function t(key: string, language: Language = 'en'): string {
  return translations[language]?.[key] || translations.en[key] || key;
}

/**
 * Create a translator function for a specific language
 */
export function createTranslator(language: Language) {
  return (key: string): string => t(key, language);
}

/**
 * Check if a language is supported
 */
export function isValidLanguage(lang: string): lang is Language {
  return lang === 'en' || lang === 'de';
}
