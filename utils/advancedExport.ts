/**
 * Advanced Export System (v1.6.0)
 *
 * Provides multiple export formats:
 * - PDF-style formatted HTML for printing
 * - CSV for analytics and spreadsheet import
 * - Theme packages for sharing collections
 * - Batch export for multiple sessions
 */

import type { ConversationSession, Message } from '../types';
import type { CustomTheme } from './themeValidator';

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
 * PDF Exporter (generates print-ready HTML)
 */
export class PDFExporter {
  /**
   * Export session to PDF-ready HTML
   */
  static async exportToPDF(
    session: ConversationSession,
    options: PDFExportOptions
  ): Promise<ExportResult> {
    const html = this.generatePDFHTML(session, options);

    return {
      filename: `${session.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.html`,
      content: html,
      mimeType: 'text/html'
    };
  }

  /**
   * Generate complete PDF-ready HTML document
   */
  private static generatePDFHTML(
    session: ConversationSession,
    options: PDFExportOptions
  ): string {
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
  <title>${this.escapeHTML(session.name)} - Dr. Sbaitso Conversation</title>
  <style>${styles}</style>
</head>
<body>
  ${coverPage}
  ${characterInfo}
  ${statistics}
  ${messages}
  <div class="footer">
    Generated with Dr. Sbaitso Recreated v1.6.0<br>
    Export Date: ${new Date().toLocaleString()}<br>
    Page: <span class="page-number"></span>
  </div>
</body>
</html>`;
  }

  /**
   * Generate PDF print styles
   */
  private static getPDFStyles(options: PDFExportOptions): string {
    const fontSize = options.fontSize;
    const pageSize = options.pageSize;
    const pageWidth = pageSize === 'A4' ? '210mm' : '8.5in';
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
        <h1>${this.escapeHTML(session.name)}</h1>
        <p>A conversation with ${this.escapeHTML(session.characterId)}</p>
        <p>Session Date: ${new Date(session.startedAt).toLocaleDateString()}</p>
        <p>${session.messageCount} messages</p>
        ${session.glitchCount > 0 ? `<p>${session.glitchCount} glitches encountered</p>` : ''}
      </div>
    `;
  }

  /**
   * Generate character information section
   */
  private static generateCharacterInfo(session: ConversationSession): string {
    const characterNames: Record<string, string> = {
      sbaitso: 'Dr. Sbaitso (1991)',
      eliza: 'ELIZA (1966)',
      hal9000: 'HAL 9000 (2001)',
      joshua: 'JOSHUA (1983)',
      parry: 'PARRY (1972)'
    };

    return `
      <div class="section">
        <h2>Character Information</h2>
        <p><strong>Character:</strong> ${this.escapeHTML(characterNames[session.characterId] || session.characterId)}</p>
        <p><strong>Theme:</strong> ${this.escapeHTML(session.themeId)}</p>
      </div>
    `;
  }

  /**
   * Generate statistics section
   */
  private static generateStatistics(session: ConversationSession): string {
    const duration = session.endedAt
      ? Math.floor((session.endedAt - session.startedAt) / 1000 / 60)
      : 0;

    return `
      <div class="section">
        <h2>Session Statistics</h2>
        <div class="statistics-grid">
          <div class="stat-box">
            <div class="stat-label">Total Messages</div>
            <div class="stat-value">${session.messageCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Duration</div>
            <div class="stat-value">${duration} min</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Glitches</div>
            <div class="stat-value">${session.glitchCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Session ID</div>
            <div class="stat-value" style="font-size: 10pt;">${session.id.substring(0, 8)}...</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format messages for PDF
   */
  private static formatMessages(messages: Message[], characterId: string): string {
    const messagesHTML = messages
      .map((msg, index) => {
        const timestamp = msg.timestamp
          ? new Date(msg.timestamp).toLocaleTimeString()
          : '';
        const author = msg.author === 'user' ? 'User' : characterId.toUpperCase();
        const className = msg.author === 'user' ? 'user' : 'ai';

        return `
          <div class="message ${className}">
            <div class="message-header">
              ${this.escapeHTML(author)}
              ${timestamp ? ` · ${timestamp}` : ` · Message ${index + 1}`}
            </div>
            <div class="message-text">${this.escapeHTML(msg.text)}</div>
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

  /**
   * Escape HTML special characters
   */
  private static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * CSV Exporter
 */
export class CSVExporter {
  /**
   * Export messages to CSV
   */
  static exportMessages(
    sessions: ConversationSession[],
    options: CSVExportOptions
  ): ExportResult {
    const rows: string[][] = [];

    // Headers
    if (options.includeHeaders) {
      rows.push(['Session Name', 'Character', 'Author', 'Message', 'Timestamp', 'Message Index']);
    }

    // Data
    sessions.forEach(session => {
      session.messages.forEach((msg, index) => {
        const timestamp = this.formatDate(msg.timestamp || session.startedAt, options.dateFormat);
        rows.push([
          session.name,
          session.characterId,
          msg.author,
          msg.text,
          timestamp,
          index.toString()
        ]);
      });
    });

    const csv = this.toCSV(rows, options.delimiter);
    const filename = `messages_export_${Date.now()}.csv`;

    return {
      filename,
      content: csv,
      mimeType: 'text/csv'
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
        'Glitch Count'
      ]);
    }

    // Data
    sessions.forEach(session => {
      const duration = session.endedAt
        ? Math.floor((session.endedAt - session.startedAt) / 1000 / 60)
        : 0;

      rows.push([
        session.name,
        session.characterId,
        session.themeId,
        this.formatDate(session.startedAt, options.dateFormat),
        session.endedAt ? this.formatDate(session.endedAt, options.dateFormat) : 'In Progress',
        duration.toString(),
        session.messageCount.toString(),
        session.glitchCount.toString()
      ]);
    });

    const csv = this.toCSV(rows, options.delimiter);
    const filename = `statistics_export_${Date.now()}.csv`;

    return {
      filename,
      content: csv,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export word frequency to CSV
   */
  static exportWordFrequency(sessions: ConversationSession[], options: CSVExportOptions): ExportResult {
    const wordFrequency: Record<string, number> = {};

    // Calculate frequency
    sessions.forEach(session => {
      session.messages.forEach(msg => {
        if (msg.author === 'user') {
          const words = msg.text.toLowerCase().match(/\b\w+\b/g) || [];
          words.forEach(word => {
            if (word.length > 3) {
              wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
          });
        }
      });
    });

    // Sort by frequency
    const sorted = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1]);

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
      mimeType: 'text/csv'
    };
  }

