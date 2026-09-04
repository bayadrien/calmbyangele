"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const checkUser = async (user: User) => {
    const token = await user.getIdTokenResult();
    if (token.claims.admin === true) {
      router.push("/dashboard");
    } else {
      alert("Ce compte n’a pas les droits administrateur.");
      await signOut(auth);
    }
  };

  const handleLogin = async () => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(
        navigator.userAgent
      );

      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          await checkUser(result.user);
        }
      }
    } catch {
      alert("Erreur de connexion.");
    }
  };

  const handleEmailLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await checkUser(result.user);
    } catch {
      alert("Email ou mot de passe incorrect.");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await checkUser(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 5) {
      setShowAdmin((prev) => !prev);
      setClickCount(0);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#dbece1] blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#f7d5bd] blur-3xl" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-white/80 bg-[#fffefa]/85 shadow-[0_28px_80px_rgba(37,76,62,.16)] backdrop-blur sm:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden min-h-[580px] overflow-hidden bg-[#315e4e] p-12 text-white sm:block">
          <div className="absolute -right-20 -top-14 h-72 w-72 rounded-full border-[28px] border-white/10" />
          <div className="absolute bottom-[-80px] left-[-70px] h-64 w-64 rounded-full bg-[#f0b895]/90" />
          <div className="relative flex h-full flex-col justify-between">
            <div><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em]">Espace privé</span><h2 className="mt-8 max-w-xs text-4xl font-semibold leading-tight">Prendre soin, en toute sérénité.</h2><p className="mt-5 max-w-sm text-sm leading-6 text-white/75">Le carnet de bord élégant de vos compagnons accueillis chez Angèle.</p></div>
            <p className="max-w-[16rem] text-sm italic text-white/80">« Chaque séjour mérite son attention particulière. »</p>
          </div>
        </div>
        <div className="flex min-h-[580px] items-center p-7 sm:p-12">
          <div className="w-full">
            <div className="mb-10 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e2eee6] text-xl text-[#315e4e]">♧</span><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#79867f]">Conciergerie canine</p><h1 onClick={handleSecretClick} className="cursor-default text-xl font-bold tracking-tight text-[#1d3029]">CALM <em className="font-normal">by Angèle</em></h1></div></div>
            <h2 className="text-3xl font-bold tracking-tight text-[#1d3029]">Bienvenue</h2>
            <p className="mt-3 text-sm leading-6 text-[#718078]">Connectez-vous pour retrouver les familles, les séjours et les souvenirs de la maison.</p>
            <button onClick={handleLogin} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#315e4e] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#315e4e]/20 transition hover:-translate-y-0.5 hover:bg-[#254c3e]"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-bold text-[#315e4e]">G</span> Continuer avec Google</button>
            <p className="mt-4 text-center text-xs text-[#87928c]">Accès réservé à l’équipe CALM.</p>
            {showAdmin && (
              <div className="mt-7 space-y-4 border-t border-[#e5e7df] pt-6 text-left">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#718078]">Connexion administrateur</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#ccd8cf] bg-white p-3.5 rounded-xl"
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#ccd8cf] bg-white p-3.5 rounded-xl"
            />

            <button
              onClick={handleEmailLogin}
              className="w-full rounded-xl bg-[#1d3029] py-3 text-sm font-bold text-white transition hover:bg-[#315e4e]"
            >
              Connexion
            </button>
          </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
