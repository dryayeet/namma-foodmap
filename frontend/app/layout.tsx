import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NammaNomNom — Bengaluru's Community-Driven Food Map",
  description:
    "Discover where Bengaluru actually eats. Hype-scored restaurants from r/bangalore & r/bengaluru.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
