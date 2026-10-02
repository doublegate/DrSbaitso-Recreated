/** Enhanced mode's first screen: asks for the user's name, then waits while the greeting is prepared. */
import type { RefObject } from 'react';

export interface NameEntryProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** True while the greeting is being synthesised. */
  isPreparing: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function NameEntry({ value, onChange, onSubmit, isPreparing, inputRef }: NameEntryProps) {
  return (
    <main
      id="main-content"
      className="bg-(--color-background) text-(--color-text) font-mono w-full h-dvh flex flex-col items-center justify-center p-4"
      role="main"
      aria-label="Dr. Sbaitso name entry screen"
    >
      <div className="w-full max-w-md text-center">
        {isPreparing ? (
          <p
            className="text-xl mb-4 animate-pulse"
            role="status"
            aria-live="polite"
          >
            PREPARING SESSION...
          </p>
        ) : (
          <>
            <label htmlFor="name-input" className="text-xl mb-4 block">
              PLEASE ENTER YOUR NAME:
            </label>
            <div className="flex items-center justify-center">
              <span className="text-yellow-300 mr-2" aria-hidden="true">{'>'}</span>
              <input
                id="name-input"
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSubmit();
                  }
                }}
                className="bg-transparent border-none text-yellow-300 w-3/4 focus:outline-hidden placeholder-gray-500 text-center"
                placeholder="TYPE NAME AND PRESS ENTER"
                disabled={isPreparing}
                aria-label="Enter your name"
                aria-describedby="name-input-help"
              />
            </div>
            <span id="name-input-help" className="sr-only">
              Type your name and press Enter to begin your session with Dr. Sbaitso
            </span>
          </>
        )}
      </div>
    </main>
  );
}
