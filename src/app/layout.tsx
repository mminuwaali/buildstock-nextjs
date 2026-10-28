import React from "react";
import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AppProviders } from "@/components/providers";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
import "@/styles/globals.style.css";
import "@/styles/themes.style.css";
import "@/styles/utilities.style.css";
import "@/styles/components.style.css";
import "@/styles/animations.style.css";

export const metadata: Metadata = {
  title: {
    default: "BuildStock | Supply Operations",
    template: "%s · BuildStock",
  },
  description:
    "Offline-first inventory and sales operations for construction supply stores.",
  applicationName: "BuildStock",
  manifest: "/manifest.webmanifest",
  themeColor: "#14283F",
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AntdRegistry>
            <AppProviders>
              <ServiceWorkerRegistration />
              {props.children}
            </AppProviders>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
