import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Cartoon Story Generator",
  description: "Turn your story into a cartoon using your existing assets.",
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
