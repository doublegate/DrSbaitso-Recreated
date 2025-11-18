/**
 * Conversation Insights Dashboard Component (v1.9.0)
 *
 * Advanced visual analytics for understanding conversation patterns and sentiment over time.
 * Features:
 * - Timeline chart showing message count over time
 * - Sentiment gauge with trend indicators
 * - Topic word cloud with frequency-based sizing
 * - Character usage pie chart
 * - 🆕 Conversation Health Score (0-100 composite metric)
 * - 🆕 Advanced Topic Clustering with keywords
 * - 🆕 Sentiment Trajectory Analysis
 * - 🆕 Character Effectiveness Matrix
 * - 🆕 Conversation Loop Detection
 * - 🆕 Engagement Metrics Dashboard
 * - Date range filtering (7, 30, 90 days, all time, custom)
 * - Character and session filtering
 * - Export to PNG, PDF, and CSV
 * - Keyboard navigation and screen reader support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InsightsData, InsightsFilter } from '@/types';
import { SessionManager } from '@/utils/sessionManager';
import { drawLineChart, drawPieChart, drawWordCloud, drawGauge } from '@/utils/chartUtils';
import { THEMES, INSIGHT_CHART_COLORS, CHARACTERS } from '@/constants';
import { generateInsightSummary, type InsightSummary } from '@/utils/insightEngine';

interface ConversationInsightsProps {
  onClose: () => void;
  currentTheme: string;
}

export default function ConversationInsights({ onClose, currentTheme }: ConversationInsightsProps) {
  // State
  const [filter, setFilter] = useState<InsightsFilter>({
    dateRange: 'month',
    characterIds: [],
    sessionIds: []
  });
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [advancedInsights, setAdvancedInsights] = useState<InsightSummary | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(true); // Toggle for advanced insights
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Canvas refs
  const timelineRef = useRef<HTMLCanvasElement>(null);
  const sentimentRef = useRef<HTMLCanvasElement>(null);
  const wordCloudRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);

  // Get theme colors
  const theme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
  const chartColors = INSIGHT_CHART_COLORS[currentTheme as keyof typeof INSIGHT_CHART_COLORS] || INSIGHT_CHART_COLORS['dos-blue'];

  // Load insights data when filter changes
  useEffect(() => {
    loadInsights();
  }, [filter]);

  // Redraw charts when data or theme changes
  useEffect(() => {
    if (insightsData && !loading) {
      drawCharts();
    }
  }, [insightsData, currentTheme]);

  // Handle window resize
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (insightsData) {
          drawCharts();
        }
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [insightsData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadInsights = useCallback(() => {
    setLoading(true);
    try {
      const data = SessionManager.getInsightsData(filter);
      setInsightsData(data);

      // Generate advanced insights (v1.9.0)
      const allSessions = SessionManager.getAllSessions();
      if (allSessions && allSessions.length > 0) {
        const advanced = generateInsightSummary(allSessions);
        setAdvancedInsights(advanced);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const drawCharts = useCallback(() => {
    if (!insightsData) return;

    const chartOptions = {
      backgroundColor: theme.colors.background,
      textColor: theme.colors.text,
      colors: chartColors,
      fontSize: 12,
      padding: 40
    };

    // Timeline chart
    if (timelineRef.current) {
      const canvas = timelineRef.current;
      const width = canvas.parentElement?.clientWidth || 600;
      drawLineChart(
        canvas,
        insightsData.timeline.map(t => ({
          label: t.date,
          value: t.count,
          series: t.character
        })),
        { ...chartOptions, width, height: 300 }
      );
    }

    // Sentiment gauge
    if (sentimentRef.current) {
      const canvas = sentimentRef.current;
      const width = canvas.parentElement?.clientWidth || 300;
      drawGauge(
        canvas,
        insightsData.sentiment.score,
        insightsData.sentiment.trend,
        { ...chartOptions, width, height: 250 }
      );
    }

    // Word cloud
    if (wordCloudRef.current) {
      const canvas = wordCloudRef.current;
      const width = canvas.parentElement?.clientWidth || 600;
      drawWordCloud(
        canvas,
        insightsData.topics,
        { ...chartOptions, width, height: 300 }
      );
    }

    // Pie chart
    if (pieChartRef.current) {
      const canvas = pieChartRef.current;
      const width = canvas.parentElement?.clientWidth || 300;
      drawPieChart(
        canvas,
        insightsData.characterUsage.map(c => ({
          label: c.character,
          value: c.count
        })),
        { ...chartOptions, width, height: 300 }
      );
    }
  }, [insightsData, theme, chartColors]);

  const handleDateRangeChange = (range: InsightsFilter['dateRange']) => {
    setFilter(prev => ({ ...prev, dateRange: range }));
  };

  const handleCharacterFilterChange = (characterId: string) => {
    setFilter(prev => {
      const currentIds = prev.characterIds || [];
      const newIds = currentIds.includes(characterId)
        ? currentIds.filter(id => id !== characterId)
        : [...currentIds, characterId];
      return { ...prev, characterIds: newIds };
    });
  };

  const handleClearFilters = () => {
    setFilter({
      dateRange: 'all',
      characterIds: [],
      sessionIds: []
    });
  };

  const exportToPNG = async () => {
    if (!insightsData) return;

    setExporting(true);
    try {
      // Create a composite canvas with all charts
      const composite = document.createElement('canvas');
      const ctx = composite.getContext('2d');
      if (!ctx) return;

      const width = 1200;
      const height = 1600;
      composite.width = width;
      composite.height = height;

      // Background
      ctx.fillStyle = theme.colors.background;
      ctx.fillRect(0, 0, width, height);

      // Title
      ctx.fillStyle = theme.colors.text;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Dr. Sbaitso - Conversation Insights', width / 2, 40);

      // Date
      ctx.font = '16px monospace';
      ctx.fillText(new Date().toLocaleDateString(), width / 2, 70);

      // Draw each chart
      const charts = [timelineRef, sentimentRef, wordCloudRef, pieChartRef];
      let y = 100;

      for (const ref of charts) {
        if (ref.current) {
          ctx.drawImage(ref.current, 50, y);
          y += ref.current.height + 50;
        }
      }

      // Download
      const link = document.createElement('a');
      link.download = `sbaitso-insights-${Date.now()}.png`;
      link.href = composite.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!insightsData) return;

    try {
      let csv = 'Dr. Sbaitso - Conversation Insights\n';
      csv += `Generated: ${new Date().toLocaleString()}\n\n`;

      // Timeline data
      csv += 'Timeline Data\n';
      csv += 'Date,Character,Message Count\n';
      insightsData.timeline.forEach(t => {
        csv += `${t.date},${t.character},${t.count}\n`;
      });
      csv += '\n';

      // Sentiment data
      csv += 'Sentiment Analysis\n';
      csv += 'Metric,Value\n';
      csv += `Overall Score,${insightsData.sentiment.score}\n`;
      csv += `Trend,${insightsData.sentiment.trend}\n`;
      csv += `Recent Average,${insightsData.sentiment.recentAverage}\n`;
      csv += '\n';

      // Topics
      csv += 'Top Topics\n';
      csv += 'Word,Count,Sentiment\n';
      insightsData.topics.forEach(t => {
        csv += `${t.word},${t.count},${t.sentiment}\n`;
      });
      csv += '\n';

      // Character usage
      csv += 'Character Usage\n';
      csv += 'Character,Count,Percentage\n';
      insightsData.characterUsage.forEach(c => {
        csv += `${c.character},${c.count},${c.percentage}%\n`;
      });

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.download = `sbaitso-insights-${Date.now()}.csv`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
        style={{ backgroundColor: `${theme.colors.background}cc` }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse" style={{ color: theme.colors.accent }}>
            📊
          </div>
          <p className="text-xl font-bold" style={{ color: theme.colors.text }}>
            Loading Insights...
          </p>
        </div>
      </div>
    );
  }

  if (!insightsData || insightsData.timeline.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
        style={{ backgroundColor: `${theme.colors.background}cc` }}
      >
        <div
          className="border-4 rounded-lg p-8 max-w-md text-center"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }}
        >
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
          <p className="mb-6">
            Start some conversations to see insights and analytics!
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 font-bold rounded hover:opacity-80 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.colors.accent,
              color: theme.colors.background
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-80 p-4"
      style={{ backgroundColor: `${theme.colors.background}cc` }}
      role="dialog"
      aria-labelledby="insights-title"
    >
      <div
        className="max-w-6xl mx-auto border-4 rounded-lg"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border
        }}
      >
        {/* Header */}
        <div
          className="border-b-4 p-4 flex justify-between items-center"
          style={{ borderColor: theme.colors.border }}
        >
          <h1
            id="insights-title"
            className="text-3xl font-bold"
            style={{ color: theme.colors.text }}
          >
            📊 Conversation Insights
          </h1>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold rounded hover:opacity-80 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.colors.accent,
              color: theme.colors.background
            }}
            aria-label="Close insights dashboard"
          >
            × Close
          </button>
        </div>

        {/* Filters */}
        <div
          className="border-b-4 p-4"
          style={{ borderColor: theme.colors.border, color: theme.colors.text }}
        >
          <div className="flex flex-wrap gap-4 items-center">
            {/* Date range filter */}
            <div>
              <label className="block text-sm font-bold mb-1">Time Period:</label>
              <div className="flex gap-2">
                {(['week', 'month', 'quarter', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => handleDateRangeChange(range)}
                    className={`px-3 py-1 text-sm font-semibold rounded ${
                      filter.dateRange === range ? 'opacity-100' : 'opacity-60'
                    } hover:opacity-100 focus:outline-none focus:ring-2`}
                    style={{
                      backgroundColor: filter.dateRange === range ? theme.colors.accent : theme.colors.border,
                      color: theme.colors.background
                    }}
                  >
                    {range === 'week' && '7 Days'}
                    {range === 'month' && '30 Days'}
                    {range === 'quarter' && '90 Days'}
                    {range === 'all' && 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {/* Character filter */}
            <div>
              <label className="block text-sm font-bold mb-1">Characters:</label>
              <div className="flex flex-wrap gap-2">
                {CHARACTERS.map(char => (
                  <button
                    key={char.id}
                    onClick={() => handleCharacterFilterChange(char.id)}
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      filter.characterIds?.includes(char.id) ? 'opacity-100' : 'opacity-40'
                    } hover:opacity-100 focus:outline-none focus:ring-1`}
                    style={{
                      backgroundColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    {char.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            <button
              onClick={handleClearFilters}
              className="ml-auto px-3 py-1 text-sm font-semibold rounded hover:opacity-80 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.colors.border,
                color: theme.colors.text
              }}
            >
              Clear Filters
            </button>

            {/* Export buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportToPNG}
                disabled={exporting}
                className="px-3 py-1 text-sm font-semibold rounded hover:opacity-80 focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.accent,
                  color: theme.colors.background
                }}
              >
                {exporting ? 'Exporting...' : '📸 PNG'}
              </button>
              <button
                onClick={exportToCSV}
                className="px-3 py-1 text-sm font-semibold rounded hover:opacity-80 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: theme.colors.accent,
                  color: theme.colors.background
                }}
              >
                📄 CSV
              </button>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="px-4 pt-4 flex gap-2">
          <button
            onClick={() => setShowAdvanced(false)}
            className={`px-4 py-2 font-semibold rounded ${!showAdvanced ? 'opacity-100' : 'opacity-60'} hover:opacity-100 focus:outline-none focus:ring-2`}
            style={{
              backgroundColor: !showAdvanced ? theme.colors.accent : theme.colors.border,
              color: !showAdvanced ? theme.colors.background : theme.colors.text
            }}
          >
            📊 Basic Insights
          </button>
          <button
            onClick={() => setShowAdvanced(true)}
            className={`px-4 py-2 font-semibold rounded ${showAdvanced ? 'opacity-100' : 'opacity-60'} hover:opacity-100 focus:outline-none focus:ring-2`}
            style={{
              backgroundColor: showAdvanced ? theme.colors.accent : theme.colors.border,
              color: showAdvanced ? theme.colors.background : theme.colors.text
            }}
          >
            🧠 Advanced Analytics
          </button>
        </div>

        {/* Charts Grid */}
        {!showAdvanced && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <div
            className="border-2 rounded p-4"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-xl font-bold mb-3" style={{ color: theme.colors.text }}>
              Message Timeline
            </h2>
            <div className="w-full">
              <canvas ref={timelineRef} className="w-full" />
            </div>
          </div>

          {/* Sentiment Gauge */}
          <div
            className="border-2 rounded p-4"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-xl font-bold mb-3" style={{ color: theme.colors.text }}>
              Sentiment Analysis
            </h2>
            <div className="w-full">
              <canvas ref={sentimentRef} className="w-full" />
            </div>
            <div className="mt-2 text-sm text-center" style={{ color: theme.colors.text }}>
              Recent 7-day average: {insightsData.sentiment.recentAverage}
            </div>
          </div>

          {/* Word Cloud */}
          <div
            className="border-2 rounded p-4"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-xl font-bold mb-3" style={{ color: theme.colors.text }}>
              Top Topics
            </h2>
            <div className="w-full">
              <canvas ref={wordCloudRef} className="w-full" />
            </div>
          </div>

          {/* Pie Chart */}
          <div
            className="border-2 rounded p-4"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-xl font-bold mb-3" style={{ color: theme.colors.text }}>
              Character Usage
            </h2>
            <div className="w-full">
              <canvas ref={pieChartRef} className="w-full" />
            </div>
          </div>
        </div>
        )}

        {/* Advanced Insights (v1.9.0) */}
        {showAdvanced && advancedInsights && (
        <div className="p-4 space-y-6">
          {/* Health Score */}
          <div
            className="border-2 rounded p-6"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              💚 Conversation Health Score
            </h2>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div
                  className="text-6xl font-bold mb-2"
                  style={{
                    color: advancedInsights.health.score >= 80 ? '#00ff00' :
                           advancedInsights.health.score >= 60 ? '#ffaa00' : '#ff4444'
                  }}
                >
                  {Math.round(advancedInsights.health.score)}
                </div>
                <div className="text-sm" style={{ color: theme.colors.text }}>out of 100</div>
              </div>
              <div className="flex-1">
                <p className="mb-4" style={{ color: theme.colors.text }}>
                  {advancedInsights.health.recommendation}
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1" style={{ color: theme.colors.text }}>
                      <span>Sentiment Balance</span>
                      <span>{Math.round(advancedInsights.health.breakdown.sentimentBalance)}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${advancedInsights.health.breakdown.sentimentBalance}%`,
                          backgroundColor: theme.colors.accent
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1" style={{ color: theme.colors.text }}>
                      <span>Topic Diversity</span>
                      <span>{Math.round(advancedInsights.health.breakdown.topicDiversity)}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${advancedInsights.health.breakdown.topicDiversity}%`,
                          backgroundColor: theme.colors.accent
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1" style={{ color: theme.colors.text }}>
                      <span>Engagement Level</span>
                      <span>{Math.round(advancedInsights.health.breakdown.engagementLevel)}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${advancedInsights.health.breakdown.engagementLevel}%`,
                          backgroundColor: theme.colors.accent
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1" style={{ color: theme.colors.text }}>
                      <span>Responsiveness</span>
                      <span>{Math.round(advancedInsights.health.breakdown.responsiveness)}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${advancedInsights.health.breakdown.responsiveness}%`,
                          backgroundColor: theme.colors.accent
                        }}
                      />
                    </div>
                  </div>
                </div>
                {advancedInsights.health.concerns.length > 0 && (
                  <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#ff444422', borderLeft: `4px solid #ff4444` }}>
                    <p className="font-bold text-sm mb-2" style={{ color: '#ff4444' }}>⚠️ Concerns:</p>
                    {advancedInsights.health.concerns.map((concern, i) => (
                      <p key={i} className="text-sm" style={{ color: theme.colors.text }}>{concern}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Topic Clusters */}
          <div
            className="border-2 rounded p-6"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              🏷️ Topic Clusters
            </h2>
            {advancedInsights.topTopics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {advancedInsights.topTopics.slice(0, 12).map((topic, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-3"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: `${theme.colors.accent}11`
                    }}
                  >
                    <div className="font-bold mb-2" style={{ color: theme.colors.accent }}>
                      {topic.topic}
                    </div>
                    <div className="text-sm mb-2" style={{ color: theme.colors.text }}>
                      Keywords: {topic.keywords.slice(0, 3).join(', ')}
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: theme.colors.text }}>
                      <span>Mentions: {topic.frequency}</span>
                      <span style={{
                        color: topic.sentiment > 0 ? '#00ff00' : topic.sentiment < 0 ? '#ff4444' : theme.colors.text
                      }}>
                        {topic.sentiment > 0 ? '😊' : topic.sentiment < 0 ? '😟' : '😐'} {topic.sentiment > 0 ? '+' : ''}{topic.sentiment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: theme.colors.text }}>Not enough conversation data to cluster topics yet.</p>
            )}
          </div>

          {/* Sentiment Trajectory */}
          <div
            className="border-2 rounded p-6"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              📈 Sentiment Trajectory
            </h2>
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-lg font-bold" style={{ color: theme.colors.text }}>
                  Trend: {advancedInsights.sentimentTrend.trend === 'improving' ? '📈 Improving' :
                          advancedInsights.sentimentTrend.trend === 'declining' ? '📉 Declining' :
                          advancedInsights.sentimentTrend.trend === 'volatile' ? '⚡ Volatile' : '➡️ Stable'}
                </span>
                <span className="text-sm" style={{ color: theme.colors.text }}>
                  (Strength: {Math.round(advancedInsights.sentimentTrend.trendStrength * 100)}%)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: theme.colors.text }}>
                <div>Recent Average: <span className="font-bold">{Math.round(advancedInsights.sentimentTrend.recentAverage)}</span></div>
                <div>Overall Average: <span className="font-bold">{Math.round(advancedInsights.sentimentTrend.overallAverage)}</span></div>
              </div>
            </div>
            {advancedInsights.sentimentTrend.timeline.length > 0 && (
              <div className="relative h-32 border rounded p-2" style={{ borderColor: theme.colors.border }}>
                {/* Simple sentiment timeline visualization */}
                <div className="flex items-end justify-around h-full">
                  {advancedInsights.sentimentTrend.timeline.slice(-15).map((point, idx) => (
                    <div
                      key={idx}
                      className="w-2 rounded-t transition-all"
                      style={{
                        height: `${Math.max(10, (point.score + 100) / 2)}%`,
                        backgroundColor: point.score > 0 ? '#00ff00' : point.score < 0 ? '#ff4444' : theme.colors.border
                      }}
                      title={`Score: ${point.score}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Character Effectiveness */}
          <div
            className="border-2 rounded p-6"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              🎭 Character Effectiveness
            </h2>
            {advancedInsights.characterPerformance.length > 0 ? (
              <div className="space-y-3">
                {advancedInsights.characterPerformance
                  .sort((a, b) => b.effectiveness - a.effectiveness)
                  .map((char, idx) => {
                    const character = CHARACTERS.find(c => c.id === char.characterId);
                    return (
                      <div
                        key={idx}
                        className="border rounded p-3"
                        style={{ borderColor: theme.colors.border }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold" style={{ color: theme.colors.text }}>
                            {character?.name || char.characterId}
                          </span>
                          <span
                            className="text-2xl font-bold"
                            style={{ color: char.effectiveness >= 80 ? '#00ff00' : char.effectiveness >= 60 ? '#ffaa00' : theme.colors.text }}
                          >
                            {Math.round(char.effectiveness)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: theme.colors.text }}>
                          <div>Sessions: {char.conversationCount}</div>
                          <div>Avg Length: {Math.round(char.avgSessionLength)} msgs</div>
                          <div>Retention: {Math.round(char.userRetention * 100)}%</div>
                          <div>Sentiment Δ: {char.avgSentimentChange > 0 ? '+' : ''}{Math.round(char.avgSentimentChange)}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p style={{ color: theme.colors.text }}>Start conversations with different characters to see effectiveness metrics.</p>
            )}
          </div>

          {/* Conversation Loops */}
          {advancedInsights.detectedLoops.length > 0 && (
          <div
            className="border-2 rounded p-6"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              🔁 Detected Conversation Loops
            </h2>
            <div className="space-y-3">
              {advancedInsights.detectedLoops.map((loop, idx) => (
                <div
                  key={idx}
                  className="border rounded p-3"
                  style={{
                    borderColor: theme.colors.border,
                    backgroundColor: `${theme.colors.accent}08`
                  }}
                >
                  <div className="font-bold mb-2" style={{ color: theme.colors.accent }}>
                    Pattern: "{loop.pattern.join(' → ')}"
                  </div>
                  <div className="text-sm" style={{ color: theme.colors.text }}>
                    Occurred {loop.occurrences} times • {loop.potentialCause}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Engagement Metrics */}
          <div
            className="border-2 rounded p-6"
            style={{ borderColor: theme.colors.border }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
              ⚡ Engagement Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 border rounded" style={{ borderColor: theme.colors.border }}>
                <div className="text-2xl font-bold" style={{ color: theme.colors.accent }}>
                  {Math.round(advancedInsights.engagement.avgMessageLength)}
                </div>
                <div className="text-xs" style={{ color: theme.colors.text }}>Avg Chars/Message</div>
              </div>
              <div className="text-center p-3 border rounded" style={{ borderColor: theme.colors.border }}>
                <div className="text-2xl font-bold" style={{ color: theme.colors.accent }}>
                  {Math.round(advancedInsights.engagement.avgResponseTime / 1000)}s
                </div>
                <div className="text-xs" style={{ color: theme.colors.text }}>Avg Response Time</div>
              </div>
              <div className="text-center p-3 border rounded" style={{ borderColor: theme.colors.border }}>
                <div className="text-2xl font-bold" style={{ color: theme.colors.accent }}>
                  {Math.round(advancedInsights.engagement.avgSessionDuration / 60000)}m
                </div>
                <div className="text-xs" style={{ color: theme.colors.text }}>Avg Session</div>
              </div>
              <div className="text-center p-3 border rounded" style={{ borderColor: theme.colors.border }}>
                <div className="text-2xl font-bold" style={{ color: theme.colors.accent }}>
                  {advancedInsights.engagement.peakEngagementTime !== null ?
                    `${advancedInsights.engagement.peakEngagementTime}:00` : 'N/A'}
                </div>
                <div className="text-xs" style={{ color: theme.colors.text }}>Peak Hour</div>
              </div>
            </div>
            {advancedInsights.engagement.messageFrequency.length > 0 && (
              <div>
                <p className="text-sm mb-2" style={{ color: theme.colors.text }}>
                  Consistency Score: {Math.round(advancedInsights.engagement.consistencyScore)}/100
                </p>
                <div className="flex items-end justify-around h-24 border rounded p-2" style={{ borderColor: theme.colors.border }}>
                  {advancedInsights.engagement.messageFrequency.map((freq, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-opacity-60 rounded-t"
                      style={{
                        height: `${(freq.count / Math.max(...advancedInsights.engagement.messageFrequency.map(f => f.count))) * 100}%`,
                        backgroundColor: freq.hour === advancedInsights.engagement.peakEngagementTime ? theme.colors.accent : theme.colors.border
                      }}
                      title={`${freq.hour}:00 - ${freq.count} messages`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Footer */}
        <div
          className="border-t-4 p-3 text-center text-sm"
          style={{ borderColor: theme.colors.border, color: theme.colors.text }}
        >
          Press <kbd className="px-2 py-1 bg-opacity-20 bg-white rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
