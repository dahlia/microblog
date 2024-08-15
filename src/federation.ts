import { Person, createFederation } from "@fedify/fedify";
import { InProcessMessageQueue, MemoryKvStore } from "@fedify/fedify";
import { getLogger } from "@logtape/logtape";
import db from "./db.ts";
import type { User } from "./schema.ts";

const logger = getLogger("microblog");

const federation = createFederation({
  kv: new MemoryKvStore(),
  queue: new InProcessMessageQueue(),
});

federation.setActorDispatcher("/users/{handle}", async (ctx, handle) => {
  const user = db
    .prepare<unknown[], User>("SELECT * FROM users WHERE username = ?")
    .get(handle);
  if (user == null) return null;

  return new Person({
    id: ctx.getActorUri(handle),
    preferredUsername: handle,
    name: handle,
  });
});

export default federation;
