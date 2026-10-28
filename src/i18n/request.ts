import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "@/i18n";

export default getRequestConfig(async function requestConfig() {
  return {
    locale: defaultLocale,
    messages: (await import("@/messages/en.json")).default,
  };
});
