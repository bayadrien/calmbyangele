"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function AuthListener() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {

      // 🔓 Pages publiques autorisées
      if (
        pathname.startsWith("/contrat") ||
        pathname.startsWith("/contrat-sejour") ||
        pathname.startsWith("/login")
      ) {
        return
      }

      // 🔐 Protéger uniquement dashboard
      if (pathname.startsWith("/dashboard") && !user) {
        router.push("/login")
      }

    })

    return () => unsubscribe()
  }, [router, pathname])

  return null
}