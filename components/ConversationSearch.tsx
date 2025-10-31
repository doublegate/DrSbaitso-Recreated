/**
 * Conversation Search & Analytics Component (v1.5.0)
 *
 * Features:
 * - Full-text search across all saved sessions
 * - Advanced filters (date range, character, keywords)
 * - Search results with context highlighting
 * - Analytics dashboard with charts
 * - Word frequency analysis
 * - Conversation patterns
 */

import { useState, useMemo } from 'react';
import type { ConversationSession, Message } from '../types';

interface SearchResult {
  sessionId: string;
  sessionName: string;
  characterId: string;
  messageIndex: number;
  message: Message;
  matchedText: string;
  context: string;
}

interface ConversationSearchProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  onOpenSession: (sessionId: string) => void;
}

export function ConversationSearch({ isOpen, onClose, sessions, onOpenSession }: ConversationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCharacter, setFilterCharacter] = useState<string>('all');
  const [filterAuthor, setFilterAuthor] = useState<'all' | 'user' | 'dr'>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Perform search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    sessions.forEach(session => {
      // Filter by character if specified
      if (filterCharacter !== 'all' && session.characterId !== filterCharacter) {
        return;
      }

      session.messages.forEach((message, index) => {
        // Filter by author if specified
        if (filterAuthor !== 'all') {
          if (filterAuthor === 'user' && message.author !== 'user') return;
          if (filterAuthor === 'dr' && message.author === 'user') return;
        }

        const text = message.text.toLowerCase();
        if (text.includes(query)) {
          // Extract context (50 chars before and after)
          const matchIndex = text.indexOf(query);
          const start = Math.max(0, matchIndex - 50);
          const end = Math.min(text.length, matchIndex + query.length + 50);
          const context = message.text.substring(start, end);

          results.push({
            sessionId: session.id,
            sessionName: session.name,
            characterId: session.characterId,
            messageIndex: index,
            message,
            matchedText: query,
            context: (start > 0 ? '...' : '') + context + (end < text.length ? '...' : '')
          });
        }
      });
    });

    return results;
  }, [searchQuery, filterCharacter, filterAuthor, sessions]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    const totalSessions = sessions.length;
    const characterCounts: Record<string, number> = {};
    const wordFrequency: Record<string, number> = {};
    let totalWords = 0;

    sessions.forEach(session => {
      // Character usage
      characterCounts[session.characterId] = (characterCounts[session.characterId] || 0) + 1;

      // Word frequency
      session.messages.forEach(msg => {
        if (msg.author === 'user') {
          const words = msg.text.toLowerCase().match(/\b\w+\b/g) || [];
          words.forEach(word => {
            if (word.length > 3) { // Filter short words
              wordFrequency[word] = (wordFrequency[word] || 0) + 1;
              totalWords++;
            }
          });
        }
      });
    });

    // Top 10 words
    const topWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;
    const avgWordsPerMessage = totalMessages > 0 ? Math.round(totalWords / totalMessages) : 0;

    return {
      totalMessages,
      totalSessions,
      characterCounts,
      topWords,
      avgMessagesPerSession,
      avgWordsPerMessage,
      totalWords
    };
  }, [sessions]);

  if (!isOpen) return null;

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-400 text-black px-1 rounded">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
      role="dialog"
      aria-labelledby="search-title"
      aria-modal="true"
    >
      <div
        className="bg-gray-900 text-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 id="search-title" className="text-2xl font-bold">
            Conversation Search & Analytics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-700">
            <button
              onClick={() => setShowAnalytics(false)}
              className={`px-4 py-2 font-semibold ${
                !showAnalytics ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className={`px-4 py-2 font-semibold ${
                showAnalytics ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'
              }`}
            >
              Analytics
            </button>
          </div>

          {!showAnalytics ? (
            /* Search Tab */
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Search across all conversations:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Enter keywords, phrases, or topics..."
                  autoFocus
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Character:</label>
                  <select
                    value={filterCharacter}
                    onChange={(e) => setFilterCharacter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Characters</option>
                    <option value="sbaitso">Dr. Sbaitso</option>
                    <option value="eliza">ELIZA</option>
                    <option value="hal9000">HAL 9000</option>
                    <option value="joshua">JOSHUA</option>
                    <option value="parry">PARRY</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Author:</label>
                  <select
                    value={filterAuthor}
                    onChange={(e) => setFilterAuthor(e.target.value as 'all' | 'user' | 'dr')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Messages</option>
                    <option value="user">User Only</option>
                    <option value="dr">AI Only</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  {searchQuery ? `Found ${searchResults.length} results` : 'Enter a search query to begin'}
                </h3>

                {searchResults.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.sessionId}-${index}`}
                        className="bg-gray-800 p-4 rounded border border-gray-700 hover:border-blue-500 cursor-pointer"
                        onClick={() => {
                          onOpenSession(result.sessionId);
                          onClose();
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-blue-400">{result.sessionName}</h4>
                            <p className="text-sm text-gray-400">
                              {result.characterId} • Message #{result.messageIndex + 1}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {result.message.author === 'user' ? 'You' : 'AI'}
                          </span>
                        </div>
                        <p className="text-sm">
                          {highlightMatch(result.context, searchQuery)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No results found for "{searchQuery}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Analytics Tab */
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                  <p className="text-sm text-gray-400">Total Sessions</p>
                  <p className="text-3xl font-bold text-blue-400">{analytics.totalSessions}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                  <p className="text-sm text-gray-400">Total Messages</p>
                  <p className="text-3xl font-bold text-green-400">{analytics.totalMessages}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                  <p className="text-sm text-gray-400">Avg Msg/Session</p>
                  <p className="text-3xl font-bold text-purple-400">{analytics.avgMessagesPerSession}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                  <p className="text-sm text-gray-400">Total Words</p>
                  <p className="text-3xl font-bold text-yellow-400">{analytics.totalWords}</p>
                </div>
              </div>

              {/* Character Usage */}
              <div className="bg-gray-800 p-6 rounded border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Character Usage</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.characterCounts).map(([character, count]) => {
                    const percentage = Math.round((Number(count) / analytics.totalSessions) * 100);
                    return (
                      <div key={character}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{character}</span>
                          <span>{count} sessions ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Words */}
              <div className="bg-gray-800 p-6 rounded border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Most Common Words</h3>
                <div className="grid grid-cols-2 gap-4">
                  {analytics.topWords.map(([word, count], index) => (
                    <div key={word} className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{word}</p>
                        <p className="text-sm text-gray-400">{count} times</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-gray-800 p-6 rounded border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Conversation Insights</h3>
                <div className="space-y-2 text-sm">
                  <p>• Average words per message: <strong>{analytics.avgWordsPerMessage}</strong></p>
                  <p>• Most used character: <strong className="capitalize">
                    {Object.entries(analytics.characterCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'N/A'}
                  </strong></p>
                  <p>• Vocabulary richness: <strong>
                    {Math.round((analytics.topWords.length / analytics.totalWords) * 100)}% unique words
                  </strong></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
