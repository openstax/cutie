import { useState, useRef, useEffect, useCallback } from 'react';
import type { ExampleGroup } from './example-items';
import { ExpandMoreIcon } from './icons';
import './ExampleDropdown.css';

interface ExampleDropdownProps {
  groups: ExampleGroup[];
  onSelect: (exampleName: string) => void;
  disabled?: boolean;
}

export function ExampleDropdown({ groups, onSelect, disabled }: ExampleDropdownProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const allItems = groups.flatMap(g => g.items);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // Focus first item when menu opens
  useEffect(() => {
    if (open) {
      const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      first?.focus();
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    const current = document.activeElement as HTMLElement;
    const index = items.indexOf(current);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = index < items.length - 1 ? index + 1 : 0;
        items[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = index > 0 ? index - 1 : items.length - 1;
        items[prev]?.focus();
        break;
      }
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  const handleSelect = (name: string) => {
    setOpen(false);
    onSelect(name);
  };

  return (
    <div className="example-dropdown" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        className="example-dropdown-trigger"
        onClick={() => setOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Load example item"
      >
        Load Example <ExpandMoreIcon />
      </button>
      {open && (
        <div ref={menuRef} className="example-dropdown-menu" role="menu">
          {groups.map(group => (
            <div key={group.label} role="group" aria-label={group.label}>
              <div className="example-dropdown-group-label">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.name}
                  className="example-dropdown-item"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => handleSelect(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ))}
          <div className="example-dropdown-count">{allItems.length} items</div>
        </div>
      )}
    </div>
  );
}
