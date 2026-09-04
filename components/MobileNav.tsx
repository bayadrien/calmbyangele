"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Accueil", icon: "⌂" },
  { href: "/dashboard/dogs", label: "Animaux", icon: "◌" },
  { href: "/dashboard/bookings", label: "Séjours", icon: "□" },
  { href: "/dashboard/calendar", label: "Agenda", icon: "◫" },
  { href: "/dashboard/photos", label: "Photos", icon: "◈" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return <nav aria-label="Navigation principale" className="mobile-nav">
    {tabs.map((tab) => {
      const active = tab.href === "/dashboard" ? pathname === tab.href : pathname.startsWith(tab.href);
      return <Link key={tab.href} href={tab.href} className={active ? "active" : ""}><span>{tab.icon}</span><small>{tab.label}</small></Link>;
    })}
  </nav>;
}
