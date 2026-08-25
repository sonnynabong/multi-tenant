export function safeInternalPath(
  path: string | null | undefined,
  fallback = "/workspace"
): string {
  if (!path) return fallback
  if (!path.startsWith("/")) return fallback
  if (path.startsWith("//")) return fallback
  if (path.includes("\\")) return fallback
  if (path.includes("://")) return fallback
  return path
}
