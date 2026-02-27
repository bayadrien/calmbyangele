"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const adminEmail = ["aux.pattounes59@gmail.com","bayadrien@gmail.com"]

  const checkUser = async (user: any) => {
    console.log("USER EMAIL:", user?.email);

    if (user?.email && adminEmail.includes(user.email)) {
      console.log("ADMIN OK");
      router.push("/dashboard");
    } else {
      console.log("NOT ADMIN");
      alert("Accès refusé.");
      await signOut(auth);
    }
    alert("EMAIL: " + user?.email);
    alert("IS ADMIN: " + adminEmail.includes(user?.email));
  };

  const handleLogin = async () => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(
        navigator.userAgent
      );

      if (isMobile) {
        // Mobile → redirect (pas de popup)
        await signInWithRedirect(auth, provider);
      } else {
        // Desktop → popup
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          await checkUser(result.user);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion.");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        alert("AUTH STATE: " + user.email);
        await checkUser(user);
      }
    });

  return () => unsubscribe();
}, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-200">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border border-purple-200">
        <h1 className="text-3xl font-bold mb-6 text-purple-900">
          CALM by Angèle 💜
        </h1>

        <button
          onClick={handleLogin}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl shadow-lg transition transform hover:scale-105"
        >
          Connexion avec Google
        </button>
      </div>
    </div>
  );
}