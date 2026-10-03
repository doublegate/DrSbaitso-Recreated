/**
 * A labelled toolbar menu (disclosure pattern): a button that reveals a list
 * of labelled actions. Escape or a click elsewhere closes it; arrow keys move
 * between items; focus returns to the trigger on close.
 */
import { useEffect, useId, useRef, useState } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  /** Shown as pressed (a panel that is currently open). */
  active?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export default function MenuGroup({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    itemRefs.current.find((el) => el && !el.disabled)?.focus();
    const onPointer = (e: PointerEvent | MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close(true);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const els = itemRefs.current.filter((el): el is HTMLButtonElement => !!el && !el.disabled);
    const index = els.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (index + 1) % els.length : (index - 1 + els.length) % els.length;
    els[next]?.focus();
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="enh-menu-trigger"
      >
        {label}
        <span aria-hidden="true" className="ml-1 text-xs">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div id={menuId} className="enh-menu" role="group" aria-label={label}>
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              disabled={item.disabled}
              aria-pressed={item.active === undefined ? undefined : item.active}
              onClick={() => {
                close(false);
                item.onSelect();
              }}
              className="enh-menu-item"
              data-keyboard-hint={item.shortcut}
            >
              {item.icon && (
                <span aria-hidden="true" className="w-5 inline-block">
                  {item.icon}
                </span>
              )}
              <span className="grow text-left">{item.label}</span>
              {item.shortcut && <kbd className="enh-kbd">{item.shortcut}</kbd>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
