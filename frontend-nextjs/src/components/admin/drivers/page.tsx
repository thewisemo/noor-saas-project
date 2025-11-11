type Driver = { name: string; phone: string; available: boolean; activeOrders: number };
const drivers: Driver[] = [
  { name: "Mostafa", phone: "0550000003", available: true, activeOrders: 1 },
  { name: "Ali", phone: "0550000004", available: false, activeOrders: 0 },
];

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Drivers</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {drivers.map((d) => (
          <div key={d.phone} className="rounded-2xl border bg-white p-4">
            <div className="font-semibold">{d.name}</div>
            <div className="text-sm text-gray-500">{d.phone}</div>
            <div className="mt-2 text-sm">
              Availability:{" "}
              <span className={d.available ? "text-green-600" : "text-red-600"}>
                {d.available ? "Available" : "Busy"}
              </span>
            </div>
            <div className="text-sm">Active Orders: {d.activeOrders}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
