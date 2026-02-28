import { randomUUID } from "node:crypto";
import { log, requestContext } from "../lib/logger.ts";
// 1. Import Request standar dari express
import type { Request, Response, NextFunction } from "express";
import type { IReqUser } from "../model/user.model.ts";

// 2. Gunakan tipe 'Request' bawaan express di sini
export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {

    // 3. Lakukan casting (perubahan tipe) secara aman di dalam fungsi
    const customReq = req as IReqUser;

    const rawHeader = req.headers["x-correlation-id"];
    const traceId = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader) as string || randomUUID();

    // 4. Panggil 'customReq' untuk mengambil data user
    const userId = customReq.user?.user_id || undefined;

    requestContext.run({ traceId, userId }, () => {
        log.info("delivery:http", `Incoming request`, { method: req.method, path: req.path });
        next();
    });
};