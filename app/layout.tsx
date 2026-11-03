import localFont from "next/font/local";
import { ConnectionBubble } from "@/app/components/ConnectionBubble";
import { InitialLoading } from "@/app/components/InitialLoading";
import "./globals.css";

export const metadata = {
  title: "Rapply",
  description: "Gestion personnelle : rappels, notes, finances et planning.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rapply",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo-ben.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#12161F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/fraunces-600.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

const inter = localFont({
  src: [
    { path: "./fonts/inter-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/inter-500.ttf", weight: "500", style: "normal" },
    { path: "./fonts/inter-600.ttf", weight: "600", style: "normal" },
    { path: "./fonts/inter-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${plexMono.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <InitialLoading />
        <ConnectionBubble />
        {children}
      </body>
    </html>
  );
}
