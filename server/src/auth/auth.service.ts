import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { createAuth, type Auth } from "./auth";

@Injectable()
export class AuthService {
  readonly auth: Auth;
  constructor(prisma: PrismaService) {
    this.auth = createAuth(prisma.system);
  }
}
