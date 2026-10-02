/**
 * Export system: the single implementation behind every export in the app.
 *
 * - Conversation formats (Markdown, plain text, JSON, standalone HTML) via
 *   {@link formatSession}; `exportConversation.ts` is a thin adapter over it.
 * - Print-ready HTML ({@link PDFExporter}). There is no PDF encoder: "PDF"
 *   means opening the browser's print dialog ({@link printHtml}), where the
 *   user picks "Save as PDF". The same document can be downloaded as HTML.
 * - CSV for analytics and spreadsheet import
 * - Theme packages for sharing collections
 * - Batch export for multiple sessions
 *
 * Every user- or model-controlled string interpolated into HTML goes through
 * {@link escapeHtml}.
 */

import type { ConversationSession, ExportFormat, Message } from '../types';
import type { CustomTheme } from './themeValidator';
import { CHARACTERS } from '../constants';

/** Sessions created by SessionManager carry createdAt but not startedAt. */
function sessionStart(session: ConversationSession): number {
  return session.startedAt ?? session.createdAt;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text for HTML element content and quoted attributes. Pure string
 * replacement: unlike the textContent/innerHTML trick it also escapes quotes
 * and needs no DOM.
 */
export function escapeHtml(text: unknown): string {
  return String(text ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** Display name for a persona id; unknown (custom) ids are returned as-is. */
export function characterName(characterId: string): string {
  return CHARACTERS.find((c) => c.id === characterId)?.name ?? characterId;
}

function speaker(message: Message, characterId: string, userLabel: string): string {
  return message.author === 'user' ? userLabel : characterName(characterId);
}

// ---------------------------------------------------------------------------
// Conversation formats (shared with exportConversation.ts)
// ---------------------------------------------------------------------------

function toMarkdown(session: ConversationSession, options: ExportFormat): string {
  let output = '';

  if (options.includeMetadata) {
    output += `# ${session.name}\n\n`;
    output += `**Character:** ${characterName(session.characterId)}\n\n`;
    output += `**Created:** ${new Date(sessionStart(session)).toLocaleString()}\n\n`;
    output += `**Messages:** ${session.messageCount}\n\n`;
    output += `**Glitches:** ${session.glitchCount}\n\n`;
    output += `---\n\n`;
  }

  session.messages.forEach((msg) => {
    const author = speaker(msg, session.characterId, 'You');
    const timestamp =
      options.includeTimestamps && msg.timestamp ? ` *(${new Date(msg.timestamp).toLocaleTimeString()})*` : '';
    // Quote every line, so a multi-line reply stays inside its blockquote.
    output += `**${author}${timestamp}:**\n\n`;
    output += `${msg.text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')}\n\n`;
  });

  return output;
}

function toText(session: ConversationSession, options: ExportFormat): string {
  let output = '';

  if (options.includeMetadata) {
    output += `${session.name}\n`;
    output += `${'='.repeat(Math.max(3, session.name.length))}\n\n`;
    output += `Character: ${characterName(session.characterId)}\n`;
    output += `Created: ${new Date(sessionStart(session)).toLocaleString()}\n`;
    output += `Messages: ${session.messageCount}\n`;
    output += `Glitches: ${session.glitchCount}\n\n`;
    output += `${'-'.repeat(60)}\n\n`;
  }

  session.messages.forEach((msg) => {
    const author = speaker(msg, session.characterId, 'You').toUpperCase();
    const timestamp =
      options.includeTimestamps && msg.timestamp ? ` [${new Date(msg.timestamp).toLocaleTimeString()}]` : '';
    output += `${author}${timestamp}:\n${msg.text}\n\n`;
  });

  return output;
}

function toJSON(session: ConversationSession, options: ExportFormat): string {
  return JSON.stringify(options.includeMetadata ? session : session.messages, null, 2);
}

function toStandaloneHTML(session: ConversationSession, options: ExportFormat): string {
  const title = escapeHtml(session.name);
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Courier New', monospace; background: #1e3a8a; color: #ffffff; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { border-bottom: 2px solid #60a5fa; padding-bottom: 10px; }
    .metadata { background: rgba(0,0,0,0.3); padding: 15px; margin: 20px 0; border-left: 4px solid #fbbf24; }
    .message { margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 4px; }
    .user { border-left: 4px solid #fbbf24; }
    .ai { border-left: 4px solid #60a5fa; }
    .author { font-weight: bold; color: #fbbf24; margin-bottom: 5px; }
    .timestamp { font-size: 0.8em; color: #9ca3af; }
    .text { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${title}</h1>
`;

  if (options.includeMetadata) {
    html += `
  <div class="metadata">
    <strong>Character:</strong> ${escapeHtml(characterName(session.characterId))}<br>
    <strong>Created:</strong> ${escapeHtml(new Date(sessionStart(session)).toLocaleString())}<br>
    <strong>Messages:</strong> ${escapeHtml(session.messageCount)}<br>
    <strong>Glitches:</strong> ${escapeHtml(session.glitchCount)}
  </div>
`;
  }

  session.messages.forEach((msg) => {
    const timestamp =
      options.includeTimestamps && msg.timestamp
        ? `<span class="timestamp">${escapeHtml(new Date(msg.timestamp).toLocaleTimeString())}</span>`
        : '';
    const cssClass = msg.author === 'user' ? 'user' : 'ai';
    html += `
  <div class="message ${cssClass}">
    <div class="author">${escapeHtml(speaker(msg, session.characterId, 'You'))} ${timestamp}</div>
    <div class="text">${escapeHtml(msg.text)}</div>
  </div>
`;
  });

  html += `
</body>
</html>`;
  return html;
}

/** Renders one conversation in a single-file format. */
export function formatSession(session: ConversationSession, options: ExportFormat): string {
  switch (options.format) {
    case 'markdown':
      return toMarkdown(session, options);
    case 'json':
      return toJSON(session, options);
    case 'html':
      return toStandaloneHTML(session, options);
    case 'text':
    default:
      return toText(session, options);
  }
}

export const FORMAT_MIME_TYPES: Record<ExportFormat['format'], string> = {
  markdown: 'text/markdown',
  text: 'text/plain',
  json: 'application/json',
  html: 'text/html',
};

const FORMAT_EXTENSIONS: Record<ExportFormat['format'], string> = {
  markdown: 'md',
  text: 'txt',
  json: 'json',
  html: 'html',
};

function safeFileStem(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_') || 'conversation';
}

export interface PDFExportOptions {
  includeCoverPage: boolean;
  includeStatistics: boolean;
  includeCharacterInfo: boolean;
  fontSize: 12 | 14 | 16;
  pageSize: 'A4' | 'Letter';
  includeThemeStyling: boolean;
}

export interface CSVExportOptions {
  delimiter: ',' | ';' | '\t';
  includeHeaders: boolean;
  dateFormat: 'iso' | 'locale' | 'timestamp';
}

export interface ExportResult {
  filename: string;
  content: string | Blob;
  mimeType: string;
}

/**
 * Print-ready HTML exporter. The browser turns the document into a PDF via
 * its print dialog ({@link printHtml}); this class never produces PDF bytes,
 * and its download result is an `.html` file.
 */
export class PDFExporter {
  /**
   * Print-ready HTML as a downloadable `.html` file (kept under its old name
   * for compatibility; it never produced a PDF).
   */
  static async exportToPDF(session: ConversationSession, options: PDFExportOptions): Promise<ExportResult> {
    return {
      filename: `${safeFileStem(session.name)}_${Date.now()}.html`,
      content: this.buildDocument(session, options),
      mimeType: 'text/html',
    };
  }

  /**
   * The complete print-ready HTML document, for {@link printHtml} or download.
   */
  static buildDocument(session: ConversationSession, options: PDFExportOptions): string {
    const styles = this.getPDFStyles(options);
    const coverPage = options.includeCoverPage ? this.generateCoverPage(session) : '';
    const statistics = options.includeStatistics ? this.generateStatistics(session) : '';
    const characterInfo = options.includeCharacterInfo ? this.generateCharacterInfo(session) : '';
    const messages = this.formatMessages(session.messages, session.characterId);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(session.name)} - Dr. Sbaitso Conversation</title>
  <style>${styles}</style>
</head>
<body>
  ${coverPage}
  ${characterInfo}
  ${statistics}
  ${messages}
  <div class="footer">
    Generated with Dr. Sbaitso Recreated<br>
    Export Date: ${escapeHtml(new Date().toLocaleString())}
  </div>
</body>
</html>`;
  }

  /**
   * Generate PDF print styles
   */
  private static getPDFStyles(options: PDFExportOptions): string {
    // Both values land in CSS, so only known values are accepted.
    const fontSize = [12, 14, 16].includes(options.fontSize) ? options.fontSize : 12;
    const pageSize = options.pageSize === 'Letter' ? 'Letter' : 'A4';
    const pageHeight = pageSize === 'A4' ? '297mm' : '11in';

    return `
      @page {
        size: ${pageSize};
        margin: 20mm;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: ${fontSize}pt;
        line-height: 1.6;
        color: #000;
        background: #fff;
      }

      .cover-page {
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: ${pageHeight};
        text-align: center;
      }

      .cover-page h1 {
        font-size: ${fontSize * 2.5}pt;
        margin-bottom: 20pt;
        color: #1e3a8a;
      }

      .cover-page p {
        font-size: ${fontSize * 1.2}pt;
        margin: 10pt 0;
        color: #666;
      }

      .section {
        margin: 20pt 0;
        page-break-inside: avoid;
      }

      .section h2 {
        font-size: ${fontSize * 1.5}pt;
        margin-bottom: 10pt;
        color: #1e3a8a;
        border-bottom: 2pt solid #1e3a8a;
        padding-bottom: 5pt;
      }

      .message {
        margin: 15pt 0;
        padding: 10pt;
        border-left: 3pt solid #ccc;
        page-break-inside: avoid;
      }

      .message.user {
        background: #f3f4f6;
        border-left-color: #3b82f6;
      }

      .message.ai {
        background: #fef3c7;
        border-left-color: #fbbf24;
      }

      .message-header {
        font-weight: bold;
        margin-bottom: 5pt;
        font-size: ${fontSize * 0.9}pt;
        color: #666;
      }

      .message-text {
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .statistics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10pt;
        margin: 10pt 0;
      }

      .stat-box {
        padding: 10pt;
        border: 1pt solid #ccc;
        border-radius: 5pt;
      }

      .stat-label {
        font-size: ${fontSize * 0.8}pt;
        color: #666;
        text-transform: uppercase;
      }

      .stat-value {
        font-size: ${fontSize * 1.8}pt;
        font-weight: bold;
        color: #1e3a8a;
        margin-top: 5pt;
      }

      .footer {
        position: fixed;
        bottom: 10mm;
        left: 0;
        right: 0;
        text-align: center;
        font-size: ${fontSize * 0.7}pt;
        color: #999;
      }

      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `;
  }

  /**
   * Generate cover page HTML
   */
  private static generateCoverPage(session: ConversationSession): string {
    return `
      <div class="cover-page">
        <h1>${escapeHtml(session.name)}</h1>
        <p>A conversation with ${escapeHtml(characterName(session.characterId))}</p>
        <p>Session Date: ${escapeHtml(new Date(sessionStart(session)).toLocaleDateString())}</p>
        <p>${escapeHtml(session.messageCount)} messages</p>
        ${session.glitchCount > 0 ? `<p>${escapeHtml(session.glitchCount)} glitches encountered</p>` : ''}
      </div>
    `;
  }

  /**
   * Generate character information section
   */
  private static generateCharacterInfo(session: ConversationSession): string {
    return `
      <div class="section">
        <h2>Character Information</h2>
        <p><strong>Character:</strong> ${escapeHtml(characterName(session.characterId))}</p>
        <p><strong>Theme:</strong> ${escapeHtml(session.themeId)}</p>
      </div>
    `;
  }

  /**
   * Generate statistics section
   */
  private static generateStatistics(session: ConversationSession): string {
    const duration = session.endedAt ? Math.floor((session.endedAt - sessionStart(session)) / 1000 / 60) : 0;

    return `
      <div class="section">
        <h2>Session Statistics</h2>
        <div class="statistics-grid">
          <div class="stat-box">
            <div class="stat-label">Total Messages</div>
            <div class="stat-value">${escapeHtml(session.messageCount)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Duration</div>
            <div class="stat-value">${escapeHtml(duration)} min</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Glitches</div>
            <div class="stat-value">${escapeHtml(session.glitchCount)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Session ID</div>
            <div class="stat-value" style="font-size: 10pt;">${escapeHtml(String(session.id).substring(0, 8))}...</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format messages for print
   */
  private static formatMessages(messages: Message[], characterId: string): string {
    const messagesHTML = messages
      .map((msg, index) => {
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
        const className = msg.author === 'user' ? 'user' : 'ai';

        return `
          <div class="message ${className}">
            <div class="message-header">
              ${escapeHtml(speaker(msg, characterId, 'You'))}
              ${timestamp ? ` · ${escapeHtml(timestamp)}` : ` · Message ${index + 1}`}
            </div>
            <div class="message-text">${escapeHtml(msg.text)}</div>
          </div>
        `;
      })
      .join('\n');

    return `
      <div class="section">
        <h2>Conversation</h2>
        ${messagesHTML}
      </div>
    `;
  }
}

/**
 * CSV Exporter
 */
export class CSVExporter {
  /**
   * Export messages to CSV
   */
  static exportMessages(sessions: ConversationSession[], options: CSVExportOptions): ExportResult {
    const rows: string[][] = [];

    // Headers
    if (options.includeHeaders) {
      rows.push(['Session Name', 'Character', 'Author', 'Message', 'Timestamp', 'Message Index']);
    }

    // Data
    sessions.forEach((session) => {
      session.messages.forEach((msg, index) => {
        const timestamp = this.formatDate(msg.timestamp || sessionStart(session), options.dateFormat);
        rows.push([session.name, session.characterId, msg.author, msg.text, timestamp, index.toString()]);
      });
    });

    const csv = this.toCSV(rows, options.delimiter);
    const filename = `messages_export_${Date.now()}.csv`;

    return {
      filename,
      content: csv,
      mimeType: 'text/csv',
    };
  }

  /**
   * Export statistics to CSV
   */
  static exportStatistics(sessions: ConversationSession[], options: CSVExportOptions): ExportResult {
    const rows: string[][] = [];

    // Headers
    if (options.includeHeaders) {
      rows.push([
        'Session Name',
        'Character',
        'Theme',
        'Start Time',
        'End Time',
        'Duration (min)',
        'Message Count',
        'Glitch Count',
      ]);
    }

    // Data
    sessions.forEach((session) => {
      const duration = session.endedAt ? Math.floor((session.endedAt - sessionStart(session)) / 1000 / 60) : 0;

      rows.push([
        session.name,
        session.characterId,
        session.themeId,
        this.formatDate(sessionStart(session), options.dateFormat),
        session.endedAt ? this.formatDate(session.endedAt, options.dateFormat) : 'In Progress',
        duration.toString(),
        session.messageCount.toString(),
        session.glitchCount.toString(),
      ]);
    });

    const csv = this.toCSV(rows, options.delimiter);
    const filename = `statistics_export_${Date.now()}.csv`;

    return {
      filename,
      content: csv,
      mimeType: 'text/csv',
    };
  }

  /**
   * Export word frequency to CSV
   */
  static exportWordFrequency(sessions: ConversationSession[], options: CSVExportOptions): ExportResult {
    const wordFrequency: Record<string, number> = {};

    // Calculate frequency
    sessions.forEach((session) => {
      session.messages.forEach((msg) => {
        if (msg.author === 'user') {
          const words = msg.text.toLowerCase().match(/\b\w+\b/g) || [];
          words.forEach((word) => {
            if (word.length > 3) {
              wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
          });
        }
      });
    });

    // Sort by frequency
    const sorted = Object.entries(wordFrequency).sort((a, b) => b[1] - a[1]);

    const rows: string[][] = [];

    if (options.includeHeaders) {
      rows.push(['Word', 'Frequency', 'Percentage']);
    }

    const total = sorted.reduce((sum, [, count]) => sum + count, 0);
    sorted.forEach(([word, count]) => {
      const percentage = ((count / total) * 100).toFixed(2);
      rows.push([word, count.toString(), percentage + '%']);
    });

    const csv = this.toCSV(rows, options.delimiter);
    const filename = `word_frequency_${Date.now()}.csv`;

    return {
      filename,
      content: csv,
      mimeType: 'text/csv',
    };
  }

  /**
   * Export character usage to CSV
   */
  static exportCharacterUsage(sessions: ConversationSession[], options: CSVExportOptions): ExportResult {
    const characterCounts: Record<string, number> = {};

    sessions.forEach((session) => {
      characterCounts[session.characterId] = (characterCounts[session.characterId] || 0) + 1;
    });

    const rows: string[][] = [];

    if (options.includeHeaders) {
      rows.push(['Character', 'Session Count', 'Percentage']);
    }

    const total = sessions.length;
    Object.entries(characterCounts).forEach(([character, count]) => {
      const percentage = ((count / total) * 100).toFixed(2);
      rows.push([character, count.toString(), percentage + '%']);
    });

    const csv = this.toCSV(rows, options.delimiter);
    const filename = `character_usage_${Date.now()}.csv`;

    return {
      filename,
      content: csv,
      mimeType: 'text/csv',
    };
  }

  /**
   * Convert 2D array to CSV string
   */
  private static toCSV(rows: string[][], delimiter: string): string {
    return rows
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains delimiter, quote, or newline
            const needsQuotes = cell.includes(delimiter) || cell.includes('"') || cell.includes('\n');
            if (needsQuotes) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(delimiter),
      )
      .join('\n');
  }

  /**
   * Format date based on option
   */
  private static formatDate(timestamp: number, format: 'iso' | 'locale' | 'timestamp'): string {
    const date = new Date(timestamp);
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'locale':
        return date.toLocaleString();
      case 'timestamp':
        return timestamp.toString();
      default:
        return date.toISOString();
    }
  }
}

/**
 * Theme Packager
 */
export class ThemePackager {
  /**
   * Package multiple themes into a single JSON file
   */
  static packageThemes(themes: CustomTheme[]): ExportResult {
    const package_data = {
      version: '1.6.0',
      exportDate: Date.now(),
      themeCount: themes.length,
      themes: themes,
    };

    const json = JSON.stringify(package_data, null, 2);
    const filename = `theme_package_${themes.length}_themes_${Date.now()}.json`;

    return {
      filename,
      content: json,
      mimeType: 'application/json',
    };
  }

  /**
   * Unpackage themes from JSON
   */
  static unpackageThemes(packageData: string): CustomTheme[] {
    try {
      const parsed = JSON.parse(packageData);
      if (!parsed.themes || !Array.isArray(parsed.themes)) {
        throw new Error('Invalid theme package format');
      }
      return parsed.themes;
    } catch (error) {
      console.error('Failed to unpackage themes:', error);
      return [];
    }
  }
}

/** Batch formats. 'pdf' is accepted for compatibility and means print-ready HTML. */
export type BatchFormat = 'html' | 'pdf' | 'csv' | 'json' | 'markdown';

/**
 * Batch Exporter
 */
export class BatchExporter {
  /**
   * Export multiple sessions in various formats
   */
  static async batchExport(
    sessions: ConversationSession[],
    format: BatchFormat,
    combined: boolean = false,
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    if (combined && format === 'csv') {
      results.push(
        CSVExporter.exportMessages(sessions, {
          delimiter: ',',
          includeHeaders: true,
          dateFormat: 'iso',
        }),
      );
    } else if (combined && format === 'json') {
      results.push({
        filename: `combined_export_${Date.now()}.json`,
        content: JSON.stringify(sessions, null, 2),
        mimeType: 'application/json',
      });
    } else {
      // HTML and Markdown are one file per session.
      for (const session of sessions) {
        results.push(await this.exportSingle(session, format));
      }
    }

    return results;
  }

  /**
   * Export a single session
   */
  private static async exportSingle(session: ConversationSession, format: BatchFormat): Promise<ExportResult> {
    switch (format) {
      case 'html':
      case 'pdf':
        return PDFExporter.exportToPDF(session, {
          includeCoverPage: true,
          includeStatistics: true,
          includeCharacterInfo: true,
          fontSize: 12,
          pageSize: 'A4',
          includeThemeStyling: false,
        });
      case 'csv':
        return CSVExporter.exportMessages([session], {
          delimiter: ',',
          includeHeaders: true,
          dateFormat: 'iso',
        });
      case 'json':
      case 'markdown': {
        const content = formatSession(session, { format, includeMetadata: true, includeTimestamps: true });
        return {
          filename: `${safeFileStem(session.name)}_${Date.now()}.${FORMAT_EXTENSIONS[format]}`,
          content,
          mimeType: FORMAT_MIME_TYPES[format],
        };
      }
      default:
        throw new Error(`Unsupported format: ${String(format)}`);
    }
  }
}

/**
 * How long a download's object URL stays valid. Revoking it synchronously
 * after click() cancels the download in Firefox and Safari.
 */
export const REVOKE_DELAY_MS = 60_000;

/** Downloads a string or Blob as a file. */
export function downloadBlob(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

/**
 * Utility function to download export results
 */
export function downloadExportResult(result: ExportResult): void {
  downloadBlob(result.content, result.filename, result.mimeType);
}

/** Longest a print iframe is kept if the browser never reports `afterprint`. */
const PRINT_FRAME_TTL_MS = 60_000;

/**
 * Opens the browser print dialog for an HTML document, from which the user
 * can choose "Save as PDF". A hidden same-origin iframe is used rather than
 * window.open, which popup blockers stop. The iframe is removed after
 * printing, or after a timeout.
 */
export function printHtml(html: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  iframe.title = 'Print preview';
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  });

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    iframe.remove();
  };

  iframe.addEventListener(
    'load',
    () => {
      const win = iframe.contentWindow;
      if (!win) {
        remove();
        return;
      }
      win.addEventListener?.('afterprint', () => setTimeout(remove, 0));
      win.focus?.();
      win.print();
    },
    { once: true },
  );

  iframe.setAttribute('srcdoc', html);
  document.body.appendChild(iframe);
  setTimeout(remove, PRINT_FRAME_TTL_MS);
  return iframe;
}
