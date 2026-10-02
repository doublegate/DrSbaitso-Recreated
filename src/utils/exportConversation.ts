/**
 * Conversation export: the original single-session API, kept as a thin
 * adapter over utils/advancedExport.ts, which holds the one implementation of
 * every format (and its HTML escaping and download handling).
 */

import type { ConversationSession, ExportFormat } from '../types';
import { formatSession, downloadBlob, FORMAT_MIME_TYPES } from './advancedExport';

export class ConversationExporter {
  static exportSession(session: ConversationSession, options: ExportFormat): string {
    return formatSession(session, options);
  }

  static download(content: string, filename: string, mimeType: string): void {
    downloadBlob(content, filename, mimeType);
  }

  static getFilename(session: ConversationSession, format: string): string {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const sessionName = session.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${sessionName}_${timestamp}.${format}`;
  }

  static getMimeType(format: string): string {
    return (FORMAT_MIME_TYPES as Record<string, string>)[format] ?? 'text/plain';
  }
}
