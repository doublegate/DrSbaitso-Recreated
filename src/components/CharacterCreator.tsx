/**
 * Character Creator Component (v1.6.0)
 *
 * Custom AI character builder with:
 * - Full personality configuration
 * - System instruction customization
 * - Voice prompt settings
 * - Personality traits selector
 * - Custom glitch messages
 * - Live preview with Gemini
 * - Character gallery management
 */

import { useState, useEffect } from 'react';
import type { CustomCharacter } from '../types';
import { synthesizeSpeech, getAIResponse } from '../services/geminiService';

interface CharacterCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: CustomCharacter) => void;
  onDelete: (characterId: string) => void;
  existingCharacters: CustomCharacter[];
  editCharacter?: CustomCharacter;
}

type TabType = 'create' | 'gallery';
type ResponseStyleType = 'uppercase' | 'mixedcase' | 'lowercase';

const PERSONALITY_TRAITS = [
  'robotic',
  'empathetic',
  'curious',
  'suspicious',
  'calm',
  'aggressive',
  'analytical',
  'creative',
  'logical'
];

export function CharacterCreator({
  isOpen,
  onClose,
  onSave,
  onDelete,
  existingCharacters,
  editCharacter
}: CharacterCreatorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [characterName, setCharacterName] = useState('');
  const [description, setDescription] = useState('');
  const [era, setEra] = useState(1990);
  const [knowledgeCutoff, setKnowledgeCutoff] = useState(1990);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [voicePrompt, setVoicePrompt] = useState('');
  const [responseStyle, setResponseStyle] = useState<ResponseStyleType>('uppercase');
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [glitchMessages, setGlitchMessages] = useState<string[]>([]);
  const [newGlitchMessage, setNewGlitchMessage] = useState('');

  // Preview state
  const [previewPrompt, setPreviewPrompt] = useState('');
  const [previewResponse, setPreviewResponse] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load edit character if provided
  useEffect(() => {
    if (editCharacter && isOpen) {
      setCharacterName(editCharacter.name);
      setDescription(editCharacter.description);
      setEra(editCharacter.era);
      setKnowledgeCutoff(editCharacter.knowledgeCutoff);
      setSystemInstruction(editCharacter.systemInstruction);
      setVoicePrompt(editCharacter.voicePrompt);
      setResponseStyle(editCharacter.responseStyle);
      setPersonalityTraits(editCharacter.personalityTraits);
      setGlitchMessages(editCharacter.glitchMessages);
      setActiveTab('create');
    } else if (!editCharacter && isOpen) {
      // Reset form for new character
      resetForm();
    }
  }, [editCharacter, isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCharacterName('');
    setDescription('');
    setEra(1990);
    setKnowledgeCutoff(1990);
    setSystemInstruction('');
    setVoicePrompt('');
    setResponseStyle('uppercase');
    setPersonalityTraits([]);
    setGlitchMessages([]);
    setNewGlitchMessage('');
    setPreviewPrompt('');
    setPreviewResponse('');
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (characterName.length < 3 || characterName.length > 50) {
      newErrors.name = 'Name must be 3-50 characters';
    }

    if (existingCharacters.some(c => c.name === characterName && c.id !== editCharacter?.id)) {
      newErrors.name = 'Name already exists';
    }

    if (description.length < 50 || description.length > 300) {
      newErrors.description = 'Description must be 50-300 characters';
    }

    if (systemInstruction.length < 50 || systemInstruction.length > 500) {
      newErrors.systemInstruction = 'System instruction must be 50-500 characters';
    }

    if (voicePrompt.length < 20 || voicePrompt.length > 200) {
      newErrors.voicePrompt = 'Voice prompt must be 20-200 characters';
    }

    if (era < 1960 || era > 2025) {
      newErrors.era = 'Era must be between 1960-2025';
    }

    if (knowledgeCutoff < 1960 || knowledgeCutoff > 2025) {
      newErrors.knowledgeCutoff = 'Knowledge cutoff must be between 1960-2025';
    }

    if (personalityTraits.length === 0) {
      newErrors.personalityTraits = 'Select at least one personality trait';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      showStatus('error', 'Please fix validation errors');
      return;
    }

    const character: CustomCharacter = {
      id: editCharacter?.id || `custom-${Date.now()}`,
      name: characterName.trim(),
      description: description.trim(),
      era,
      knowledgeCutoff,
      systemInstruction: systemInstruction.trim(),
      voicePrompt: voicePrompt.trim(),
      responseStyle,
      personalityTraits,
      glitchMessages,
      isCustom: true,
      createdAt: editCharacter?.createdAt || Date.now(),
      usageCount: editCharacter?.usageCount || 0
    };

    onSave(character);
    showStatus('success', editCharacter ? 'Character updated!' : 'Character created!');
    setTimeout(() => {
      setActiveTab('gallery');
      resetForm();
    }, 1000);
  };

  const handleDelete = (characterId: string) => {
    if (confirm('Are you sure you want to delete this character? This cannot be undone.')) {
      onDelete(characterId);
      showStatus('success', 'Character deleted');
    }
  };

  const handlePreview = async () => {
    if (!previewPrompt.trim() || !systemInstruction) {
      showStatus('error', 'Enter system instruction and test prompt');
      return;
    }

    setIsPreviewLoading(true);
    setPreviewResponse('');

    try {
      // Create temporary character for preview
      const tempCharacter = {
        id: 'preview',
        systemInstruction: systemInstruction.trim()
      };

      const response = await getAIResponse(previewPrompt, 'preview');

      // Apply response style
      let formattedResponse = response;
      if (responseStyle === 'uppercase') {
        formattedResponse = response.toUpperCase();
      } else if (responseStyle === 'lowercase') {
        formattedResponse = response.toLowerCase();
      }

      setPreviewResponse(formattedResponse);
    } catch (error) {
      console.error('Preview failed:', error);
      showStatus('error', 'Preview failed - check system instruction');
      setPreviewResponse('ERROR: Failed to generate preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const toggleTrait = (trait: string) => {
    setPersonalityTraits(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  const addGlitchMessage = () => {
    if (newGlitchMessage.trim() && !glitchMessages.includes(newGlitchMessage.trim())) {
      setGlitchMessages([...glitchMessages, newGlitchMessage.trim()]);
      setNewGlitchMessage('');
    }
  };

  const removeGlitchMessage = (index: number) => {
    setGlitchMessages(glitchMessages.filter((_, i) => i !== index));
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleEditCharacter = (character: CustomCharacter) => {
    setCharacterName(character.name);
    setDescription(character.description);
    setEra(character.era);
    setKnowledgeCutoff(character.knowledgeCutoff);
    setSystemInstruction(character.systemInstruction);
    setVoicePrompt(character.voicePrompt);
    setResponseStyle(character.responseStyle);
    setPersonalityTraits(character.personalityTraits);
    setGlitchMessages(character.glitchMessages);
    setActiveTab('create');
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
          maxWidth: '900px',
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
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-primary)' }}>
            🎭 CHARACTER CREATOR
          </h2>
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

        {/* Status Message */}
        {statusMessage && (
          <div
            style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: statusMessage.type === 'success' ? '#10b981' : '#ef4444',
              color: '#fff',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid var(--color-border)' }}>
          {(['create', 'gallery'] as TabType[]).map((tab) => (
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
              {tab === 'create' && '✏️ Create New'}
              {tab === 'gallery' && '📚 My Characters'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '400px' }}>
          {/* Create Tab */}
          {activeTab === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Basic Information */}
              <div>
                <h3 style={{ color: 'var(--color-primary)', marginBottom: '10px' }}>Basic Information</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      Character Name * (3-50 chars)
                    </label>
                    <input
                      type="text"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      maxLength={50}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-text)',
                        border: `1px solid ${errors.name ? '#ef4444' : 'var(--color-border)'}`,
                        fontFamily: 'monospace',
                      }}
                      placeholder="e.g., CYBER-SAGE"
                    />
                    {errors.name && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{errors.name}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      Description * (50-300 chars) - {description.length}/300
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={300}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-text)',
                        border: `1px solid ${errors.description ? '#ef4444' : 'var(--color-border)'}`,
                        fontFamily: 'monospace',
                        resize: 'vertical',
                      }}
                      placeholder="Brief description of the character's personality and purpose..."
                    />
                    {errors.description && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{errors.description}</div>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>
                        Era * (1960-2025)
                      </label>
                      <input
                        type="number"
                        value={era}
                        onChange={(e) => setEra(parseInt(e.target.value))}
                        min={1960}
                        max={2025}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: 'var(--color-background)',
                          color: 'var(--color-text)',
                          border: `1px solid ${errors.era ? '#ef4444' : 'var(--color-border)'}`,
                          fontFamily: 'monospace',
                        }}
                      />
                      {errors.era && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{errors.era}</div>}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>
                        Knowledge Cutoff * (1960-2025)
                      </label>
                      <input
                        type="number"
                        value={knowledgeCutoff}
                        onChange={(e) => setKnowledgeCutoff(parseInt(e.target.value))}
                        min={1960}
                        max={2025}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: 'var(--color-background)',
                          color: 'var(--color-text)',
                          border: `1px solid ${errors.knowledgeCutoff ? '#ef4444' : 'var(--color-border)'}`,
                          fontFamily: 'monospace',
                        }}
                      />
                      {errors.knowledgeCutoff && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{errors.knowledgeCutoff}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personality Configuration */}
              <div>
                <h3 style={{ color: 'var(--color-primary)', marginBottom: '10px' }}>Personality Configuration</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      System Instruction * (50-500 chars) - {systemInstruction.length}/500
                    </label>
                    <textarea
                      value={systemInstruction}
                      onChange={(e) => setSystemInstruction(e.target.value)}
                      maxLength={500}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-text)',
                        border: `1px solid ${errors.systemInstruction ? '#ef4444' : 'var(--color-border)'}`,
                        fontFamily: 'monospace',
                        resize: 'vertical',
                      }}
                      placeholder="Define how the character should behave, respond, and interact..."
                    />
                    {errors.systemInstruction && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{errors.systemInstruction}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      Voice Prompt * (20-200 chars) - {voicePrompt.length}/200
                    </label>
                    <textarea
                      value={voicePrompt}
                      onChange={(e) => setVoicePrompt(e.target.value)}
                      maxLength={200}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-text)',
                        border: `1px solid ${errors.voicePrompt ? '#ef4444' : 'var(--color-border)'}`,
                        fontFamily: 'monospace',
                        resize: 'vertical',
                      }}
                      placeholder="e.g., Speak in a robotic monotone with occasional static"
                    />
                    {errors.voicePrompt && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{errors.voicePrompt}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Response Style *</label>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      {(['uppercase', 'mixedcase', 'lowercase'] as ResponseStyleType[]).map((style) => (
                        <label key={style} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="responseStyle"
                            checked={responseStyle === style}
                            onChange={() => setResponseStyle(style)}
                          />
                          <span>{style === 'uppercase' ? 'ALL CAPS' : style === 'mixedcase' ? 'Mixed Case' : 'lowercase'}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      Personality Traits * (select at least 1)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {PERSONALITY_TRAITS.map((trait) => (
                        <label
                          key={trait}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '8px',
                            backgroundColor: personalityTraits.includes(trait) ? 'var(--color-primary)' : 'transparent',
                            color: personalityTraits.includes(trait) ? 'var(--color-background)' : 'var(--color-text)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={personalityTraits.includes(trait)}
                            onChange={() => toggleTrait(trait)}
                          />
                          <span style={{ textTransform: 'capitalize' }}>{trait}</span>
                        </label>
                      ))}
                    </div>
                    {errors.personalityTraits && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{errors.personalityTraits}</div>}
                  </div>
                </div>
              </div>

              {/* Glitch Messages */}
              <div>
                <h3 style={{ color: 'var(--color-primary)', marginBottom: '10px' }}>Glitch Messages (Optional)</h3>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={newGlitchMessage}
                    onChange={(e) => setNewGlitchMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGlitchMessage()}
                    placeholder="e.g., SYSTEM OVERLOAD"
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={addGlitchMessage}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-background)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                    }}
                  >
                    Add
                  </button>
                </div>

                <div style={{ maxHeight: '100px', overflow: 'auto', border: '1px solid var(--color-border)', padding: '10px' }}>
                  {glitchMessages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text)', opacity: 0.6 }}>
                      No glitch messages added
                    </p>
                  ) : (
                    glitchMessages.map((msg, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                        <span>{msg}</span>
                        <button
                          onClick={() => removeGlitchMessage(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '16px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Preview Panel */}
              <div>
                <h3 style={{ color: 'var(--color-primary)', marginBottom: '10px' }}>Preview</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    value={previewPrompt}
                    onChange={(e) => setPreviewPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePreview()}
                    placeholder="Enter a test message..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace',
                    }}
                  />

                  <button
                    onClick={handlePreview}
                    disabled={isPreviewLoading || !systemInstruction || !previewPrompt.trim()}
                    style={{
                      padding: '10px',
                      backgroundColor: isPreviewLoading ? '#666' : 'var(--color-border)',
                      color: 'var(--color-text)',
                      border: 'none',
                      cursor: isPreviewLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'monospace',
                    }}
                  >
                    {isPreviewLoading ? 'TESTING...' : '🧪 Test Character'}
                  </button>

                  {previewResponse && (
                    <div
                      style={{
                        padding: '15px',
                        backgroundColor: 'var(--color-background)',
                        border: '2px solid var(--color-accent)',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        minHeight: '80px',
                      }}
                    >
                      {previewResponse}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-background)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                  }}
                >
                  {editCharacter ? '💾 UPDATE CHARACTER' : '💾 SAVE CHARACTER'}
                </button>

                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('gallery');
                  }}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div>
              {existingCharacters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <p style={{ fontSize: '48px', marginBottom: '20px' }}>🎭</p>
                  <p style={{ fontSize: '18px', color: 'var(--color-text)', marginBottom: '10px' }}>
                    No custom characters yet
                  </p>
                  <p style={{ color: 'var(--color-text)', opacity: 0.6, marginBottom: '20px' }}>
                    Create your first AI character to get started!
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-background)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '16px',
                    }}
                  >
                    ✏️ CREATE CHARACTER
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {existingCharacters.map((character) => (
                    <div
                      key={character.id}
                      style={{
                        border: '2px solid var(--color-border)',
                        padding: '15px',
                        backgroundColor: 'var(--color-background)',
                      }}
                    >
                      <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-primary)' }}>
                        {character.name}
                      </h4>
                      <p style={{ fontSize: '12px', marginBottom: '10px', opacity: 0.8 }}>
                        {character.description}
                      </p>
                      <div style={{ fontSize: '11px', marginBottom: '10px', opacity: 0.6 }}>
                        <div>Era: {character.era}</div>
                        <div>Style: {character.responseStyle}</div>
                        <div>Traits: {character.personalityTraits.length}</div>
                        <div>Used: {character.usageCount} times</div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleEditCharacter(character)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-background)',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(character.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
