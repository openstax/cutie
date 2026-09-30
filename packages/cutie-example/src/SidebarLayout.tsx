import { useState } from 'react';
import type { ReactNode } from 'react';

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
    <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
  </svg>
);

interface SidebarLayoutProps {
  /** The panels of the collapsible debug sidebar */
  sidebar: ReactNode;
  /** The item area beside it */
  children: ReactNode;
}

/**
 * A collapsible debug sidebar (collapsed to start) beside the item area.
 */
export function SidebarLayout({ sidebar, children }: SidebarLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {sidebarCollapsed && (
        <button
          className="sidebar-toggle floating"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </button>
      )}
      <div className="sidebar">
        <div className="header">
          <h2>Debug</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Close sidebar"
          >
            <MenuIcon />
          </button>
        </div>
        {sidebar}
      </div>

      <div className="item-area">
        {children}
      </div>
    </div>
  );
}
