import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELAH Banking Simulation",
  description:
    "PROJECT ELAH — a simulated banking environment for reasoning-level security research on Agentic AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
