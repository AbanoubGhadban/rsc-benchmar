// MEGA Heavy - RSC version with STREAMING - ALL DATA
import { Suspense } from 'react';
import { Pool } from 'pg';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const pool = new Pool({
  connectionString: 'postgres://localhost/rsc_bench',
});

async function Stats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) as user_count,
      (SELECT COUNT(*) FROM posts) as post_count,
      (SELECT COUNT(*) FROM comments) as comment_count
  `);
  const stats = rows[0];

  return (
    <section>
      <h2>Stats</h2>
      <ul>
        <li>Users: {stats.user_count}</li>
        <li>Posts: {stats.post_count}</li>
        <li>Comments: {stats.comment_count}</li>
      </ul>
    </section>
  );
}

async function Users() {
  const { rows } = await pool.query('SELECT id, name, email FROM users ORDER BY id');

  return (
    <section>
      <h2>Users ({rows.length})</h2>
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
        <tbody>
          {rows.map((u: any) => (
            <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

async function Posts() {
  const { rows } = await pool.query(`
    SELECT p.id, p.title, p.body, u.name as author_name
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ORDER BY p.id
  `);

  return (
    <section>
      <h2>Posts ({rows.length})</h2>
      <ul>
        {rows.map((p: any) => (
          <li key={p.id}><strong>{p.title}</strong> by {p.author_name}<br/><small>{p.body.slice(0, 100)}...</small></li>
        ))}
      </ul>
    </section>
  );
}

async function Comments() {
  const { rows } = await pool.query(`
    SELECT c.id, c.body, u.name as user_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.id
  `);

  return (
    <section>
      <h2>Comments ({rows.length})</h2>
      <ul>
        {rows.map((c: any) => (
          <li key={c.id}><strong>{c.user_name}:</strong> {c.body}</li>
        ))}
      </ul>
    </section>
  );
}

function Loading({ section }: { section: string }) {
  return <div>Loading {section}...</div>;
}

export default async function MegaPage() {
  await headers();
  const timestamp = Date.now();

  return (
    <main>
      <h1>MEGA RSC Dashboard (Streaming) - {timestamp}</h1>
      <p>ALL DATA: 500 users, 1000 posts, 5000 comments</p>

      <Suspense fallback={<Loading section="stats" />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<Loading section="users (500)" />}>
        <Users />
      </Suspense>

      <Suspense fallback={<Loading section="posts (1000)" />}>
        <Posts />
      </Suspense>

      <Suspense fallback={<Loading section="comments (5000)" />}>
        <Comments />
      </Suspense>
    </main>
  );
}
