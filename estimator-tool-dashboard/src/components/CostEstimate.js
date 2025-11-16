export default function CostEstimate({ interventions, costs }) {
  return (
    <div className="mb-8 bg-white bg-opacity-30 backdrop-blur-sm rounded-lg shadow-lg p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Cost Estimates</h2>
      <table className="w-full text-purple-900 bg-white rounded-lg">
        <thead>
          <tr>
            <th className="p-2 border">Intervention</th>
            <th className="p-2 border">Unit Price (₹)</th>
            <th className="p-2 border">Total Cost (₹)</th>
            <th className="p-2 border">Price Source</th>
          </tr>
        </thead>
        <tbody>
          {interventions.map(({ id, name }) => (
            <tr key={id} className="text-center even:bg-purple-100">
              <td className="p-2 border">{name}</td>
              <td className="p-2 border">{costs[id]?.unitPrice || '-'}</td>
              <td className="p-2 border">{costs[id]?.total || '-'}</td>
              <td className="p-2 border">{costs[id]?.source || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
