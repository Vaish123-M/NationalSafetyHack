import Button from './Button';

export default function DownloadReport({ interventions, costs, extractedText = '' }) {
  const handleSave = () => {
    const overall = interventions.reduce((acc, { id }) => acc + (costs[id]?.total || 0), 0);
    const payload = { interventions, costs, extractedText, overall };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost-estimate.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    // Create simple printable report and open print dialog
    const html = `
      <html>
      <head>
        <title>Cost Estimate Report</title>
        <style>body{font-family: Arial, Helvetica, sans-serif; padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f3f3f3}</style>
      </head>
      <body>
        <h1>Cost Estimate Report</h1>
        <table>
          <thead><tr><th>Intervention</th><th>Quantity</th><th>Clause</th><th>Unit Price (₹)</th><th>Total Cost (₹)</th><th>Price Source</th></tr></thead>
          <tbody>
            ${interventions.map(({ id, name, quantity, clause }) => {
              const u = costs[id]?.unitPrice ?? '-';
              const t = costs[id]?.total ?? '-';
              const s = costs[id]?.source ?? '-';
              return `<tr><td>${name}</td><td>${quantity}</td><td>${clause}</td><td>${u}</td><td>${t}</td><td>${s}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
        <p style="margin-top:20px;"><strong>Overall total:</strong> ₹ ${interventions.reduce((acc,{id}) => acc + (costs[id]?.total || 0), 0)}</p>
        ${extractedText ? `<h3>Extracted text</h3><pre style="white-space:pre-wrap;border:1px solid #eee;padding:10px">${String(extractedText).replace(/</g,'&lt;')}</pre>` : ''}
      </body>
      </html>
    `;
    const w = window.open('', '_blank');
    if (!w) { alert('Popup blocked. Please allow popups to print the report.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="flex gap-4 justify-center mt-4">
      <Button onClick={handleSave}>Save Output</Button>
      <Button onClick={handlePrint}>Print Output</Button>
    </div>
  );
}
