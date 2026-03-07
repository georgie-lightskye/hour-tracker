import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

const heading = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Hour Tracker",
  description: "Track your hours. Measure your impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${heading.variable} ${mono.variable} antialiased bg-bg-base text-text-primary font-[family-name:var(--font-heading)]`}
      >
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
