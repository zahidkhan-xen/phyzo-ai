import type { Metadata, Viewport } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "Physics AI Tutor — Learn from your textbook",
    template: "%s · Physics AI Tutor",
  },
  description:
    "A strict textbook-grounded physics tutor with page-level citations, mathematical explanations, and conversation history.",
};

export const viewport: Viewport = {
  themeColor: "#050810",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-dvh antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
