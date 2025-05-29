import type React from "react"
import "./globals.css"
import "./patterns.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import PrivyWeb3Provider from "@/components/privy-web3-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "$T3MPL3 - Trade memes, accrue deductions",
  description: "Tax-advantaged speculation for the temple fund",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PrivyWeb3Provider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            {children}
          </ThemeProvider>
        </PrivyWeb3Provider>
      </body>
    </html>
  )
}
