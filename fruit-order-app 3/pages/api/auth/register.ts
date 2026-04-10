import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { sql, initDB } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    await initDB();
    const hash = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO users (name, phone, password_hash, role)
      VALUES (${name.trim()}, ${phone.trim()}, ${hash}, 'user')
    `;
    res.status(201).json({ success: true });
  } catch (err: any) {
    if (err.message?.includes('unique')) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
