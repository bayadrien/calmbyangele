"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 🔒 Remplace par TON email exact
      const adminEmail = "aux.pattounes59@gmail.com";

      if (user.email === adminEmail) {
        router.push("/dashboard");
      } else {
        alert("Accès refusé.");
        await auth.signOut();
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-6 text-purple-700">
          CALM by Angèle
        </h1>
        <button
          onClick={handleLogin}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition"
        >
          Connexion avec Google
        </button>
      </div>
    </div>
  );
}