import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  let text = '';
  const params: any[] = [];
  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  });
  return query(text, params);
};

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(10) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS fruits (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      unit VARCHAR(20) NOT NULL DEFAULT 'kg',
      active BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS daily_rates (
      id SERIAL PRIMARY KEY,
      fruit_id INTEGER REFERENCES fruits(id),
      price DECIMAL(10,2) NOT NULL,
      rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
      UNIQUE(fruit_id, rate_date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      fruit_id INTEGER REFERENCES fruits(id),
      quantity DECIMAL(10,2) NOT NULL,
      order_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, fruit_id, order_date)
    )
  `;
}

export async function getTodayRates() {
  const result = await sql`
    SELECT f.id, f.name, f.unit, dr.price
    FROM fruits f
    LEFT JOIN daily_rates dr ON f.id = dr.fruit_id AND dr.rate_date = CURRENT_DATE
    WHERE f.active = true
    ORDER BY f.name
  `;
  return result.rows;
}

export async function getTodayOrders() {
  const result = await sql`
    SELECT 
      u.id as user_id, u.name as user_name, u.phone,
      f.id as fruit_id, f.name as fruit_name, f.unit,
      o.quantity, dr.price,
      (o.quantity * dr.price) as total
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN fruits f ON o.fruit_id = f.id
    LEFT JOIN daily_rates dr ON f.id = dr.fruit_id AND dr.rate_date = CURRENT_DATE
    WHERE o.order_date = CURRENT_DATE
    ORDER BY u.name, f.name
  `;
  return result.rows;
}

export async function getUserTodayOrders(userId: number) {
  const result = await sql`
    SELECT 
      o.id, f.id as fruit_id, f.name as fruit_name, f.unit,
      o.quantity, dr.price,
      (o.quantity * dr.price) as total
    FROM orders o
    JOIN fruits f ON o.fruit_id = f.id
    LEFT JOIN daily_rates dr ON f.id = dr.fruit_id AND dr.rate_date = CURRENT_DATE
    WHERE o.user_id = ${userId} AND o.order_date = CURRENT_DATE
    ORDER BY f.name
  `;
  return result.rows;
}
