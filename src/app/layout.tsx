import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pepclaw — Autonomous peptide research",
  description:
    "Autonomous peptide research swarm. Twelve specialist agent pools, real biomedical data, tamper-evident commit-and-reveal protocol.",
  metadataBase: new URL("http://localhost:3000"),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Pepclaw",
    description:
      "Autonomous peptide research. Twelve agent pools. Tamper-evident thesis loop.",
    type: "website",
    images: ["/hero-peptide.png"],
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${serif.variable} ${mono.variable}`}>
      <body
        className="antialiased min-h-screen bg-black text-ink-50"
        style={{
          fontFamily: "var(--font-sans), Inter, system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
