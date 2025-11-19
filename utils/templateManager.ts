/**
 * Template Management Utilities (v1.11.0 - Option C4)
 *
 * Manages conversation templates for quick-start conversations.
 * Supports predefined and custom templates with categories.
 */

export interface ConversationTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  icon: string;
  prompts: TemplatePrompt[];
  tags: string[];
  isCustom: boolean;
  createdAt: number;
  useCount: number;
}

export interface TemplatePrompt {
  id: string;
  text: string;
  order: number;
  isOptional: boolean;
  placeholder?: string;
}

export type TemplateCategory =
  | 'therapy'
  | 'casual'
  | 'technical'
  | 'creative'
  | 'educational'
  | 'custom';

/**
 * Built-in conversation templates
 */
export const BUILT_IN_TEMPLATES: ConversationTemplate[] = [
  {
    id: 'therapy-stress',
    name: 'Stress Management',
    category: 'therapy',
    description: 'Structured conversation for managing stress and anxiety',
    icon: '😰',
    prompts: [
      {
        id: 'intro',
        text: "I've been feeling stressed lately",
        order: 1,
        isOptional: false
      },
      {
        id: 'source',
        text: 'It seems to come from work and personal life',
        order: 2,
        isOptional: false
      },
      {
        id: 'symptoms',
        text: "I've noticed I'm sleeping poorly and feeling anxious",
        order: 3,
        isOptional: true
      },
      {
        id: 'coping',
        text: "I'd like to learn better coping strategies",
        order: 4,
        isOptional: false
      }
    ],
    tags: ['stress', 'anxiety', 'mental health', 'coping'],
    isCustom: false,
    createdAt: Date.now(),
    useCount: 0
  },
  {
    id: 'therapy-relationships',
    name: 'Relationship Issues',
    category: 'therapy',
    description: 'Explore relationship challenges and communication',
    icon: '💔',
    prompts: [
      {
        id: 'intro',
        text: "I'm having trouble in my relationship",
        order: 1,
        isOptional: false
      },
      {
        id: 'issue',
        text: 'We seem to argue about the same things repeatedly',
        order: 2,
        isOptional: false
      },
      {
        id: 'feelings',
        text: 'It makes me feel frustrated and misunderstood',
        order: 3,
        isOptional: true
      },
      {
        id: 'goal',
        text: 'I want to improve our communication',
        order: 4,
        isOptional: false
      }
    ],
    tags: ['relationships', 'communication', 'conflict', 'emotions'],
    isCustom: false,
    createdAt: Date.now(),
    useCount: 0
  },
  {
    id: 'casual-checkin',
    name: 'Daily Check-in',
    category: 'casual',
    description: 'Casual conversation about your day',
    icon: '☀️',
    prompts: [
      {
        id: 'greeting',
        text: 'Hello! How are you today?',
        order: 1,
        isOptional: false
      },
      {
        id: 'day',
        text: "I'd like to talk about my day",
        order: 2,
        isOptional: false
      },
      {
        id: 'highlights',
        text: 'Here are some highlights from today...',
        order: 3,
        isOptional: true,
        placeholder: 'Share what went well'
      },
      {
        id: 'challenges',
        text: 'I also faced some challenges...',
        order: 4,
        isOptional: true,
        placeholder: 'Share any difficulties'
      }
    ],
    tags: ['daily', 'casual', 'mood', 'reflection'],
    isCustom: false,
    createdAt: Date.now(),
    useCount: 0
  },
  {
    id: 'technical-problem',
    name: 'Problem Solving',
    category: 'technical',
    description: 'Structured approach to solving a problem',
    icon: '🧩',
    prompts: [
      {
        id: 'problem',
        text: 'I have a problem I need help thinking through',
        order: 1,
        isOptional: false
      },
      {
        id: 'details',
        text: 'Here are the details...',
        order: 2,
        isOptional: false,
        placeholder: 'Describe the problem'
      },
      {
        id: 'constraints',
        text: 'The constraints or limitations are...',
        order: 3,
        isOptional: true,
        placeholder: 'Any limitations?'
      },
      {
        id: 'ideas',
        text: 'I have some initial ideas...',
        order: 4,
        isOptional: true,
        placeholder: 'Share your thoughts'
      }
    ],
    tags: ['problem-solving', 'analytical', 'brainstorming'],
    isCustom: false,
    createdAt: Date.now(),
    useCount: 0
  },
  {
    id: 'creative-brainstorm',
    name: 'Creative Brainstorming',
    category: 'creative',
    description: 'Generate ideas for creative projects',
    icon: '💡',
    prompts: [
      {
        id: 'project',
        text: "I'm working on a creative project",
        order: 1,
        isOptional: false
      },
      {
        id: 'goal',
        text: 'My goal is to...',
        order: 2,
        isOptional: false,
        placeholder: 'What do you want to create?'
      },
      {
        id: 'inspiration',
        text: "I'm inspired by...",
        order: 3,
        isOptional: true,
        placeholder: 'Share your influences'
      },
      {
        id: 'blockers',
        text: "I'm stuck on...",
        order: 4,
        isOptional: true,
        placeholder: 'Any creative blocks?'
      }
    ],
    tags: ['creativity', 'brainstorming', 'ideas', 'projects'],
    isCustom: false,
    createdAt: Date.now(),
    useCount: 0
  },
  {
    id: 'educational-learning',
    name: 'Learning Session',
    category: 'educational',
    description: 'Explore a topic you want to learn about',
    icon: '📚',
    prompts: [
      {
        id: 'topic',
        text: 'I want to learn about...',
        order: 1,
        isOptional: false,
        placeholder: 'What topic interests you?'
      },
      {
        id: 'knowledge',
        text: 'I currently know...',
        order: 2,
        isOptional: true,
        placeholder: 'Your current understanding'
      },
      {
        id: 'questions',
        text: 'My main questions are...',
        order: 3,
        isOptional: false,
        placeholder: 'What do you want to know?'
      },
      {
        id: 'application',
        text: 'I want to apply this knowledge to...',
        order: 4,
        isOptional: true,
        placeholder: 'How will you use it?'
      }
    ],
    tags: ['learning', 'education', 'knowledge', 'questions'],
    isCustom: false,
    createdAt: Date.now(),
    useCount: 0
  }
];

