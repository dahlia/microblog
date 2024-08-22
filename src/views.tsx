import type { FC } from "hono/jsx";
import type { Actor, Post, User } from "./schema.ts";

export const Layout: FC = (props) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light dark" />
      <title>Microblog</title>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
      />
    </head>
    <body>
      <main class="container">{props.children}</main>
    </body>
  </html>
);

export interface HomeProps extends PostListProps {
  user: User & Actor;
}

export const Home: FC<HomeProps> = ({ user, posts }) => (
  <>
    <hgroup>
      <h1>{user.name}'s microblog</h1>
      <p>
        <a href={`/users/${user.username}`}>{user.name}'s profile</a>
      </p>
    </hgroup>
    <form method="post" action={`/users/${user.username}/following`}>
      {/* biome-ignore lint/a11y/noRedundantRoles: required by picocss */}
      <fieldset role="group">
        <input
          type="text"
          name="actor"
          required={true}
          placeholder="Enter an actor handle (e.g., @johndoe@mastodon.com) or URI (e.g., https://mastodon.com/@johndoe)"
        />
        <input type="submit" value="Follow" />
      </fieldset>
    </form>
    <form method="post" action={`/users/${user.username}/posts`}>
      <fieldset>
        <label>
          <textarea name="content" required={true} placeholder="What's up?" />
        </label>
      </fieldset>
      <input type="submit" value="Post" />
    </form>
    <PostList posts={posts} />
  </>
);

export const SetupForm: FC = () => (
  <>
    <h1>Set up your microblog</h1>
    <form method="post" action="/setup">
      <fieldset>
        <label>
          Username{" "}
          <input
            type="text"
            name="username"
            required
            maxlength={50}
            pattern="^[a-z0-9_\-]+$"
          />
        </label>
        <label>
          Name <input type="text" name="name" required />
        </label>
      </fieldset>
      <input type="submit" value="Setup" />
    </form>
  </>
);

export interface ProfileProps {
  name: string;
  username: string;
  handle: string;
  following: number;
  followers: number;
}

export const Profile: FC<ProfileProps> = ({
  name,
  username,
  handle,
  following,
  followers,
}) => (
  <>
    <hgroup>
      <h1>
        <a href={`/users/${username}`}>{name}</a>
      </h1>
      <p>
        <span style="user-select: all;">{handle}</span> &middot;{" "}
        <a href={`/users/${username}/following`}>{following} following</a>{" "}
        &middot;{" "}
        <a href={`/users/${username}/followers`}>
          {followers === 1 ? "1 follower" : `${followers} followers`}
        </a>
      </p>
    </hgroup>
  </>
);

export interface FollowingListProps {
  following: Actor[];
}

export const FollowingList: FC<FollowingListProps> = ({ following }) => (
  <>
    <h2>Following</h2>
    <ul>
      {following.map((actor) => (
        <li key={actor.id}>
          <ActorLink actor={actor} />
        </li>
      ))}
    </ul>
  </>
);

export interface FollowerListProps {
  followers: Actor[];
}

export const FollowerList: FC<FollowerListProps> = ({ followers }) => (
  <>
    <h2>Followers</h2>
    <ul>
      {followers.map((follower) => (
        <li key={follower.id}>
          <ActorLink actor={follower} />
        </li>
      ))}
    </ul>
  </>
);

export interface ActorLinkProps {
  actor: Actor;
}

export const ActorLink: FC<ActorLinkProps> = ({ actor }) => {
  const href = actor.url ?? actor.uri;
  return actor.name == null ? (
    <a href={href} class="secondary">
      {actor.handle}
    </a>
  ) : (
    <>
      <a href={href}>{actor.name}</a>{" "}
      <small>
        (
        <a href={href} class="secondary">
          {actor.handle}
        </a>
        )
      </small>
    </>
  );
};

export interface PostPageProps extends ProfileProps, PostViewProps {}

export const PostPage: FC<PostPageProps> = (props) => (
  <>
    <Profile
      name={props.name}
      username={props.username}
      handle={props.handle}
      following={props.following}
      followers={props.followers}
    />
    <PostView post={props.post} />
  </>
);

export interface PostViewProps {
  post: Post & Actor;
}

export const PostView: FC<PostViewProps> = ({ post }) => (
  <article>
    <header>
      <ActorLink actor={post} />
    </header>
    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: */}
    <div dangerouslySetInnerHTML={{ __html: post.content }} />
    <footer>
      <a href={post.url ?? post.uri}>
        <time datetime={new Date(post.created).toISOString()}>
          {post.created}
        </time>
      </a>
    </footer>
  </article>
);

export interface PostListProps {
  posts: (Post & Actor)[];
}

export const PostList: FC<PostListProps> = ({ posts }) => (
  <>
    {posts.map((post) => (
      <div key={post.id}>
        <PostView post={post} />
      </div>
    ))}
  </>
);
