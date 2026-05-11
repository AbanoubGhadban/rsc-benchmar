// Server Component (RSC) - no 'use client'
import { headers } from 'next/headers';

// Disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Simulate data fetching
async function getData() {
  // Simulate DB/API delay
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
      body: `This is the body content for post ${i}. It contains some text that would be typical in a real application.`,
      authorId: i % 100,
    })),
    stats: {
      totalUsers: 1000,
      activeToday: 234,
      revenue: 54321.99,
    },
  };
}

export default async function Home() {
  // Force no caching by reading headers
  const headersList = await headers();
  const timestamp = Date.now();

  const data = await getData();

  return (
    <main>
      <h1>RSC Dashboard - {timestamp}</h1>

      <section>
        <h2>Stats</h2>
        <div>
          <p>Total Users: {data.stats.totalUsers}</p>
          <p>Active Today: {data.stats.activeToday}</p>
          <p>Revenue: ${data.stats.revenue}</p>
        </div>
      </section>

      <section>
        <h2>Users ({data.users.length})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
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
        <h2>Posts ({data.posts.length})</h2>
        <ul>
          {data.posts.map((post) => (
            <li key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <small>Author ID: {post.authorId}</small>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
