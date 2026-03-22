import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="app-shell">
          <header className="top-nav glass-panel">
            <strong>Brain Segmentation Studio</strong>
            <nav>
              <Link href="/">Dashboard</Link>
              <Link href="/cases">Cases</Link>
              <Link href="/cases/new">New Case</Link>
              <Link href="/settings">Settings</Link>
            </nav>
          </header>
          <section className="content">{children}</section>
        </main>
      </body>
    </html>
  );
}
