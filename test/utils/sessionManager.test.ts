/**
 * Session Manager Test Suite
 * Tests for session persistence, statistics, and settings management
 *
 * @version 1.7.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '@/utils/sessionManager';
import type { Message, ConversationSession } from '@/types';

describe('SessionManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createSession', () => {
    it('should create new session with valid metadata', () => {
      const session = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.characterId).toBe('sbaitso');
      expect(session.themeId).toBe('dosBlue');
      expect(session.audioQualityId).toBe('authentic8Bit');
      expect(session.messages).toEqual([]);
      expect(session.messageCount).toBe(0);
      expect(session.glitchCount).toBe(0);
    });

    it('should generate unique session IDs', () => {
      const session1 = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      const session2 = SessionManager.createSession('eliza', 'phosphorGreen', 'modern');

      expect(session1.id).not.toBe(session2.id);
    });

    it('should set created and updated timestamps', () => {
      const before = Date.now();
      const session = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      const after = Date.now();

      expect(session.createdAt).toBeGreaterThanOrEqual(before);
      expect(session.createdAt).toBeLessThanOrEqual(after);
      expect(session.updatedAt).toBe(session.createdAt);
    });
  });

  describe('saveSession', () => {
    it('should save session to localStorage', () => {
      const session = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      session.name = 'Test Session';

      SessionManager.saveSession(session);

      const allSessions = JSON.parse(localStorage.getItem('sbaitso_sessions') || '[]');
      const saved = allSessions.find((s: any) => s.id === session.id);
      expect(saved).toBeTruthy();
      expect(saved).toMatchObject({
        id: session.id,
        name: 'Test Session',
      });

      // Should also save as current session
      const currentSession = JSON.parse(localStorage.getItem('sbaitso_current_session')!);
      expect(currentSession.id).toBe(session.id);
    });

    it('should update existing session', () => {
      const session = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      SessionManager.saveSession(session);

      session.messages.push({
        author: 'user',
        text: 'Hello',
      });
      session.messageCount = 1;

      SessionManager.saveSession(session);

      const allSessions = JSON.parse(localStorage.getItem('sbaitso_sessions') || '[]');
      const saved = allSessions.find((s: any) => s.id === session.id);
      expect(saved.messageCount).toBe(1);
      expect(saved.messages.length).toBe(1);
    });

    it('should update updatedAt timestamp on save', async () => {
      const session = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      const originalUpdatedAt = session.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      session.updatedAt = Date.now(); // Update timestamp
      SessionManager.saveSession(session);

      const allSessions = JSON.parse(localStorage.getItem('sbaitso_sessions') || '[]');
      const saved = allSessions.find((s: any) => s.id === session.id);
      expect(saved.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('getCurrentSession', () => {
    it('should return null when no current session exists', () => {
      const session = SessionManager.getCurrentSession();
      expect(session).toBeNull();
    });

    it('should return saved current session', () => {
      const session = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      localStorage.setItem('sbaitso_current_session', JSON.stringify(session));

      const retrieved = SessionManager.getCurrentSession();
      expect(retrieved).toMatchObject({
        id: session.id,
        characterId: 'sbaitso',
      });
    });

    it('should handle corrupted session data', () => {
      localStorage.setItem('sbaitso_current_session', 'invalid json');
      const session = SessionManager.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('getAllSessions', () => {
    it('should return empty array when no sessions exist', () => {
      const sessions = SessionManager.getAllSessions();
      expect(sessions).toEqual([]);
    });

    it('should return all saved sessions', () => {
      const session1 = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      const session2 = SessionManager.createSession('eliza', 'phosphorGreen', 'modern');

      SessionManager.saveSession(session1);
      SessionManager.saveSession(session2);

      const sessions = SessionManager.getAllSessions();
      expect(sessions.length).toBe(2);
      expect(sessions.some((s) => s.id === session1.id)).toBe(true);
      expect(sessions.some((s) => s.id === session2.id)).toBe(true);
    });

    it('should sort sessions by updatedAt descending', () => {
      const session1 = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      session1.updatedAt = 1000;
      const session2 = SessionManager.createSession('eliza', 'phosphorGreen', 'modern');
      session2.updatedAt = 2000;

      SessionManager.saveSession(session1);
      SessionManager.saveSession(session2);

      const sessions = SessionManager.getAllSessions();
      expect(sessions[0].updatedAt).toBeGreaterThan(sessions[1].updatedAt);
    });
  });

  describe('deleteSession', () => {
    it('should delete specified session', () => {
      const session = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      SessionManager.saveSession(session);

      SessionManager.deleteSession(session.id);

      const allSessions = SessionManager.getAllSessions();
      const found = allSessions.find((s) => s.id === session.id);
      expect(found).toBeUndefined();
    });

    it('should not throw error when deleting non-existent session', () => {
      expect(() => {
        SessionManager.deleteSession('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('clearAllSessions', () => {
    it('should clear all sessions and current session', () => {
      const session1 = SessionManager.createSession('sbaitso', 'dosBlue', 'authentic8Bit');
      const session2 = SessionManager.createSession('eliza', 'phosphorGreen', 'modern');

      SessionManager.saveSession(session1);
      SessionManager.saveSession(session2);
      localStorage.setItem('sbaitso_current_session', JSON.stringify(session1));

      SessionManager.clearAllSessions();

      expect(SessionManager.getAllSessions()).toEqual([]);
      expect(SessionManager.getCurrentSession()).toBeNull();
    });
  });

  describe('Settings Management', () => {
    it('should return default settings when none saved', () => {
      const settings = SessionManager.getSettings();

      expect(settings).toMatchObject({
        characterId: 'sbaitso',
        themeId: 'dos-blue',
        audioQualityId: 'default',
        soundEnabled: true,
        autoScroll: true,
      });
    });

    it('should save and retrieve settings', () => {
      const newSettings = {
        characterId: 'hal',
        themeId: 'matrixGreen',
        audioQualityId: 'modern',
        audioMode: 'modern' as const,
        soundEnabled: false,
        autoScroll: false,
        showTimestamps: true,
        compactMode: false,
      };

      SessionManager.saveSettings(newSettings);
      const retrieved = SessionManager.getSettings();

      expect(retrieved).toMatchObject(newSettings);
    });

    it('should merge partial settings updates', () => {
      SessionManager.saveSettings({
        characterId: 'sbaitso',
        themeId: 'dosBlue',
        audioQualityId: 'authentic8Bit',
        audioMode: 'authentic',
        soundEnabled: true,
        autoScroll: true,
        showTimestamps: false,
        compactMode: false,
      });

      SessionManager.saveSettings({
        soundEnabled: false,
      } as any);

      const settings = SessionManager.getSettings();
      expect(settings.soundEnabled).toBe(false);
      expect(settings.characterId).toBe('sbaitso'); // Unchanged
    });
  });

  describe('Statistics Management', () => {
    it('should return default stats when none saved', () => {
      const stats = SessionManager.getStats();

      expect(stats).toMatchObject({
        totalSessions: 0,
        totalMessages: 0,
        totalGlitches: 0,
        averageMessagesPerSession: 0,
        totalConversationTime: 0,
      });
    });

    it('should update statistics correctly', () => {
      const session: ConversationSession = {
        id: '123',
        name: 'Test',
        characterId: 'sbaitso',
        themeId: 'dosBlue',
        audioQualityId: 'authentic8Bit',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 10,
        glitchCount: 2,
      };

      SessionManager.updateStats(session);
      const stats = SessionManager.getStats();

      expect(stats.totalSessions).toBe(1);
      expect(stats.totalMessages).toBe(10);
      expect(stats.totalGlitches).toBe(2);
    });

    it('should track character usage', () => {
      const session1: ConversationSession = {
        id: '1',
        name: 'Test1',
        characterId: 'sbaitso',
        themeId: 'dosBlue',
        audioQualityId: 'authentic8Bit',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 5,
        glitchCount: 0,
      };

      const session2: ConversationSession = {
        id: '2',
        name: 'Test2',
        characterId: 'sbaitso',
        themeId: 'dosBlue',
        audioQualityId: 'authentic8Bit',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 3,
        glitchCount: 0,
      };

      SessionManager.updateStats(session1);
      SessionManager.updateStats(session2);

      const stats = SessionManager.getStats();
      expect(stats.charactersUsed['sbaitso']).toBe(2);
    });

    it('should calculate average messages per session', () => {
      const session1: ConversationSession = {
        id: '1',
        name: 'Test1',
        characterId: 'sbaitso',
        themeId: 'dosBlue',
        audioQualityId: 'authentic8Bit',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 10,
        glitchCount: 0,
      };

      const session2: ConversationSession = {
        id: '2',
        name: 'Test2',
        characterId: 'eliza',
        themeId: 'phosphorGreen',
        audioQualityId: 'modern',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 20,
        glitchCount: 0,
      };

      SessionManager.updateStats(session1);
      SessionManager.updateStats(session2);

      const stats = SessionManager.getStats();
      expect(stats.averageMessagesPerSession).toBe(15); // (10 + 20) / 2
    });

    it('should reset all statistics', () => {
      const session: ConversationSession = {
        id: '1',
        name: 'Test',
        characterId: 'sbaitso',
        themeId: 'dosBlue',
        audioQualityId: 'authentic8Bit',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 10,
        glitchCount: 2,
      };

      SessionManager.updateStats(session);
      SessionManager.resetStats();

      const stats = SessionManager.getStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.totalGlitches).toBe(0);
    });
  });
});
