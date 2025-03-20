import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css"
import "../styles/clerk.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SafeClerkProvider } from "@/lib/conditional-auth";

export const metadata: Metadata = {
  title: "Charstream | AI Characters",
  description: "Chat with AI characters and create your own",
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SafeClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </SafeClerkProvider>
      </body>
    </html>
  )
}

