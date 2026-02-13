import express from "express";

import bodyParser from "body-parser";
import cors from "cors";
import type { Request, Response } from "express";
import { connectDB } from "./lib/database";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { httpLogger } from "./middlewares/logger.middleware";
import routerPrivate from "./routes/apiPrivate";
import routerPublic from "./routes/apiPublic";

async function init() {
  try {
    const app = express();
    const PORT = process.env.PORT;
    const routerV1 = express.Router();
    connectDB();
    app.use(bodyParser.json());
    app.use(cors());
    app.use(httpLogger);
    routerV1.use("/api", routerPrivate);
    routerV1.use(routerPublic);
    app.use("/v1", routerV1);
    app.use(globalErrorHandler);

    app.get("/", (req: Request, res: Response) => {
      res.status(200).json({
        message: "Server is running",
        data: null,
      });
      return;
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

init();
