import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { sql, getTodayRates, getUserTodayOrders } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const userId = parseInt((session.user as any).id);

  if (req.method === 'GET') {
    const orders = await getUserTodayOrders(userId);
    const rates = await getTodayRates();
    return res.status(200).json({ orders, rates });
  }

  if (req.method === 'POST') {
    // items = [{ fruit_id, quantity }]
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array required' });
    }

    try {
      // Delete existing today's orders for this user first
      await sql`DELETE FROM orders WHERE user_id = ${userId} AND order_date = CURRENT_DATE`;

      // Insert new orders
      for (const item of items) {
        const qty = parseFloat(item.quantity);
        if (!qty || qty <= 0) continue;
        await sql`
          INSERT INTO orders (user_id, fruit_id, quantity, order_date)
          VALUES (${userId}, ${item.fruit_id}, ${qty}, CURRENT_DATE)
        `;
      }
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).end();
}
