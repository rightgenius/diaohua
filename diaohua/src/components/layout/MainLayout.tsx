import { useConfigStore } from '@/stores/configStore';
import { Settings, Home, Plus, FolderOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Link, useLocation } from 'react-router-dom';
import { NotificationCenter } from '@/components/notification/NotificationCenter';
import { useState, useCallback } from 'react';
import type { Notification } from '@/types';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { isConfigured } = useConfigStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-16 border-r bg-muted/10 flex flex-col items-center py-4 gap-2">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
          雕
        </div>
        
        <NavButton 
          icon={<Home size={20} />} 
          to="/" 
          tooltip="首页" 
          isActive={location.pathname === '/'}
        />
        <NavButton 
          icon={<Plus size={20} />} 
          to="/requirement" 
          tooltip="新建需求" 
          isActive={location.pathname.startsWith('/requirement')}
        />
        <NavButton 
          icon={<FolderOpen size={20} />} 
          to="/" 
          tooltip="项目" 
          isActive={false}
        />
        
        <div className="flex-1" />
        
        {/* Config Status Indicator */}
        {!isConfigured && (
          <div className="w-2 h-2 bg-amber-500 rounded-full mb-2" title="未配置 API" />
        )}
        
        <NavButton 
          icon={<Settings size={20} />} 
          to="/settings" 
          tooltip="设置" 
          isActive={location.pathname === '/settings'}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top bar with notifications */}
        <div className="h-14 border-b flex items-center justify-end px-4 gap-2">
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        </div>
        
        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavButton({
  icon,
  to,
  tooltip,
  isActive,
}: {
  icon: React.ReactNode;
  to: string;
  tooltip: string;
  isActive: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative group',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      title={tooltip}
    >
      {icon}
      <span className="absolute left-12 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border shadow-sm">
        {tooltip}
      </span>
    </Link>
  );
}