/**
 * Template Manager Class
 */
export class TemplateManager {
  private static STORAGE_KEY = 'dr_sbaitso_templates';
  private static USAGE_KEY = 'dr_sbaitso_template_usage';

  /**
   * Get all templates (built-in + custom)
   */
  static getAllTemplates(): ConversationTemplate[] {
    const customTemplates = this.getCustomTemplates();
    const usage = this.getUsageStats();

    // Merge and update use counts
    return [...BUILT_IN_TEMPLATES, ...customTemplates].map(template => ({
      ...template,
      useCount: usage[template.id] || 0
    }));
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: TemplateCategory): ConversationTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Get template by ID
   */
  static getTemplate(id: string): ConversationTemplate | null {
    return this.getAllTemplates().find(t => t.id === id) || null;
  }

  /**
   * Create custom template
   */
  static createTemplate(template: Omit<ConversationTemplate, 'id' | 'isCustom' | 'createdAt' | 'useCount'>): ConversationTemplate {
    const newTemplate: ConversationTemplate = {
      ...template,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      isCustom: true,
      createdAt: Date.now(),
      useCount: 0
    };

    const customTemplates = this.getCustomTemplates();
    customTemplates.push(newTemplate);
    this.saveCustomTemplates(customTemplates);

    return newTemplate;
  }

  /**
   * Update template
   */
  static updateTemplate(id: string, updates: Partial<ConversationTemplate>): boolean {
    const customTemplates = this.getCustomTemplates();
    const index = customTemplates.findIndex(t => t.id === id);

    if (index === -1) return false;

    customTemplates[index] = {
      ...customTemplates[index],
      ...updates,
      id: customTemplates[index].id, // Prevent ID change
      isCustom: true // Keep as custom
    };

    this.saveCustomTemplates(customTemplates);
    return true;
  }

  /**
   * Delete template
   */
  static deleteTemplate(id: string): boolean {
    const customTemplates = this.getCustomTemplates();
    const filtered = customTemplates.filter(t => t.id !== id);

    if (filtered.length === customTemplates.length) return false;

    this.saveCustomTemplates(filtered);
    return true;
  }

  /**
   * Increment template use count
   */
  static recordUsage(id: string): void {
    const usage = this.getUsageStats();
    usage[id] = (usage[id] || 0) + 1;
    localStorage.setItem(this.USAGE_KEY, JSON.stringify(usage));
  }

  /**
   * Get most used templates
   */
  static getMostUsed(limit: number = 5): ConversationTemplate[] {
    return this.getAllTemplates()
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, limit);
  }

  /**
   * Search templates
   */
  static searchTemplates(query: string): ConversationTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export template as JSON
   */
  static exportTemplate(id: string): string | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  static importTemplate(json: string): ConversationTemplate | null {
    try {
      const template = JSON.parse(json);

      // Validate required fields
      if (!template.name || !template.category || !template.prompts) {
        return null;
      }

      return this.createTemplate({
        name: template.name,
        category: template.category,
        description: template.description || '',
        icon: template.icon || '📝',
        prompts: template.prompts,
        tags: template.tags || []
      });
    } catch (error) {
      console.error('[TemplateManager] Import failed:', error);
      return null;
    }
  }

  /**
   * Get custom templates from localStorage
   */
  private static getCustomTemplates(): ConversationTemplate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[TemplateManager] Failed to load custom templates:', error);
      return [];
    }
  }

  /**
   * Save custom templates to localStorage
   */
  private static saveCustomTemplates(templates: ConversationTemplate[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('[TemplateManager] Failed to save custom templates:', error);
    }
  }

  /**
   * Get usage statistics
   */
  private static getUsageStats(): Record<string, number> {
    try {
      const stored = localStorage.getItem(this.USAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Clear all custom templates
   */
  static clearCustomTemplates(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Clear usage statistics
   */
  static clearUsageStats(): void {
    localStorage.removeItem(this.USAGE_KEY);
  }
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: TemplateCategory): string {
  const icons: Record<TemplateCategory, string> = {
    therapy: '🧠',
    casual: '💬',
    technical: '⚙️',
    creative: '🎨',
    educational: '📖',
    custom: '✨'
  };

  return icons[category] || '📝';
}

/**
 * Get category color
 */
export function getCategoryColor(category: TemplateCategory): string {
  const colors: Record<TemplateCategory, string> = {
    therapy: '#a855f7',    // Purple
    casual: '#22c55e',     // Green
    technical: '#3b82f6',  // Blue
    creative: '#f59e0b',   // Amber
    educational: '#06b6d4', // Cyan
    custom: '#ec4899'      // Pink
  };

  return colors[category] || '#6b7280';
}

export default TemplateManager;
