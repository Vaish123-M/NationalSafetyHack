const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const PRICING_FILE = path.join(__dirname, 'pricing.json');
let pricing = { entries: [] };
try { pricing = JSON.parse(fs.readFileSync(PRICING_FILE, 'utf8')); } catch (e) { /* ignore */ }

function extractClause(s) {
  const m = s.match(/(IRC[:\s]*[A-Z0-9\s:-]+|IRC\s*\d+|IRC[:\s]*[A-Z]{1,3}\s*:?\s*\d{1,3})/i);
  return m ? m[0].trim() : '';
}

function parseTextContent(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n|\.|;|\u2022/).map(l => l.trim()).filter(Boolean);
  const items = [];
  const nameKeywords = ['speed breaker','speed hump','speed table','road signage','signage','road marking','pavement marking','guard rail','rumble strip','pedestrian crossing','traffic signal'];
  let idc = 1;

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
}

function computeCosts(items) {
  const result = {};
  for (const it of items) {
    const name = (it.name || '').toLowerCase();
    const match = pricing.entries.find(p => name.includes(p.key));
    if (match) {
      const qty = Number(it.quantity || 0);
      result[it.id] = { unitPrice: match.unitPrice, total: match.unitPrice * qty, source: match.source };
    }
  }
  return result;
}

app.get('/api/pricing', (req, res) => {
  res.json(pricing);
});

app.post('/api/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { originalname, mimetype, buffer } = req.file;
    let extracted = '';
    if (/\.docx$/i.test(originalname) || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const r = await mammoth.extractRawText({ buffer });
        extracted = r && r.value ? r.value : '';
      } catch (e) {
        extracted = '';
      }
    } else if (/\.pdf$/i.test(originalname) || mimetype === 'application/pdf') {
      try {
        const data = await pdfParse(buffer);
        extracted = data && data.text ? data.text : '';
      } catch (e) {
        extracted = '';
      }
    } else {
      extracted = buffer.toString('utf8');
    }

    const items = parseTextContent(extracted || '');
    const costs = computeCosts(items);
    const overall = items.reduce((acc, it) => acc + (costs[it.id]?.total || 0), 0);
    res.json({ items, extractedText: extracted, costs, overall });
  } catch (err) {
    console.error('Parse error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => console.log(`Estimator server listening on port ${PORT}`));
