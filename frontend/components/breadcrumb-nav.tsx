'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

export function BreadcrumbNav() {
  const pathname = usePathname();
  
  // Don't show on login or root
  if (pathname === '/login' || pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return { href, label, isLast: index === segments.length - 1 };
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground py-3 px-1">
      <Link 
        href="/dashboard" 
        className="flex items-center gap-1.5 hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 hover:bg-accent"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-xs font-medium">Home</span>
      </Link>
      
      {breadcrumbs.map((crumb) => (
        <Fragment key={crumb.href}>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground text-xs px-1.5 py-0.5">{crumb.label}</span>
          ) : (
            <Link 
              href={crumb.href}
              className="hover:text-foreground transition-colors text-xs rounded-md px-1.5 py-0.5 hover:bg-accent"
            >
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
