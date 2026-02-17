import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indian Village Manor",
  description: "Community website for Indian Village Manor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
