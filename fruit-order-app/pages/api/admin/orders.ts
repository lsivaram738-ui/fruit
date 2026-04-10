import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { sql, getTodayOrders } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const orders = await getTodayOrders();
    return res.status(200).json(orders);
  }

  // DELETE = reset all today's orders after download
  if (req.method === 'DELETE') {
    await sql`DELETE FROM orders WHERE order_date = CURRENT_DATE`;
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
