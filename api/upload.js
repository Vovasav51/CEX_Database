import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return res.status(200).json({ ok: true, inserted: 0 });

    const sql = neon(process.env.DATABASE_URL);

    await sql`
      CREATE TABLE IF NOT EXISTS uploads(
        id BIGSERIAL PRIMARY KEY,
        tx_time_utc TEXT,
        exchange TEXT,
        blockchain TEXT,
        asset TEXT,
        amount DOUBLE PRECISION,
        direction TEXT,
        from_address TEXT,
        to_address TEXT,
        tx_hash TEXT,
        file_name TEXT,
        uploaded_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(exchange, tx_hash)
      );
    `;

    let count = 0;
    for (const r of rows) {
      const rec = {
        tx_time_utc: r.tx_time_utc ?? r['Time(UTC)'] ?? '',
        exchange:    r.exchange    ?? r['Exchange']  ?? '',
        blockchain:  r.blockchain  ?? r['Chain']     ?? '',
        asset:       r.asset       ?? r['Asset']     ?? '',
        amount:      Number(r.amount ?? r['Amount'] ?? 0) || 0,
        direction:   r.direction   ?? r['Operation'] ?? '',
        from_address:r.from_address?? r['From']      ?? '',
        to_address:  r.to_address  ?? r['To']        ?? '',
        tx_hash:     r.tx_hash     ?? r['Transaction ID'] ?? '',
        file_name:   r.file_name   ?? r['file_name'] ?? ''
      };

      await sql`
        INSERT INTO uploads
        (tx_time_utc, exchange, blockchain, asset, amount, direction,
         from_address, to_address, tx_hash, file_name)
        VALUES (
          ${rec.tx_time_utc}, ${rec.exchange}, ${rec.blockchain}, ${rec.asset},
          ${rec.amount}, ${rec.direction}, ${rec.from_address}, ${rec.to_address},
          ${rec.tx_hash}, ${rec.file_name}
        )
        ON CONFLICT (exchange, tx_hash) DO UPDATE SET
          tx_time_utc = EXCLUDED.tx_time_utc,
          blockchain  = EXCLUDED.blockchain,
          asset       = EXCLUDED.asset,
          amount      = EXCLUDED.amount,
          direction   = EXCLUDED.direction,
          from_address= EXCLUDED.from_address,
          to_address  = EXCLUDED.to_address,
          file_name   = EXCLUDED.file_name,
          uploaded_at = NOW();
      `;
      count++;
    }
    res.status(200).json({ ok: true, inserted: count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
