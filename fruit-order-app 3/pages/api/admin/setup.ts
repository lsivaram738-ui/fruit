import { NextApiRequest, NextApiResponse } from 'next';
import { initDB, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development or with a secret key
  const secret = req.headers['x-setup-secret'];
  if (process.env.NODE_ENV === 'production' && secret !== process.env.SETUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await initDB();

    // Create default admin account if not exists
    const existing = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await sql`
        INSERT INTO users (name, phone, password_hash, role)
        VALUES ('Admin', '0000000000', ${hash}, 'admin')
        ON CONFLICT (phone) DO NOTHING
      `;
    }

    // Add some default fruits if none exist
    const fruits = await sql`SELECT id FROM fruits LIMIT 1`;
    if (fruits.rows.length === 0) {
      const defaultFruits = ['Mango', 'Apple', 'Banana', 'Orange', 'Grapes', 'Watermelon', 'Papaya'];
      for (const fruit of defaultFruits) {
        await sql`INSERT INTO fruits (name, unit) VALUES (${fruit}, 'kg') ON CONFLICT (name) DO NOTHING`;
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Database initialized. Default admin: phone=0000000000, password=admin123' 
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
