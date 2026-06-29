"use client";

import { GitHubCalendar } from "react-github-calendar";
import { useEffect, useState } from "react";

const lightTheme = {
  light: ["#f1efe5", "#d7f0e3", "#a8e4c3", "#79d7a0", "#4ab580"],
  dark: ["#0c2120", "#0a3f35", "#0a5a46", "#0d7a5c", "#1a9d6f"],
};

export function GitHubCalendarSection() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsDark(theme === "dark");

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const theme = isDark ? lightTheme.dark : lightTheme.light;

  return (
    <section className="mx-auto max-w-[1360px] px-5 py-12 sm:px-8 lg:px-12 lg:py-18 xl:px-16 border-t border-[var(--border-subtle)]">
      <div className="mb-9 max-w-3xl">
        <p className="mb-4 flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--color-accent)]">
          <span aria-hidden="true">📊</span>
          Activity
        </p>
        <h2 className="font-[family-name:var(--font-nunito)] font-extrabold leading-[0.98] tracking-normal text-[clamp(1.35rem,1.65vw,1.85rem)]">
          GitHub contributions this year.
        </h2>
        <p className="mt-5 text-[0.92rem] leading-8 text-[var(--color-muted)]">
          Here's a snapshot of my contributions on GitHub. Consistent shipping and building.
        </p>
      </div>

      <div className="rounded-[18px] border border-[var(--border-card)] p-5 sm:p-6 transition duration-200 hover:border-[var(--border-hover)] overflow-x-auto">
        <GitHubCalendar
          username="MehfoozurRehman"
          colorScheme={isDark ? "dark" : "light"}
          theme={{
            light: lightTheme.light,
            dark: lightTheme.dark,
          }}
          year={new Date().getFullYear()}
          blockSize={12}
          blockMargin={3}
          fontSize={14}
        />
      </div>
    </section>
  );
}
