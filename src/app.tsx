import { federation } from "@fedify/fedify/x/hono";
import { getLogger } from "@logtape/logtape";
import { Hono } from "hono";
import { stringifyEntities } from "stringify-entities";
import db from "./db.ts";
import fedi from "./federation.ts";
import type { Actor, Post, User } from "./schema.ts";
import {
  FollowerList,
  FollowingList,
  Home,
  Layout,
  PostList,
  PostPage,
  Profile,
  SetupForm,
} from "./views.tsx";
import { Create, Follow, isActor, lookupObject, Note } from "@fedify/fedify";

const logger = getLogger("microblog");

const app = new Hono();
app.use(federation(fedi, () => undefined));

app.get("/", (c) => {
  const user = db
    .prepare<unknown[], User & Actor>(
      `
      SELECT users.*, actors.*
      FROM users
      JOIN actors ON users.id = actors.user_id
      LIMIT 1
      `,
    )
    .get();
  if (user == null) return c.redirect("/setup");

  const posts = db
    .prepare<unknown[], Post & Actor>(
      `
      SELECT actors.*, posts.*
      FROM posts
      JOIN actors ON posts.actor_id = actors.id
      WHERE posts.actor_id = ? OR posts.actor_id IN (
        SELECT following_id
        FROM follows
        WHERE follower_id = ?
      )
      ORDER BY posts.created DESC
      `,
    )
    .all(user.id, user.id);
  return c.html(
    <Layout>
      <Home user={user} posts={posts} />
    </Layout>,
  );
});

app.get("/setup", (c) => {
  // Check if the user already exists
  const user = db
    .prepare<unknown[], User>(
      `
      SELECT * FROM users
      JOIN actors ON (users.id = actors.user_id)
      LIMIT 1
      `,
    )
    .get();
  if (user != null) return c.redirect("/");

  return c.html(
    <Layout>
      <SetupForm />
    </Layout>,
  );
});

