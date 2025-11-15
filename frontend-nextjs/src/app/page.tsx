import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const token = cookies().get("token")?.value;
  const role  = cookies().get("role")?.value;

  if (!token) redirect("/login");
  if (role === "SUPER_ADMIN") redirect("/super/tenants");
  redirect("/admin");
}
