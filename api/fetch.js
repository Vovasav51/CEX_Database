import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // створимо таблицю, якщо нема
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

    const rows = await sql`
      SELECT tx_time_utc, exchange, blockchain, asset, amount, direction,
             from_address, to_address, tx_hash, file_name
      FROM uploads
      ORDER BY uploaded_at DESC, id DESC
      LIMIT 5000;
    `;
    res.status(200).json({ data: rows });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