app.post("/setup", async (c) => {
  // Check if the user already exists
  const user = db
    .prepare<unknown[], User>(
      `
      SELECT * FROM users
      JOIN actors ON (users.id = actors.user_id)
      LIMIT 1
      `,
    )
    .get();
  if (user != null) return c.redirect("/");

  const form = await c.req.formData();
  const username = form.get("username");
  if (typeof username !== "string" || !username.match(/^[a-z0-9_-]{1,50}$/)) {
    return c.redirect("/setup");
  }
  const name = form.get("name");
  if (typeof name !== "string" || name.trim() === "") {
    return c.redirect("/setup");
  }
  const url = new URL(c.req.url);
  const handle = `@${username}@${url.host}`;
  const ctx = fedi.createContext(c.req.raw, undefined);
  db.transaction(() => {
    db.prepare("INSERT OR REPLACE INTO users (id, username) VALUES (1, ?)").run(
      username,
    );
    db.prepare(
      `
      INSERT OR REPLACE INTO actors
        (user_id, uri, handle, name, inbox_url, shared_inbox_url, url)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      ctx.getActorUri(username).href,
      handle,
      name,
      ctx.getInboxUri(username).href,
      ctx.getInboxUri().href,
      ctx.getActorUri(username).href,
    );
  })();
  return c.redirect("/");
});

app.get("/users/:username", async (c) => {
  const user = db
    .prepare<unknown[], User & Actor>(
      `
      SELECT * FROM users
      JOIN actors ON (users.id = actors.user_id)
      WHERE username = ?
      `,
    )
    .get(c.req.param("username"));
  if (user == null) return c.notFound();

  // biome-ignore lint/style/noNonNullAssertion: always returns a row
  const { following } = db
    .prepare<unknown[], { following: number }>(
      `
      SELECT count(*) AS following
      FROM follows
      JOIN actors ON follows.follower_id = actors.id
      WHERE actors.user_id = ?
      `,
    )
    .get(user.id)!;
  // biome-ignore lint/style/noNonNullAssertion: always returns a row
  const { followers } = db
    .prepare<unknown[], { followers: number }>(
      `
      SELECT count(*) AS followers
      FROM follows
      JOIN actors ON follows.following_id = actors.id
      WHERE actors.user_id = ?
      `,
    )
    .get(user.id)!;
  const posts = db
    .prepare<unknown[], Post & Actor>(
      `
      SELECT actors.*, posts.*
      FROM posts
      JOIN actors ON posts.actor_id = actors.id
      WHERE actors.user_id = ?
      ORDER BY posts.created DESC
      `,
    )
    .all(user.user_id);
  const url = new URL(c.req.url);
  const handle = `@${user.username}@${url.host}`;
  return c.html(
    <Layout>
      <Profile
        name={user.name ?? user.username}
        username={user.username}
        handle={handle}
        following={following}
        followers={followers}
      />
      <PostList posts={posts} />
    </Layout>,
  );
});

app.post("/users/:username/following", async (c) => {
  const username = c.req.param("username");
  const form = await c.req.formData();
  const handle = form.get("actor");
  if (typeof handle !== "string") {
    return c.text("Invalid actor handle or URL", 400);
  }
  const actor = await lookupObject(handle);
  if (!isActor(actor)) {
    return c.text("Invalid actor handle or URL", 400);
  }
  const ctx = fedi.createContext(c.req.raw, undefined);
  await ctx.sendActivity(
    { identifier: username },
    actor,
    new Follow({
      actor: ctx.getActorUri(username),
      object: actor.id,
      to: actor.id,
    }),
  );
  return c.text("Successfully sent a follow request");
});

app.get("/users/:username/following", async (c) => {
  const following = db
    .prepare<unknown[], Actor>(
      `
      SELECT following.*
      FROM follows
      JOIN actors AS followers ON follows.follower_id = followers.id
      JOIN actors AS following ON follows.following_id = following.id
      JOIN users ON users.id = followers.user_id
      WHERE users.username = ?
      ORDER BY follows.created DESC
      `,
    )
    .all(c.req.param("username"));
  return c.html(
    <Layout>
      <FollowingList following={following} />
    </Layout>,
  );
});

app.get("/users/:username/followers", async (c) => {
  const followers = db
    .prepare<unknown[], Actor>(
      `
      SELECT followers.*
      FROM follows
      JOIN actors AS followers ON follows.follower_id = followers.id
      JOIN actors AS following ON follows.following_id = following.id
      JOIN users ON users.id = following.user_id
      WHERE users.username = ?
      ORDER BY follows.created DESC
      `,
    )
    .all(c.req.param("username"));
  return c.html(
    <Layout>
      <FollowerList followers={followers} />
    </Layout>,
  );
});

app.post("/users/:username/posts", async (c) => {
  const username = c.req.param("username");
  const actor = db
    .prepare<unknown[], Actor>(
      `
      SELECT actors.*
      FROM actors
      JOIN users ON users.id = actors.user_id
      WHERE users.username = ?
      `,
    )
    .get(username);
  if (actor == null) return c.redirect("/setup");
  const form = await c.req.formData();
  const content = form.get("content")?.toString();
  if (content == null || content.trim() === "") {
    return c.text("Content is required", 400);
  }
  const ctx = fedi.createContext(c.req.raw, undefined);
  const post: Post | null = db.transaction(() => {
    const post = db
      .prepare<unknown[], Post>(
        `
        INSERT INTO posts (uri, actor_id, content)
        VALUES ('https://localhost/', ?, ?)
        RETURNING *
        `,
      )
      .get(actor.id, stringifyEntities(content, { escapeOnly: true }));
    if (post == null) return null;
    const url = ctx.getObjectUri(Note, {
      identifier: username,
      id: post.id.toString(),
    }).href;
    db.prepare("UPDATE posts SET uri = ?, url = ? WHERE id = ?").run(
      url,
      url,
      post.id,
    );
    return post;
  })();
  if (post == null) return c.text("Failed to create post", 500);
  const noteArgs = { identifier: username, id: post.id.toString() };
  const note = await ctx.getObject(Note, noteArgs);
  await ctx.sendActivity(
    { identifier: username },
    "followers",
    new Create({
      id: new URL("#activity", note?.id ?? undefined),
      object: note,
      actors: note?.attributionIds,
      tos: note?.toIds,
      ccs: note?.ccIds,
    }),
  );
  return c.redirect(ctx.getObjectUri(Note, noteArgs).href);
});

app.get("/users/:username/posts/:id", (c) => {
  const post = db
    .prepare<unknown[], Post & Actor & User>(
      `
      SELECT users.*, actors.*, posts.*
      FROM posts
      JOIN actors ON actors.id = posts.actor_id
      JOIN users ON users.id = actors.user_id
      WHERE users.username = ? AND posts.id = ?
      `,
    )
    .get(c.req.param("username"), c.req.param("id"));
  if (post == null) return c.notFound();

  // biome-ignore lint/style/noNonNullAssertion: always returns a row
  const { following, followers } = db
    .prepare<unknown[], { following: number; followers: number }>(
      `
      SELECT sum(follows.follower_id = ?) AS following,
             sum(follows.following_id = ?) AS followers
      FROM follows
      `,
    )
    .get(post.actor_id, post.actor_id)!;
  return c.html(
    <Layout>
      <PostPage
        name={post.name ?? post.username}
        username={post.username}
        handle={post.handle}
        following={following}
        followers={followers}
        post={post}
      />
    </Layout>,
  );
});

export default app;
