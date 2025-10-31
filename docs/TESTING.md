# Testing Guide

Comprehensive testing documentation for Dr. Sbaitso Recreated using Vitest.

**Version**: 1.7.0
**Last Updated**: 2025-10-30

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Commands](#test-commands)
3. [Writing Tests](#writing-tests)
4. [Test Coverage](#test-coverage)
5. [Mocking](#mocking)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)

---

## Quick Start

### Installation

Dependencies are pre-installed. If needed:

```bash
npm install
```

### Run Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode (interactive) |
| `npm run test:run` | Run all tests once (CI mode) |
| `npm run test:ui` | Open Vitest UI in browser |
| `npm run test:coverage` | Generate coverage report |
| `npm run typecheck` | TypeScript type checking only |

### Watch Mode Features

- **Auto-rerun**: Tests rerun on file changes
- **Filter**: Press `p` to filter by filename pattern
- **Focus**: Press `t` to filter by test name
- **Coverage**: Press `c` to toggle coverage
- **Clear**: Press `r` to clear console

---

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });

  it('should update value', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.increment();
    });

    expect(result.current.value).toBe(1);
  });
});
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await fetchData();
  expect(result).toEqual({ data: 'test' });
});

it('should handle errors', async () => {
  await expect(fetchData()).rejects.toThrow('Error message');
});
```

---

## Test Coverage

### Coverage Thresholds

Current thresholds (in `vitest.config.ts`):

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### View Coverage

```bash
npm run test:coverage
```

Coverage reports generated in:
- **Terminal**: Summary table
- **HTML**: `coverage/index.html` (open in browser)
- **LCOV**: `coverage/lcov.info` (for CI tools)

### Coverage by File

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|----------
All files             |   74.32 |    68.21 |   72.45 |   74.89
 utils/               |   82.14 |    75.00 |   80.00 |   83.12
  audio.ts            |   85.71 |    78.26 |   83.33 |   86.21
  sessionManager.ts   |   78.94 |    71.42 |   76.19 |   79.31
 hooks/               |   68.42 |    62.50 |   66.67 |   69.23
  usePWA.ts           |   70.00 |    64.28 |   68.42 |   71.15
```

### Increase Coverage

Focus on untested:
1. Check coverage report: `open coverage/index.html`
2. Find red/yellow lines (untested code)
3. Write tests for those paths
4. Re-run coverage

---

## Mocking

### Mock Functions

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue(Promise.resolve(42));
mockFn.mockRejectedValue(new Error('fail'));

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mock Modules

```typescript
vi.mock('@/utils/audio', () => ({
  playAudio: vi.fn(),
  decode: vi.fn(() => new Uint8Array()),
}));
```

### Mock Timers

```typescript
vi.useFakeTimers();

// Fast-forward time
vi.advanceTimersByTime(1000);

// Run all timers
vi.runAllTimers();

// Restore real timers
vi.useRealTimers();
```

### Pre-Configured Mocks

Already mocked in `test/setup.ts`:
- AudioContext
- Web Speech API
- localStorage
- Service Worker
- matchMedia
- IntersectionObserver
- Canvas API
- Gemini API

---

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**:
```typescript
it('should set state', () => {
  component.setState({ value: 5 });
  expect(component.state.value).toBe(5);
});
```

✅ **Good**:
```typescript
it('should display new value when button clicked', () => {
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('5')).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

❌ **Bad**:
```typescript
it('works', () => { /* ... */ });
it('test 1', () => { /* ... */ });
```

✅ **Good**:
```typescript
it('should return error when input is empty', () => { /* ... */ });
it('should save session to localStorage after 60 seconds', () => { /* ... */ });
```

### 3. One Assertion Per Test (When Possible)

❌ **Bad**:
```typescript
it('should handle all operations', () => {
  expect(fn1()).toBe(1);
  expect(fn2()).toBe(2);
  expect(fn3()).toBe(3);
});
```

✅ **Good**:
```typescript
it('should add numbers', () => expect(add(1, 2)).toBe(3));
it('should subtract numbers', () => expect(sub(5, 2)).toBe(3));
it('should multiply numbers', () => expect(mul(2, 3)).toBe(6));
```

### 4. Test Edge Cases

```typescript
describe('divide', () => {
  it('should divide positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  it('should handle decimal results', () => {
    expect(divide(5, 2)).toBe(2.5);
  });
});
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  cleanup(); // React Testing Library
});
```

---

## CI/CD Integration

### GitHub Actions

Example workflow (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm run test:run
npm run typecheck
```

---

## Test Organization

### File Structure

```
test/
├── setup.ts              # Global test configuration
├── utils/
│   ├── audio.test.ts
│   └── sessionManager.test.ts
├── hooks/
│   └── usePWA.test.ts
└── components/
    └── PWAPrompts.test.tsx
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Setup file: `setup.ts`
- Describe blocks: Component/function name
- It blocks: "should do something"

---

## Troubleshooting

### Tests Not Running

1. Check Node.js version: `node --version` (18+)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Clear Vitest cache: `npx vitest --clearCache`

### Mock Not Working

1. Ensure mock is defined before imports
2. Use `vi.mock()` at top of file
3. Check mock path matches exactly
4. Verify module is actually being imported

### Coverage Not Accurate

1. Exclude test files in config
2. Ensure all files are imported
3. Run with `--coverage` flag
4. Check coverage thresholds

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Happy Testing! 🧪**
