import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sileo"
import { AuthProvider } from '@/lib/auth-context'
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: 'Finmark — Project Finer',
  description: 'Data-driven financial services platform for SMEs across Southeast Asia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0B0F1A]">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right"  />
      </body>
    </html>
  )
}