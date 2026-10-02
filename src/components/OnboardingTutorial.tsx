/**
 * Onboarding Tutorial Component (v1.8.0)
 *
 * First-time tour of the enhanced UI (steps in ONBOARDING_STEPS).
 * Features:
 * - Each step highlights its `[data-tour-id]` target and sits next to it;
 *   a missing target centres the card instead of breaking the step
 * - Optional click/type actions, completed by the real event on the target
 *   (and waived when the target is absent)
 * - Skip and restart functionality
 * - localStorage persistence
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Screen reader support with ARIA announcements
 * - Celebration animation on completion
 */

import React, { useState, useEffect, useEffectEvent, useCallback, useRef } from 'react';
import { OnboardingStep, OnboardingState } from '@/types';
import { ONBOARDING_STEPS } from '@/constants';

const ONBOARDING_COMPLETED_KEY = 'sbaitso_onboarding_completed';
const ONBOARDING_STATE_KEY = 'sbaitso_onboarding_state';

/** Returns the first element matching a step selector, or null (also for invalid selectors). */
function findTarget(selector: string | undefined): HTMLElement | null {
  if (!selector) return null;
  try {
    return document.querySelector<HTMLElement>(selector);
  } catch {
    return null;
  }
}

/** Places the card below a target in the top half of the screen, above one in the bottom half. */
function anchoredCardStyle(rect: DOMRect): React.CSSProperties {
  const gap = 12;
  const below = rect.top + rect.height / 2 < window.innerHeight / 2;
  return {
    position: 'fixed',
    left: 0,
    right: 0,
    marginInline: 'auto',
    width: 'min(42rem, calc(100vw - 2rem))',
    ...(below
      ? { top: Math.min(rect.bottom + gap, window.innerHeight - 160) }
      : { bottom: Math.min(window.innerHeight - rect.top + gap, window.innerHeight - 160) }),
  };
}

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
  onAction?: (action: string) => void;
}

