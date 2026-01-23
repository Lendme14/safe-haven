import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Clock, Settings, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSafety } from '@/contexts/SafetyContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/contacts', icon: Users, label: 'Contacts' },
  { path: '/playback', icon: Headphones, label: 'Playback' },
  { path: '/timeline', icon: Clock, label: 'Timeline' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { isActive, isRecording } = useSafety();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-effect border-t border-border/50 z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isNavActive = location.pathname === path;
          const isHome = path === '/';
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200",
                isNavActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isNavActive && "scale-110"
                )} />
                {isHome && isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
                )}
                {path === '/playback' && isRecording && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full recording-pulse border-2 border-background" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-opacity",
                isNavActive ? "opacity-100" : "opacity-70"
              )}>
                {label}
              </span>
              {isNavActive && (
                <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
