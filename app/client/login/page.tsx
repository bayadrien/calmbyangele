"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

type Mode = "signin" | "signup" | "reset";

const errorMessage = (error: unknown) => {
  const code = (error as { code?: string }).code;
  if (code === "auth/email-already-in-use") return "Cette adresse a déjà un compte. Connectez-vous plutôt.";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code || "")) return "Adresse e-mail ou mot de passe incorrect.";
  if (code === "auth/weak-password") return "Choisissez un mot de passe d’au moins 6 caractères.";
  if (code === "auth/invalid-email") return "Cette adresse e-mail n’est pas valide.";
  if (code === "auth/operation-not-allowed") return "La connexion par e-mail doit encore être activée dans les réglages du site.";
  return "Une erreur est survenue. Réessayez dans quelques instants.";
};

export default function ClientLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loginGoogle = async () => {
    setLoading(true); setMessage("");
    try {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (mobile) await signInWithRedirect(auth, provider);
      else { await signInWithPopup(auth, provider); router.push("/client"); }
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setLoading(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      if (mode === "reset") { await sendPasswordResetEmail(auth, email); setMessage("Un lien pour choisir un nouveau mot de passe vient d’être envoyé à cette adresse."); }
      else if (mode === "signup") { await createUserWithEmailAndPassword(auth, email, password); router.push("/client"); }
      else { await signInWithEmailAndPassword(auth, email, password); router.push("/client"); }
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setLoading(false); }
  };

  const switchMode = (next: Mode) => { setMode(next); setMessage(""); };
  const title = mode === "signup" ? "Créez votre accès" : mode === "reset" ? "Retrouvez votre accès" : "Bienvenue";
  const description = mode === "signup" ? "Utilisez l’adresse e-mail que vous avez communiquée à CALM." : mode === "reset" ? "Nous vous enverrons un lien pour choisir un nouveau mot de passe." : "Connectez-vous pour retrouver les nouvelles de votre compagnon.";

  return <main className="public-calm grid min-h-screen place-items-center p-5">
    <section className="access-card w-full max-w-md">
      <span className="pet-seal">♧</span><p className="eyebrow mt-6">Espace famille</p><h1>{title}</h1><p>{description}</p>
      <button onClick={loginGoogle} disabled={loading} className="calm-primary mt-7 w-full disabled:cursor-wait disabled:opacity-60">Continuer avec Google <span>→</span></button>
      <div className="my-6 flex items-center gap-3 text-xs text-[#87928c]"><span className="h-px flex-1 bg-[#dce5dd]" />ou avec votre e-mail<span className="h-px flex-1 bg-[#dce5dd]" /></div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-left text-xs font-bold uppercase tracking-[.12em] text-[#718078]">Adresse e-mail
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ccd8cf] bg-white px-3.5 py-3 text-sm text-[#1d3029] outline-none focus:border-[#315e4e]" placeholder="vous@exemple.fr" />
        </label>
        {mode !== "reset" && <label className="block text-left text-xs font-bold uppercase tracking-[.12em] text-[#718078]">Mot de passe
          <input required minLength={6} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ccd8cf] bg-white px-3.5 py-3 text-sm text-[#1d3029] outline-none focus:border-[#315e4e]" placeholder="6 caractères minimum" />
        </label>}
        <button disabled={loading} className="calm-primary w-full disabled:cursor-wait disabled:opacity-60">{loading ? "Un instant…" : mode === "signup" ? "Créer mon accès" : mode === "reset" ? "Envoyer le lien" : "Se connecter"}</button>
      </form>
      {message && <p role="status" className="mt-4 rounded-xl bg-[#edf5ef] px-3 py-2 text-center text-xs leading-5 text-[#315e4e]">{message}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-[#315e4e]">
        {mode !== "signin" && <button onClick={() => switchMode("signin")}>J’ai déjà un accès</button>}
        {mode !== "signup" && <button onClick={() => switchMode("signup")}>Créer un accès</button>}
        {mode !== "reset" && <button onClick={() => switchMode("reset")}>Mot de passe oublié ?</button>}
      </div>
      <p className="mt-5 text-center text-xs leading-5 text-[#78877f]">Votre espace s’ouvrira uniquement si cette adresse est déjà présente dans votre fiche client CALM.</p>
    </section>
  </main>;
}
