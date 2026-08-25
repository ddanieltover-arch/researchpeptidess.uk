import React from 'react';
import { Home, LayoutGrid, Search, User, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { parseAppPath, ROUTES } from '../../lib/routing';
import { cn } from '../../lib/utils';

const itemClass = (active: boolean) =>
  cn(
    'flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4353FF]/50 focus-visible:ring-inset',
    active ? 'text-[#4353FF]' : 'text-slate-500'
  );

function NavItem({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const { navigate } = useStore();

  return (
    <a
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={itemClass(active)}
      onClick={(event) => {
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

export const MobileBottomNav: React.FC = () => {
  const { currentPath, cart, cartDrawerOpen, setCartDrawerOpen, isAccountAuthenticated } = useStore();
  const route = parseAppPath(currentPath);

  if (route.kind === 'admin' || route.kind === 'admin-login') {
    return null;
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shopActive = route.kind === 'shop' || route.kind === 'category' || route.kind === 'product';
  const accountHref = isAccountAuthenticated ? ROUTES.account : ROUTES.accountLogin;
  const accountActive = route.kind === 'account' || route.kind === 'account-login';
  const cartActive = cartDrawerOpen || route.kind === 'cart' || route.kind === 'checkout';

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-7xl items-stretch">
        <NavItem href={ROUTES.home} active={route.kind === 'home'} label="Home">
          <Home className="h-5 w-5" strokeWidth={route.kind === 'home' ? 2.4 : 1.8} />
          <span>Home</span>
        </NavItem>

        <NavItem href={ROUTES.shop} active={shopActive} label="Shop">
          <LayoutGrid className="h-5 w-5" strokeWidth={shopActive ? 2.4 : 1.8} />
          <span>Shop</span>
        </NavItem>

        <NavItem href={ROUTES.search} active={route.kind === 'search'} label="Search">
          <Search className="h-5 w-5" strokeWidth={route.kind === 'search' ? 2.4 : 1.8} />
          <span>Search</span>
        </NavItem>

        <NavItem
          href={accountHref}
          active={accountActive}
          label={isAccountAuthenticated ? 'Account' : 'Sign in'}
        >
          <User className="h-5 w-5" strokeWidth={accountActive ? 2.4 : 1.8} />
          <span>{isAccountAuthenticated ? 'Account' : 'Sign in'}</span>
        </NavItem>

        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          className={itemClass(cartActive)}
          aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" strokeWidth={cartActive ? 2.4 : 1.8} />
            <span
              className={cn(
                'absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white',
                cartCount > 0 ? 'bg-[#4353FF]' : 'bg-slate-300'
              )}
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          </span>
          <span>Cart</span>
        </button>
      </div>
    </nav>
  );
};
