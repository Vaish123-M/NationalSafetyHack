import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import InterventionList from './components/InterventionList';
import CostEstimate from './components/CostEstimate';
import DownloadReport from './components/DownloadReport';

export default function App() {
  const [interventions, setInterventions] = useState([]);
  const [costs, setCosts] = useState({});
  const [pricingDB, setPricingDB] = useState([
    { key: 'speed breaker', unitPrice: 5000, source: 'CPWD SOR 2025' },
    { key: 'speed hump', unitPrice: 4500, source: 'CPWD SOR 2025' },
    { key: 'road signage', unitPrice: 2000, source: 'GeM portal 2025' },
    { key: 'road marking', unitPrice: 150, source: 'GeM portal 2025' },
  ]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [extractedText, setExtractedText] = useState('');
  const [uploadMeta, setUploadMeta] = useState(null);
  const [showExtracted, setShowExtracted] = useState(false);

  const handleFileUpload = (payload, meta = {}) => {
    // payload may be either a File object (legacy) or a parsed result object
    // If payload.items exists, it's the parsed extraction from FileUpload
    if (payload && payload.items) {
      const items = payload.items.map((it, idx) => ({ ...it, id: it.id || (Date.now() + idx) }));
      setUploadedFile(payload.fileName || null);
      setUploadStatus(meta?.status || 'done');
      setUploadMeta(meta || null);
      setInterventions(items);
      setShowExtracted(true);
      setExtractedText(payload.extractedText || '');

      // If server returned precomputed costs use them
      if (payload.costs && Object.keys(payload.costs).length > 0) {
        setCosts(payload.costs);
        return;
      }

      // Otherwise compute costs locally using the app pricingDB state
      const computed = {};
      for (const it of items) {
        const name = (it.name || '').toLowerCase();
        const match = pricingDB.find(p => name.includes(p.key));
        if (match) {
          const qty = Number(it.quantity || 0);
          computed[it.id] = { unitPrice: match.unitPrice, total: match.unitPrice * qty, source: match.source };
        }
      }
      setCosts(computed);
      return;
    }

    // legacy: if a File object was passed, keep previous simulated behavior
    const file = payload;
    setUploadedFile(file?.name || null);
    setUploadStatus('parsing');

    setTimeout(() => {
      const parsed = [
        { id: 1, name: 'Speed Breaker', quantity: 10, clause: 'IRC: SP: 84' },
        { id: 2, name: 'Road Signage', quantity: 15, clause: 'IRC 67' },
      ];
      setInterventions(parsed);

      setCosts({
        1: { unitPrice: 5000, total: 50000, source: 'CPWD SOR 2025' },
        2: { unitPrice: 2000, total: 30000, source: 'GeM portal 2025' },
      });
      setUploadStatus('done');
    }, 900);
  };

  // If parsing produced no items, allow creating items from extracted text using heuristics
  const createItemsFromText = (text) => {
    if (!text) return;
    // simple heuristics: split lines, look for "name - qty" or numbers
    const lines = text.split(/\r?\n|\.|;|\u2022/).map(l => l.trim()).filter(Boolean);
    const items = [];
    let idc = 1;
    for (const line of lines) {
      const m = line.match(/(.{3,80}?)\s*[-:]?\s*(?:qty[:\s]*)?(\d{1,6})\b/i);
      if (m) {
        items.push({ id: Date.now() + idc++, name: m[1].trim(), quantity: Number(m[2]) || 0, clause: '' });
        continue;
      }
      // keywords
      const kws = ['speed breaker','signage','road marking','guard rail','rumble strip','speed hump','speed table'];
      for (const kw of kws) if (line.toLowerCase().includes(kw)) {
        const num = (line.match(/(\d{1,6})/) || [])[1] || 0;
        items.push({ id: Date.now() + idc++, name: kw, quantity: Number(num) || 0, clause: '' });
        break;
      }
    }
    if (items.length > 0) {
      setInterventions(items);
      computeCosts(items);
      setUploadStatus('done');
    }
  };

  const computeCosts = (items) => {
    const computed = {};
    for (const it of items) {
      const name = (it.name || '').toLowerCase();
      const match = pricingDB.find(p => name.includes(p.key));
      if (match) {
        const qty = Number(it.quantity || 0);
        computed[it.id] = { unitPrice: match.unitPrice, total: match.unitPrice * qty, source: match.source };
      }
    }
    setCosts(computed);
  };

  const updatePricingEntry = (index, entry) => {
    setPricingDB(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...entry };
      return next;
    });
    // recompute costs after pricing change
    computeCosts(interventions);
  };

  const addPricingEntry = (entry) => {
    setPricingDB(prev => [...prev, entry]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-900 via-purple-900 to-pink-900 font-sans p-6">
      <h1 className="text-center text-5xl font-extrabold text-white mb-12 drop-shadow-lg">
        Road Safety Intervention Estimator
      </h1>

      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-8">
        <section className="mb-6 text-white/90 leading-relaxed">
          <p className="mb-4">
            This web application is designed to assist road safety engineers and planners by providing an AI-powered estimator for material costs of recommended road safety interventions. By simply uploading intervention reports, users receive accurate, itemized cost estimations based on the latest Indian Road Congress (IRC) standards and official pricing data sources like CPWD and GeM portals.
          </p>
          <p className="mb-4">
            Our solution emphasizes clarity, transparency, and ease of use. It automatically extracts relevant technical specifications, quantities, and unit costs to generate detailed reports with references to IRC clauses and pricing sources. The interface is designed to be clean, modern, and responsive, ensuring the user can focus on actionable insights without distraction.
          </p>
          <p>
            This tool supports evidence-based decision-making to improve road safety interventions’ budgeting and planning accuracy while reducing manual estimation efforts.
          </p>
        </section>

        <FileUpload onUpload={handleFileUpload} />

        {uploadedFile && (
          <div className="mt-4 mb-4 text-sm text-white/80">
            <strong>Uploaded:</strong> {uploadedFile} — <span className="capitalize">{uploadStatus}</span>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Process Status</h3>
          <div className="flex gap-3 items-center text-sm text-white/90 mb-2">
            <div><strong>Uploaded:</strong> {uploadedFile || '—'}</div>
            <div><strong>Stage:</strong> {uploadStatus}</div>
            {uploadMeta?.error && <div className="text-red-300">Error: {uploadMeta.error}</div>}
          </div>
          <div className="mb-3">
            <button className="text-sm bg-white/20 text-white px-2 py-1 rounded mr-2" onClick={() => setShowExtracted(s => !s)}>{showExtracted ? 'Hide' : 'Show'} extracted text</button>
            <button className="text-sm bg-green-500 text-white px-2 py-1 rounded" onClick={() => createItemsFromText(extractedText)}>Try auto-create items</button>
          </div>
          {showExtracted && (
            <div className="bg-black/10 p-3 rounded text-xs text-white max-h-48 overflow-auto whitespace-pre-wrap mb-4">{extractedText || '— no extracted text —'}</div>
          )}

        </div>

        {interventions.length > 0 && (
          <>
            <InterventionList interventions={interventions} onChange={(id, payload) => {
              // payload may be { add: {...} } or { remove: true } or updates
              if (payload && payload.add) {
                setInterventions(prev => [...prev, payload.add]);
                return;
              }
              if (payload && payload.remove) {
                setInterventions(prev => prev.filter(i => i.id !== id));
                setCosts(prev => { const next = { ...prev }; delete next[id]; return next; });
                return;
              }
              // updates to a row
              setInterventions(prev => {
                const next = prev.map(it => it.id === id ? { ...it, ...payload } : it);
                // recompute costs locally
                computeCosts(next);
                return next;
              });
            }} />
            <CostEstimate interventions={interventions} costs={costs} />
            <DownloadReport interventions={interventions} costs={costs} extractedText={extractedText} />
          </>
        )}

        {/* If no interventions were extracted, show extracted text and helper */}
        {uploadedFile && interventions.length === 0 && (
          <div className="mt-4 bg-white/10 p-4 rounded text-white text-sm">
            <h3 className="font-semibold mb-2">No interventions detected automatically</h3>
            <p className="mb-2">Below is the raw extracted text from the uploaded document. You can try to auto-create items from it or copy/paste/edit manually.</p>
            <div className="max-h-48 overflow-auto bg-black/10 p-2 rounded mb-2 whitespace-pre-wrap text-xs">{extractedText || '— no text extracted —'}</div>
            <div className="flex gap-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => createItemsFromText(extractedText)}>Create items from extracted text</button>
              <button className="bg-white/20 text-white px-3 py-1 rounded" onClick={() => navigator.clipboard && navigator.clipboard.writeText(extractedText)}>Copy extracted text</button>
            </div>
          </div>
        )}

        {/* Admin: pricing editor (small) */}
        <details className="mt-6 text-white/90">
          <summary className="cursor-pointer mb-2">Admin: Pricing database (edit to match official sources)</summary>
          <div className="bg-white/10 p-4 rounded">
            {pricingDB.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <input className="text-black p-1 rounded" value={p.key} onChange={e => updatePricingEntry(idx, { key: e.target.value })} />
                <input className="text-black p-1 rounded w-32" value={p.unitPrice} onChange={e => updatePricingEntry(idx, { unitPrice: Number(e.target.value) || 0 })} />
                <input className="text-black p-1 rounded" value={p.source} onChange={e => updatePricingEntry(idx, { source: e.target.value })} />
              </div>
            ))}
            <button className="mt-2 bg-white/20 px-3 py-1 rounded" onClick={() => addPricingEntry({ key: 'new item', unitPrice: 0, source: '' })}>+ Add pricing entry</button>
            <div className="mt-3">
              <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => computeCosts(interventions)}>Recalculate costs</button>
            </div>
          </div>
        </details>
      </div>

      <footer className="mt-16 text-center text-white/70 text-sm">
        &copy; 2025 Road Safety Hackathon – Built with 💜 using React & Tailwind CSS
      </footer>
    </div>
  );
}
