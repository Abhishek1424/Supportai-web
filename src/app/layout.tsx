// What is this file?   The ROOT layout: wraps every page of the app.
// Flutter/Dart idea:   like `MaterialApp(home: ...)`. `children` is the current page,
//                      like the `child` widget. Next.js "layout" = a common parent widget.
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "./providers";

// Page title and description. Dart idea: `MaterialApp(title: 'SupportAI')`.
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
// A React component = a function that returns UI. Closest idea: a StatelessWidget's
//   `build()`. `{ children }` is its constructor parameter.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
