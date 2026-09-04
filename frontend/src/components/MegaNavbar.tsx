"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { getDashboardRoute } from "@/config/routes";
import {
  TRANSACTION_TYPES,
  BEDROOM_QUICK_FILTERS,
  PROPERTY_TYPE_QUICK_FILTERS,
  buildPropertiesUrl,
} from "@/config/propertyCategories";
import { ChevronDown } from "lucide-react";

function PostPropertyButton({ mobile, onClick }: { mobile?: boolean; onClick?: () => void }) {
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (onClick) onClick();
    if (user?.role === "landlord" || user?.role === "agent" || user?.role === "admin") {
      router.push(getDashboardRoute(user.role).path);
    } else {
      router.push("/register");
    }
  };

  if (mobile) {
    return (
      <button
        onClick={handleClick}
        className="block w-full px-4 py-2 mt-2 text-center rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Post a Property
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
    >
      Post a Property
    </button>
  );
}

function handleLogout() {
  localStorage.clear();
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; domain=" +
    window.location.hostname;
  window.location.replace("/login");
}

// One category dropdown (Buy / Rent / Shortlet), each with real
// bed-count and property-type quick links underneath. All hrefs are
// genuine /properties?... URLs the backend actually filters on.
function CategoryMenu({ typeValue, label }: { typeValue: string; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={buildPropertiesUrl({ type: typeValue })}
        className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </Link>

      {open && (
        <div className="absolute left-0 mt-1 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-4 space-y-4 z-50">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Bedrooms
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {BEDROOM_QUICK_FILTERS.map((b) => (
                <Link
                  key={b.value}
                  href={buildPropertiesUrl({ type: typeValue, bedroom: b.value })}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                >
                  {b.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Property Type
            </h3>
            <div className="space-y-1">
              {PROPERTY_TYPE_QUICK_FILTERS.map((pt) => (
                <Link
                  key={pt.value}
                  href={buildPropertiesUrl({ type: typeValue, property_type: pt.value })}
                  className="block text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded px-2 py-1"
                >
                  {pt.label}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href={buildPropertiesUrl({ type: typeValue })}
            className="block text-xs font-semibold text-indigo-600 hover:underline pt-1 border-t border-gray-100"
          >
            View all {label} listings →
          </Link>
        </div>
      )}
    </div>
  );
}

const MegaNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, isLoading } = useAuth();
  const dashboard = getDashboardRoute(user?.role);
  const pathname = usePathname();
  const hidePostProperty = pathname === "/register";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const avatarUrl = "/default-avatar.png";
  const avatarAlt = user?.username || user?.email || "User avatar";

  return (
    <nav
      className={`fixed w-full z-50 transition-all ${
        isScrolled ? "bg-white shadow-md py-2" : "bg-white py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              Broker
            </Link>
          </div>

          {/* Desktop Navigation — real category menus */}
          <div className="hidden md:flex items-center space-x-2">
            {TRANSACTION_TYPES.map((t) => (
              <CategoryMenu key={t.value} typeValue={t.value} label={t.label} />
            ))}
            <Link
              href="/properties"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Browse All
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!hidePostProperty && <PostPropertyButton />}

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100">
                  <Image
                    src={avatarUrl}
                    alt={avatarAlt}
                    className="w-8 h-8 rounded-full object-cover"
                    width={40}
                    height={40}
                  />
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">
                    {user.username || user.email}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                  <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    My Account
                  </Link>
                  <Link href={dashboard.path} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {dashboard.label}
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none"
            >
              <svg
                className={`h-6 w-6 ${isMobileMenuOpen ? "hidden" : "block"}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`h-6 w-6 ${isMobileMenuOpen ? "block" : "hidden"}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          {TRANSACTION_TYPES.map((t) => (
            <Link
              key={t.value}
              href={buildPropertiesUrl({ type: t.value })}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t.label}
            </Link>
          ))}
          <Link
            href="/properties"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Browse All
          </Link>

          <div className="pt-4 border-t border-gray-200">
            {!hidePostProperty && (
              <PostPropertyButton mobile onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {isLoading ? (
              <div className="w-8 h-8 mx-auto rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href={dashboard.path}
                  className="block w-full px-4 py-2 mt-2 text-center rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {dashboard.label}
                </Link>
                <Link
                  href="/account"
                  className="flex justify-center mt-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Image
                    src={avatarUrl}
                    alt={avatarAlt}
                    className="w-8 h-8 rounded-full object-cover"
                    width={40}
                    height={40}
                  />
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full px-4 py-2 mt-2 text-center rounded-md text-base font-medium text-red-600 border border-red-200 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block w-full px-4 py-2 text-center rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MegaNavbar;
