/**
 * Export utilities for discussions
 */

import { Message, Expert, DiscussionSummary } from '@/types';

interface ExportData {
  title: string;
  topic: string;
  experts: Expert[];
  messages: Message[];
  summary?: DiscussionSummary | null;
  language: string;
  createdAt: string;
}

/**
 * Export discussion as Markdown
 */
export function exportAsMarkdown(data: ExportData): string {
  const { title, topic, experts, messages, summary, createdAt } = data;

  let markdown = `# ${title}\n\n`;
  markdown += `**Erstellt:** ${new Date(createdAt).toLocaleString('de-DE')}\n\n`;
  markdown += `---\n\n`;

  // Topic
  markdown += `## Diskussionsthema\n\n`;
  markdown += `${topic}\n\n`;

  // Experts
  markdown += `## Experten-Panel\n\n`;
  experts.forEach((expert) => {
    markdown += `- **${expert.name}** - ${expert.role}\n`;
  });
  markdown += `\n---\n\n`;

  // Messages by round
  markdown += `## Diskussionsverlauf\n\n`;

  const messagesByRound = messages.reduce((acc, msg) => {
    const round = msg.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(msg);
    return acc;
  }, {} as Record<number, Message[]>);

  const rounds = Object.keys(messagesByRound).map(Number).sort((a, b) => a - b);

  rounds.forEach((round) => {
    markdown += `### Runde ${round}\n\n`;
    messagesByRound[round].forEach((msg) => {
      const expertName = msg.expert?.name || experts.find(e => e.id === msg.expertId)?.name || 'Unbekannt';
      const expertRole = msg.expert?.role || experts.find(e => e.id === msg.expertId)?.role || '';
      markdown += `#### ${expertName} (${expertRole})\n\n`;
      markdown += `${msg.content}\n\n`;
    });
  });

  // Summary
  if (summary) {
    markdown += `---\n\n`;
    markdown += `## Zusammenfassung\n\n`;

    markdown += `### Wichtigste Erkenntnisse\n\n`;
    summary.keyTakeaways.forEach((takeaway, i) => {
      markdown += `${i + 1}. ${takeaway}\n`;
    });
    markdown += `\n`;

    markdown += `### To-Dos / Action Items\n\n`;
    summary.actionItems.forEach((item) => {
      markdown += `- [ ] ${item}\n`;
    });
    markdown += `\n`;

    markdown += `### Sentiment\n\n`;
    const sentimentLabels: Record<string, string> = {
      positive: 'Positiv',
      neutral: 'Neutral',
      mixed: 'Gemischt',
      negative: 'Kritisch',
    };
    markdown += `**${sentimentLabels[summary.sentiment] || summary.sentiment}:** ${summary.sentimentExplanation}\n\n`;

    markdown += `### Konsens-Level\n\n`;
    markdown += `**${Math.round(summary.consensusLevel * 100)}%:** ${summary.consensusExplanation}\n\n`;

    markdown += `### Nächste Schritte\n\n`;
    markdown += `${summary.nextSteps}\n`;
  }

  return markdown;
}

/**
 * Export discussion as plain text
 */
export function exportAsText(data: ExportData): string {
  const { title, topic, experts, messages, summary, createdAt } = data;

  let text = `${title}\n${'='.repeat(title.length)}\n\n`;
  text += `Erstellt: ${new Date(createdAt).toLocaleString('de-DE')}\n\n`;

  // Topic
  text += `DISKUSSIONSTHEMA\n${'-'.repeat(20)}\n\n`;
  text += `${topic}\n\n`;

  // Experts
  text += `EXPERTEN-PANEL\n${'-'.repeat(20)}\n\n`;
  experts.forEach((expert) => {
    text += `• ${expert.name} - ${expert.role}\n`;
  });
  text += `\n`;

  // Messages by round
  text += `DISKUSSIONSVERLAUF\n${'-'.repeat(20)}\n\n`;

  const messagesByRound = messages.reduce((acc, msg) => {
    const round = msg.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(msg);
    return acc;
  }, {} as Record<number, Message[]>);

  const rounds = Object.keys(messagesByRound).map(Number).sort((a, b) => a - b);

  rounds.forEach((round) => {
    text += `--- Runde ${round} ---\n\n`;
    messagesByRound[round].forEach((msg) => {
      const expertName = msg.expert?.name || experts.find(e => e.id === msg.expertId)?.name || 'Unbekannt';
      const expertRole = msg.expert?.role || experts.find(e => e.id === msg.expertId)?.role || '';
      text += `[${expertName} - ${expertRole}]\n\n`;
      text += `${msg.content}\n\n`;
    });
  });

  // Summary
  if (summary) {
    text += `ZUSAMMENFASSUNG\n${'-'.repeat(20)}\n\n`;

    text += `Wichtigste Erkenntnisse:\n`;
    summary.keyTakeaways.forEach((takeaway, i) => {
      text += `${i + 1}. ${takeaway}\n`;
    });
    text += `\n`;

    text += `To-Dos / Action Items:\n`;
    summary.actionItems.forEach((item) => {
      text += `• ${item}\n`;
    });
    text += `\n`;

    const sentimentLabels: Record<string, string> = {
      positive: 'Positiv',
      neutral: 'Neutral',
      mixed: 'Gemischt',
      negative: 'Kritisch',
    };
    text += `Sentiment: ${sentimentLabels[summary.sentiment] || summary.sentiment}\n`;
    text += `${summary.sentimentExplanation}\n\n`;

    text += `Konsens-Level: ${Math.round(summary.consensusLevel * 100)}%\n`;
    text += `${summary.consensusExplanation}\n\n`;

    text += `Nächste Schritte:\n`;
    text += `${summary.nextSteps}\n`;
  }

  return text;
}

/**
 * Download text content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export discussion and download
 */
export function exportDiscussion(
  data: ExportData,
  format: 'markdown' | 'text' = 'markdown'
) {
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedTitle = data.title.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_').substring(0, 50);

  if (format === 'markdown') {
    const content = exportAsMarkdown(data);
    downloadFile(content, `${sanitizedTitle}_${timestamp}.md`, 'text/markdown');
  } else {
    const content = exportAsText(data);
    downloadFile(content, `${sanitizedTitle}_${timestamp}.txt`, 'text/plain');
  }
}
