import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RKN ERP",
  description: "RKN Hijab ERP web application"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
