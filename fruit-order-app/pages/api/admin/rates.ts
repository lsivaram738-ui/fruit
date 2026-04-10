import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { sql, getTodayRates } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const rows = await getTodayRates();
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    // rates = [{ fruit_id, price }]
    const { rates } = req.body;
    if (!rates || !Array.isArray(rates)) {
      return res.status(400).json({ error: 'rates array required' });
    }

    try {
      for (const r of rates) {
        if (!r.price || parseFloat(r.price) <= 0) continue;
        await sql`
          INSERT INTO daily_rates (fruit_id, price, rate_date)
          VALUES (${r.fruit_id}, ${r.price}, CURRENT_DATE)
          ON CONFLICT (fruit_id, rate_date)
          DO UPDATE SET price = ${r.price}
        `;
      }
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).end();
}
