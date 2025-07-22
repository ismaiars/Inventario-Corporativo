import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Providers } from "@/components/Provider";
import { cn } from "@/lib/utils";
import { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "Inventario Corporativo",
    description: "Sistema de gestión de inventario para equipos de la empresa.",
    authors: [{ name: "soycesar.dev", url: "https://www.linkedin.com/in/soycesardev/" }],
    creator: "César Arce",
    publisher: "César Arce",
    keywords: ["inventario", "dashboard", "empresa", "equipos"],
    robots: "index, follow",
    alternates: {
      canonical: "https://inventario-corporativo.vercel.app/",
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="dns-prefetch" href="https://inventario-corporativo.vercel.app" />
        <link rel="dns-prefetch" href="https://placehold.co" />
      </head>
        <body className={cn(
           "min-h-screen bg-background font-sans antialiased",
           inter.variable
        )}>
          <AuthProvider>
            <Providers>
              {children}
            </Providers>
          </AuthProvider>
        </body>
    </html>
  );
}

