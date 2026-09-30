"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const VOCI = [
  { href: "/", label: "Oggi" },
  { href: "/storico", label: "Storico" },
  { href: "/profilo", label: "Profilo" },
];

export function Navigazione() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 text-sm">
      {VOCI.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          className={`rounded-full px-3 py-1.5 ${path === v.href ? "bg-accent-soft font-medium text-accent" : "text-muted"}`}
        >
          {v.label}
        </Link>
      ))}
    </nav>
  );
}
