"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [{ href: "/super/tenants", label: "Tenants" }];

export default function SuperSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <div className="p-4 font-bold text-xl">Super Admin</div>
      <nav className="px-2 pb-4 space-y-1">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-green-600 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}