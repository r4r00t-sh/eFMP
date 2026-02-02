'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { AppSidebar } from '@/components/app-sidebar';
import { Navbar } from '@/components/navbar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { PresenceClient } from '@/components/presence-client';
import { ToastConsumer } from '@/components/toast-consumer';
import { ThemeProvider } from '@/components/theme-provider';
import { ChatFab } from '@/components/chat-fab';
import { ChatSidebar } from '@/components/chat-sidebar';
import { CommandPalette } from '@/components/command-palette';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';

const publicRoutes = ['/login'];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthenticated = !!user;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Floating chat FAB + sidebar: render in portal so they're always on top and visible
  const chatWidget =
    mounted &&
    typeof document !== 'undefined' &&
    isAuthenticated &&
    !isPublicRoute
      ? createPortal(
          <>
            <ChatFab onClick={() => setChatOpen(true)} />
            <ChatSidebar open={chatOpen} onOpenChange={setChatOpen} />
          </>,
          document.body
        )
      : null;

  // Show full layout only if authenticated and not on public routes
  if (isAuthenticated && !isPublicRoute) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="efiling-theme">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-muted/30">
            <Navbar />
            <main className="flex flex-1 flex-col">
              <PresenceClient />
              <ToastConsumer />
              {/* Content container with proper spacing */}
              <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <BreadcrumbNav />
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        {chatWidget}
        <CommandPalette />
        <KeyboardShortcuts />
      </ThemeProvider>
    );
  }

  // Public routes (login, etc.) - no sidebar/navbar, no presence/toast
  return (
    <ThemeProvider defaultTheme="system" storageKey="efiling-theme">
      {children}
    </ThemeProvider>
  );
}

