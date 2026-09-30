import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Navigazione } from "@/components/Navigazione";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HE@LTY",
  description: "Indicazioni giornaliere su attività fisica, alimentazione, idratazione e integrazione.",
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <span className="text-lg font-semibold text-accent">HE@LTY</span>
            <Navigazione />
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-2xl px-4 pb-6 text-xs text-muted">
          Prototipo. I suggerimenti sono di carattere generale sul benessere e non sostituiscono il parere del
          medico. Non modificare mai farmaci o terapie in base a questa app. I dati restano nel tuo browser.
        </footer>
      </body>
    </html>
  );
}
