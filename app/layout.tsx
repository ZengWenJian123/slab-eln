import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLAB-ELN",
  description: "Laboratory ELN & LIMS MVP"
};

const hydrationGuardScript = `
(() => {
  const attr = "inmaintabuse";
  const clean = () => {
    document.documentElement?.removeAttribute(attr);
    document.body?.removeAttribute(attr);
  };
  clean();
  const observer = new MutationObserver(clean);
  observer.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: [attr]
  });
  window.addEventListener(
    "load",
    () => setTimeout(() => observer.disconnect(), 3000),
    { once: true }
  );
})();
`;

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: hydrationGuardScript
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
