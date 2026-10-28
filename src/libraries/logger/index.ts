export function logError(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production")
    console.error(`[BuildStock] ${message}`, error);
}
