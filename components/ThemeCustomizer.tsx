/**
 * Theme Customizer Component (v1.5.0)
 *
 * Full-featured theme editor with:
 * - Color pickers for all theme colors
 * - Live preview
 * - WCAG accessibility validation
 * - Import/Export JSON
 * - Share code generation
 * - Save custom themes
 */

import { useState, useEffect } from 'react';
import type { CustomTheme } from '../utils/themeValidator';
import {
  generateThemeId,
  isValidCustomTheme,
  validateThemeColors,
  normalizeHexColor,
  exportThemeJSON,
  importThemeJSON,
  generateShareCode,
  parseShareCode,
  lightenColor,
  darkenColor
} from '../utils/themeValidator';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: CustomTheme) => void;
  currentTheme?: Partial<CustomTheme>;
}

export function ThemeCustomizer({ isOpen, onClose, onSave, currentTheme }: ThemeCustomizerProps) {
  const [themeName, setThemeName] = useState(currentTheme?.name || 'My Custom Theme');
  const [themeDescription, setThemeDescription] = useState(currentTheme?.description || '');
  const [themeAuthor, setThemeAuthor] = useState(currentTheme?.author || '');

  const [primaryColor, setPrimaryColor] = useState(currentTheme?.colors?.primary || '#3b82f6');
  const [backgroundColor, setBackgroundColor] = useState(currentTheme?.colors?.background || '#1e3a8a');
  const [textColor, setTextColor] = useState(currentTheme?.colors?.text || '#ffffff');
  const [borderColor, setBorderColor] = useState(currentTheme?.colors?.border || '#60a5fa');
  const [accentColor, setAccentColor] = useState(currentTheme?.colors?.accent || '#fbbf24');

  const [showPreview, setShowPreview] = useState(true);
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateThemeColors> | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [exportedJSON, setExportedJSON] = useState('');

  // Validate colors whenever they change
  useEffect(() => {
    const colors = {
      primary: primaryColor,
      background: backgroundColor,
      text: textColor,
      border: borderColor,
      accent: accentColor
    };
    const result = validateThemeColors(colors);
    setValidationResult(result);
  }, [primaryColor, backgroundColor, textColor, borderColor, accentColor]);

  if (!isOpen) return null;

  const handleSave = () => {
    const theme: CustomTheme = {
      id: currentTheme?.id || generateThemeId(),
      name: themeName.trim() || 'Custom Theme',
      description: themeDescription.trim() || 'A custom theme',
      colors: {
        primary: normalizeHexColor(primaryColor),
        background: normalizeHexColor(backgroundColor),
        text: normalizeHexColor(textColor),
        border: normalizeHexColor(borderColor),
        accent: normalizeHexColor(accentColor)
      },
      isCustom: true,
      createdAt: currentTheme?.createdAt || Date.now(),
      author: themeAuthor.trim() || undefined
    };

    if (isValidCustomTheme(theme)) {
      onSave(theme);
      onClose();
    }
  };

  const handleExport = () => {
    const theme: CustomTheme = {
      id: currentTheme?.id || generateThemeId(),
      name: themeName,
      description: themeDescription,
      colors: {
        primary: normalizeHexColor(primaryColor),
        background: normalizeHexColor(backgroundColor),
        text: normalizeHexColor(textColor),
        border: normalizeHexColor(borderColor),
        accent: normalizeHexColor(accentColor)
      },
      isCustom: true,
      createdAt: Date.now(),
      author: themeAuthor || undefined
    };

    setExportedJSON(exportThemeJSON(theme));
  };

  const handleImport = () => {
    const theme = importThemeJSON(importCode);
    if (theme) {
      setThemeName(theme.name);
      setThemeDescription(theme.description);
      setPrimaryColor(theme.colors.primary);
      setBackgroundColor(theme.colors.background);
      setTextColor(theme.colors.text);
      setBorderColor(theme.colors.border);
      setAccentColor(theme.colors.accent);
      setThemeAuthor(theme.author || '');
      setImportCode('');
    } else {
      alert('Failed to import theme. Invalid JSON format.');
    }
  };

  const handleGenerateShareCode = () => {
    const theme: CustomTheme = {
      id: generateThemeId(),
      name: themeName,
      description: themeDescription,
      colors: {
        primary: normalizeHexColor(primaryColor),
        background: normalizeHexColor(backgroundColor),
        text: normalizeHexColor(textColor),
        border: normalizeHexColor(borderColor),
        accent: normalizeHexColor(accentColor)
      },
      isCustom: true,
      createdAt: Date.now(),
      author: themeAuthor || undefined
    };

    setShareCode(generateShareCode(theme));
  };

  const handleImportShareCode = () => {
    const theme = parseShareCode(shareCode);
    if (theme) {
      setThemeName(theme.name);
      setThemeDescription(theme.description);
      setPrimaryColor(theme.colors.primary);
      setBackgroundColor(theme.colors.background);
      setTextColor(theme.colors.text);
      setBorderColor(theme.colors.border);
      setAccentColor(theme.colors.accent);
      setThemeAuthor(theme.author || '');
    } else {
      alert('Failed to parse share code. Invalid format.');
    }
  };

  const generateHarmoniousTheme = (baseColor: string) => {
    const base = normalizeHexColor(baseColor);
    setPrimaryColor(base);
    setBackgroundColor(darkenColor(base, 70));
    setTextColor(lightenColor(base, 90));
    setBorderColor(lightenColor(base, 30));
    setAccentColor(lightenColor(base, 80));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
      role="dialog"
      aria-labelledby="theme-customizer-title"
      aria-modal="true"
    >
      <div
        className="bg-gray-900 text-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 id="theme-customizer-title" className="text-2xl font-bold">
            Theme Customizer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close theme customizer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Metadata */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Theme Information</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Name:</label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="My Custom Theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description:</label>
              <input
                type="text"
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="A beautiful custom theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Author (optional):</label>
              <input
                type="text"
                value={themeAuthor}
                onChange={(e) => setThemeAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>
          </div>

          {/* Color Pickers */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Colors</h3>
              <button
                onClick={() => generateHarmoniousTheme(primaryColor)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Auto-Generate Harmonious
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium mb-1">Primary Color:</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium mb-1">Background Color:</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-sm"
                    placeholder="#1e3a8a"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium mb-1">Text Color:</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Border Color */}
              <div>
                <label className="block text-sm font-medium mb-1">Border Color:</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-sm"
                    placeholder="#60a5fa"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Accent Color:</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-16 h-10 rounded border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-sm"
                    placeholder="#fbbf24"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Accessibility Validation */}
          {validationResult && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Accessibility Check</h3>
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold">Score:</span>
                  <span className={`text-2xl font-bold ${
                    validationResult.overall.score >= 80 ? 'text-green-400' :
                    validationResult.overall.score >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {validationResult.overall.score}/100
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Text Contrast:</span> {validationResult.textContrast.ratio.toFixed(2)}:1
                    {validationResult.textContrast.wcagAAA && <span className="ml-2 text-green-400">✓ WCAG AAA</span>}
                    {!validationResult.textContrast.wcagAAA && validationResult.textContrast.wcagAA && <span className="ml-2 text-yellow-400">✓ WCAG AA</span>}
                    {!validationResult.textContrast.wcagAA && <span className="ml-2 text-red-400">✗ Fails WCAG</span>}
                  </p>
                  <p>
                    <span className="font-medium">Accent Contrast:</span> {validationResult.accentContrast.ratio.toFixed(2)}:1
                    {validationResult.accentContrast.wcagAALarge && <span className="ml-2 text-green-400">✓ OK</span>}
                    {!validationResult.accentContrast.wcagAALarge && <span className="ml-2 text-yellow-400">⚠ Low</span>}
                  </p>
                  <p>
                    <span className="font-medium">Border Contrast:</span> {validationResult.borderContrast.ratio.toFixed(2)}:1
                  </p>
                </div>

                {validationResult.suggestions.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="font-medium">Suggestions:</p>
                    {validationResult.suggestions.map((suggestion, i) => (
                      <p key={i} className="text-sm text-gray-300">• {suggestion}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Live Preview</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {showPreview ? 'Hide' : 'Show'}
              </button>
            </div>

            {showPreview && (
              <div
                className="p-6 rounded border-4"
                style={{
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  color: textColor
                }}
              >
                <div className="space-y-4">
                  <h4 className="text-xl font-bold" style={{ color: primaryColor }}>
                    Dr. Sbaitso Preview
                  </h4>
                  <p style={{ color: textColor }}>
                    This is how your custom theme will look in the application. Text appears in the selected text color against the background.
                  </p>
                  <p style={{ color: accentColor }}>
                    This text uses the accent color for highlights and important information.
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded font-medium"
                      style={{
                        backgroundColor: primaryColor,
                        color: backgroundColor
                      }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded font-medium border-2"
                      style={{
                        borderColor: accentColor,
                        color: accentColor,
                        backgroundColor: 'transparent'
                      }}
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Import/Export */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Import/Export</h3>

            {/* Export JSON */}
            <div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Export JSON
                </button>
                {exportedJSON && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportedJSON);
                      alert('Copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                  >
                    Copy JSON
                  </button>
                )}
              </div>
              {exportedJSON && (
                <textarea
                  value={exportedJSON}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-xs h-32"
                />
              )}
            </div>

            {/* Import JSON */}
            <div>
              <label className="block text-sm font-medium mb-1">Import from JSON:</label>
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-xs h-32 mb-2"
                placeholder="Paste theme JSON here..."
              />
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
              >
                Import JSON
              </button>
            </div>

            {/* Share Code */}
            <div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleGenerateShareCode}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded"
                >
                  Generate Share Code
                </button>
                {shareCode && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareCode);
                      alert('Share code copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                  >
                    Copy Share Code
                  </button>
                )}
              </div>
              {shareCode && (
                <input
                  type="text"
                  value={shareCode}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-xs"
                />
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Import from Share Code:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-xs"
                    placeholder="Paste share code here..."
                  />
                  <button
                    onClick={handleImportShareCode}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
          >
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );
}
