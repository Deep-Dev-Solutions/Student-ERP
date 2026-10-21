import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

/** The error shape the frontend expects: { status, message } (see errorMessage in client/src/store/api.ts). */
export const fail = (status: number, message: string) => new HttpException({ status, message }, status);

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === "string" ? body : ((body as { message?: string | string[] }).message ?? exception.message);
      const message = Array.isArray(raw) ? raw[0] : raw;
      return res.status(status).json({ status, message });
    }
    console.error(exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ status: 500, message: "Something went wrong on our side" });
  }
}
