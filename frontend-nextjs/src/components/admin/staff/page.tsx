type Staff = { name: string; email: string; role: "TENANT_ADMIN" | "STAFF" | "DRIVER" };
const staff: Staff[] = [
  { name: "Momen", email: "imwisemo@gmail.com", role: "TENANT_ADMIN" },
  { name: "Sara", email: "saramomen2019@gmail.com", role: "STAFF" },
  { name: "Mostafa", email: "ghithakpos@gmail.com", role: "DRIVER" },
];

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Staff</h1>
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.email} className="border-t">
                <td className="p-3">{s.name}</td>
                <td className="p-3">{s.email}</td>
                <td className="p-3">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                    {s.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
