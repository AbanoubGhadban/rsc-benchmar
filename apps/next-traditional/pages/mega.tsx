// MEGA Heavy - Traditional SSR version - ALL DATA
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
  stats: any;
}

export const getServerSideProps: GetServerSideProps<PageData> = async () => {
  const [usersRes, postsRes, statsRes, commentsRes] = await Promise.all([
    pool.query('SELECT id, name, email FROM users ORDER BY id'),
    pool.query(`
      SELECT p.id, p.title, p.body, u.name as author_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.id
    `),
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM posts) as post_count,
        (SELECT COUNT(*) FROM comments) as comment_count
    `),
    pool.query(`
      SELECT c.id, c.body, u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.id
    `),
  ]);

  return {
    props: {
      timestamp: Date.now(),
      users: usersRes.rows,
      posts: postsRes.rows,
      comments: commentsRes.rows,
      stats: statsRes.rows[0],
    },
  };
};

export default function MegaPage({ timestamp, users, posts, comments, stats }: PageData) {
  return (
    <main>
      <h1>MEGA Traditional Dashboard - {timestamp}</h1>
      <p>ALL DATA: 500 users, 1000 posts, 5000 comments</p>

      <section>
        <h2>Stats</h2>
        <ul>
          <li>Users: {stats.user_count}</li>
          <li>Posts: {stats.post_count}</li>
          <li>Comments: {stats.comment_count}</li>
        </ul>
      </section>

      <section>
        <h2>Users ({users.length})</h2>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Posts ({posts.length})</h2>
        <ul>
          {posts.map((p) => (
            <li key={p.id}><strong>{p.title}</strong> by {p.author_name}<br/><small>{p.body.slice(0, 100)}...</small></li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Comments ({comments.length})</h2>
        <ul>
          {comments.map((c) => (
            <li key={c.id}><strong>{c.user_name}:</strong> {c.body}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
