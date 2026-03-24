import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./Providers";
import "../styles/globals.css";
import "../styles/text-editor.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-ui/styles/dark/attributes.css";
import "@liveblocks/react-tiptap/styles.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export const metadata = {
  title: "Collaborative Editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://liveblocks.io/favicon-32x32.png"
          rel="icon"
          sizes="32x32"
          type="image/png"
        />
        <link
          href="https://liveblocks.io/favicon-16x16.png"
          rel="icon"
          sizes="16x16"
          type="image/png"
        />
      </head>
      <body>
        <ClerkProvider>
          <Providers>
            <Suspense>{children}</Suspense>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
