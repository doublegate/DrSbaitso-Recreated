import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen, fireEvent, act } from '@testing-library/react';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import { ONBOARDING_STEPS } from '@/constants';
import { APP_SHORTCUTS, shortcutLabel } from '@/utils/shortcuts';

const enhancedSource = readFileSync(path.resolve(import.meta.dirname, '../../src/EnhancedApp.tsx'), 'utf8');

/** True when at least one comma-separated part of the selector names something EnhancedApp renders. */
function selectorExistsInEnhancedApp(selector: string): boolean {
  return selector.split(',').some((part) => {
    const tour = /\[data-tour-id="([^"]+)"\]/.exec(part);
    if (tour) return enhancedSource.includes(`data-tour-id="${tour[1]}"`);
    const label = /\[aria-label\^="([^"]+)"\]/.exec(part);
    if (label) return enhancedSource.includes(label[1]);
    const id = /^\s*#([\w-]+)\s*$/.exec(part);
    if (id) return enhancedSource.includes(`id="${id[1]}"`);
    return false;
  });
}

describe('ONBOARDING_STEPS', () => {
  it('targets only elements the enhanced UI actually renders', () => {
    const missing = ONBOARDING_STEPS.flatMap((step) =>
      [step.target, step.actionTarget]
        .filter((selector): selector is string => Boolean(selector))
        .filter((selector) => !selectorExistsInEnhancedApp(selector))
        .map((selector) => `${step.id}: ${selector}`)
    );
    expect(missing).toEqual([]);
    expect(ONBOARDING_STEPS.filter((s) => s.target).length).toBeGreaterThan(4);
  });

  it('does not claim a sample conversation was loaded', () => {
    expect(ONBOARDING_STEPS.some((s) => /sample conversation/i.test(s.content))).toBe(false);
  });

  it('only mentions shortcuts that exist, in their Alt+Shift form', () => {
    const valid = new Set(APP_SHORTCUTS.map((s) => shortcutLabel(s.id)));
    for (const step of ONBOARDING_STEPS) {
      expect(step.content).not.toMatch(/Ctrl\+|Cmd\+/);
      for (const match of step.content.matchAll(/Alt\+Shift\+[A-Z]/g)) {
        expect(valid.has(match[0]), `${step.id}: ${match[0]}`).toBe(true);
      }
    }
  });

  it('has no step that requires an action the overlay would block', () => {
    expect(ONBOARDING_STEPS.every((s) => s.action === undefined)).toBe(true);
  });
});

describe('OnboardingTutorial', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('centres the card when a step target is missing', () => {
    render(<OnboardingTutorial onComplete={() => {}} onSkip={() => {}} />);
    // Step 2 targets the character button, which is not rendered here.
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByTestId('onboarding-card')).toHaveAttribute('data-placement', 'center');
    expect(screen.queryByTestId('onboarding-highlight')).toBeNull();
  });

  it('anchors the card and highlights the target when it exists', () => {
    const target = document.createElement('button');
    target.setAttribute('data-tour-id', 'character-selection');
    document.body.appendChild(target);

    render(<OnboardingTutorial onComplete={() => {}} onSkip={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByTestId('onboarding-card')).toHaveAttribute('data-placement', 'anchored');
    expect(screen.getByTestId('onboarding-highlight')).toBeInTheDocument();
  });

  it('can be completed from start to finish', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<OnboardingTutorial onComplete={onComplete} onSkip={() => {}} />);
    for (let i = 0; i < ONBOARDING_STEPS.length - 1; i++) {
      const next = screen.getByRole('button', { name: 'Next step' });
      expect(next).toBeEnabled();
      fireEvent.click(next);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Complete tutorial' }));
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not show raw CSS selectors to the user', () => {
    render(<OnboardingTutorial onComplete={() => {}} onSkip={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.queryByText(/data-tour-id/)).toBeNull();
  });
});
