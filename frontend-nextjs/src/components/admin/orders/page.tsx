type Order = {
  id: string; customer: string; phone: string;
  addressLink?: string; payment: "CASH" | "CARD"; status: "NEW" | "ASSIGNED" | "OUT" | "DONE" | "CANCELLED";
};

const mock: Order[] = [
  { id: "GH-1001", customer: "Ahmed", phone: "0550000001", addressLink: "https://maps.app.goo.gl/xxx", payment: "CASH", status: "NEW" },
  { id: "GH-1002", customer: "Sara", phone: "0550000002", addressLink: "https://maps.apple.com/?q=...", payment: "CARD", status: "ASSIGNED" },
];

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">#</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Address</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {mock.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-mono">{o.id}</td>
                <td className="p-3">{o.customer}</td>
                <td className="p-3">{o.phone}</td>
                <td className="p-3">
                  {o.addressLink ? (
                    <a className="text-green-700 underline" href={o.addressLink} target="_blank">
                      Map
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3">{o.payment}</td>
                <td className="p-3">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                    {o.status}
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
