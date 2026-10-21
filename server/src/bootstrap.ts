import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { toNodeHandler } from "better-auth/node";
import express from "express";
import { AppModule } from "./app.module";
import { AuthService } from "./auth/auth.service";
import { requestContext } from "./common/context";

/** Builds the app: better-auth at /api/auth, everything else under /api with the guards. */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: ["error", "warn", "log"] });
  const authHandler = toNodeHandler(app.get(AuthService).auth);
  // better-auth reads the raw body itself, so it goes before the JSON parser.
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => (req.url.startsWith("/api/auth/") ? void authHandler(req, res) : next()));
  app.use(express.json({ limit: "2mb" }));
  // A fresh context per request; the guards fill in who is calling and for which school.
  app.use((_req: express.Request, _res: express.Response, next: express.NextFunction) => requestContext.run({}, next));
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  return app;
}

export function openApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("DeepDev ERP API")
    .setDescription("School ERP API. Sign in through better-auth at /api/auth; school routes use the session cookie.")
    .setVersion("0.1.0")
    .addCookieAuth("deepdev.session_token")
    .build();
  return SwaggerModule.createDocument(app, config);
}