  /**
   * Export character usage to CSV
   */
  static exportCharacterUsage(sessions: ConversationSession[], options: CSVExportOptions): ExportResult {
    const characterCounts: Record<string, number> = {};

    sessions.forEach(session => {
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
      mimeType: 'text/csv'
    };
  }

  /**
   * Convert 2D array to CSV string
   */
  private static toCSV(rows: string[][], delimiter: string): string {
    return rows
      .map(row =>
        row
          .map(cell => {
            // Escape quotes and wrap in quotes if contains delimiter, quote, or newline
            const needsQuotes = cell.includes(delimiter) || cell.includes('"') || cell.includes('\n');
            if (needsQuotes) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(delimiter)
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
      themes: themes
    };

    const json = JSON.stringify(package_data, null, 2);
    const filename = `theme_package_${themes.length}_themes_${Date.now()}.json`;

    return {
      filename,
      content: json,
      mimeType: 'application/json'
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

/**
 * Batch Exporter
 */
export class BatchExporter {
  /**
   * Export multiple sessions in various formats
   */
  static async batchExport(
    sessions: ConversationSession[],
    format: 'pdf' | 'csv' | 'json' | 'markdown',
    combined: boolean = false
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    if (combined) {
      // Combine all sessions into one file
      switch (format) {
        case 'csv':
          results.push(CSVExporter.exportMessages(sessions, {
            delimiter: ',',
            includeHeaders: true,
            dateFormat: 'iso'
          }));
          break;
        case 'json':
          results.push({
            filename: `combined_export_${Date.now()}.json`,
            content: JSON.stringify(sessions, null, 2),
            mimeType: 'application/json'
          });
          break;
        default:
          // PDF and Markdown don't support combined well, export separately
          for (const session of sessions) {
            const result = await this.exportSingle(session, format);
            results.push(result);
          }
      }
    } else {
      // Export each session separately
      for (const session of sessions) {
        const result = await this.exportSingle(session, format);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Export a single session
   */
  private static async exportSingle(
    session: ConversationSession,
    format: 'pdf' | 'csv' | 'json' | 'markdown'
  ): Promise<ExportResult> {
    switch (format) {
      case 'pdf':
        return PDFExporter.exportToPDF(session, {
          includeCoverPage: true,
          includeStatistics: true,
          includeCharacterInfo: true,
          fontSize: 12,
          pageSize: 'A4',
          includeThemeStyling: false
        });
      case 'csv':
        return CSVExporter.exportMessages([session], {
          delimiter: ',',
          includeHeaders: true,
          dateFormat: 'iso'
        });
      case 'json':
        return {
          filename: `${session.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`,
          content: JSON.stringify(session, null, 2),
          mimeType: 'application/json'
        };
      case 'markdown':
        return {
          filename: `${session.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`,
          content: this.toMarkdown(session),
          mimeType: 'text/markdown'
        };
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert session to Markdown
   */
  private static toMarkdown(session: ConversationSession): string {
    let md = `# ${session.name}\n\n`;
    md += `**Character:** ${session.characterId}\n`;
    md += `**Theme:** ${session.themeId}\n`;
    md += `**Started:** ${new Date(session.startedAt).toLocaleString()}\n`;
    if (session.endedAt) {
      md += `**Ended:** ${new Date(session.endedAt).toLocaleString()}\n`;
    }
    md += `**Messages:** ${session.messageCount}\n`;
    md += `**Glitches:** ${session.glitchCount}\n\n`;
    md += `---\n\n`;

    session.messages.forEach((msg, index) => {
      const author = msg.author === 'user' ? 'User' : session.characterId.toUpperCase();
      md += `### ${author} (Message ${index + 1})\n\n`;
      md += `${msg.text}\n\n`;
    });

    return md;
  }
}

/**
 * Utility function to download export results
 */
export function downloadExportResult(result: ExportResult): void {
  const blob = result.content instanceof Blob
    ? result.content
    : new Blob([result.content], { type: result.mimeType });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  a.click();
  URL.revokeObjectURL(url);
}
