import React from 'react';
import { useStore } from '../../context/StoreContext';
import { isNavActive } from '../../lib/routing';
import { cn } from '../../lib/utils';

export interface AppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  activeClassName?: string;
}

/**
 * Client-side link that still exposes a real `href` (unique slug) for
 * open-in-new-tab, copy-link, and crawlers.
 */
export const AppLink = React.forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ href, className, activeClassName, onClick, children, ...props }, ref) => {
    const { currentPath, navigate } = useStore();
    const active = isNavActive(currentPath, href);

    return (
      <a
        ref={ref}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(className, active && activeClassName)}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (event.button !== 0) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          navigate(href);
        }}
        {...props}
      >
        {children}
      </a>
    );
  }
);

AppLink.displayName = 'AppLink';
