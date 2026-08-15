import type { Metadata } from "next";
import "./globals.css";
import { InterfaceCursor } from "@/app/interface-cursor";
import { BootPreloader } from "@/app/fx/boot-preloader";

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
    <html lang="en" data-fx="on" suppressHydrationWarning>
      <body>
        <script
          // Runs before paint: restore the persisted FX preference so effects
          // never flash on for users who disabled them. Shared contract: every
          // effect (this engine, cursor, HUD) gates on html[data-fx].
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;if(localStorage.getItem("sb-fx")==="off")d.dataset.fx="off";if(d.dataset.fx!=="off"&&!sessionStorage.getItem("sb-boot-done")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.boot="show"}catch(e){}`,
          }}
        />
        <BootPreloader />
        {children}
        <InterfaceCursor />
      </body>
    </html>
  );
}
