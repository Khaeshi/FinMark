/**
 * Minimal className joiner — filters out falsy values.
 * Kept dependency-free (no clsx/tailwind-merge) since this project
 * doesn't use shadcn and doesn't need conflict-resolving merges.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
