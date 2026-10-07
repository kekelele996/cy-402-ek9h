import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`cylawcase backend listening on ${env.PORT}`);
});

