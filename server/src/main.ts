import "reflect-metadata";
import { SwaggerModule } from "@nestjs/swagger";
import { createApp, openApiDocument } from "./bootstrap";
import { env } from "./config/env";

async function main() {
  const app = await createApp();
  SwaggerModule.setup("api/docs", app, openApiDocument(app));
  await app.listen(env.PORT);
  console.log(`DeepDev ERP API on http://localhost:${env.PORT}/api (docs at /api/docs)`);
}
void main();
