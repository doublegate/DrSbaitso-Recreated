import { GeminiServiceError } from '../services/geminiService';

const GENERIC_FAULTS = [
  'UNEXPECTED DATA STREAM CORRUPTION. PLEASE REBOOT.',
  'INTERNAL PROCESSOR FAULT. PLEASE TRY AGAIN.',
  'MEMORY ADDRESS CONFLICT. PLEASE RESTATE YOUR PROBLEM.',
  'IRQ CONFLICT AT ADDRESS 220H. PLEASE TRY AGAIN.',
];

/**
 * In-character error text for a failed reply. Known failure modes get a
 * message that tells the user what to do; anything else gets a generic
 * 1991-style fault.
 */
export function retroErrorMessage(error: unknown, random: () => number = Math.random): string {
  if (error instanceof GeminiServiceError) {
    switch (error.code) {
      case 'RATE_LIMITED':
        return 'SYSTEM OVERLOAD. TOO MANY REQUESTS. PLEASE WAIT A MOMENT AND TRY AGAIN.';
      case 'UNAVAILABLE':
        return 'MY PROCESSOR IS BUSY. PLEASE TRY AGAIN IN A MOMENT.';
      case 'NETWORK_ERROR':
        return 'CARRIER LOST. PLEASE CHECK YOUR CONNECTION.';
      case 'NOT_CONFIGURED':
        return 'SYSTEM NOT CONFIGURED. THE OPERATOR MUST INSTALL AN API KEY.';
      default:
        break;
    }
  }
  return GENERIC_FAULTS[Math.floor(random() * GENERIC_FAULTS.length)];
}
