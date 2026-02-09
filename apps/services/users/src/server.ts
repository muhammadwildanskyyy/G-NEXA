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
    const PORT = 3000;
    connectDB();
    app.use(bodyParser.json());
    app.use(cors());
    app.use(httpLogger);
    app.use("/api", routerPrivate);
    app.use(routerPublic);
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
