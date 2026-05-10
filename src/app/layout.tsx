import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gary's Health Tracker",
  description: "Personal health and calorie tracking app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
