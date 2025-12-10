import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document Extractor",
  description: "Upload and extract text from PDF and DOCX files easily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        {children}
      </body>
    </html>
  );
}
