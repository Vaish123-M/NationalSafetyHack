export default function InterventionList({ interventions }) {
  return (
    <div className="mb-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Extracted Interventions</h2>
      <ul className="list-disc list-inside">
        {interventions.map(({ id, name, quantity, clause }) => (
          <li key={id} className="mb-2">
            <strong>{name}</strong> – Quantity: {quantity} | Clause: {clause}
          </li>
        ))}
      </ul>
    </div>
  );
}
