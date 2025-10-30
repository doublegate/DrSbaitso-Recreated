/**
 * SkipNav Component
 *
 * Provides skip navigation links for keyboard and screen reader users.
 * Links become visible when focused, allowing users to jump to main content areas.
 *
 * @module SkipNav
 * @since 1.4.0
 */

import React from 'react';

export interface SkipNavProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

const DEFAULT_LINKS = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#chat-input', label: 'Skip to chat input' },
  { href: '#settings', label: 'Skip to settings' }
];

export default function SkipNav({ links = DEFAULT_LINKS }: SkipNavProps) {
  return (
    <nav
      aria-label="Skip navigation"
      className="skip-nav"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-nav-link"
          style={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            background: '#3b82f6',
            color: '#ffffff',
            padding: '8px 16px',
            textDecoration: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            border: '2px solid #ffffff',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            transition: 'none'
          }}
          onFocus={(e) => {
            const target = e.target as HTMLAnchorElement;
            target.style.position = 'fixed';
            target.style.left = '8px';
            target.style.top = `${8 + index * 48}px`;
            target.style.width = 'auto';
            target.style.height = 'auto';
            target.style.overflow = 'visible';
          }}
          onBlur={(e) => {
            const target = e.target as HTMLAnchorElement;
            target.style.position = 'absolute';
            target.style.left = '-10000px';
            target.style.top = 'auto';
            target.style.width = '1px';
            target.style.height = '1px';
            target.style.overflow = 'hidden';
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
