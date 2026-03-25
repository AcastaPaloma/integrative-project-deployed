import "./globals.css";
import type { ReactNode } from "react";

import AppNav from "../components/AppNav";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <AppNav />
          <main className="app-main">
            <section className="app-content">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
