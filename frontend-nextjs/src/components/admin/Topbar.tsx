"use client";
import ThemeToggle from "./ThemeToggle";

export default function Topbar() {
  const hardLogout = () => {
    try { localStorage.removeItem("token"); localStorage.removeItem("role"); sessionStorage.clear(); } catch {}
    window.location.href = "/logout";
  };
  return (
    <header className="h-14 border-b bg-white dark:bg-neutral-900 flex items-center justify-between px-4">
      <div className="font-semibold">Noor • GHITHAK</div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <span className="text-xs text-gray-500 dark:text-gray-400">status: online</span>
        <button onClick={hardLogout} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800">Logout</button>
      </div>
    </header>
  );
}
