const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'shop.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Schema ─────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL,
    phone   TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS item_packings (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    label   TEXT NOT NULL,
    qty     REAL DEFAULT 0,
    unit    TEXT DEFAULT 'kg'
  );

  CREATE TABLE IF NOT EXISTS stock (
    packing_id INTEGER PRIMARY KEY REFERENCES item_packings(id) ON DELETE CASCADE,
    quantity   REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sales (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id   INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    date          TEXT NOT NULL,
    grand_total   REAL DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id        INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id        INTEGER,
    packing_id     INTEGER,
    item_name      TEXT NOT NULL,
    packing_label  TEXT NOT NULL,
    qty            REAL NOT NULL,
    price          REAL NOT NULL,
    total          REAL NOT NULL
  );
`);

// ── Seed default items if empty ────────────────────────────────────────────
const DEFAULT_ITEMS = [
  { name: 'Sugar',           packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Atta (Wheat)',    packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Maida',           packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Sooji (Fine)',    packings: [{ label: 'Large Bag', qty: 30, unit: 'kg' }, { label: 'Small Bag',  qty: 15,  unit: 'kg'    }] },
  { name: 'Sooji (Coarse)',  packings: [{ label: 'Large Bag', qty: 30, unit: 'kg' }, { label: 'Small Bag',  qty: 15,  unit: 'kg'    }] },
  { name: 'Besan',           packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Rice (Sona)',     packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Rice (Basmati)',  packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Pack', qty: 5,   unit: 'kg'    }] },
  { name: 'Rice (IR)',       packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Toor Dal',        packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Chana Dal',       packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Urad Dal',        packings: [{ label: 'Large Bag', qty: 30, unit: 'kg' }, { label: 'Small Bag',  qty: 15,  unit: 'kg'    }] },
  { name: 'Moong Dal',       packings: [{ label: 'Large Bag', qty: 30, unit: 'kg' }, { label: 'Small Bag',  qty: 15,  unit: 'kg'    }] },
  { name: 'Masoor Dal',      packings: [{ label: 'Large Bag', qty: 30, unit: 'kg' }, { label: 'Small Bag',  qty: 15,  unit: 'kg'    }] },
  { name: 'Gram Dal',        packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Poha',            packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Rawa',            packings: [{ label: 'Large Bag', qty: 30, unit: 'kg' }, { label: 'Small Bag',  qty: 15,  unit: 'kg'    }] },
  { name: 'Salt',            packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: '1kg Pack',   qty: 1,   unit: 'kg'    }] },
  { name: 'Cooking Oil',     packings: [{ label: 'Large Tin', qty: 15, unit: 'litre' }, { label: 'Small Can', qty: 5,  unit: 'litre' }] },
  { name: 'Mustard Oil',     packings: [{ label: 'Large Tin', qty: 15, unit: 'litre' }, { label: 'Small Can', qty: 5,  unit: 'litre' }] },
  { name: 'Sunflower Oil',   packings: [{ label: 'Large Tin', qty: 15, unit: 'litre' }, { label: 'Small Can', qty: 5,  unit: 'litre' }] },
  { name: 'Vanaspati',       packings: [{ label: 'Large Tin', qty: 15, unit: 'kg'    }, { label: 'Small Tin', qty: 5,  unit: 'kg'    }] },
  { name: 'Tea (Loose)',     packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Turmeric',        packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Red Chilli',      packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Coriander',       packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Cumin',           packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Pepper',          packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Vermicelli',      packings: [{ label: 'Large Box', qty: 20, unit: 'kg' }, { label: 'Small Box',  qty: 10,  unit: 'kg'    }] },
  { name: 'Sabudana',        packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Groundnuts',      packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Chana (Whole)',   packings: [{ label: 'Large Bag', qty: 50, unit: 'kg' }, { label: 'Small Bag',  qty: 25,  unit: 'kg'    }] },
  { name: 'Kabuli Chana',    packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Rajma',           packings: [{ label: 'Large Bag', qty: 25, unit: 'kg' }, { label: 'Small Bag',  qty: 10,  unit: 'kg'    }] },
  { name: 'Soya Chunks',     packings: [{ label: 'Large Bag', qty: 30, unit: 'kg' }, { label: 'Small Bag',  qty: 15,  unit: 'kg'    }] },
  { name: 'Noodles',         packings: [{ label: 'Large Box', qty: 20, unit: 'kg' }, { label: 'Small Box',  qty: 10,  unit: 'kg'    }] },
  { name: 'Biscuits (Asst)', packings: [{ label: 'Full Case', qty: 1,  unit: 'box' }, { label: 'Half Case', qty: 1,  unit: 'box'   }] },
  { name: 'Detergent',       packings: [{ label: 'Full Case', qty: 1,  unit: 'box' }, { label: 'Half Case', qty: 1,  unit: 'box'   }] },
  { name: 'Washing Powder',  packings: [{ label: 'Full Case', qty: 1,  unit: 'box' }, { label: 'Half Case', qty: 1,  unit: 'box'   }] },
  { name: 'Soap (Bar)',      packings: [{ label: 'Full Case', qty: 1,  unit: 'box' }, { label: 'Half Case', qty: 1,  unit: 'box'   }] },
];

if (db.prepare('SELECT COUNT(*) as c FROM items').get().c === 0) {
  const insertItem    = db.prepare('INSERT INTO items (name) VALUES (?)');
  const insertPacking = db.prepare('INSERT INTO item_packings (item_id, label, qty, unit) VALUES (?, ?, ?, ?)');
  for (const item of DEFAULT_ITEMS) {
    const { lastInsertRowid: itemId } = insertItem.run(item.name);
    for (const p of item.packings) insertPacking.run(itemId, p.label, p.qty, p.unit);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
const getItemsWithPackings = () => {
  const rows = db.prepare(`
    SELECT i.id, i.name, ip.id as packing_id, ip.label, ip.qty, ip.unit,
           COALESCE(s.quantity, 0) as stock
    FROM items i
    JOIN item_packings ip ON ip.item_id = i.id
    LEFT JOIN stock s ON s.packing_id = ip.id
    ORDER BY i.name, ip.id
  `).all();

  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id)) map.set(r.id, { id: r.id, name: r.name, packings: [] });
    map.get(r.id).packings.push({ id: r.packing_id, label: r.label, qty: r.qty, unit: r.unit, stock: r.stock });
  }
  return [...map.values()];
};

const adjustStock = db.prepare(`
  INSERT INTO stock (packing_id, quantity) VALUES (?, ?)
  ON CONFLICT(packing_id) DO UPDATE SET quantity = MAX(0, quantity + excluded.quantity)
`);

const setStock = db.prepare(`
  INSERT INTO stock (packing_id, quantity) VALUES (?, ?)
  ON CONFLICT(packing_id) DO UPDATE SET quantity = excluded.quantity
`);

// ── Customers ──────────────────────────────────────────────────────────────
app.get('/api/customers', (req, res) => {
  res.json(db.prepare('SELECT * FROM customers ORDER BY name COLLATE NOCASE').all());
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const { lastInsertRowid } = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(name.trim(), phone || '');
    res.json({ id: lastInsertRowid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const { name, phone } = req.body;
    db.prepare('UPDATE customers SET name=?, phone=? WHERE id=?').run(name.trim(), phone || '', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/customers/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── Items ──────────────────────────────────────────────────────────────────
app.get('/api/items', (req, res) => res.json(getItemsWithPackings()));

app.post('/api/items', (req, res) => {
  try {
    const { name, packings } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const { lastInsertRowid: itemId } = db.prepare('INSERT INTO items (name) VALUES (?)').run(name.trim());
    for (const p of (packings || [])) {
      if (p.label?.trim()) db.prepare('INSERT INTO item_packings (item_id, label, qty, unit) VALUES (?, ?, ?, ?)').run(itemId, p.label.trim(), p.qty || 0, p.unit || 'kg');
    }
    res.json({ id: itemId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { name, packings } = req.body;
    db.prepare('UPDATE items SET name=? WHERE id=?').run(name.trim(), req.params.id);
    const existing = db.prepare('SELECT id FROM item_packings WHERE item_id=? ORDER BY id').all(req.params.id);
    for (let i = 0; i < existing.length && i < (packings || []).length; i++) {
      const p = packings[i];
      if (p.label?.trim()) db.prepare('UPDATE item_packings SET label=?, qty=?, unit=? WHERE id=?').run(p.label.trim(), p.qty || 0, p.unit || 'kg', existing[i].id);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/items/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── Stock ──────────────────────────────────────────────────────────────────
app.post('/api/stock', (req, res) => {
  try {
    const { packing_id, quantity, mode } = req.body;
    if (mode === 'set') setStock.run(packing_id, quantity);
    else adjustStock.run(packing_id, quantity);
    const row = db.prepare('SELECT COALESCE(quantity, 0) as q FROM stock WHERE packing_id=?').get(packing_id);
    res.json({ stock: row?.q ?? 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Sales ──────────────────────────────────────────────────────────────────
app.get('/api/sales', (req, res) => {
  const { date } = req.query;
  const sales = date
    ? db.prepare('SELECT * FROM sales WHERE date=? ORDER BY created_at DESC').all(date)
    : db.prepare('SELECT * FROM sales ORDER BY date DESC, created_at DESC LIMIT 200').all();
  for (const s of sales) s.items = db.prepare('SELECT * FROM sale_items WHERE sale_id=?').all(s.id);
  res.json(sales);
});

app.post('/api/sales', (req, res) => {
  try {
    const { customer_id, customer_name, date, items } = req.body;
    if (!customer_name?.trim()) return res.status(400).json({ error: 'Customer required' });
    if (!items?.length) return res.status(400).json({ error: 'Items required' });

    const grandTotal = items.reduce((s, i) => s + i.total, 0);
    const { lastInsertRowid: saleId } = db.prepare(
      'INSERT INTO sales (customer_id, customer_name, date, grand_total) VALUES (?, ?, ?, ?)'
    ).run(customer_id || null, customer_name.trim(), date, grandTotal);

    const insertSaleItem = db.prepare(
      'INSERT INTO sale_items (sale_id, item_id, packing_id, item_name, packing_label, qty, price, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    for (const item of items) {
      insertSaleItem.run(saleId, item.item_id || null, item.packing_id || null, item.item_name, item.packing_label, item.qty, item.price, item.total);
      if (item.packing_id) adjustStock.run(item.packing_id, -item.qty);
    }

    res.json({ id: saleId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/sales/:id', (req, res) => {
  try {
    const saleItems = db.prepare('SELECT * FROM sale_items WHERE sale_id=?').all(req.params.id);
    for (const item of saleItems) {
      if (item.packing_id) adjustStock.run(item.packing_id, item.qty);
    }
    db.prepare('DELETE FROM sales WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(3000, () => {
  console.log('✅  Shop Ledger running at http://localhost:3000');
});
