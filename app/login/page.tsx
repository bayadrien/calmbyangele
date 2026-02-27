"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const adminEmail = [
    "aux.pattounes59@gmail.com",
    "bayadrien@gmail.com",
  ];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const checkUser = async (user: any) => {
    if (user?.email && adminEmail.includes(user.email)) {
      router.push("/dashboard");
    } else {
      alert("Accès refusé.");
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
    <div className="min-h-screen flex items-center justify-center bg-purple-200">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border border-purple-200 w-96">
        
        {/* Titre cliquable secret */}
        <h1
          onClick={handleSecretClick}
          className="text-3xl font-bold mb-6 text-purple-900 cursor-default"
        >
          CALM by Angèle 💜
        </h1>

        <button
          onClick={handleLogin}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl shadow-lg transition transform hover:scale-105 w-full"
        >
          Connexion avec Google
        </button>

        {showAdmin && (
          <div className="mt-6 space-y-4 text-left">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            <button
              onClick={handleEmailLogin}
              className="w-full bg-purple-900 text-white py-3 rounded-xl hover:bg-purple-800 transition"
            >
              Connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}