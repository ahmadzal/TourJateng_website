"use client";
import Link from "next/link";
// Using native <img> for logo to avoid optimizer issues
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from '@/lib/auth-context';
import UserAvatar from '@/components/UserAvatar';
import ClientOnly from '@/components/ClientOnly';
import { useBrowserAPIs } from '@/hooks/useBrowserAPIs';

function LogoImage() {
  const [err, setErr] = useState(false);
  if (err) {
    return <span className="text-lg font-semibold text-[#2563EB]">TourJateng</span>;
  }

  return (
    <img
      src="/images/Tourjateng.png"
      alt="Tourjateng"
      width={140}
      height={40}
      className="object-contain"
      onError={() => setErr(true)}
    />
  );
}

const navItems: { label: string; href: string }[] = [
  { label: "Beranda", href: "/" },
  { label: "Destinasi Wisata", href: "/destinasi" },
  { label: "Forum Diskusi", href: "/forum" },
  { label: "Artikel", href: "/artikel" },
  { label: "Tentang Kami", href: "/tentang" },
  { label: "ChatBot AI", href: "/chatbot" },
];

export default function Navbar() {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, userProfile, loading, signOut } = useAuth();
  const { window: safeWindow, document: safeDocument } = useBrowserAPIs();

  // Debug: Log auth state changes
  useEffect(() => {
    console.log('🔔 Navbar - Auth state:', { 
      user: !!user, 
      userProfile: !!userProfile, 
      loading,
      email: user?.email,
      name: userProfile?.full_name 
    });
  }, [user, userProfile, loading]);

  // toggle scrolled state when user scrolls so we can change navbar style
  useEffect(() => {
    if (!safeWindow) return;
    
    const onScroll = () => setScrolled(safeWindow.scrollY > 10);
    onScroll();
    safeWindow.addEventListener("scroll", onScroll, { passive: true });
    return () => safeWindow.removeEventListener("scroll", onScroll);
  }, [safeWindow]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!safeDocument) return;
    
    const handleClickOutside = () => {
      setUserMenuOpen(false);
    };

    if (userMenuOpen) {
      safeDocument.addEventListener('click', handleClickOutside);
      return () => safeDocument.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen, safeDocument]);

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors ${scrolled ? 'bg-white/60 backdrop-blur-sm border-b' : 'bg-white'}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo - visible on desktop only */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              {/* Show image if available; fallback to text if loading/error */}
              <LogoImage />
            </Link>
          </div>

          {/* Center: Nav links - desktop only */}
          <nav className="hidden lg:flex lg:flex-1 lg:justify-center">
            <ul className="flex items-center gap-6 text-sm font-medium">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`relative px-1 py-2 pb-3 transition-colors duration-150 group ${
                        isActive
                          ? "text-[#2563EB] font-semibold"
                          : "text-gray-700 hover:text-[#2563EB]"
                      }`}
                    >
                      {item.label}
                      {/* Underline effect */}
                      <span className={`absolute bottom-1 left-0 h-0.5 bg-[#2563EB] transition-all duration-300 ease-in-out ${
                        isActive 
                          ? "w-full" 
                          : "w-0 group-hover:w-full"
                      }`}></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile/Tablet menu button - positioned at right, hidden when sidebar is open */}
          {!mobileOpen && (
            <div className="lg:hidden flex items-center ml-auto">
              <button
                aria-label="Toggle menu"
                onClick={() => setMobileOpen(true)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}

          {/* Right: Auth section - desktop only */}
          <div className="hidden lg:flex items-center gap-4" suppressHydrationWarning>
            <ClientOnly 
              fallback={
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
                </div>
              }
            >
              {loading ? (
                // Loading state
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
                </div>
              ) : user ? (
              // User is logged in - show profile dropdown
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full bg-white p-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {/* Avatar */}
                  <UserAvatar
                    src={userProfile?.avatar_url}
                    name={userProfile?.full_name}
                    email={user.email}
                    size="md"
                  />
                  
                  {/* Name - hidden on small screens */}
                  <span className="hidden sm:block font-medium text-gray-700">
                    {userProfile?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                  
                  {/* Dropdown arrow */}
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                      {/* User info */}
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {userProfile?.full_name || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      {/* Menu items */}
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <svg className="mr-3 h-4 w-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil Saya
                      </Link>
                      
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => {
                            signOut();
                            setUserMenuOpen(false);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                        >
                          Keluar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // User not logged in - show auth links
              <>
                <Link href="/login" className="text-sm text-gray-800 hover:text-sky-600">
                  Masuk
                </Link>

                <Link
                  href="/register"
                  className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1F40C7]"
                >
                  Daftar
                </Link>
              </>
            )}
            </ClientOnly>
          </div>
        </div>
      </div>
    </header>
    <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    {/* spacer so page content doesn't go under the fixed header */}
    <div className="h-16" aria-hidden />
    </>
  );
}

/* Mobile dropdown menu (renders under header when open) */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, userProfile, signOut } = useAuth();
  const pathname = usePathname() || "/";
  
  if (!open) return null;

  return (
    <div className="lg:hidden">
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 top-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-white shadow-xl overflow-y-auto flex flex-col">
        <div className="px-4 py-6 flex-1 flex flex-col">
          {/* Logo at top of sidebar with close button */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link href="/" onClick={onClose} className="flex items-center">
                <LogoImage />
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Auth section for mobile - moved to top */}
          <div suppressHydrationWarning className="mb-4">
            <ClientOnly 
              fallback={
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              }
            >
              {user ? (
            <div className="mb-4 pb-4 border-b border-gray-200">
              {/* User info - clickable to profile */}
              <Link 
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg hover:from-blue-100 hover:to-sky-100 transition-all cursor-pointer group"
              >
                <UserAvatar
                  src={userProfile?.avatar_url}
                  name={userProfile?.full_name}
                  email={user.email}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide group-hover:text-[#2563EB] transition-colors">
                    PROFILE USER
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      {userProfile?.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    {userProfile?.active_badge_id && userProfile?.badge_icon_url && (
                      <img 
                        src={userProfile.badge_icon_url} 
                        alt="User Badge"
                        className="h-4 w-4 sm:h-5 sm:w-5 object-contain flex-shrink-0"
                        title="Badge"
                      />
                    )}
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400 group-hover:text-[#2563EB] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="mb-4 pb-4 border-b border-gray-200 space-y-3">
              <Link 
                href="/login" 
                onClick={onClose} 
                className="block px-4 py-2.5 text-sm sm:text-base text-gray-700 text-center border-2 border-gray-300 rounded-lg hover:border-[#2563EB] hover:text-[#2563EB] transition-colors font-medium"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                onClick={onClose} 
                className="block px-4 py-2.5 text-sm sm:text-base text-white bg-[#2563EB] rounded-lg text-center hover:bg-[#1F53C4] transition-colors font-medium shadow-md"
              >
                Daftar
              </Link>
            </div>
          )}
          </ClientOnly>
          </div>
          
          {/* Navigation items - after auth section */}
          <ul className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link 
                    href={item.href} 
                    onClick={onClose} 
                    className={`block px-4 py-2.5 text-sm sm:text-base rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-[#2563EB] font-semibold"
                        : "text-gray-700 hover:bg-gray-100 hover:text-[#2563EB]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          {/* Logout button at bottom - only for logged in users */}
          {user && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm sm:text-base text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
