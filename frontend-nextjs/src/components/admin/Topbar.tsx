"use client";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const logout = async () => {
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch {}
    router.replace("/login");
  };
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="font-semibold">Noor • GHITHAK</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">status: online</span>
        <button
          onClick={logout}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
