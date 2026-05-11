/// <reference types="react/experimental" />
import * as React from "react";
import { Suspense } from "react";
import { WithAsyncProps } from "react-on-rails-pro";

type User = { id: number; name: string; email: string };
type Post = { id: number; title: string; body: string; author_name: string };
type CommentType = { id: number; body: string; user_name: string };
type Stats = {
  user_count: number;
  post_count: number;
  comment_count: number;
};

type SyncPropsType = {
  timestamp: number;
};

type AsyncPropsType = {
  users: User[];
  posts: Post[];
  comments: CommentType[];
  stats: Stats;
};

type PropsType = WithAsyncProps<AsyncPropsType, SyncPropsType>;

const StatsSection = async ({ statsPromise }: { statsPromise: Promise<Stats> }) => {
  const stats = await statsPromise;
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
};

const UsersSection = async ({ usersPromise }: { usersPromise: Promise<User[]> }) => {
  const users = await usersPromise;
  return (
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
  );
};

const PostsSection = async ({ postsPromise }: { postsPromise: Promise<Post[]> }) => {
  const posts = await postsPromise;
  return (
    <section>
      <h2>Posts ({posts.length})</h2>
      <ul>
        {posts.map((p) => (
          <li key={p.id}><strong>{p.title}</strong> by {p.author_name}</li>
        ))}
      </ul>
    </section>
  );
};

const CommentsSection = async ({ commentsPromise }: { commentsPromise: Promise<CommentType[]> }) => {
  const comments = await commentsPromise;
  return (
    <section>
      <h2>Comments ({comments.length})</h2>
      <ul>
        {comments.map((c) => (
          <li key={c.id}>{c.user_name}: {c.body.slice(0, 50)}...</li>
        ))}
      </ul>
    </section>
  );
};

const Loading = ({ section }: { section: string }) => (
  <div>Loading {section}...</div>
);

const HeavyBenchmark = ({ timestamp, getReactOnRailsAsyncProp }: PropsType) => {
  const statsPromise = getReactOnRailsAsyncProp("stats");
  const usersPromise = getReactOnRailsAsyncProp("users");
  const postsPromise = getReactOnRailsAsyncProp("posts");
  const commentsPromise = getReactOnRailsAsyncProp("comments");

  return (
    <main>
      <h1>React on Rails Pro RSC Heavy Dashboard - {timestamp}</h1>
      <p>4 DB queries with async props streaming</p>

      <Suspense fallback={<Loading section="stats" />}>
        <StatsSection statsPromise={statsPromise} />
      </Suspense>

      <Suspense fallback={<Loading section="users" />}>
        <UsersSection usersPromise={usersPromise} />
      </Suspense>

      <Suspense fallback={<Loading section="posts" />}>
        <PostsSection postsPromise={postsPromise} />
      </Suspense>

      <Suspense fallback={<Loading section="comments" />}>
        <CommentsSection commentsPromise={commentsPromise} />
      </Suspense>
    </main>
  );
};

export default HeavyBenchmark;
