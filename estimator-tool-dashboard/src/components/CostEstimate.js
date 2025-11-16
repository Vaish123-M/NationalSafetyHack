export default function CostEstimate({ interventions, costs }) {
  const formatCurrency = (v) => {
    if (v === undefined || v === null || v === '') return '-';
    return new Intl.NumberFormat('en-IN').format(Number(v));
  };

  const overallTotal = interventions.reduce((acc, { id }) => acc + (Number(costs[id]?.total || 0)), 0);

  const buildTextReport = () => {
    let out = '';
    out += 'Extracted Interventions with Details\n\n';
    interventions.forEach(({ name, quantity, clause }) => {
      out += `${name}: Quantity ${quantity || 0}${clause ? `, Clause ${clause}` : ''}\n`;
    });

    out += '\nCost Estimates per Intervention\n\n';
    interventions.forEach(({ id, name, quantity }) => {
      const u = costs[id]?.unitPrice ?? 0;
      const t = costs[id]?.total ?? 0;
      const s = costs[id]?.source ?? '-';
      out += `${name}\nUnit Price: ₹${formatCurrency(u)}\nTotal Cost: ₹${formatCurrency(t)}\nPrice Source: ${s}\n\n`;
    });

    out += `Overall Total: ₹${formatCurrency(overallTotal)}\n`;
    return out;
  };

  const handleSave = () => {
    const txt = buildTextReport();
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost-estimate.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const html = `
      <html>
      <head>
        <title>Cost Estimate Report</title>
        <meta charset="utf-8" />
        <style>
          body{font-family: Arial, Helvetica, sans-serif; padding:18px; color:#111}
          .item{border:1px solid #ddd;padding:12px;margin-bottom:12px;border-radius:6px}
          .item h3{margin:0 0 8px}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#f6f6f6}
        </style>
      </head>
      <body>
        <h1>Cost Estimate Report</h1>
        <h2>Extracted Interventions</h2>
        ${interventions.map(({ name, quantity, clause }) => `
          <div class="item"><h3>${name}</h3>
            <div>Quantity: ${quantity || 0}</div>
            <div>${clause ? `Clause: ${clause}` : ''}</div>
          </div>
        `).join('')}

        <h2>Cost Estimates per Intervention</h2>
        ${interventions.map(({ id, name }) => `
          <div class="item">
            <h3>${name}</h3>
            <table><tbody>
              <tr><th>Unit Price (₹)</th><td>₹ ${formatCurrency(costs[id]?.unitPrice ?? '-')}</td></tr>
              <tr><th>Total Cost (₹)</th><td>₹ ${formatCurrency(costs[id]?.total ?? '-')}</td></tr>
              <tr><th>Price Source</th><td>${costs[id]?.source ?? '-'}</td></tr>
            </tbody></table>
          </div>
        `).join('')}

        <h3>Overall total: ₹ ${formatCurrency(overallTotal)}</h3>
      </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) { alert('Popup blocked. Please allow popups to print the report.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  };

  return (
    <div className="mb-8 bg-white bg-opacity-30 backdrop-blur-sm rounded-lg shadow-lg p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Cost Estimates</h2>

      <div className="grid gap-4">
        {interventions.map(({ id, name, quantity, clause }) => (
          <div key={id} className="bg-white/90 text-gray-900 p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold">{name}</div>
                <div className="text-sm text-gray-700">Quantity: {quantity || 0}{clause ? ` — Clause: ${clause}` : ''}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Unit Price</div>
                <div className="text-xl font-bold">₹ {formatCurrency(costs[id]?.unitPrice ?? '-')}</div>
                <div className="text-sm text-gray-600">Total: ₹ {formatCurrency(costs[id]?.total ?? '-')}</div>
                <div className="text-xs text-gray-500 mt-1">Price Source: {costs[id]?.source ?? '-'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-white font-semibold">Overall total: ₹ {formatCurrency(overallTotal)}</div>
        <div className="flex gap-3">
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save Report</button>
          <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded">Print Report</button>
        </div>
      </div>
    </div>
  );
}
