"use client";

import Image from "next/image";

type HomeLinkProps = {
  href: string;
};

export function HomeLink({ href }: HomeLinkProps) {
  return (
    <a
      className="grid size-14 place-items-center"
      href={href}
      aria-label="Mehfooz-ur-Rehman home"
      onClick={(event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        history.replaceState(null, "", href);
      }}
    >
      <Image src="/logo.svg" alt="" width={56} height={56} priority />
    </a>
  );
}
