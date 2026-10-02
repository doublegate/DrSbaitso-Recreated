/**
 * Advanced Exporter Component (v1.6.0)
 *
 * Multi-format export system with:
 * - PDF via the browser print dialog, or the same print-ready document as HTML
 * - CSV export in 4 variants
 * - Theme packaging for collections
 * - Batch export for multiple sessions
 */

import { useState } from 'react';
import type { ConversationSession, PDFExportOptions, CSVExportOptions } from '../types';
import type { CustomTheme } from '../utils/themeValidator';
import {
  PDFExporter,
  CSVExporter,
  ThemePackager,
  BatchExporter,
  downloadExportResult,
  printHtml,
  type BatchFormat,
  type ExportResult,
} from '../utils/advancedExport';

interface AdvancedExporterProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  themes: CustomTheme[];
  currentSession?: ConversationSession;
}

type TabType = 'pdf' | 'csv' | 'theme' | 'batch';
type CSVType = 'messages' | 'statistics' | 'wordFrequency' | 'characterUsage';

export function AdvancedExporter({ isOpen, onClose, sessions, themes, currentSession }: AdvancedExporterProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pdf');
  const [exportInProgress, setExportInProgress] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PDF Options
  const [pdfOptions, setPdfOptions] = useState<PDFExportOptions>({
    includeCoverPage: true,
    includeStatistics: true,
    includeCharacterInfo: true,
    fontSize: 12,
    pageSize: 'A4',
    includeThemeStyling: false,
  });

  // CSV Options
  const [csvOptions, setCsvOptions] = useState<CSVExportOptions>({
    delimiter: ',',
    includeHeaders: true,
    dateFormat: 'iso',
  });
  const [csvType, setCsvType] = useState<CSVType>('messages');

  // Batch Options
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [batchFormat, setBatchFormat] = useState<BatchFormat>('json');
  const [batchCombined, setBatchCombined] = useState(false);

  // Theme Selection
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  if (!isOpen) return null;

  // There is no PDF encoder: the browser's print dialog offers "Save as PDF".
  const handlePrintToPDF = () => {
    if (!currentSession) {
      showMessage('error', 'No active session to export');
      return;
    }

    try {
      printHtml(PDFExporter.buildDocument(currentSession, pdfOptions));
      showMessage('success', 'Print dialog opened: choose "Save as PDF" as the destination');
    } catch (error) {
      console.error('Print failed:', error);
      showMessage('error', 'Could not open the print dialog');
    }
  };

  const handleHTMLExport = async () => {
    if (!currentSession) {
      showMessage('error', 'No active session to export');
      return;
    }

    setExportInProgress(true);
    try {
      const result = await PDFExporter.exportToPDF(currentSession, pdfOptions);
      downloadExportResult(result);
      showMessage('success', `HTML exported: ${result.filename}`);
    } catch (error) {
      console.error('HTML export failed:', error);
      showMessage('error', 'HTML export failed');
    } finally {
      setExportInProgress(false);
    }
  };

  const handleCSVExport = () => {
    if (sessions.length === 0) {
      showMessage('error', 'No sessions available to export');
      return;
    }

    setExportInProgress(true);
    try {
      let result: ExportResult;

      switch (csvType) {
        case 'messages':
          result = CSVExporter.exportMessages(sessions, csvOptions);
          break;
        case 'statistics':
          result = CSVExporter.exportStatistics(sessions, csvOptions);
          break;
        case 'wordFrequency':
          result = CSVExporter.exportWordFrequency(sessions, csvOptions);
          break;
        case 'characterUsage':
          result = CSVExporter.exportCharacterUsage(sessions, csvOptions);
          break;
      }

      downloadExportResult(result);
      showMessage('success', `CSV exported: ${result.filename}`);
    } catch (error) {
      console.error('CSV export failed:', error);
      showMessage('error', 'CSV export failed');
    } finally {
      setExportInProgress(false);
    }
  };

  const handleThemePackage = () => {
    if (selectedThemes.length === 0) {
      showMessage('error', 'No themes selected');
      return;
    }

    setExportInProgress(true);
    try {
      const themesToExport = themes.filter((t) => selectedThemes.includes(t.id));
      const result = ThemePackager.packageThemes(themesToExport);
      downloadExportResult(result);
      showMessage('success', `Theme package exported: ${themesToExport.length} themes`);
    } catch (error) {
      console.error('Theme package failed:', error);
      showMessage('error', 'Theme packaging failed');
    } finally {
      setExportInProgress(false);
    }
  };

  const handleBatchExport = async () => {
    if (selectedSessions.length === 0) {
      showMessage('error', 'No sessions selected');
      return;
    }

    setExportInProgress(true);
    try {
      const sessionsToExport = sessions.filter((s) => selectedSessions.includes(s.id));
      const results = await BatchExporter.batchExport(sessionsToExport, batchFormat, batchCombined);

      results.forEach((result) => downloadExportResult(result));
      showMessage('success', `Batch export complete: ${results.length} file(s)`);
    } catch (error) {
      console.error('Batch export failed:', error);
      showMessage('error', 'Batch export failed');
    } finally {
      setExportInProgress(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setExportMessage({ type, text });
    setTimeout(() => setExportMessage(null), 3000);
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    );
  };

  const toggleThemeSelection = (themeId: string) => {
    setSelectedThemes((prev) => (prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId]));
  };

  const selectAllSessions = () => {
    setSelectedSessions(sessions.map((s) => s.id));
  };

  const clearSessionSelection = () => {
    setSelectedSessions([]);
  };

  const selectAllThemes = () => {
    setSelectedThemes(themes.map((t) => t.id));
  };

  const clearThemeSelection = () => {
    setSelectedThemes([]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-background)',
          border: '2px solid var(--color-border)',
          borderRadius: '0',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '20px',
          fontFamily: 'monospace',
          color: 'var(--color-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-primary)' }}>📦 ADVANCED EXPORT</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Export Message */}
        {exportMessage && (
          <div
            style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: exportMessage.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            {exportMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid var(--color-border)' }}
        >
          {(['pdf', 'csv', 'theme', 'batch'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                background: activeTab === tab ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab ? 'var(--color-background)' : 'var(--color-text)',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            >
              {tab === 'pdf' && '📄 PDF / HTML'}
              {tab === 'csv' && '📊 CSV'}
              {tab === 'theme' && '🎨 Themes'}
              {tab === 'batch' && '📦 Batch'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '300px' }}>
          {/* PDF Tab */}
          {activeTab === 'pdf' && (
            <div>
              <p style={{ marginBottom: '15px', color: 'var(--color-text)', opacity: 0.8 }}>
                Print the current session to PDF (choose &quot;Save as PDF&quot; in the print dialog), or download it as
                a print-ready HTML file.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeCoverPage}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeCoverPage: e.target.checked })}
                  />
                  <span>Include Cover Page</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeStatistics}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeStatistics: e.target.checked })}
                  />
                  <span>Include Statistics</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeCharacterInfo}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeCharacterInfo: e.target.checked })}
                  />
                  <span>Include Character Info</span>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span>Font Size:</span>
                  <select
                    value={pdfOptions.fontSize}
                    onChange={(e) =>
                      setPdfOptions({ ...pdfOptions, fontSize: parseInt(e.target.value) as 12 | 14 | 16 })
                    }
                    style={{
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    <option value="12">12pt</option>
                    <option value="14">14pt</option>
                    <option value="16">16pt</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span>Page Size:</span>
                  <select
                    value={pdfOptions.pageSize}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, pageSize: e.target.value as 'A4' | 'Letter' })}
                    style={{
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                  </select>
                </label>

                <button
                  onClick={handlePrintToPDF}
                  disabled={exportInProgress || !currentSession}
                  style={{
                    padding: '12px',
                    backgroundColor: exportInProgress ? '#666' : 'var(--color-primary)',
                    color: 'var(--color-background)',
                    border: 'none',
                    cursor: exportInProgress ? 'not-allowed' : 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    marginTop: '10px',
                  }}
                >
                  PDF (VIA PRINT DIALOG)
                </button>

                <button
                  onClick={handleHTMLExport}
                  disabled={exportInProgress || !currentSession}
                  style={{
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text)',
                    border: '2px solid var(--color-primary)',
                    cursor: exportInProgress ? 'not-allowed' : 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                  }}
                >
                  {exportInProgress ? 'EXPORTING...' : 'DOWNLOAD HTML'}
                </button>
              </div>
            </div>
          )}

          {/* CSV Tab */}
          {activeTab === 'csv' && (
            <div>
              <p style={{ marginBottom: '15px', color: 'var(--color-text)', opacity: 0.8 }}>
                Export data in CSV format for spreadsheets
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span>Export Type:</span>
                  <select
                    value={csvType}
                    onChange={(e) => setCsvType(e.target.value as CSVType)}
                    style={{
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    <option value="messages">Messages</option>
                    <option value="statistics">Session Statistics</option>
                    <option value="wordFrequency">Word Frequency</option>
                    <option value="characterUsage">Character Usage</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span>Delimiter:</span>
                  <select
                    value={csvOptions.delimiter}
                    onChange={(e) => setCsvOptions({ ...csvOptions, delimiter: e.target.value as ',' | ';' | '\t' })}
                    style={{
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value={'\t'}>Tab</option>
                  </select>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={csvOptions.includeHeaders}
                    onChange={(e) => setCsvOptions({ ...csvOptions, includeHeaders: e.target.checked })}
                  />
                  <span>Include Headers</span>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span>Date Format:</span>
                  <select
                    value={csvOptions.dateFormat}
                    onChange={(e) =>
                      setCsvOptions({ ...csvOptions, dateFormat: e.target.value as 'iso' | 'locale' | 'timestamp' })
                    }
                    style={{
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    <option value="iso">ISO 8601</option>
                    <option value="locale">Locale String</option>
                    <option value="timestamp">Unix Timestamp</option>
                  </select>
                </label>

                <button
                  onClick={handleCSVExport}
                  disabled={exportInProgress || sessions.length === 0}
                  style={{
                    padding: '12px',
                    backgroundColor: exportInProgress ? '#666' : 'var(--color-primary)',
                    color: 'var(--color-background)',
                    border: 'none',
                    cursor: exportInProgress ? 'not-allowed' : 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    marginTop: '10px',
                  }}
                >
                  {exportInProgress ? 'EXPORTING...' : '📊 EXPORT CSV'}
                </button>
              </div>
            </div>
          )}

          {/* Theme Package Tab */}
          {activeTab === 'theme' && (
            <div>
              <p style={{ marginBottom: '15px', color: 'var(--color-text)', opacity: 0.8 }}>
                Package custom themes for sharing ({selectedThemes.length} selected)
              </p>

              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={selectAllThemes}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={clearThemeSelection}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  Clear All
                </button>
              </div>

              <div
                style={{
                  maxHeight: '300px',
                  overflow: 'auto',
                  marginBottom: '15px',
                  border: '1px solid var(--color-border)',
                  padding: '10px',
                }}
              >
                {themes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text)', opacity: 0.6 }}>
                    No custom themes available
                  </p>
                ) : (
                  themes.map((theme) => (
                    <label
                      key={theme.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedThemes.includes(theme.id)}
                        onChange={() => toggleThemeSelection(theme.id)}
                      />
                      <span>{theme.name}</span>
                    </label>
                  ))
                )}
              </div>

              <button
                onClick={handleThemePackage}
                disabled={exportInProgress || selectedThemes.length === 0}
                style={{
                  padding: '12px',
                  backgroundColor: exportInProgress ? '#666' : 'var(--color-primary)',
                  color: 'var(--color-background)',
                  border: 'none',
                  cursor: exportInProgress ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  width: '100%',
                }}
              >
                {exportInProgress ? 'PACKAGING...' : '🎨 PACKAGE THEMES'}
              </button>
            </div>
          )}

          {/* Batch Export Tab */}
          {activeTab === 'batch' && (
            <div>
              <p style={{ marginBottom: '15px', color: 'var(--color-text)', opacity: 0.8 }}>
                Export multiple sessions ({selectedSessions.length} selected)
              </p>

              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={selectAllSessions}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={clearSessionSelection}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  Clear All
                </button>
              </div>

              <div
                style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  marginBottom: '15px',
                  border: '1px solid var(--color-border)',
                  padding: '10px',
                }}
              >
                {sessions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text)', opacity: 0.6 }}>No sessions available</p>
                ) : (
                  sessions.map((session) => (
                    <label
                      key={session.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.id)}
                        onChange={() => toggleSessionSelection(session.id)}
                      />
                      <span>
                        {session.name} ({session.messageCount} msgs)
                      </span>
                    </label>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span>Export Format:</span>
                  <select
                    value={batchFormat}
                    onChange={(e) => setBatchFormat(e.target.value as BatchFormat)}
                    style={{
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace',
                    }}
                  >
                    <option value="html">HTML (print-ready)</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={batchCombined}
                    onChange={(e) => setBatchCombined(e.target.checked)}
                    disabled={batchFormat === 'html' || batchFormat === 'pdf' || batchFormat === 'markdown'}
                  />
                  <span>
                    Combine into single file{' '}
                    {(batchFormat === 'html' || batchFormat === 'pdf' || batchFormat === 'markdown') &&
                      '(not supported for HTML/Markdown)'}
                  </span>
                </label>
              </div>

              <button
                onClick={handleBatchExport}
                disabled={exportInProgress || selectedSessions.length === 0}
                style={{
                  padding: '12px',
                  backgroundColor: exportInProgress ? '#666' : 'var(--color-primary)',
                  color: 'var(--color-background)',
                  border: 'none',
                  cursor: exportInProgress ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  width: '100%',
                }}
              >
                {exportInProgress ? 'EXPORTING...' : '📦 BATCH EXPORT'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
