import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <aside>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? 'Expand menu' : 'Collapse menu'}
          </button>
          <Sidebar collapsed={collapsed} />
        </aside>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
