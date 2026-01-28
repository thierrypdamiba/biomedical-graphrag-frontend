import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PubMed Navigator",
  description: "AI-powered biomedical research assistant combining Qdrant vector search with Neo4j knowledge graphs",
  keywords: ["biomedical", "GraphRAG", "Qdrant", "Neo4j", "PubMed", "research", "AI"],
  authors: [{ name: "PubMed Navigator Team" }],
  openGraph: {
    title: "PubMed Navigator",
    description: "AI-powered biomedical research assistant combining Qdrant vector search with Neo4j knowledge graphs",
    type: "website",
    siteName: "PubMed Navigator",
  },
  twitter: {
    card: "summary_large_image",
    title: "PubMed Navigator",
    description: "AI-powered biomedical research assistant combining Qdrant vector search with Neo4j knowledge graphs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
