import { Kafka, logLevel } from "kafkajs";
import {logger} from "../../lib/logger.ts";


// Setup instance Kafka utama
export const kafkaClient = new Kafka({
    clientId: "gnexa-user-service",
    brokers: [process.env.KAFKA_BROKER || "kafka:29092"],
    logLevel: logLevel.ERROR, // Hindari log spamming dari KafkaJS
    logCreator: () => {
        return ({ level, log }) => {
            if (level === logLevel.ERROR) logger.error(log.message, log);
            else if (level === logLevel.WARN) logger.warn(log.message, log);
        };
    },
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});