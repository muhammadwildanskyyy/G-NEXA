import morgan from "morgan";
import { logger } from "../lib/logger";

export const httpLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      // Mengarahkan output Morgan ke logger Winston kita
      write: (message) => logger.info(message.trim()),
    },
  },
);