export default function OnboardingTutorial({ onComplete, onSkip, onAction }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const announcerRef = useRef<HTMLDivElement>(null);

  const step: OnboardingStep = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  // Announce step change to screen readers
  const announceStep = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
    }
  }, []);

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(ONBOARDING_STATE_KEY);
      if (savedState) {
        const state: OnboardingState = JSON.parse(savedState);
        if (!state.completed && !state.skipped) {
          setCurrentStep(state.currentStep);
        }
      }
    } catch (e) {
      console.error('Failed to load onboarding state:', e);
    }
  }, []);

  // Save state on step change
  useEffect(() => {
    try {
      const state: OnboardingState = {
        currentStep,
        completed: false,
        skipped: false,
        startedAt: Date.now(),
      };
      localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
  }, [currentStep]);

  // Announce current step
  useEffect(() => {
    const message = `Step ${currentStep + 1} of ${ONBOARDING_STEPS.length}: ${step.title}`;
    announceStep(message);
  }, [currentStep, step.title, announceStep]);

  // Locate the step's target. A missing target (or an invalid selector) is
  // not an error: the card is simply centred.
  useEffect(() => {
    const element = findTarget(step.target);
    if (!element) {
      setTargetRect(null);
      return;
    }
    element.scrollIntoView?.({ block: 'nearest' });
    const measure = () => setTargetRect(element.getBoundingClientRect());
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.target]);

  // A step that requires an action is completed by that action on its
  // target. If the target is missing the action cannot be performed, so the
  // step must not block the tutorial.
  useEffect(() => {
    const element = step.action ? findTarget(step.actionTarget ?? step.target) : null;
    if (!step.action || !element || step.action === 'wait') {
      setActionCompleted(true);
      return;
    }
    setActionCompleted(false);
    const eventName = step.action === 'type' ? 'input' : 'click';
    const done = () => setActionCompleted(true);
    element.addEventListener(eventName, done, { once: true });
    return () => element.removeEventListener(eventName, done);
  }, [step]);

  // Keyboard navigation. An effect event always sees the latest state and
  // handlers, so the listener is attached once.
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (celebrating) return; // Disable during celebration

    if (e.key === 'Escape') {
      if (showSkipConfirm) {
        setShowSkipConfirm(false);
      } else if (step.skipable) {
        setShowSkipConfirm(true);
      }
    }

    if (e.key === 'Enter' && !showSkipConfirm) {
      if (actionCompleted || !step.action) {
        handleNext();
      }
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
      setActionCompleted(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setActionCompleted(false);
    }
  };

  const handleComplete = () => {
    setCelebrating(true);
    announceStep('Tutorial completed! Congratulations!');

    // Save completion state
    try {
      const state: OnboardingState = {
        currentStep: ONBOARDING_STEPS.length - 1,
        completed: true,
        skipped: false,
        startedAt: Date.now(),
        completedAt: Date.now(),
      };
      localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state));
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (e) {
      console.error('Failed to save completion state:', e);
    }

    // Show celebration for 2 seconds
    setTimeout(() => {
      setCelebrating(false);
      onComplete();
    }, 2000);
  };

  const handleSkip = () => {
    try {
      const state: OnboardingState = {
        currentStep,
        completed: false,
        skipped: true,
        startedAt: Date.now(),
      };
      localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state));
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (e) {
      console.error('Failed to save skip state:', e);
    }

    announceStep('Tutorial skipped');
    onSkip();
  };

  const handleActionComplete = () => {
    setActionCompleted(true);
    announceStep('Action completed! You can proceed to the next step.');
  };

  // Notify parent component of user actions
  const notifyAction = (actionType: string) => {
    if (onAction) {
      onAction(actionType);
    }
    if (step.action === actionType) {
      handleActionComplete();
    }
  };

  // Render celebration animation
  if (celebrating) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        role="dialog"
        aria-label="Tutorial completed"
      >
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-green-400 mb-2">Congratulations!</h2>
          <p className="text-xl text-white">Tutorial Completed</p>
          <div className="mt-4 text-yellow-400">
            <div className="inline-block animate-pulse">★</div>
            <div className="inline-block animate-pulse delay-100">★</div>
            <div className="inline-block animate-pulse delay-200">★</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-content"
      aria-live="polite"
    >
      {/* Screen reader announcer */}
      <div ref={announcerRef} className="sr-only" role="status" aria-live="assertive" aria-atomic="true" />

      {/* Highlight around the step's target (drawn above the dimmed backdrop) */}
      {targetRect && (
        <div
          data-testid="onboarding-highlight"
          aria-hidden="true"
          className="fixed pointer-events-none rounded-sm motion-safe:animate-pulse"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.8), 0 0 24px rgba(251, 191, 36, 0.5)',
          }}
        />
      )}

      {/* Main tutorial card: next to the target when there is one, centred otherwise */}
      <div
        data-testid="onboarding-card"
        data-placement={targetRect ? 'anchored' : 'center'}
        className="bg-blue-900 border-4 border-blue-500 rounded-lg max-w-2xl w-full shadow-2xl"
        style={targetRect ? anchoredCardStyle(targetRect) : undefined}
      >
        {/* Header */}
        <div className="bg-blue-800 border-b-4 border-blue-500 p-4">
          <h2 id="onboarding-title" className="text-2xl font-bold text-white text-center">
            {step.title}
          </h2>
          <div className="mt-2 text-center text-sm text-blue-200">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </div>

          {/* Progress bar */}
          <div className="mt-3 bg-blue-950 rounded-full h-2 overflow-hidden">
            <div
              className="bg-yellow-400 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={ONBOARDING_STEPS.length}
              aria-label={`Progress: step ${currentStep + 1} of ${ONBOARDING_STEPS.length}`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p id="onboarding-content" className="text-lg text-white whitespace-pre-line leading-relaxed">
            {step.content}
          </p>

          {/* Action indicator */}
          {step.action && !actionCompleted && (
            <div className="mt-4 p-3 bg-yellow-900 border-2 border-yellow-500 rounded-sm">
              <p className="text-yellow-200 font-semibold">
                {step.action === 'click' && '👆 Click the highlighted element to continue'}
                {step.action === 'type' && '⌨️ Type in the input field to continue'}
                {step.action === 'wait' && '⏳ Wait for the action to complete'}
              </p>
              {step.actionPlaceholder && <p className="text-yellow-300 text-sm mt-1">{step.actionPlaceholder}</p>}
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="bg-blue-800 border-t-4 border-blue-500 p-4 flex justify-between items-center">
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
            aria-label="Previous step"
          >
            ← Previous
          </button>

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Skip button */}
            {step.skipable && !showSkipConfirm && (
              <button
                onClick={() => setShowSkipConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-sm hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
                aria-label="Skip tutorial"
              >
                Skip Tutorial
              </button>
            )}

            {/* Skip confirmation */}
            {showSkipConfirm && (
              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 bg-red-700 text-white font-semibold rounded-sm hover:bg-red-800 focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
                  aria-label="Confirm skip tutorial"
                >
                  Yes, Skip
                </button>
                <button
                  onClick={() => setShowSkipConfirm(false)}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-sm hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
                  aria-label="Cancel skip"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Next button */}
            {!showSkipConfirm && (
              <button
                onClick={handleNext}
                disabled={step.action !== undefined && !actionCompleted}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
                aria-label={isLastStep ? 'Complete tutorial' : 'Next step'}
              >
                {isLastStep ? 'Complete ✓' : 'Next →'}
              </button>
            )}
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="bg-blue-950 p-2 text-center text-xs text-blue-400 border-t border-blue-700">
          <span className="hidden sm:inline">
            Press <kbd className="px-1 py-0.5 bg-blue-800 rounded-sm">Enter</kbd> to continue •{' '}
          </span>
          {step.skipable && (
            <span>
              Press <kbd className="px-1 py-0.5 bg-blue-800 rounded-sm">Esc</kbd> to skip
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Check if onboarding has been completed
 */
export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Reset onboarding state (for "Restart Tutorial")
 */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    localStorage.removeItem(ONBOARDING_STATE_KEY);
  } catch (e) {
    console.error('Failed to reset onboarding:', e);
  }
}
