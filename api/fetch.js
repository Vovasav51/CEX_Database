import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    try {
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT * FROM transactions ORDER BY tx_time_utc DESC`;
        res.status(200).json({ data: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
