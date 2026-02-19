import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import type { Request, Response } from "express";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { httpLogger } from "./middlewares/logger.middleware";
import routerPrivate from "./routes/apiPrivate";
import routerPublic from "./routes/apiPublic";

const app = express();

// 1. Middlewares
app.use(bodyParser.json());
app.use(cors());
app.use(httpLogger);

// 2. Routes
const routerV1 = express.Router();
routerV1.use("/api", routerPrivate);
routerV1.use(routerPublic);
app.use("/v1", routerV1);

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Server is running",
    data: null,
  });
});

// 3. Error Handler 
app.use(globalErrorHandler);

export default app;
