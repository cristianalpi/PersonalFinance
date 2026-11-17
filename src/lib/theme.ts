// The person's theme choice, kept in a cookie so the server renders the right
// colours on the first paint (no flash of the wrong theme).
export type ThemeChoice = "system" | "light" | "dark";
export const THEME_COOKIE = "theme";

export function parseTheme(value: string | undefined): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

const THEME_COLOR = { light: "#f4f2ff", dark: "#0f0d21" };

/** Applies a choice to the page right away and remembers it for a year. */
export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  document.cookie = `${THEME_COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax`;
  // Keep the phone's status bar in step with the chosen theme.
  const effective = choice === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : choice;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLOR[effective]));
  window.dispatchEvent(new Event("themechange"));
}

/** Whether the page is showing dark colours now, whatever the reason. */
export function isDark(): boolean {
  const set = document.documentElement.dataset.theme;
  return set ? set === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}
