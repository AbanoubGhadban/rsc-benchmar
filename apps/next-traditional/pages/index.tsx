// Traditional SSR with getServerSideProps (no RSC)
import { GetServerSideProps } from 'next';

interface Data {
  users: Array<{ id: number; name: string; email: string; role: string }>;
  posts: Array<{ id: number; title: string; body: string; authorId: number }>;
  stats: { totalUsers: number; activeToday: number; revenue: number };
  timestamp: number;
}

// Simulate data fetching
async function getData(): Promise<Omit<Data, 'timestamp'>> {
  await new Promise((r) => setTimeout(r, 10));

  return {
    users: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: i % 3 === 0 ? 'admin' : 'user',
    })),
    posts: Array.from({ length: 50 }, (_, i) => ({
      id: i,
      title: `Post Title ${i}`,
      body: `This is the body content for post ${i}. It contains some text.`,
      authorId: i % 100,
    })),
    stats: {
      totalUsers: 1000,
      activeToday: 234,
      revenue: 54321.99,
    },
  };
}

export const getServerSideProps: GetServerSideProps<Data> = async () => {
  const data = await getData();
  return {
    props: {
      ...data,
      timestamp: Date.now(),
    },
  };
};

export default function Home({ users, posts, stats, timestamp }: Data) {
  return (
    <main>
      <h1>Traditional SSR Dashboard - {timestamp}</h1>

      <section>
        <h2>Stats</h2>
        <p>Total Users: {stats.totalUsers}</p>
        <p>Active Today: {stats.activeToday}</p>
        <p>Revenue: ${stats.revenue}</p>
      </section>

      <section>
        <h2>Users ({users.length})</h2>
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Posts ({posts.length})</h2>
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
