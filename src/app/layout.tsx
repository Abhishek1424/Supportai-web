import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SupportAI",
  description: "AI-powered customer support platform",
};

/**
 * Root layout: wraps every page with the HTML shell and the data providers.
 *
 * @param props.children The current page.
 * @returns The document structure.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
