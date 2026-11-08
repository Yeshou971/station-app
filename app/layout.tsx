import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Prix des carburants",
  description: "Trouver la station-service la moins chère près de chez soi.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
