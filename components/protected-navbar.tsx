"use client";
import { usePathname } from "next/navigation";
import Navbar from "./navbar";

export default function ProtectedNavbar() {
  const pathname = usePathname() || "/";

  // Hide navbar on auth pages and profile pages
  const hideOn = ["/login", "/register", "/forgot-password", "/confirm-registration", "/profile", "/settings", "/badges" , "/reset-password"];
  const shouldHide = hideOn.some((p) => pathname === p || pathname.startsWith(p + "/") );
  
  // Also hide on destinasi detail pages (e.g., /destinasi/1, /destinasi/2, etc.)
  const isDestinasiDetail = /^\/destinasi\/\d+/.test(pathname);

  // Also hide on artikel detail pages (e.g., /artikel/1, /artikel/2, etc.)
  const isArtikelDetail = /^\/artikel\/\d+/.test(pathname);

  // Also hide on reset-password page
  const isResetPassword = pathname === "/reset-password";
  // Also hide on forum detail pages (e.g., /forum/uuid)
  const isForumDetail = /^\/forum\/[^\/]+$/.test(pathname);

  if (shouldHide || isDestinasiDetail || isArtikelDetail || isForumDetail || isResetPassword) return null;
  return <Navbar />;
}
