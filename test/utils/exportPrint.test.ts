import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  escapeHtml,
  PDFExporter,
  BatchExporter,
  formatSession,
  printHtml,
  downloadExportResult,
  REVOKE_DELAY_MS,
} from '@/utils/advancedExport';
import { ConversationExporter } from '@/utils/exportConversation';
import type { ConversationSession } from '@/types';

const hostile = '<img src=x onerror="alert(1)">';

function session(overrides: Partial<ConversationSession> = {}): ConversationSession {
  return {
    id: '<id>"x',
    name: hostile,
    characterId: 'sbaitso',
    themeId: '<theme>',
    audioQualityId: 'default',
    messages: [
      { author: 'user', text: '<b>hi</b>', timestamp: 1_700_000_000_000 },
      { author: 'dr', text: 'TELL ME MORE & MORE.', timestamp: 1_700_000_001_000 },
    ],
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_001_000,
    messageCount: 2,
    glitchCount: 0,
    ...overrides,
  };
}

const printOptions = {
  includeCoverPage: true,
  includeStatistics: true,
  includeCharacterInfo: true,
  fontSize: 12,
  pageSize: 'A4',
  includeThemeStyling: false,
} as const;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('escapeHtml', () => {
  it('escapes markup and both quote characters without a DOM', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    );
  });
});

describe('print-ready export', () => {
  it('escapes every interpolated session field', async () => {
    const { content } = await PDFExporter.exportToPDF(session({ characterId: '<custom>' }), printOptions);
    const html = String(content);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<theme>');
    expect(html).not.toContain('<custom>');
    expect(html).not.toContain('<id>');
    expect(html).not.toContain('<b>hi');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('is labelled honestly as an HTML file', async () => {
    const result = await PDFExporter.exportToPDF(session(), printOptions);
    expect(result.filename).toMatch(/\.html$/);
    expect(result.mimeType).toBe('text/html');
  });

  it('only accepts known page sizes in the print CSS', async () => {
    const options = { ...printOptions, pageSize: 'A4; } body { display:none' as 'A4' };
    const { content } = await PDFExporter.exportToPDF(session(), options);
    expect(String(content)).not.toContain('display:none');
  });
});

describe('formatSession (shared by both exporters)', () => {
  it('escapes the title, heading and names in standalone HTML', () => {
    const html = formatSession(session(), { format: 'html', includeMetadata: true, includeTimestamps: true });
    expect(html).not.toContain('<img');
    expect(html).toContain(`<title>${escapeHtml(hostile)}</title>`);
  });

  it('backs the legacy ConversationExporter API', () => {
    const options = { format: 'markdown', includeMetadata: true, includeTimestamps: false } as const;
    expect(ConversationExporter.exportSession(session(), options)).toBe(formatSession(session(), options));
  });

  it('is used for batch Markdown export', async () => {
    const [result] = await BatchExporter.batchExport([session()], 'markdown');
    expect(result.content).toBe(
      formatSession(session(), { format: 'markdown', includeMetadata: true, includeTimestamps: true })
    );
  });

  it('batch "pdf" produces print-ready HTML files rather than claiming PDF', async () => {
    const [result] = await BatchExporter.batchExport([session()], 'pdf');
    expect(result.filename).toMatch(/\.html$/);
  });
});

describe('printHtml', () => {
  it('prints the document from a hidden iframe and then removes it', () => {
    vi.useFakeTimers();
    const iframe = printHtml('<p>hello</p>');
    expect(iframe.getAttribute('srcdoc')).toBe('<p>hello</p>');
    expect(document.body.contains(iframe)).toBe(true);

    const print = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', {
      value: { print, focus: vi.fn(), addEventListener: vi.fn() },
      configurable: true,
    });
    iframe.dispatchEvent(new Event('load'));
    expect(print).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(120_000);
    expect(document.body.contains(iframe)).toBe(false);
  });
});

describe('downloadExportResult', () => {
  it('revokes the object URL only after a delay', () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: revoke }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadExportResult({ filename: 'a.txt', content: 'x', mimeType: 'text/plain' });
    expect(click).toHaveBeenCalledTimes(1);
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(REVOKE_DELAY_MS);
    expect(revoke).toHaveBeenCalledWith('blob:x');
    vi.unstubAllGlobals();
  });
});
