import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NammaNomNom — Bengaluru's Community-Driven Food Map",
  description:
    "Discover where Bengaluru actually eats. Hype-scored restaurants from r/bangalore & r/bengaluru.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

// Runs before React hydrates, so the page paints in the right theme immediately.
// Default is light: dark is only applied when the user has explicitly picked it.
const themeBootstrap = `
  try {
    if (localStorage.getItem('nnn-theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
