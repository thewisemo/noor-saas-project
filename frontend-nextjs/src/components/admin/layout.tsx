import Sidebar from "../../components/admin/Sidebar";
import Topbar from "../../components/admin/Topbar";
import AuthGate from "../../components/admin/AuthGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-gray-100">
      <Topbar />
      <AuthGate />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}