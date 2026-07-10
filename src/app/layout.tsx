import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/layout/container";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trip Planner",
  description: "Plan budget-aware trips end to end.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
         * First thing in the tab order: a keyboard user can jump the header nav
         * instead of tabbing it on every page. Hidden until it takes focus.
         */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-20 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-foreground"
        >
          Skip to content
        </a>
        <SiteHeader />
        {/*
         * tabIndex={-1} makes <main> a valid target for the skip link without
         * putting it in the tab order. Fragment navigation only moves focus to
         * a focusable element; without this, Safari scrolls but leaves focus in
         * the header, so the next Tab returns to the nav the link just skipped.
         */}
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          <Container className="py-8 md:py-12">{children}</Container>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
