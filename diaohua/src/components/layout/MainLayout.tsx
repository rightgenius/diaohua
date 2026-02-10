import { useConfigStore } from '@/stores/configStore';
import { Navigate } from 'react-router-dom';
import { Settings, Home, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isConfigured } = useConfigStore();

  if (!isConfigured) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-16 border-r bg-muted/10 flex flex-col items-center py-4 gap-2">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
          雕
        </div>
        
        <NavButton icon={<Home size={20} />} to="/" tooltip="首页" />
        <NavButton icon={<Plus size={20} />} to="/requirement" tooltip="新建需求" />
        <NavButton icon={<FolderOpen size={20} />} to="/" tooltip="项目" />
        
        <div className="flex-1" />
        
        <NavButton icon={<Settings size={20} />} to="/settings" tooltip="设置" />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function NavButton({
  icon,
  to,
  tooltip,
}: {
  icon: React.ReactNode;
  to: string;
  tooltip: string;
}) {
  const isActive = window.location.pathname === to;
  
  return (
    <a
      href={to}
      className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative group',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      title={tooltip}
    >
      {icon}
      <span className="absolute left-12 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        {tooltip}
      </span>
    </a>
  );
}
