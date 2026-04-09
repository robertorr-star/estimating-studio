import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, FolderOpen, Settings, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'ESTIMATES', shortLabel: 'EST', path: '/', icon: LayoutDashboard },
  { label: '+ NEW ESTIMATE', shortLabel: '+ NEW', path: '/new-estimate', icon: Plus },
  { label: 'ANALYTICS', shortLabel: 'ANALYTICS', path: '/analytics', icon: BarChart3 },
  { label: 'TEMPLATES', shortLabel: 'TMPL', path: '/templates', icon: FolderOpen },
  { label: 'SETTINGS', shortLabel: 'SETTINGS', path: '/settings', icon: Settings },
];

const NavPills = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="flex items-center gap-1 px-3 sm:px-6 py-2 border-b border-border bg-card/50 overflow-x-auto scrollbar-none">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path === '/new-estimate' && location.pathname.startsWith('/estimate/'));
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded font-heading text-[11px] sm:text-sm font-semibold tracking-wider uppercase transition-all whitespace-nowrap flex-shrink-0 ${
              isActive
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default NavPills;
