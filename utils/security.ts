/**
 * Security Utilities (v1.11.0 - Option B4)
 *
 * Provides:
 * - Input sanitization (XSS prevention)
 * - URL validation
 * - HTML sanitization
 * - Rate limiting
 * - Content Security Policy configuration
 * - Secure token generation
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML tags and encodes special characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Sanitize HTML content while preserving safe tags
 * Allows basic formatting tags but removes scripts and event handlers
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script tags and content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol in links
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (except for images)
  sanitized = sanitized.replace(/(<(?!img\s)[^>]+\s+(?:href|src)\s*=\s*["']?)data:/gi, '$1');

  // Allowed tags: p, br, strong, em, u, a, ul, ol, li, h1-h6
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'];
  const tagPattern = new RegExp(`</?(?!(?:${allowedTags.join('|')})\\b)[^>]+>`, 'gi');
  sanitized = sanitized.replace(tagPattern, '');

  return sanitized;
}

/**
 * Validate URL to prevent malicious redirects
 * Only allows http, https, and relative URLs
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;

  try {
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }

    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Block common malicious patterns
    const maliciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /about:/i
    ];

    return !maliciousPatterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * Sanitize URL by validating and removing dangerous parts
 */
export function sanitizeUrl(url: string): string {
  if (!isValidUrl(url)) {
    return '#';
  }

  return url;
}

/**
 * Rate Limiter Class
 * Prevents abuse by limiting requests per time window
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed for given identifier
   * Returns true if allowed, false if rate limit exceeded
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove requests outside the time window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);

    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      console.warn(`[RateLimiter] Rate limit exceeded for: ${identifier}`);
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);

    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requests.clear();
  }
}

/**
 * Content Security Policy Configuration
 * Returns CSP directives for secure application
 */
export function getCSPDirectives(): Record<string, string[]> {
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite dev and Tailwind CDN
      'https://cdn.tailwindcss.com',
      'https://aistudiocdn.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and inline styles
      'https://cdn.tailwindcss.com'
    ],
    'img-src': [
      "'self'",
      'data:', // Required for canvas toDataURL
      'blob:',
      'https:'
    ],
    'font-src': [
      "'self'",
      'data:'
    ],
    'connect-src': [
      "'self'",
      'https://generativelanguage.googleapis.com', // Gemini API
      'https://aistudiocdn.com' // CDN for dependencies
    ],
    'media-src': [
      "'self'",
      'blob:',
      'data:'
    ],
    'worker-src': [
      "'self'",
      'blob:'
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };
}

/**
 * Convert CSP directives to header string
 */
export function cspToString(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Get all security headers for production
 */
export function getSecurityHeaders(): Record<string, string> {
  const cspDirectives = getCSPDirectives();

  return {
    // Content Security Policy
    'Content-Security-Policy': cspToString(cspDirectives),

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection (legacy browsers)
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': 'geolocation=(), microphone=(self), camera=()',

    // HSTS (HTTPS only)
    // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
}

/**
 * Generate cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash string using SHA-256
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate Content Security Policy compliance
 * Checks if content violates CSP directives
 */
export function validateCSPCompliance(content: string): {
  isCompliant: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check for inline event handlers
  if (/<[^>]+\s+on\w+\s*=/i.test(content)) {
    violations.push('Inline event handlers detected (onclick, onerror, etc.)');
  }

  // Check for javascript: protocol
  if (/javascript:/i.test(content)) {
    violations.push('javascript: protocol detected');
  }

  // Check for eval() usage
  if (/\beval\s*\(/i.test(content)) {
    violations.push('eval() usage detected');
  }

  // Check for data: URLs (except in img tags)
  const dataUrlPattern = /(?<!<img[^>]*\s+src=["'])data:/gi;
  if (dataUrlPattern.test(content)) {
    violations.push('data: URLs detected outside of images');
  }

  return {
    isCompliant: violations.length === 0,
    violations
  };
}

/**
 * Escape regex special characters in string
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove null bytes from string (prevents null byte injection)
 */
export function removeNullBytes(input: string): string {
  return input.replace(/\0/g, '');
}

/**
 * Validate and sanitize file name
 * Prevents directory traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove null bytes
  let sanitized = removeNullBytes(fileName);

  // Remove directory traversal patterns
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[/\\]/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

export default {
  sanitizeInput,
  sanitizeHtml,
  sanitizeUrl,
  isValidUrl,
  RateLimiter,
  getCSPDirectives,
  cspToString,
  getSecurityHeaders,
  generateSecureToken,
  hashString,
  validateCSPCompliance,
  escapeRegex,
  removeNullBytes,
  sanitizeFileName
};
