// Heavy DB queries - RSC version with STREAMING
import { Suspense } from 'react';
import { Pool } from 'pg';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const pool = new Pool({
  connectionString: 'postgres://localhost/rsc_bench',
});

// Stats component - loads first
async function Stats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) as user_count,
      (SELECT COUNT(*) FROM posts) as post_count,
      (SELECT COUNT(*) FROM comments) as comment_count,
      (SELECT COUNT(*) FROM products) as product_count,
      (SELECT COUNT(*) FROM orders) as order_count,
      (SELECT SUM(total) FROM orders) as total_revenue,
      (SELECT AVG(price) FROM products) as avg_product_price
  `);
  const stats = rows[0];

  return (
    <section>
      <h2>Stats</h2>
      <ul>
        <li>Users: {stats.user_count}</li>
        <li>Posts: {stats.post_count}</li>
        <li>Comments: {stats.comment_count}</li>
        <li>Products: {stats.product_count}</li>
        <li>Orders: {stats.order_count}</li>
        <li>Revenue: ${Number(stats.total_revenue).toFixed(2)}</li>
        <li>Avg Price: ${Number(stats.avg_product_price).toFixed(2)}</li>
      </ul>
    </section>
  );
}

// Users component - streams independently
async function Users() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id LIMIT 100');

  return (
    <section>
      <h2>Users ({rows.length})</h2>
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          {rows.map((u: any) => (
            <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// Posts component
async function Posts() {
  const { rows } = await pool.query(`
    SELECT p.*, u.name as author_name
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ORDER BY p.id DESC LIMIT 50
  `);

  return (
    <section>
      <h2>Posts ({rows.length})</h2>
      <ul>
        {rows.map((p: any) => (
          <li key={p.id}><strong>{p.title}</strong> by {p.author_name}</li>
        ))}
      </ul>
    </section>
  );
}

// Comments component
async function Comments() {
  const { rows } = await pool.query(`
    SELECT c.*, u.name as user_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.id DESC LIMIT 100
  `);

  return (
    <section>
      <h2>Recent Comments ({rows.length})</h2>
      <ul>
        {rows.map((c: any) => (
          <li key={c.id}>{c.user_name}: {c.body.slice(0, 50)}...</li>
        ))}
      </ul>
    </section>
  );
}

// Products component
async function Products() {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY id LIMIT 100');

  return (
    <section>
      <h2>Products ({rows.length})</h2>
      <table>
        <thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Stock</th></tr></thead>
        <tbody>
          {rows.map((p: any) => (
            <tr key={p.id}><td>{p.name}</td><td>${p.price}</td><td>{p.category}</td><td>{p.stock}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// Orders component
async function Orders() {
  const { rows } = await pool.query(`
    SELECT o.*, u.name as user_name,
           COUNT(oi.id) as item_count,
           SUM(oi.quantity) as total_items
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id, u.name
    ORDER BY o.id DESC LIMIT 50
  `);

  return (
    <section>
      <h2>Orders ({rows.length})</h2>
      <table>
        <thead><tr><th>ID</th><th>User</th><th>Total</th><th>Items</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((o: any) => (
            <tr key={o.id}><td>{o.id}</td><td>{o.user_name}</td><td>${o.total}</td><td>{o.total_items}</td><td>{o.status}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Loading({ section }: { section: string }) {
  return <div>Loading {section}...</div>;
}

export default async function HeavyPage() {
  await headers();
  const timestamp = Date.now();

  return (
    <main>
      <h1>RSC Heavy Dashboard (Streaming) - {timestamp}</h1>
      <p>6 DB queries with Suspense streaming</p>

      <Suspense fallback={<Loading section="stats" />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<Loading section="users" />}>
        <Users />
      </Suspense>

      <Suspense fallback={<Loading section="posts" />}>
        <Posts />
      </Suspense>

      <Suspense fallback={<Loading section="comments" />}>
        <Comments />
      </Suspense>

      <Suspense fallback={<Loading section="products" />}>
        <Products />
      </Suspense>

      <Suspense fallback={<Loading section="orders" />}>
        <Orders />
      </Suspense>
    </main>
  );
}
