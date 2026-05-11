// Heavy DB queries - Traditional SSR version
import { GetServerSideProps } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://localhost/rsc_bench',
});

interface PageData {
  timestamp: number;
  users: any[];
  posts: any[];
  comments: any[];
  products: any[];
  orders: any[];
  stats: any;
}

export const getServerSideProps: GetServerSideProps<PageData> = async () => {
  // Execute all queries (some parallel, some sequential to simulate real app)
  const [usersRes, postsRes, statsRes] = await Promise.all([
    pool.query('SELECT * FROM users ORDER BY id LIMIT 100'),
    pool.query(`
      SELECT p.*, u.name as author_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.id DESC LIMIT 50
    `),
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM posts) as post_count,
        (SELECT COUNT(*) FROM comments) as comment_count,
        (SELECT COUNT(*) FROM products) as product_count,
        (SELECT COUNT(*) FROM orders) as order_count,
        (SELECT SUM(total) FROM orders) as total_revenue,
        (SELECT AVG(price) FROM products) as avg_product_price
    `),
  ]);

  const [commentsRes, productsRes, ordersRes] = await Promise.all([
    pool.query(`
      SELECT c.*, u.name as user_name, p.title as post_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      ORDER BY c.id DESC LIMIT 100
    `),
    pool.query('SELECT * FROM products ORDER BY id LIMIT 100'),
    pool.query(`
      SELECT o.*, u.name as user_name,
             COUNT(oi.id) as item_count,
             SUM(oi.quantity) as total_items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, u.name
      ORDER BY o.id DESC LIMIT 50
    `),
  ]);

  return {
    props: {
      timestamp: Date.now(),
      users: usersRes.rows,
      posts: postsRes.rows,
      comments: commentsRes.rows,
      products: productsRes.rows,
      orders: ordersRes.rows,
      stats: {
        ...statsRes.rows[0],
        total_revenue: Number(statsRes.rows[0].total_revenue),
        avg_product_price: Number(statsRes.rows[0].avg_product_price),
      },
    },
  };
};

export default function HeavyPage({ timestamp, users, posts, comments, products, orders, stats }: PageData) {
  return (
    <main>
      <h1>Traditional Heavy Dashboard - {timestamp}</h1>
      <p>6 DB queries executed</p>

      <section>
        <h2>Stats</h2>
        <ul>
          <li>Users: {stats.user_count}</li>
          <li>Posts: {stats.post_count}</li>
          <li>Comments: {stats.comment_count}</li>
          <li>Products: {stats.product_count}</li>
          <li>Orders: {stats.order_count}</li>
          <li>Revenue: ${stats.total_revenue.toFixed(2)}</li>
          <li>Avg Price: ${stats.avg_product_price.toFixed(2)}</li>
        </ul>
      </section>

      <section>
        <h2>Users ({users.length})</h2>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Posts ({posts.length})</h2>
        <ul>
          {posts.map((p) => (
            <li key={p.id}><strong>{p.title}</strong> by {p.author_name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Recent Comments ({comments.length})</h2>
        <ul>
          {comments.map((c) => (
            <li key={c.id}>{c.user_name}: {c.body.slice(0, 50)}...</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Products ({products.length})</h2>
        <table>
          <thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Stock</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}><td>{p.name}</td><td>${p.price}</td><td>{p.category}</td><td>{p.stock}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Orders ({orders.length})</h2>
        <table>
          <thead><tr><th>ID</th><th>User</th><th>Total</th><th>Items</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}><td>{o.id}</td><td>{o.user_name}</td><td>${o.total}</td><td>{o.total_items}</td><td>{o.status}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
