import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationExporter } from '@/utils/exportConversation';
import { ConversationSession } from '@/types';

const mockSession: ConversationSession = {
  id: 'test-session-123',
  name: 'Test Session',
  characterId: 'sbaitso',
  messages: [
    { author: 'user', text: 'Hello Doctor', timestamp: 1699999999000, characterId: 'sbaitso' },
    { author: 'dr', text: 'HELLO. I AM DR. SBAITSO.', timestamp: 1700000001000, characterId: 'sbaitso' },
    { author: 'user', text: 'How are you?', timestamp: 1700000005000, characterId: 'sbaitso' },
    { author: 'dr', text: 'I AM FUNCTIONING NORMALLY.', timestamp: 1700000007000, characterId: 'sbaitso' }
  ],
  createdAt: 1699999990000,
  updatedAt: 1700000010000,
  messageCount: 4,
  glitchCount: 0,
  themeId: 'dos-blue',
  audioQualityId: 'authentic'
};

describe('ConversationExporter', () => {
  describe('exportSession - Markdown Format', () => {
    it('should export to markdown format with metadata', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'markdown',
        includeMetadata: true,
        includeTimestamps: false
      });

      expect(result).toContain('# Test Session');
      expect(result).toContain('**Character:** Dr. Sbaitso');
      expect(result).toContain('**Messages:** 4');
      expect(result).toContain('**You:**');
      expect(result).toContain('> Hello Doctor');
      expect(result).toContain('**Dr. Sbaitso:**');
      expect(result).toContain('> HELLO. I AM DR. SBAITSO.');
    });

    it('should export to markdown without metadata', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'markdown',
        includeMetadata: false,
        includeTimestamps: false
      });

      expect(result).not.toContain('**Character:**');
      expect(result).toContain('**You:**');
      expect(result).toContain('> Hello Doctor');
    });

    it('should include timestamps in markdown when requested', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'markdown',
        includeMetadata: false,
        includeTimestamps: true
      });

      // Should contain time information in some format
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('exportSession - Text Format', () => {
    it('should export to plain text format', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'text',
        includeMetadata: true,
        includeTimestamps: false
      });

      expect(result).toContain('Test Session');
      expect(result).toContain('Character: Dr. Sbaitso');
      expect(result).toContain('YOU:');
      expect(result).toContain('Hello Doctor');
      expect(result).toContain('DR. SBAITSO:');
      expect(result).toContain('I AM FUNCTIONING NORMALLY.');
    });

    it('should use proper separators in text format', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'text',
        includeMetadata: true,
        includeTimestamps: false
      });

      // Should contain separators
      expect(result).toMatch(/={3,}/); // Title underline
      expect(result).toMatch(/-{3,}/); // Section separator
    });
  });

  describe('exportSession - JSON Format', () => {
    it('should export to JSON with full session object', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'json',
        includeMetadata: true,
        includeTimestamps: false
      });

      const parsed = JSON.parse(result);
      expect(parsed.id).toBe('test-session-123');
      expect(parsed.name).toBe('Test Session');
      expect(parsed.characterId).toBe('sbaitso');
      expect(parsed.messages).toHaveLength(4);
      expect(parsed.messageCount).toBe(4);
    });

    it('should export to JSON with messages only', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'json',
        includeMetadata: false,
        includeTimestamps: false
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(4);
      expect(parsed[0].author).toBe('user');
      expect(parsed[0].text).toBe('Hello Doctor');
    });

    it('should produce valid parseable JSON', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'json',
        includeMetadata: true,
        includeTimestamps: true
      });

      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('exportSession - HTML Format', () => {
    it('should export to standalone HTML document', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'html',
        includeMetadata: true,
        includeTimestamps: false
      });

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html');
      expect(result).toContain('<head>');
      expect(result).toContain('<title>Test Session</title>');
      expect(result).toContain('<body>');
      expect(result).toContain('Hello Doctor');
      expect(result).toContain('I AM FUNCTIONING NORMALLY.');
      expect(result).toContain('</html>');
    });

    it('should include embedded CSS styles', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'html',
        includeMetadata: true,
        includeTimestamps: false
      });

      expect(result).toContain('<style>');
      expect(result).toContain('</style>');
      // Should have some CSS rules
      expect(result).toMatch(/background|color|font/);
    });

    it('should properly escape HTML in text content', () => {
      const sessionWithHtml: ConversationSession = {
        ...mockSession,
        messages: [
          { author: 'user', text: '<b>Bold text</b>', timestamp: Date.now(), characterId: 'sbaitso' },
          { author: 'dr', text: 'Text with & ampersand', timestamp: Date.now(), characterId: 'sbaitso' }
        ],
        messageCount: 2
      };

      const result = ConversationExporter.exportSession(sessionWithHtml, {
        format: 'html',
        includeMetadata: false,
        includeTimestamps: false
      });

      // escapeHtml uses textContent which escapes HTML entities
      expect(result).toContain('<div class="text">');
      // The text should be escaped
      expect(result.includes('&lt;b&gt;') || result.includes('&amp;')).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should generate correct filename with session name and timestamp', () => {
      const filename = ConversationExporter.getFilename(mockSession, 'md');
      expect(filename).toContain('test_session');
      expect(filename).toContain('.md');
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format
    });

    it('should generate correct filename for text', () => {
      const filename = ConversationExporter.getFilename(mockSession, 'txt');
      expect(filename).toContain('test_session');
      expect(filename).toContain('.txt');
    });

    it('should generate correct filename for JSON', () => {
      const filename = ConversationExporter.getFilename(mockSession, 'json');
      expect(filename).toContain('test_session');
      expect(filename).toContain('.json');
    });

    it('should generate correct filename for HTML', () => {
      const filename = ConversationExporter.getFilename(mockSession, 'html');
      expect(filename).toContain('test_session');
      expect(filename).toContain('.html');
    });

    it('should sanitize session name in filename', () => {
      const specialSession = { ...mockSession, name: 'Test & Session!' };
      const filename = ConversationExporter.getFilename(specialSession, 'md');
      // Should replace special characters with underscores
      expect(filename).toContain('test___session_');
    });

    it('should return correct MIME type for markdown', () => {
      const mimeType = ConversationExporter.getMimeType('markdown');
      expect(mimeType).toBe('text/markdown');
    });

    it('should return correct MIME type for text', () => {
      const mimeType = ConversationExporter.getMimeType('text');
      expect(mimeType).toBe('text/plain');
    });

    it('should return correct MIME type for JSON', () => {
      const mimeType = ConversationExporter.getMimeType('json');
      expect(mimeType).toBe('application/json');
    });

    it('should return correct MIME type for HTML', () => {
      const mimeType = ConversationExporter.getMimeType('html');
      expect(mimeType).toBe('text/html');
    });
  });

  describe('download', () => {
    beforeEach(() => {
      // Reset any previous mocks
      vi.restoreAllMocks();
    });

    it('should create and trigger download', () => {
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn()
      } as unknown as HTMLAnchorElement;

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);

      ConversationExporter.download('test content', 'test-file.txt', 'text/plain');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe('test-file.txt');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty session', () => {
      const emptySession: ConversationSession = {
        ...mockSession,
        messages: [],
        messageCount: 0
      };

      const result = ConversationExporter.exportSession(emptySession, {
        format: 'markdown',
        includeMetadata: true,
        includeTimestamps: false
      });

      expect(result).toContain('Test Session');
      expect(result).toContain('**Messages:** 0');
    });

    it('should handle very long messages', () => {
      const longText = 'A'.repeat(10000);
      const longSession: ConversationSession = {
        ...mockSession,
        messages: [
          { author: 'user', text: longText, timestamp: Date.now(), characterId: 'sbaitso' }
        ],
        messageCount: 1
      };

      const result = ConversationExporter.exportSession(longSession, {
        format: 'text',
        includeMetadata: false,
        includeTimestamps: false
      });

      expect(result).toContain(longText);
      expect(result.length).toBeGreaterThan(10000);
    });

    it('should default to text format for unknown format', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'unknown' as any,
        includeMetadata: false,
        includeTimestamps: false
      });

      // Should fall back to text format
      expect(result).toContain('YOU:');
    });
  });
});
