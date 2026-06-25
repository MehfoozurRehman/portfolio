import Script from "next/script";

const themeScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("portfolio-theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : systemTheme;
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export function ThemeScript() {
  return <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
