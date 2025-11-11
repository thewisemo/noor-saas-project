export default function AdminDashboard() {
  const stats = [
    { title: "New Orders", value: "12" },
    { title: "Assigned", value: "7" },
    { title: "On the Way", value: "3" },
    { title: "Completed", value: "25" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.title} className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-gray-500">{s.title}</div>
            <div className="text-3xl font-semibold mt-2">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-2">Today Activity</div>
        <div className="text-sm text-gray-500">
          Orders timeline and KPIs will appear here.
        </div>
      </div>
    </div>
  );
}
