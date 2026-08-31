import "./styles.css";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0b131e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "RKN ERP",
  description: "RKN Group Enterprise Resource Planning",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RKN ERP",
  },
  icons: {
    icon: "/rkn-logo.png",
    apple: "/rkn-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" sizes="192x192" href="/rkn-logo.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/rkn-logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/rkn-logo.png" />
        <link rel="shortcut icon" href="/rkn-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/rkn-logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}

