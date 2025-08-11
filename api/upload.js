import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const sql = neon(process.env.DATABASE_URL);
        const rows = req.body.rows || [];
        let inserted = 0;
        for (const r of rows) {
            await sql`
                INSERT INTO transactions (tx_time_utc, exchange, blockchain, asset, amount, direction, from_address, to_address, tx_hash, file_name)
                VALUES (${r.tx_time_utc}, ${r.exchange}, ${r.blockchain}, ${r.asset}, ${r.amount}, ${r.direction}, ${r.from_address}, ${r.to_address}, ${r.tx_hash}, ${r.file_name})
                ON CONFLICT (tx_hash) DO NOTHING
            `;
            inserted++;
        }
        res.status(200).json({ inserted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
