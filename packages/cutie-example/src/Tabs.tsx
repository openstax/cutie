import { createContext, useContext, useId, type ReactNode } from 'react';

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsContextValue {
  idPrefix: string;
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabList/TabPanel must be used inside <Tabs>');
  return ctx;
}

interface TabsProps {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}

export function Tabs({ tabs, activeTab, onTabChange, children }: TabsProps) {
  const idPrefix = useId();
  return (
    <TabsContext.Provider value={{ idPrefix, tabs, activeTab, onTabChange }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabList({ ariaLabel = 'View selection' }: { ariaLabel?: string }) {
  const { idPrefix, tabs, activeTab, onTabChange } = useTabsContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      onTabChange(tabs[nextIndex].id);
      document.getElementById(`${idPrefix}-tab-${tabs[nextIndex].id}`)?.focus();
    }
  };

  return (
    <div className="tabs-left" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`${idPrefix}-tab-${tab.id}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${idPrefix}-panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={handleKeyDown}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel() {
  const { idPrefix, tabs, activeTab } = useTabsContext();
  const activePanel = tabs.find(t => t.id === activeTab);

  if (!activePanel) return null;

  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${activePanel.id}`}
      aria-labelledby={`${idPrefix}-tab-${activePanel.id}`}
      className="tab-panel"
    >
      {activePanel.content}
    </div>
  );
}
