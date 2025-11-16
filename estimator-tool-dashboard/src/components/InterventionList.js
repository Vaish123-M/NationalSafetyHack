export default function InterventionList({ interventions, onChange }) {
  const handleChange = (id, field, value) => {
    if (!onChange) return;
    const updates = {};
    if (field === 'quantity') updates[field] = Number(value) || 0;
    else updates[field] = value;
    onChange(id, updates);
  };

  const addRow = () => {
    const id = Date.now();
    onChange && onChange(null, { add: { id, name: 'New item', quantity: 0, clause: '' } });
  };

  const removeRow = (id) => {
    onChange && onChange(id, { remove: true });
  };

  return (
    <div className="mb-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold mb-4">Extracted Interventions</h2>
        <button onClick={addRow} className="text-sm bg-white/20 px-3 py-1 rounded">+ Add</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Intervention</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Clause / Reference</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {interventions.map(({ id, name, quantity, clause }) => (
              <tr key={id} className="align-top">
                <td className="p-2">
                  <input value={name || ''} onChange={e => handleChange(id, 'name', e.target.value)} className="w-full text-black p-1 rounded" />
                </td>
                <td className="p-2">
                  <input type="number" value={quantity || 0} onChange={e => handleChange(id, 'quantity', e.target.value)} className="w-24 text-black p-1 rounded" />
                </td>
                <td className="p-2">
                  <input value={clause || ''} onChange={e => handleChange(id, 'clause', e.target.value)} className="w-full text-black p-1 rounded" />
                </td>
                <td className="p-2">
                  <button onClick={() => removeRow(id)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
