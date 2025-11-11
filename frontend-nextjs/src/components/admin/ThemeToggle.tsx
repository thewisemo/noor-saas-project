"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      setDark(document.documentElement.classList.contains("dark"));
    } catch {}
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
      title="Toggle theme"
    >
      {dark ? "Dark" : "Light"}
    </button>
  );
}
