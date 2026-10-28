export const locales = ["en"] as const;
export type LocaleType = (typeof locales)[number];
export const defaultLocale: LocaleType = "en";
