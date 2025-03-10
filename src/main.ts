import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 8000;
  app.enableCors();
  await app.listen(port);

  Logger.log(`🚀 App running on http://localhost:${port}/`);
}
bootstrap();
