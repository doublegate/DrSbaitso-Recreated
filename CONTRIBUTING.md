# Contributing to Dr. Sbaitso Recreated

Thank you for your interest in contributing to Dr. Sbaitso Recreated! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- **Be respectful**: Treat everyone with respect and kindness
- **Be constructive**: Provide helpful feedback and suggestions
- **Be collaborative**: Work together to improve the project
- **Be inclusive**: Welcome contributors of all backgrounds and experience levels

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Personal or political attacks
- Publishing others' private information
- Any conduct that could be considered inappropriate in a professional setting

### Reporting

If you experience or witness unacceptable behavior, please report it by opening an issue or contacting the maintainers directly.

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Git**: Version 2.x or higher
- **Gemini API Key**: Get one free at [Google AI Studio](https://aistudio.google.com/apikey)

### First-Time Contributors

1. **Star the repository** ⭐ to show your support
2. **Fork the repository** to your GitHub account
3. **Read the documentation** in the `docs/` directory
4. **Look for good first issues** labeled with `good first issue` or `help wanted`
5. **Join discussions** in GitHub Discussions or Issues

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/DrSbaitso-Recreated.git
cd DrSbaitso-Recreated

# Add the original repository as upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/DrSbaitso-Recreated.git
```

### 2. Install Dependencies

```bash
# Install all npm dependencies
npm install
```

### 3. Environment Setup

```bash
# Create .env.local file
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# Verify the setup
npm run typecheck
```

### 4. Start Development Server

```bash
# Start Vite dev server (port 3000)
npm run dev

# In another terminal, run tests in watch mode
npm test
```

### 5. Verify Setup

- Open http://localhost:3000 in your browser
- You should see the name entry screen
- Enter a name and start a conversation to verify API connectivity
- Check that audio plays correctly

---

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

- **Bug fixes**: Fix issues in existing code
- **New features**: Implement features from the [ROADMAP.md](ROADMAP.md)
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Code quality**: Refactoring, optimization, or cleanup
- **Translations**: Add multi-language support (future)
- **Design**: Improve UI/UX or create assets
- **Examples**: Create example use cases or tutorials

### Finding Work

1. **Check existing issues**: Look for issues labeled:
   - `good first issue` - Great for newcomers
   - `help wanted` - We need contributors
   - `bug` - Something isn't working
   - `enhancement` - New feature or request
   - `documentation` - Improvements or additions

2. **Check the roadmap**: See [ROADMAP.md](ROADMAP.md) for planned features

3. **Propose new ideas**: Open an issue to discuss your idea before implementing

### Before You Start

- **Check for duplicates**: Search existing issues and PRs
- **Discuss first**: For major changes, open an issue to discuss your approach
- **One PR per feature**: Keep pull requests focused on a single issue
- **Update documentation**: Document new features or changes

---

## Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Use explicit types
function calculateHealth(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length;
}

// ❌ Bad: Avoid `any` and implicit types
function calculateHealth(sessions) {
  return sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length;
}

// ✅ Good: Use interfaces for complex types
interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  border: string;
  accent: string;
}

// ✅ Good: Use descriptive variable names
const isUserAuthenticated = checkAuth();
const hasValidSubscription = checkSubscription();

// ❌ Bad: Avoid single-letter or unclear names (except loop indices)
const ua = checkAuth();
const vs = checkSubscription();
```

### React Component Guidelines

```typescript
// ✅ Good: Functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ✅ Good: Use custom hooks for logic reuse
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// ✅ Good: Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveOperation(data);
}, [data]);
```

### Code Organization

```
src/
├── components/           # React components
│   ├── VoiceInput.tsx           # Feature components
│   ├── VoiceInput.test.tsx      # Component tests
│   └── index.ts                 # Re-exports
├── utils/                # Utility functions
│   ├── audio.ts                 # Audio processing
│   ├── emotionDetection.ts      # Emotion analysis
│   └── index.ts                 # Re-exports
├── hooks/                # Custom React hooks
│   ├── useKeyboardShortcuts.ts
│   └── index.ts
├── services/             # API and external services
│   ├── geminiService.ts
│   └── index.ts
├── types.ts              # Global TypeScript types
└── constants.ts          # App-wide constants
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `VoiceInput.tsx`, `EmotionVisualizer.tsx`)
- **Utilities**: camelCase (e.g., `emotionDetection.ts`, `topicAnalysis.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useKeyboardShortcuts.ts`)
- **Tests**: Match source file with `.test.ts` suffix (e.g., `VoiceInput.test.tsx`)
- **Types**: PascalCase for interfaces/types (e.g., `Message`, `ThemeColors`)

### Code Style

We use **TypeScript strict mode**. Follow these guidelines:

- **Indentation**: 2 spaces (configured in `tsconfig.json`)
- **Quotes**: Single quotes for strings (except JSON)
- **Semicolons**: Always use semicolons
- **Line length**: Aim for <100 characters, max 120
- **Comments**: Use JSDoc for functions and complex logic
- **Imports**: Group and sort imports (React → libraries → local)

```typescript
// ✅ Good: Organized imports
import React, { useState, useEffect } from 'react';
import { calculateScore } from 'some-library';

import { Message } from '@/types';
import { detectEmotions } from '@/utils/emotionDetection';
import { Button } from '@/components/Button';

// ✅ Good: JSDoc documentation
/**
 * Analyzes the emotional content of a message
 * @param text - The message text to analyze
 * @returns Emotion analysis with dominant emotion and scores
 */
export function analyzeMessage(text: string): EmotionAnalysis {
  // Implementation
}
```

---

## Testing Guidelines

### Test Coverage Requirements

- **New features**: 80%+ coverage required
- **Bug fixes**: Add test case that reproduces the bug
- **Refactoring**: Maintain or improve existing coverage

### Writing Component Tests

```typescript
// components/VoiceInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { VoiceInput } from './VoiceInput';

describe('VoiceInput Component', () => {
  beforeEach(() => {
    // Mock Web Speech API
    (window as any).SpeechRecognition = function() {
      return mockRecognitionInstance;
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    (window as any).SpeechRecognition = undefined;
  });

  it('should start listening when button clicked', () => {
    const onTranscript = vi.fn();
    render(<VoiceInput onTranscript={onTranscript} />);

    const button = screen.getByRole('button', { name: /start/i });
    fireEvent.click(button);

    // Assertions
    expect(mockRecognitionInstance.start).toHaveBeenCalled();
  });
});
```

### Writing Unit Tests

```typescript
// utils/emotionDetection.test.ts
import { describe, it, expect } from 'vitest';
import { detectEmotions } from './emotionDetection';

describe('emotionDetection', () => {
  it('should detect joy from happy keywords', () => {
    const result = detectEmotions('I am so happy and excited!');

    expect(result.dominant).toBe('joy');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.scores.joy).toBeGreaterThan(result.scores.sadness);
  });

  it('should handle empty text', () => {
    const result = detectEmotions('');

    expect(result.dominant).toBe('neutral');
    expect(result.confidence).toBe(0);
  });
});
```

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- VoiceInput.test.tsx

# Run E2E tests
npm run test:e2e
```

### Test Best Practices

- **Describe blocks**: Group related tests
- **Clear test names**: Use "should..." format
- **Arrange-Act-Assert**: Structure tests clearly
- **Mock external dependencies**: Isolate unit tests
- **Test edge cases**: Empty inputs, errors, boundary conditions
- **Avoid test interdependence**: Each test should be independent

---

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or tooling changes
- **ci**: CI/CD changes

### Examples

```bash
# Feature
feat(voice-input): add interim transcript display

# Bug fix
fix(emotion-viz): resolve canvas rendering issue on Firefox

# Documentation
docs(contributing): add testing guidelines

# Refactoring
refactor(audio): simplify bit-crushing algorithm

# Performance
perf(topic-flow): optimize D3 force simulation

# Test
test(templates): add search functionality tests

# Multiple paragraphs
feat(templates): add custom template creator

Implement visual template builder with drag-and-drop
prompt ordering. Users can now create templates with:
- Custom prompt sequences
- Placeholder variables
- Conditional branching

Closes #123
```

### Commit Message Rules

- **Use imperative mood**: "add feature" not "added feature"
- **First line ≤50 chars**: Keep subject line concise
- **Body ≤72 chars per line**: Wrap long descriptions
- **Reference issues**: Use "Closes #123" or "Fixes #456"
- **Explain why, not what**: Code shows what, commit explains why

---

## Pull Request Process

### Before Submitting

1. **Update your fork**: Sync with upstream main branch
2. **Create feature branch**: From main, not from other branches
3. **Write tests**: Add tests for new functionality
4. **Run tests**: Ensure all tests pass locally
5. **Update docs**: Document new features or changes
6. **Build successfully**: Verify production build works
7. **Check TypeScript**: Run `npm run typecheck`

### Pull Request Template

```markdown
## Description

Brief description of the changes and why they're needed.

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Related Issues

Closes #123
Relates to #456

## Changes Made

- Added voice input UI component
- Implemented real-time transcription
- Added 29 unit tests

## Testing

- [ ] All existing tests pass
- [ ] New tests added and passing
- [ ] Manual testing completed
- [ ] E2E tests pass (if applicable)

## Screenshots (if applicable)

![Voice Input UI](link-to-screenshot)

## Checklist

- [ ] Code follows project coding standards
- [ ] Self-review of code completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Build completes successfully
```

### Review Process

1. **Automated checks**: CI runs tests and builds
2. **Code review**: Maintainer reviews code
3. **Requested changes**: Address feedback and push updates
4. **Approval**: Maintainer approves PR
5. **Merge**: Maintainer merges to main branch

### After Merge

- **Delete branch**: Clean up merged feature branch
- **Update local**: Pull latest main branch
- **Celebrate**: You've contributed! 🎉

---

## Documentation

### Where to Add Documentation

- **README.md**: Overview, features, quick start
- **CHANGELOG.md**: Version history and changes
- **docs/**: Detailed feature and technical documentation
- **Code comments**: Inline documentation for complex logic
- **JSDoc**: Function and class documentation

### Documentation Style

```typescript
/**
 * Analyzes conversation topics and their relationships
 *
 * @param messages - Array of conversation messages to analyze
 * @param options - Optional configuration for topic analysis
 * @returns Analysis result with topics, transitions, and statistics
 *
 * @example
 * ```ts
 * const messages = [
 *   { author: 'user', text: 'I want to talk about stress' },
 *   { author: 'ai', text: 'Tell me about your stress' }
 * ];
 * const analysis = analyzeTopics(messages);
 * console.log(analysis.dominant); // 'stress'
 * ```
 */
export function analyzeTopics(
  messages: Message[],
  options?: TopicAnalysisOptions
): ConversationAnalysis {
  // Implementation
}
```

### Documentation Checklist

- [ ] Clear and concise writing
- [ ] Code examples provided
- [ ] Screenshots/GIFs for UI features
- [ ] Link to related documentation
- [ ] Keep up-to-date with code changes

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions, ideas, and general discussion
- **Pull Requests**: Code contributions and reviews

### Getting Help

- **Documentation**: Check `docs/` directory first
- **Issues**: Search existing issues
- **Discussions**: Ask questions in GitHub Discussions
- **Code**: Read source code and tests for examples

### Recognition

Contributors are recognized in:
- GitHub contributors page
- CHANGELOG.md (for significant contributions)
- Release notes

---

## Development Workflow

### Typical Contribution Flow

```bash
# 1. Sync your fork
git checkout main
git pull upstream main
git push origin main

# 2. Create feature branch
git checkout -b feat/voice-input-ui

# 3. Make changes and commit
git add .
git commit -m "feat(voice-input): add interim transcript display"

# 4. Run tests
npm test
npm run test:run

# 5. Build and verify
npm run build
npm run typecheck

# 6. Push to your fork
git push origin feat/voice-input-ui

# 7. Create pull request on GitHub

# 8. Address review feedback
git add .
git commit -m "fix: address review feedback"
git push origin feat/voice-input-ui

# 9. After merge, cleanup
git checkout main
git pull upstream main
git branch -d feat/voice-input-ui
git push origin --delete feat/voice-input-ui
```

---

## License

By contributing to Dr. Sbaitso Recreated, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have questions about contributing, please:
1. Check this document thoroughly
2. Search existing issues and discussions
3. Open a new discussion for general questions
4. Open an issue for specific bugs or features

---

**Thank you for contributing to Dr. Sbaitso Recreated!**

*TELL ME ABOUT YOUR CONTRIBUTIONS.*

Made with ❤️ by the community
