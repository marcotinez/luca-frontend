import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Luca | Educacion Financiera",
    template: "%s | Luca",
  },
  description: "Plataforma de educacion financiera adaptativa con rutas de aprendizaje personalizadas y evaluaciones inteligentes.",
  applicationName: "Luca",
  keywords: ["Luca", "educacion financiera", "aprendizaje adaptativo", "evaluaciones", "finanzas"],
  authors: [{ name: "Luca" }],
  creator: "Luca",
  publisher: "Luca",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Luca | Educacion Financiera",
    description: "Aprende finanzas con rutas personalizadas, contenido validado y evaluaciones inteligentes.",
    siteName: "Luca",
    locale: "es_CL",
    type: "website",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
