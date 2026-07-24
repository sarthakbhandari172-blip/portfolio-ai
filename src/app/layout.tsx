import type { Metadata } from "next";
import "./globals.css";
import { InterfaceCursor } from "@/app/interface-cursor";

export const metadata: Metadata = {
  title: "Sarthak Bhandari | Software · Hardware · Interfaces",
  description:
    "Portfolio of Sarthak Bhandari, a technology enthusiast in Nepal exploring software, hardware and interfaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <InterfaceCursor />
      </body>
    </html>
  );
}
