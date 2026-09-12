'use client';

import { Suspense, useEffect, useState } from 'react';

import { GitHubCalendar } from 'react-github-calendar';

const lightTheme = {
  light: ['#f1efe5', '#d7f0e3', '#a8e4c3', '#79d7a0', '#4ab580'],
  dark: ['#0c2120', '#0a3f35', '#0a5a46', '#0d7a5c', '#1a9d6f'],
};

function GitHubCalendarContent() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mx-auto w-full max-w-[1320px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
      <div className="mb-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="font-mono-label text-[0.68rem] font-semibold tracking-[0.2em] text-[var(--color-soft)]">✦</span>
          <span className="h-px w-8 bg-[var(--border-card)]" />
          <span className="font-mono-label text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Activity</span>
        </div>
        <h2 className="font-heading max-w-2xl text-[clamp(1.55rem,2.9vw,2.35rem)] font-extrabold leading-[0.98] tracking-[-0.01em]">
          GitHub contributions this year.
        </h2>
      </div>

      <div
        suppressHydrationWarning
        className="no-scrollbar w-full overflow-x-auto rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6 sm:p-8 [&_.react-activity-calendar]:!w-full [&_.react-activity-calendar]:!max-w-full [&_.react-activity-calendar_svg]:!w-full [&_.react-activity-calendar_svg]:!h-auto [&_.react-activity-calendar_svg]:!block [&_.react-activity-calendar__footer]:!w-full [&_.react-activity-calendar__footer]:!flex [&_.react-activity-calendar__footer]:!items-center [&_.react-activity-calendar__footer]:!justify-between [&_.react-activity-calendar__footer]:!mt-5 [&_.react-activity-calendar__footer]:!text-[0.82rem]"
      >
        {mounted ? (
          <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-[var(--color-field)]" />}>
            <div className="w-full min-w-[700px] lg:min-w-0">
              <GitHubCalendar
                username="MehfoozurRehman"
                colorScheme={isDark ? 'dark' : 'light'}
                theme={{
                  light: lightTheme.light,
                  dark: lightTheme.dark,
                }}
                blockRadius={5}
                fontSize={14}
                year={new Date().getFullYear()}
                blockSize={16}
                style={{ width: '100%' }}
              />
            </div>
          </Suspense>
        ) : (
          <div className="h-32 animate-pulse rounded-lg bg-[var(--color-field)]" />
        )}
      </div>
    </section>
  );
}

export function GitHubCalendarSection() {
  return (
    <Suspense fallback={<div />}>
      <GitHubCalendarContent />
    </Suspense>
  );
}
