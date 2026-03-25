"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "SYSTEM_DASH", code: "00" },
  { href: "/cases", label: "CASE_LIBRARY", code: "01" },
  { href: "/cases/new", label: "NEW_CASE", code: "02" },
  { href: "/settings", label: "SETTINGS", code: "03" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/cases") {
    return pathname === "/cases" || (pathname.startsWith("/cases/") && !pathname.startsWith("/cases/new"));
  }
  return pathname === href;
}

export default function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="shell-topbar">
        <div className="shell-brand-block">
          <Link href="/" className="shell-brand">
            BRAIN_SEG_STUDIO
          </Link>
          <div className="shell-inline-note">
            <span className="shell-note-key">mode</span>
            <span className="shell-note-value">LOCAL_RESEARCH_WORKFLOW</span>
          </div>
        </div>
        <nav className="shell-topnav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="shell-topnav-link"
                data-active={active}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <aside className="shell-sidebar">
        <div className="sidebar-lab">
          <div className="sidebar-lab-mark">42</div>
          <div>
            <div className="sidebar-lab-title">LAB_042</div>
            <div className="sidebar-lab-subtitle">RESEARCH USE ONLY</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Section">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="sidebar-link"
                data-active={active}
              >
                <span className="sidebar-link-code">{item.code}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-label">NON-DIAGNOSTIC OUTPUTS</div>
          <p className="sidebar-footer-copy">
            Review segmentation results carefully before exporting research artifacts.
          </p>
        </div>
      </aside>
    </>
  );
}
