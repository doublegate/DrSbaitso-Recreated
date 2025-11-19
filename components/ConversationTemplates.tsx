/**
 * Conversation Templates Component (v1.11.0 - Option C4)
 *
 * UI for browsing, selecting, and managing conversation templates.
 * Allows quick-start conversations with predefined or custom templates.
 */

import React, { useState, useEffect } from 'react';
import {
  TemplateManager,
  getCategoryIcon,
  getCategoryColor,
  type ConversationTemplate,
  type TemplateCategory,
  type TemplatePrompt
} from '@/utils/templateManager';

interface ConversationTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (prompts: string[]) => void;
  theme?: {
    colors: {
      background: string;
      text: string;
      border: string;
      accent: string;
    };
  };
}

export function ConversationTemplates({
  isOpen,
  onClose,
  onSelectTemplate,
  theme
}: ConversationTemplatesProps): JSX.Element | null {
  const [templates, setTemplates] = useState<ConversationTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ConversationTemplate | null>(null);
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});

  // Load templates
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = () => {
    const allTemplates = TemplateManager.getAllTemplates();
    setTemplates(allTemplates);
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' || TemplateManager.searchTemplates(searchQuery).some(t => t.id === template.id);
    return matchesCategory && matchesSearch;
  });

  // Handle template selection
  const handleSelectTemplate = (template: ConversationTemplate) => {
    setSelectedTemplate(template);
    setCustomPrompts({});
  };

  // Handle apply template
  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const prompts = selectedTemplate.prompts
      .filter(prompt => !prompt.isOptional || customPrompts[prompt.id])
      .map(prompt => customPrompts[prompt.id] || prompt.text);

    TemplateManager.recordUsage(selectedTemplate.id);
    onSelectTemplate(prompts);
    onClose();
  };

  const categories: Array<TemplateCategory | 'all'> = ['all', 'therapy', 'casual', 'technical', 'creative', 'educational', 'custom'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 p-6"
        style={{
          backgroundColor: theme?.colors.background || '#1e3a8a',
          borderColor: theme?.colors.border || '#4b5563'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: theme?.colors.text }}>
              📝 Conversation Templates
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Quick-start your conversation with pre-defined templates
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl px-3 py-1 border-2 hover:bg-opacity-20"
            style={{ borderColor: theme?.colors.border, color: theme?.colors.text }}
          >
            ✕
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border-2 bg-black bg-opacity-30"
            style={{
              borderColor: theme?.colors.border,
              color: theme?.colors.text
            }}
          />

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 border-2 text-sm font-bold ${
                  selectedCategory === category ? 'bg-opacity-50' : ''
                }`}
                style={{
                  borderColor: category === 'all' ? theme?.colors.border : getCategoryColor(category as TemplateCategory),
                  backgroundColor: selectedCategory === category
                    ? (category === 'all' ? theme?.colors.accent : getCategoryColor(category as TemplateCategory)) + '44'
                    : 'transparent',
                  color: theme?.colors.text
                }}
              >
                {category === 'all' ? '🌐' : getCategoryIcon(category as TemplateCategory)} {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Template List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {filteredTemplates.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                No templates found
              </p>
            )}

            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`p-4 border-2 cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id ? 'border-opacity-100' : 'border-opacity-40'
                }`}
                style={{
                  borderColor: getCategoryColor(template.category),
                  backgroundColor: selectedTemplate?.id === template.id
                    ? `${getCategoryColor(template.category)}22`
                    : 'transparent'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h3 className="font-bold" style={{ color: theme?.colors.text }}>
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {getCategoryIcon(template.category)} {template.category}
                      </p>
                    </div>
                  </div>
                  {template.useCount > 0 && (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      backgroundColor: `${theme?.colors.accent}33`,
                      color: theme?.colors.text
                    }}>
                      Used {template.useCount}×
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${getCategoryColor(template.category)}33`,
                        color: theme?.colors.text
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Template Preview */}
          <div className="border-2 p-4" style={{ borderColor: theme?.colors.border }}>
            {!selectedTemplate ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Select a template to preview</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme?.colors.text }}>
                    {selectedTemplate.icon} {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    {selectedTemplate.description}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: theme?.colors.text }}>
                    Conversation Flow:
                  </p>
                  <div className="space-y-3">
                    {selectedTemplate.prompts.map((prompt, index) => (
                      <div key={prompt.id}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{
                            backgroundColor: theme?.colors.accent,
                            color: theme?.colors.background
                          }}>
                            {index + 1}
                          </span>
                          <span className="text-xs" style={{ color: theme?.colors.text }}>
                            {prompt.isOptional && (
                              <span className="text-gray-400">(Optional) </span>
                            )}
                          </span>
                        </div>
                        {prompt.placeholder ? (
                          <textarea
                            placeholder={prompt.placeholder}
                            value={customPrompts[prompt.id] || ''}
                            onChange={(e) => setCustomPrompts(prev => ({
                              ...prev,
                              [prompt.id]: e.target.value
                            }))}
                            className="w-full px-3 py-2 text-sm border bg-black bg-opacity-30 resize-none"
                            rows={2}
                            style={{
                              borderColor: theme?.colors.border,
                              color: theme?.colors.text
                            }}
                          />
                        ) : (
                          <p className="text-sm px-3 py-2 border bg-black bg-opacity-20" style={{
                            borderColor: theme?.colors.border,
                            color: theme?.colors.text
                          }}>
                            {prompt.text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: theme?.colors.border }}>
                  <button
                    onClick={handleApplyTemplate}
                    className="w-full px-4 py-3 border-2 font-bold hover:bg-opacity-20 transition-colors"
                    style={{
                      borderColor: theme?.colors.accent,
                      backgroundColor: `${theme?.colors.accent}33`,
                      color: theme?.colors.text
                    }}
                  >
                    ✓ Apply Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: theme?.colors.border }}>
          <p className="text-xs text-gray-400">
            💡 Tip: Templates help structure your conversation and ensure you cover important topics
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConversationTemplates;
