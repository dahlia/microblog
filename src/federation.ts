import { Endpoints, Person, createFederation } from "@fedify/fedify";
import { InProcessMessageQueue, MemoryKvStore } from "@fedify/fedify";
import { getLogger } from "@logtape/logtape";
import db from "./db.ts";
import type { Actor, User } from "./schema.ts";

const logger = getLogger("microblog");

const federation = createFederation({
  kv: new MemoryKvStore(),
  queue: new InProcessMessageQueue(),
});

federation.setActorDispatcher("/users/{handle}", async (ctx, handle) => {
  const user = db
    .prepare<unknown[], User & Actor>(
      `
      SELECT * FROM users
      JOIN actors ON (users.id = actors.user_id)
      WHERE users.username = ?
      `,
    )
    .get(handle);
  if (user == null) return null;

  return new Person({
    id: ctx.getActorUri(handle),
    preferredUsername: handle,
    name: user.name,
    inbox: ctx.getInboxUri(handle),
    endpoints: new Endpoints({
      sharedInbox: ctx.getInboxUri(),
    }),
    url: ctx.getActorUri(handle),
  });
});

federation.setInboxListeners("/users/{handle}/inbox", "/inbox");

export default federation;
