import React, { useRef, useState } from 'react';
import Button from './Button';

export default function FileUpload({ onUpload, maxSizeMB = 10 }) {
  const fileInput = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');

  const humanFileSize = (size) => {
    if (size === 0) return '0 B';
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  const validate = (file) => {
    if (!file) return 'No file selected.';
    const allowed = ['application/pdf', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx|doc|txt|csv)$/i)) {
      return 'Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, CSV.';
    }
    if (file.size > maxSizeMB * 1024 * 1024) return `File too large. Max ${maxSizeMB} MB.`;
    return null;
  };

  const handleChange = () => {
    const f = fileInput.current.files[0];
    setSelectedFile(f || null);
    setProgress(0);
    setStatus('idle');
    if (f) setTimeout(() => processFile(f), 120);
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const file = fileInput.current.files[0];
    processFile(file);
  };

  // Helpers to read file
  const readAsText = (f) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsText(f);
  });

  const readAsArray = (f) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsArrayBuffer(f);
  });

  // DOCX extraction: prefer mammoth, fallback to crude XML scan
  const extractFromDocx = async (arrayBuffer) => {
    try {
      const mammoth = await import('mammoth');
      const res = await mammoth.extractRawText({ arrayBuffer });
      if (res && res.value) return res.value;
    } catch (e) {
      // ignore
    }
    try {
      const bytes = new Uint8Array(arrayBuffer);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const start = bin.indexOf('<w:document');
      if (start === -1) return '';
      const docPart = bin.slice(start);
      const re = /<w:t[^>]*>(.*?)<\/w:t>/gms;
      let m; const out = [];
      while ((m = re.exec(docPart)) !== null) out.push(m[1]);
      return out.join(' ');
    } catch (e) {
      return '';
    }
  };

  // PDF extraction: prefer pdfjs, fallback to raw decode
  const extractFromPdf = async (arrayBuffer) => {
    try {
      const pdfjs = await import('pdfjs-dist/build/pdf');
      try {
        await import('pdfjs-dist/build/pdf.worker.entry');
      } catch (e) {
        // worker import optional
      }
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= doc.numPages; i++) {
        try {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const strs = content.items.map(it => it.str || '').join(' ');
          fullText += strs + '\n';
        } catch (e) {
          // ignore page failures
        }
      }
      return fullText;
    } catch (e) {
      try {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
        return text.replace(/\s+/g, ' ');
      } catch (err) {
        return '';
      }
    }
  };

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const header = lines[0].split(/,|;|\t/).map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(l => l.split(/,|;|\t/).map(c => c.trim()));
    const nameIdx = header.findIndex(h => /name|intervention|item/.test(h));
    const qtyIdx = header.findIndex(h => /qty|quantity|count/.test(h));
    const clauseIdx = header.findIndex(h => /clause|irc|reference/.test(h));
    const items = rows.map((r, idx) => ({
      id: Date.now() + idx,
      name: (r[nameIdx] || r[0] || '').trim(),
      quantity: Number(r[qtyIdx] || r[1] || 0) || 0,
      clause: r[clauseIdx] || ''
    })).filter(it => it.name || it.quantity);
    return items;
  };

  // Improved template-based parsing to detect interventions, quantities and IRC clauses
  const parseTextContent = (text) => {
    if (!text) return [];
    const lines = text.split(/\r?\n|\.|;|\u2022/).map(l => l.trim()).filter(Boolean);
    const items = [];
    const nameKeywords = ['speed breaker','speed hump','speed table','road signage','signage','road marking','pavement marking','guard rail','rumble strip','pedestrian crossing','traffic signal'];
    let idc = 1;

    const extractClause = (s) => {
      const m = s.match(/(IRC[:\s]*[A-Z0-9\s:-]+|IRC\s*\d+|IRC[:\s]*[A-Z]{1,3}\s*:?\s*\d{1,3})/i);
      return m ? m[0].trim() : '';
    };

    for (const line of lines) {
      const L = line.replace(/\s+/g, ' ').trim();
      const struct = L.match(/^(.{3,120}?)\s*[-:,]\s*(?:Qty[:\s]*)?(\d{1,7})\s*(?:[-:,]\s*(.*))?$/i);
      if (struct) {
        items.push({ id: Date.now() + idc++, name: struct[1].trim(), quantity: Number(struct[2]) || 0, clause: (struct[3]||'').trim() });
        continue;
      }
      const paren = L.match(/^(.{3,120}?)\s*\(.*?(?:qty|quantity)?[:\s]*?(\d{1,7}).*?\)/i);
      if (paren) {
        items.push({ id: Date.now() + idc++, name: paren[1].trim(), quantity: Number(paren[2]) || 0, clause: extractClause(L) });
        continue;
      }
      for (const kw of nameKeywords) {
        if (L.toLowerCase().includes(kw)) {
          const num = (L.match(/(\d{1,7})/) || [])[1] || 0;
          const clause = extractClause(L);
          items.push({ id: Date.now() + idc++, name: kw, quantity: Number(num) || 0, clause });
          break;
        }
      }
      const qtyMatch = L.match(/(.{3,80}?)\s+(?:-+|–|—)?\s*(?:qty[:\s]*)?(\d{1,7})\b/i);
      if (qtyMatch) {
        items.push({ id: Date.now() + idc++, name: qtyMatch[1].trim(), quantity: Number(qtyMatch[2]) || 0, clause: extractClause(L) });
        continue;
      }
    }

    const map = new Map();
    for (const it of items) {
      const key = it.name.toLowerCase();
      if (!map.has(key)) map.set(key, { ...it });
      else {
        const existing = map.get(key);
        existing.quantity = (existing.quantity || 0) + (it.quantity || 0);
        if (!existing.clause && it.clause) existing.clause = it.clause;
      }
    }
    return Array.from(map.values()).map((it, i) => ({ ...it, id: Date.now() + i }));
  };

  // Process file and call onUpload with parsed items + extractedText
  const processFile = (file) => {
    const error = validate(file);
    if (error) { setStatus('error'); alert(error); return; }
    setStatus('processing');
    setProgress(10);
    // First try backend parsing if available
    (async () => {
      try {
        const form = new FormData();
        form.append('file', file);
        const resp = await fetch('/api/parse', { method: 'POST', body: form });
        if (resp.ok) {
          const json = await resp.json();
          // expected shape: { items, extractedText, costs, overall }
          const items = json.items || [];
          setProgress(80);
          onUpload({ items, fileName: file.name, fileType: file.type, extractedText: json.extractedText || '', costs: json.costs || {} , overall: json.overall }, { status: 'done' });
          setProgress(100);
          setStatus('done');
          return;
        }
      } catch (e) {
        // backend not available or failed — fall back to client parsing
      }

      try {
        let text = '';
        if (/\.csv$/i.test(file.name) || file.type === 'text/csv') {
          text = await readAsText(file);
          const items = parseCsv(text);
          setProgress(80);
          onUpload({ items, fileName: file.name, fileType: file.type, extractedText: text }, { status: 'done' });
          setProgress(100);
          setStatus('done');
          return;
        }

        if (file.type === 'text/plain' || /\.txt$/i.test(file.name)) {
          text = await readAsText(file);
          const items = parseTextContent(text);
          setProgress(80);
          onUpload({ items, fileName: file.name, fileType: file.type, extractedText: text }, { status: 'done' });
          setProgress(100);
          setStatus('done');
          return;
        }

        if (/\.docx$/i.test(file.name) || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arr = await readAsArray(file);
          const extracted = await extractFromDocx(arr);
          const items = parseTextContent(extracted || '');
          setProgress(80);
          onUpload({ items, fileName: file.name, fileType: 'docx', extractedText: extracted || '' }, { status: 'done' });
          setProgress(100);
          setStatus('done');
          return;
        }

        if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
          const arr = await readAsArray(file);
          const extracted = await extractFromPdf(arr);
          const items = parseTextContent(extracted || '');
          setProgress(80);
          onUpload({ items, fileName: file.name, fileType: 'pdf', extractedText: extracted || '' }, { status: 'done' });
          setProgress(100);
          setStatus('done');
          return;
        }

        text = await readAsText(file);
        const items = parseTextContent(text || '');
        setProgress(80);
        onUpload({ items, fileName: file.name, fileType: file.type, extractedText: text || '' }, { status: 'done' });
        setProgress(100);
        setStatus('done');
      } catch (err) {
        console.error('Parsing failed', err);
        setStatus('error');
        onUpload({ items: [], fileName: file.name, fileType: file.type, extractedText: '' }, { status: 'error', error: String(err) });
      }
    })();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-2 items-center justify-center">
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.csv"
          onChange={handleChange}
          className="text-black p-2 rounded-l border border-r-0 border-gray-300"
        />
        <Button type="submit" className="rounded-l-none" disabled={!selectedFile || status === 'uploading'}>
          Upload Report
        </Button>
      </div>

      {selectedFile && (
        <div className="mt-3 text-white/90 text-sm max-w-2xl mx-auto">
          <div><strong>Selected:</strong> {selectedFile.name} ({humanFileSize(selectedFile.size)})</div>
          <div className="mt-2">
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div className="bg-green-400 h-3" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1">Status: {status} {status === 'uploading' && `— ${progress}%`}</div>
          </div>
        </div>
      )}
    </form>
  );
}
