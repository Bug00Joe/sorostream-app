"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// SVG icons for each nav destination
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} />
      <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function AddressBookIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: null },
  { href: "/stream/new", label: "Create", icon: null },
  { href: "/address-book", label: "Contacts", icon: null },
  { href: "/settings", label: "Settings", icon: null },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/*
       * Safe-area spacer: pushes page content above the bottom nav on iOS
       * and Android devices with a home indicator. The nav itself is fixed,
       * so we reserve exactly the same height in the document flow.
       */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-gray-900/95 backdrop-blur border-t border-gray-800 safe-bottom"
      >
        <ul className="flex items-stretch h-16" role="list">
          {/* Dashboard */}
          <li className="flex-1">
            <NavLink
              href="/dashboard"
              label="Dashboard"
              isActive={pathname === "/dashboard" || pathname.startsWith("/stream/")}
              icon={(active) => <DashboardIcon active={active} />}
            />
          </li>

          {/* Create — prominent centre pill */}
          <li className="flex-1">
            <NavLink
              href="/stream/new"
              label="Create"
              isActive={pathname === "/stream/new"}
              icon={() => <CreateIcon />}
              isCreate
            />
          </li>

          {/* Contacts / Address Book */}
          <li className="flex-1">
            <NavLink
              href="/address-book"
              label="Contacts"
              isActive={pathname === "/address-book"}
              icon={(active) => <AddressBookIcon active={active} />}
            />
          </li>

          {/* Settings */}
          <li className="flex-1">
            <NavLink
              href="/settings"
              label="Settings"
              isActive={pathname === "/settings"}
              icon={(active) => <SettingsIcon active={active} />}
            />
          </li>
        </ul>
      </nav>
    </>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  icon: (active: boolean) => React.ReactNode;
  isCreate?: boolean;
}

function NavLink({ href, label, isActive, icon, isCreate }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`
        flex flex-col items-center justify-center gap-1 h-full w-full text-[10px] font-medium
        transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-inset
        ${
          isCreate
            ? "text-green-400"
            : isActive
            ? "text-green-400"
            : "text-gray-400 hover:text-gray-200"
        }
      `}
    >
      <span
        className={`
          flex items-center justify-center rounded-full transition-colors
          ${isCreate ? "bg-green-700 text-white w-10 h-10 -mt-5 shadow-lg shadow-green-900/50" : ""}
        `}
      >
        {icon(isActive)}
      </span>
      <span className={isCreate ? "mt-1" : ""}>{label}</span>
    </Link>
  );
}
