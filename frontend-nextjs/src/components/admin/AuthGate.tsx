"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthGate() {
  const router = useRouter();
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) router.replace("/login");
    } catch {}
  }, [router]);
  return null;
}