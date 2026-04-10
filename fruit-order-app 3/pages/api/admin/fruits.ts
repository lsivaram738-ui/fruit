import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { sql } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const result = await sql`SELECT * FROM fruits ORDER BY name`;
    return res.status(200).json(result.rows);
  }

  if (req.method === 'POST') {
    const { name, unit } = req.body;
    if (!name) return res.status(400).json({ error: 'Fruit name required' });
    try {
      const result = await sql`
        INSERT INTO fruits (name, unit) VALUES (${name.trim()}, ${unit || 'kg'})
        ON CONFLICT (name) DO UPDATE SET active = true
        RETURNING *
      `;
      return res.status(201).json(result.rows[0]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    const { id, active } = req.body;
    await sql`UPDATE fruits SET active = ${active} WHERE id = ${id}`;
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
