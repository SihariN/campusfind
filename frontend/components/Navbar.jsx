
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  getInbox,
  getUnreadNotificationCount,
  getAdminProfile,
} from "../lib/api";

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    report: <><path d="M12 5v14M5 12h14" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/25 transition group-hover:rotate-3">
        C
      </span>
      <span>
        <span className="block text-xl font-black tracking-tight text-slate-950 dark:text-white">
          CampusFind<span className="text-blue-600">.</span>
        </span>
        <span className="hidden text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 sm:block">
          YOUR CAMPUS LOST & FOUND
        </span>
      </span>
    </Link>
  );
}

function BadgeCount({ count }) {
  if (!count) return null;

  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const closeMenus = useCallback(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    setAdminMenuOpen(false);
  }, []);

  const loadUnreadCounts = useCallback(async () => {
    try {
      const messages = await getInbox();
      setUnreadMessages(
        messages.filter((message) => !message.is_read).length
      );
    } catch {
      setUnreadMessages(0);
    }

    try {
      const data = await getUnreadNotificationCount();
      setUnreadNotifications(data.unread_count || 0);
    } catch {
      setUnreadNotifications(0);
    }
  }, []);

  const syncAuthState = useCallback(async () => {
    const token = localStorage.getItem("campusfind_token");
    const loggedIn = Boolean(token);

    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      setIsAdmin(false);
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return;
    }

    try {
      await getAdminProfile();
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  // Load the saved theme whenever the route changes.
  // This also picks up theme changes made inside the admin dashboard.
  useEffect(() => {
    const savedTheme = localStorage.getItem("campusfind_theme");
    const currentTheme = savedTheme === "dark" ? "dark" : "light";

    setTheme(currentTheme);

    document.documentElement.classList.toggle(
      "dark",
      currentTheme === "dark"
    );
  }, [pathname]);

  // Keep the login and admin state synchronized.
  useEffect(() => {
    syncAuthState();

    const handleAuthChange = () => {
      syncAuthState();
    };

    window.addEventListener("campusfind-auth-change", handleAuthChange);

    return () => {
      window.removeEventListener(
        "campusfind-auth-change",
        handleAuthChange
      );
    };
  }, [syncAuthState]);

  // Close menus after navigating to another page.
  useEffect(() => {
    closeMenus();
  }, [pathname, closeMenus]);

  // Load unread counts for logged-in users.
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return;
    }

    loadUnreadCounts();

    window.addEventListener("focus", loadUnreadCounts);

    return () => {
      window.removeEventListener("focus", loadUnreadCounts);
    };
  }, [isLoggedIn, loadUnreadCounts]);

  // Apply and save the theme immediately when the user clicks the button.
  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    localStorage.setItem("campusfind_theme", nextTheme);

    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );

    setTheme(nextTheme);
  }

  function logout() {
    localStorage.removeItem("campusfind_token");

    window.dispatchEvent(new Event("campusfind-auth-change"));

    setIsLoggedIn(false);
    setIsAdmin(false);
    setUnreadMessages(0);
    setUnreadNotifications(0);

    closeMenus();
    router.push("/");
    router.refresh();
  }

  const linkClass = (href) =>
    `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      pathname === href
        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
    }`;

  // Admin pages use their own dedicated sidebar and top bar.
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Brand />

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="ml-auto hidden items-center gap-1 lg:flex"
        >
          {isLoggedIn ? (
            <>
              <Link href="/" className={linkClass("/")}>
                Home
              </Link>

              <Link href="/my-reports" className={linkClass("/my-reports")}>
                My Reports
              </Link>

              <Link
                href="/notifications"
                aria-label={`Notifications, ${unreadNotifications} unread`}
                className={linkClass("/notifications")}
              >
                <Icon name="bell" className="h-4 w-4" />
                Notifications
                <BadgeCount count={unreadNotifications} />
              </Link>

              <Link
                href="/messages/inbox"
                aria-label={`Messages, ${unreadMessages} unread`}
                className={linkClass("/messages/inbox")}
              >
                <Icon name="mail" className="h-4 w-4" />
                Messages
                <BadgeCount count={unreadMessages} />
              </Link>

              {isAdmin && (
                <Link href="/admin" className={linkClass("/admin")}>
                  <Icon name="shield" className="h-4 w-4" />
                  Admin
                </Link>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(!accountMenuOpen);
                    setAdminMenuOpen(false);
                  }}
                  aria-expanded={accountMenuOpen}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <Icon name="user" className="h-4 w-4" />
                  Account
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <Link
                      href="/profile"
                      onClick={closeMenus}
                      className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      My Profile
                    </Link>

                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Icon name="logout" className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/" className={linkClass("/")}>
                Home
              </Link>

              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Create account
              </Link>
            </>
          )}
        </nav>

        {/* Right-side actions */}
        <div className="flex shrink-0 items-center gap-2">
          {isLoggedIn && (
            <Link
              href="/report"
              className="hidden items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
            >
              <Icon name="report" className="h-4 w-4" />
              Report an Item
            </Link>
          )}

          {theme !== null && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 lg:hidden"
          >
            <Icon
              name={mobileMenuOpen ? "close" : "menu"}
              className="h-5 w-5"
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <nav
            aria-label="Mobile navigation"
            className="mx-auto max-w-7xl space-y-1"
          >
            {isLoggedIn ? (
              <>
                <Link href="/" className={linkClass("/")}>
                  <Icon name="home" className="h-4 w-4" />
                  Home
                </Link>

                <Link href="/my-reports" className={linkClass("/my-reports")}>
                  My Reports
                </Link>

                <Link
                  href="/notifications"
                  className={linkClass("/notifications")}
                >
                  <Icon name="bell" className="h-4 w-4" />
                  Notifications
                  <BadgeCount count={unreadNotifications} />
                </Link>

                <Link
                  href="/messages/inbox"
                  className={linkClass("/messages/inbox")}
                >
                  <Icon name="mail" className="h-4 w-4" />
                  Messages
                  <BadgeCount count={unreadMessages} />
                </Link>

                <Link
                  href="/messages/sent"
                  className={linkClass("/messages/sent")}
                >
                  Sent Messages
                </Link>

                <Link href="/profile" className={linkClass("/profile")}>
                  <Icon name="user" className="h-4 w-4" />
                  My Profile
                </Link>

                {isAdmin && (
                  <Link href="/admin" className={linkClass("/admin")}>
                    <Icon name="shield" className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                )}

                <Link
                  href="/report"
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <Icon name="report" className="h-4 w-4" />
                  Report an Item
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/" className={linkClass("/")}>
                  <Icon name="home" className="h-4 w-4" />
                  Home
                </Link>

                <Link href="/login" className={linkClass("/login")}>
                  Log in
                </Link>

                <Link
                  href="/register"
                  className="mt-2 flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
