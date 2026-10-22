import { useState, useRef, useEffect, useMemo, useId } from 'react';
import type { ExampleGroup, ExampleItem } from './example-items';
import { ExpandMoreIcon } from './icons';
import './ExampleDropdown.css';

interface ExampleDropdownProps {
  groups: ExampleGroup[];
  onSelect: (exampleName: string) => void;
  disabled?: boolean;
}

/** A keyboard-navigable row in the tree: either a group header or an example item */
type Row =
  | { kind: 'group'; label: string }
  | { kind: 'item'; item: ExampleItem; groupLabel: string };

// Every whitespace-separated term must appear in the item name, group label, or interaction types
const matchesQuery = (item: ExampleItem, groupLabel: string, terms: string[]) => {
  const haystack = [item.name, groupLabel, ...item.interactionTypes].join(' ').toLowerCase();
  return terms.every(term => haystack.includes(term));
};

export function ExampleDropdown({ groups, onSelect, disabled }: ExampleDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollToActiveRef = useRef(false);
  const idPrefix = useId();
  const treeId = `${idPrefix}-tree`;
  const rowId = (index: number) => `${idPrefix}-row-${index}`;

  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);
  const searching = query.trim() !== '';

  const filteredGroups = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return groups
      .map(group => ({
        label: group.label,
        items: group.items.filter(item => matchesQuery(item, group.label, terms)),
      }))
      .filter(group => group.items.length > 0);
  }, [groups, query]);

  // Every group is expanded while searching so all matches are visible
  const isExpanded = (label: string) => searching || expandedGroups.has(label);

  // Group headers are only navigable when not searching, since toggling is disabled then
  const rows: Row[] = filteredGroups.flatMap(group => [
    ...(searching ? [] : [{ kind: 'group' as const, label: group.label }]),
    ...(isExpanded(group.label)
      ? group.items.map(item => ({ kind: 'item' as const, item, groupLabel: group.label }))
      : []),
  ]);

  const matchCount = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);
  const activeRowId = rows.length ? rowId(activeIndex) : undefined;

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

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

  // Reset the filter and focus the search input when the menu opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      inputRef.current?.focus();
    }
  }, [open]);

  // Keep the active row visible while navigating with the keyboard. Mouse hover
  // never scrolls, since scrolling would move a different row under the pointer.
  useEffect(() => {
    if (!scrollToActiveRef.current || !activeRowId) return;
    scrollToActiveRef.current = false;
    const row = document.getElementById(activeRowId);
    // A group's treeitem wraps its children, so scroll to just its header line
    const target = row?.querySelector(':scope > .example-dropdown-group-label') ?? row;
    target?.scrollIntoView({ block: 'nearest' });
  });

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const setGroupExpanded = (label: string, expanded: boolean) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (expanded) next.add(label); else next.delete(label);
      return next;
    });
  };

  const hoverRow = (index: number) => {
    scrollToActiveRef.current = false;
    setActiveIndex(index);
  };

  const handleSelect = (name: string) => {
    setOpen(false);
    onSelect(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const count = rows.length;
    const active = rows[activeIndex];
    scrollToActiveRef.current = true;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (count) setActiveIndex(i => (i + 1) % count);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (count) setActiveIndex(i => (i - 1 + count) % count);
        break;
      case 'ArrowRight':
        // Leave caret movement alone while there is text to edit
        if (searching || active?.kind !== 'group') break;
        e.preventDefault();
        setGroupExpanded(active.label, true);
        break;
      case 'ArrowLeft': {
        if (searching || !active) break;
        e.preventDefault();
        const groupLabel = active.kind === 'group' ? active.label : active.groupLabel;
        setGroupExpanded(groupLabel, false);
        setActiveIndex(rows.findIndex(row => row.kind === 'group' && row.label === groupLabel));
        break;
      }
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(Math.max(count - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (active?.kind === 'group') setGroupExpanded(active.label, !isExpanded(active.label));
        else if (active?.kind === 'item') handleSelect(active.item.name);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  let rowIndex = 0;

  return (
    <div className="example-dropdown">
      <button
        ref={buttonRef}
        className="example-dropdown-trigger"
        onClick={() => setOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="tree"
        aria-expanded={open}
        aria-label="Load example item"
      >
        Load Example <ExpandMoreIcon />
      </button>
      {open && (
        <div ref={menuRef} className="example-dropdown-menu">
          <input
            ref={inputRef}
            className="example-dropdown-search"
            type="text"
            role="combobox"
            placeholder="Filter examples…"
            aria-label="Filter examples"
            aria-haspopup="tree"
            aria-expanded="true"
            aria-controls={treeId}
            aria-autocomplete="list"
            aria-activedescendant={activeRowId}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div id={treeId} className="example-dropdown-list" role="tree" aria-label="Examples">
            {filteredGroups.map(group => {
              const expanded = isExpanded(group.label);
              const headerIndex = searching ? undefined : rowIndex++;
              return (
                <div
                  key={group.label}
                  id={headerIndex === undefined ? undefined : rowId(headerIndex)}
                  role="treeitem"
                  aria-label={group.label}
                  aria-expanded={expanded}
                >
                  <div
                    className={`example-dropdown-group-label${headerIndex === activeIndex ? ' is-active' : ''}`}
                    aria-hidden="true"
                    onMouseDown={e => e.preventDefault()}
                    onMouseMove={() => headerIndex !== undefined && hoverRow(headerIndex)}
                    onClick={() => {
                      if (headerIndex === undefined) return;
                      setActiveIndex(headerIndex);
                      setGroupExpanded(group.label, !expanded);
                    }}
                  >
                    {!searching && (
                      <ExpandMoreIcon className={`example-dropdown-chevron${expanded ? ' is-expanded' : ''}`} />
                    )}
                    {group.label}
                    <span className="example-dropdown-group-count">{group.items.length}</span>
                  </div>
                  {expanded && (
                    <div role="group">
                      {group.items.map(item => {
                        const index = rowIndex++;
                        return (
                          <div
                            key={item.name}
                            id={rowId(index)}
                            className={`example-dropdown-item${index === activeIndex ? ' is-active' : ''}`}
                            role="treeitem"
                            onMouseDown={e => e.preventDefault()}
                            onMouseMove={() => hoverRow(index)}
                            onClick={() => handleSelect(item.name)}
                          >
                            {item.name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {matchCount === 0 && (
            <div className="example-dropdown-empty">No matching examples</div>
          )}
          <div className="example-dropdown-count" aria-live="polite">
            {searching ? `${matchCount} of ${totalCount} items` : `${totalCount} items`}
          </div>
        </div>
      )}
    </div>
  );
}
