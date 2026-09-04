"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const items = [
  { href: "/dashboard", icon: "⌂", label: "Vue d’ensemble" },
  { href: "/dashboard/owners", icon: "♡", label: "Les familles" },
  { href: "/dashboard/dogs", icon: "◌", label: "Les animaux" },
  { href: "/dashboard/bookings", icon: "□", label: "Les séjours" },
  { href: "/dashboard/calendar", icon: "◫", label: "Le calendrier" },
  { href: "/dashboard/photos", icon: "◈", label: "Les souvenirs" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed top-0 left-0 z-50 w-full border-b border-[#e4e5dc] bg-[#fffefb]/90 backdrop-blur-xl"><div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/dashboard" className="group flex items-center gap-3" onClick={() => setOpen(false)}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#396957] text-xl text-white shadow-sm transition group-hover:rotate-6">♧</span><span><span className="block text-[10px] font-bold uppercase tracking-[.22em] text-[#6b7b72]">Conciergerie canine</span><span className="block text-base font-bold tracking-tight text-[#1d3029]">CALM <em className="font-normal">by Angèle</em></span></span></Link><button onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="rounded-full border border-[#d9e1d8] bg-white px-4 py-2 text-sm font-semibold text-[#254c3e] transition hover:bg-[#e2eee6]"><span className="mr-2 text-base">☰</span> Menu</button></div></header>
      {open && <button aria-label="Fermer le menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-[#183128]/30 backdrop-blur-[2px]" />}
      <aside className={`fixed top-0 right-0 z-50 flex h-dvh w-[min(360px,88vw)] flex-col bg-[#fffefb] p-6 shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}><div className="mb-9 flex items-center justify-between"><div className="text-sm font-bold text-[#1d3029]">Navigation</div><button onClick={() => setOpen(false)} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f4ee] text-lg text-[#254c3e]">×</button></div><nav className="space-y-1.5">{items.map((item) => { const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${active ? "bg-[#e2eee6] text-[#254c3e]" : "text-[#65746c] hover:bg-[#f4f6f0] hover:text-[#254c3e]"}`}><span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-base shadow-sm">{item.icon}</span>{item.label}</Link>; })}</nav><div className="mt-auto border-t border-[#e4e5dc] pt-5"><button onClick={() => signOut(auth)} className="w-full rounded-2xl border border-[#efd5c6] bg-[#fff7f2] px-4 py-3 text-left text-sm font-semibold text-[#a95537] transition hover:bg-[#fdece1]">↗ Déconnexion</button><p className="mt-5 text-center text-xs text-[#89948d]">Fait avec soin pour les animaux.</p></div></aside>
    </>
  );
}
