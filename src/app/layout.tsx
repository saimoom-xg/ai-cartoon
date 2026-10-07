import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Cartoon Storybook Creator",
  description: "Turn your story into an illustrated children's storybook with consistent AI-generated characters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && (!window.crypto || !window.crypto.randomUUID)) {
                window.crypto = window.crypto || {};
                window.crypto.randomUUID = function() {
                  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, function(c) {
                    var r = (window.crypto.getRandomValues ? window.crypto.getRandomValues(new Uint8Array(1))[0] : Math.floor(Math.random() * 256));
                    return (+c ^ (r & 15 >> +c / 4)).toString(16);
                  });
                };
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
