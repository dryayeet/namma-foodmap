import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NammaNomNom — Bengaluru's Community-Driven Food Map",
  description:
    "Discover where Bengaluru actually eats. Hype-scored restaurants from r/bangalore & r/bengaluru.",
};

// Runs before React hydrates, so the page paints in the right theme immediately.
const themeBootstrap = `
  try {
    var t = localStorage.getItem('nnn-theme');
    if (t !== 'light') document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link
          rel="preconnect"
          href="https://rsms.me/"
        />
        <link
          rel="stylesheet"
          href="https://rsms.me/inter/inter.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
