import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrepAI - AI-Powered Mock Interview Platform",
  description: "Upload job descriptions and resumes, undergo tailored mock interviews, receive direct feedback, and analyze knowledge gaps using Gemini.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex flex-col h-full bg-slate-50 text-slate-900 selection:bg-indigo-500/10 selection:text-indigo-900 font-sans">
        {/* Sleek background decoration */}
        <div className="bg-gradient-mesh" />

        {/* Global sticky header navigation */}
        <Navbar user={user} />

        {/* Application page mount */}
        <main className="flex-grow px-6 py-12 md:py-16">
          {children}
        </main>

        {/* Premium footer */}
        <footer className="w-full mt-auto py-8 px-6 border-t border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <p className="text-sm font-bold text-slate-800">
                PrepAI Mock Interviewer Platform
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Fullstack Developer Assignment 2 &copy; 2026. All rights reserved.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1.5">
              <span className="text-xs font-medium text-slate-600">
                Developed by: <span className="text-indigo-600 font-bold">Piyush Kumar</span>
              </span>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <a
                  href="https://github.com/Piyush-2004"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  GitHub Profile
                </a>
                <span className="text-slate-300">|</span>
                <a
                  href="https://www.linkedin.com/in/piyush-kumar-2424b6215/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  LinkedIn Profile
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
