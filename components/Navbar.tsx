"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* BARRE HAUTE */}
      <div className="fixed top-0 left-0 w-full bg-white shadow z-50 flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-bold text-purple-700">
          CALM by Angèle
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="text-2xl text-purple-700"
        >
          ☰
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* MENU LATERAL */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6">

          <NavLink href="/dashboard" label="🏠 Dashboard" close={() => setOpen(false)} />
          <NavLink href="/dashboard/owners" label="👤 Maîtres" close={() => setOpen(false)} />
          <NavLink href="/dashboard/dogs" label="🐾 Animaux" close={() => setOpen(false)} />
          <NavLink href="/dashboard/calendar" label="📅 Calendrier" close={() => setOpen(false)} />
          <NavLink href="/dashboard/photos" label="📸 Photos" close={() => setOpen(false)} />

          <button
            onClick={() => signOut(auth)}
            className="text-red-500 mt-8"
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}

function NavLink({
  href,
  label,
  close,
}: {
  href: string;
  label: string;
  close: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={close}
      className="block text-lg text-gray-800 hover:text-purple-700 transition"
    >
      {label}
    </Link>
  );
}