const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("life-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

// Runs before hydration so the correct theme is set on <html> before first
// paint (no flash of the wrong theme). Dark is the default when nothing is
// stored yet, matching the product default in globals.css.
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
