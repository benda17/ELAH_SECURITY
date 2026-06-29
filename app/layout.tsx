import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELAH Analytics Dashboard",
  description: "Read-only analytics dashboard for the ELAH banking simulation database.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
