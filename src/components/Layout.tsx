import React from 'react';
import BottomNav from './BottomNav';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNav = true }) => {
  const { isActive } = useSafety();

  return (
    <div className={cn(
      "min-h-screen bg-background transition-colors duration-500",
      isActive && "bg-success/5"
    )}>
      <main className={cn("pb-20", !showNav && "pb-0")}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default Layout;
