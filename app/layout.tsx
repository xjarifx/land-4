import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NID Portal",
  description: "Secure citizen registration and login"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
