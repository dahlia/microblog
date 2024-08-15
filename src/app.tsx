import { federation } from "@fedify/fedify/x/hono";
import { getLogger } from "@logtape/logtape";
import { Hono } from "hono";
import fedi from "./federation.ts";
import { Layout, SetupForm } from "./views.tsx";

const logger = getLogger("microblog");

const app = new Hono();
app.use(federation(fedi, () => undefined));

app.get("/", (c) => c.text("Hello, Fedify!"));

app.get("/setup", (c) =>
  c.html(
    <Layout>
      <SetupForm />
    </Layout>,
  ),
);

export default app;
