'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  Search,
  Settings,
  Moon,
  Sun,
  Braces,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tool {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const tools: Tool[] = [
  {
    name: 'ES Query',
    href: '/es-query',
    icon: <Braces className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const pathname = usePathname();

  const toggleTheme = () => {
    setIsDark(!isDark);
    // In a real app, this would toggle the theme globally
    document.documentElement.classList.toggle('dark');
  };

  return (
    <aside
      className={cn(
        'glass flex h-full flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight">DevTools</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'rounded-lg p-2 transition-colors hover:bg-muted',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Search Bar */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted">
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </button>
        </div>
      )}

      {/* Tools List */}
      <nav className="flex-1 space-y-1 px-2">
        {!collapsed && (
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </p>
        )}
        {tools.map((tool) => {
          const isActive = pathname === tool.href;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'accent-gradient text-white shadow-lg shadow-violet-500/25'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? tool.name : undefined}
            >
              {tool.icon}
              {!collapsed && <span>{tool.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <div
          className={cn(
            'flex items-center gap-2',
            collapsed ? 'flex-col' : 'justify-between'
          )}
        >
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          {!collapsed && (
            <button
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
