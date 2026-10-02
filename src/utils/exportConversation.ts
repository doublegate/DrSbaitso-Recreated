import { ConversationSession, ExportFormat } from '../types';
import { CHARACTERS } from '../constants';

export class ConversationExporter {
  static exportSession(session: ConversationSession, options: ExportFormat): string {
    switch (options.format) {
      case 'markdown':
        return this.toMarkdown(session, options);
      case 'text':
        return this.toText(session, options);
      case 'json':
        return this.toJSON(session, options);
      case 'html':
        return this.toHTML(session, options);
      default:
        return this.toText(session, options);
    }
  }

  static download(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static toMarkdown(session: ConversationSession, options: ExportFormat): string {
    const character = CHARACTERS.find(c => c.id === session.characterId);
    let output = '';

    if (options.includeMetadata) {
      output += `# ${session.name}\n\n`;
      output += `**Character:** ${character?.name || 'Unknown'}\n\n`;
      output += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n\n`;
      output += `**Messages:** ${session.messageCount}\n\n`;
      output += `**Glitches:** ${session.glitchCount}\n\n`;
      output += `---\n\n`;
    }

    session.messages.forEach(msg => {
      const author = msg.author === 'user' ? 'You' : (character?.name || 'AI');
      const timestamp = options.includeTimestamps && msg.timestamp
        ? ` *(${new Date(msg.timestamp).toLocaleTimeString()})*`
        : '';

      output += `**${author}${timestamp}:**\n\n`;
      output += `> ${msg.text}\n\n`;
    });

    return output;
  }

  private static toText(session: ConversationSession, options: ExportFormat): string {
    const character = CHARACTERS.find(c => c.id === session.characterId);
    let output = '';

    if (options.includeMetadata) {
      output += `${session.name}\n`;
      output += `${'='.repeat(session.name.length)}\n\n`;
      output += `Character: ${character?.name || 'Unknown'}\n`;
      output += `Created: ${new Date(session.createdAt).toLocaleString()}\n`;
      output += `Messages: ${session.messageCount}\n`;
      output += `Glitches: ${session.glitchCount}\n\n`;
      output += `${'-'.repeat(60)}\n\n`;
    }

    session.messages.forEach((msg, index) => {
      const author = msg.author === 'user' ? 'YOU' : (character?.name.toUpperCase() || 'AI');
      const timestamp = options.includeTimestamps && msg.timestamp
        ? ` [${new Date(msg.timestamp).toLocaleTimeString()}]`
        : '';

      output += `${author}${timestamp}:\n${msg.text}\n\n`;
    });

    return output;
  }

  private static toJSON(session: ConversationSession, options: ExportFormat): string {
    if (!options.includeMetadata) {
      return JSON.stringify(session.messages, null, 2);
    }

    return JSON.stringify(session, null, 2);
  }

  private static toHTML(session: ConversationSession, options: ExportFormat): string {
    const character = CHARACTERS.find(c => c.id === session.characterId);

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${session.name}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #1e3a8a;
      color: #ffffff;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      border-bottom: 2px solid #60a5fa;
      padding-bottom: 10px;
    }
    .metadata {
      background: rgba(0,0,0,0.3);
      padding: 15px;
      margin: 20px 0;
      border-left: 4px solid #fbbf24;
    }
    .message {
      margin: 20px 0;
      padding: 15px;
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
    }
    .user {
      border-left: 4px solid #fbbf24;
    }
    .ai {
      border-left: 4px solid #60a5fa;
    }
    .author {
      font-weight: bold;
      color: #fbbf24;
      margin-bottom: 5px;
    }
    .timestamp {
      font-size: 0.8em;
      color: #9ca3af;
    }
    .text {
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <h1>${session.name}</h1>
`;

    if (options.includeMetadata) {
      html += `
  <div class="metadata">
    <strong>Character:</strong> ${character?.name || 'Unknown'}<br>
    <strong>Created:</strong> ${new Date(session.createdAt).toLocaleString()}<br>
    <strong>Messages:</strong> ${session.messageCount}<br>
    <strong>Glitches:</strong> ${session.glitchCount}
  </div>
`;
    }

    session.messages.forEach(msg => {
      const author = msg.author === 'user' ? 'You' : (character?.name || 'AI');
      const timestamp = options.includeTimestamps && msg.timestamp
        ? `<span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`
        : '';
      const cssClass = msg.author === 'user' ? 'user' : 'ai';

      html += `
  <div class="message ${cssClass}">
    <div class="author">${author} ${timestamp}</div>
    <div class="text">${this.escapeHtml(msg.text)}</div>
  </div>
`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static getFilename(session: ConversationSession, format: string): string {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const sessionName = session.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${sessionName}_${timestamp}.${format}`;
  }

  static getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'markdown': 'text/markdown',
      'text': 'text/plain',
      'json': 'application/json',
      'html': 'text/html'
    };
    return mimeTypes[format] || 'text/plain';
  }
}
