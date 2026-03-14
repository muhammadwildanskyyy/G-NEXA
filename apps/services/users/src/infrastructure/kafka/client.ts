import { Kafka, logLevel } from "kafkajs";
import {log} from "../../lib/logger.ts"


// Setup instance Kafka utama
export const kafkaClient = new Kafka({
    clientId: "gnexa-user-service",
    brokers: [process.env.KAFKA_BROKER || "kafka:29092"],
    logLevel: logLevel.ERROR, // Hindari log spamming dari KafkaJS
    logCreator: () => {
        return ({ level, log : logging }) => {
            if (level === logLevel.ERROR) log.error("kafka",logging.message, logging);
            else if (level === logLevel.WARN) log.error("kafka",logging.message, logging);
        };
    },
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});