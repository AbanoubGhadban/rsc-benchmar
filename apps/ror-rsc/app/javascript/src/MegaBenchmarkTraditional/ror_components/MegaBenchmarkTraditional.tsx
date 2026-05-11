'use client';
import React from "react";

type User = { id: number; name: string; email: string };
type Post = { id: number; title: string; body: string; author_name: string };
type CommentType = { id: number; body: string; user_name: string };
type Stats = {
  user_count: number;
  post_count: number;
  comment_count: number;
};

interface Props {
  timestamp: number;
  stats: Stats;
  users: User[];
  posts: Post[];
  comments: CommentType[];
}

const MegaBenchmarkTraditional = ({ timestamp, stats, users, posts, comments }: Props) => {
  return (
    <main>
      <h1>MEGA React on Rails Traditional Dashboard - {timestamp}</h1>
      <p>ALL DATA: 500 users, 1000 posts, 5000 comments - Traditional SSR (no streaming)</p>

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
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th></tr>
          </thead>
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
};

export default MegaBenchmarkTraditional;
