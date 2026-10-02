import { describe, it, expect } from 'vitest';
import { PDFExporter, CSVExporter, BatchExporter } from '@/utils/advancedExport';
import type { ConversationSession } from '@/types';

/** A session as SessionManager creates it: createdAt is set, startedAt is not. */
function managedSession(overrides: Partial<ConversationSession> = {}): ConversationSession {
  const createdAt = Date.UTC(2026, 9, 1, 12, 0, 0);
  return {
    id: 's1',
    name: 'Tuesday',
    characterId: 'sbaitso',
    themeId: 'dos-blue',
    audioQualityId: 'default',
    messages: [
      { author: 'user', text: 'hello' },
      { author: 'dr', text: 'TELL ME MORE.' },
    ],
    createdAt,
    updatedAt: createdAt + 5 * 60_000,
    messageCount: 2,
    glitchCount: 0,
    ...overrides,
  };
}

const pdfOptions = {
  includeCoverPage: true,
  includeStatistics: true,
  includeCharacterInfo: true,
  fontSize: 12,
  pageSize: 'A4',
  includeThemeStyling: true,
} as const;

const csv = { delimiter: ',', includeHeaders: true, dateFormat: 'iso' } as const;

describe('exports of sessions without startedAt', () => {
  it('PDF/print export uses createdAt rather than printing Invalid Date', async () => {
    const result = await PDFExporter.exportToPDF(managedSession(), pdfOptions);
    expect(result.content).not.toMatch(/Invalid Date|NaN/);
  });

  it('CSV message rows fall back to the session creation time', () => {
    const { content } = CSVExporter.exportMessages([managedSession()], csv);
    expect(content).toContain('2026-10-01T12:00:00.000Z');
    expect(content).not.toMatch(/Invalid|NaN/);
  });

  it('CSV statistics report a real start date and duration', () => {
    const { content } = CSVExporter.exportStatistics([managedSession({ endedAt: Date.UTC(2026, 9, 1, 12, 30) })], csv);
    expect(content).toContain('2026-10-01T12:00:00.000Z');
    expect(content).toContain(',30,');
    expect(content).not.toMatch(/Invalid|NaN/);
  });

  it('batch Markdown export has a valid start time', async () => {
    const results = await BatchExporter.batchExport([managedSession()], 'markdown');
    const text = JSON.stringify(results);
    expect(text).not.toMatch(/Invalid Date|NaN/);
  });
});
