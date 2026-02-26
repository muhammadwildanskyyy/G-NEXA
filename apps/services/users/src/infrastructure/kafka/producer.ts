import { kafkaClient } from "./client";
import {logger} from "../../lib/logger.ts";

export const KAFKA_TOPIC_USER:string = "user.events"

// Contoh tipe data untuk standarisasi event
export interface UserEventPayload {
    event: "user.created" | "user.update" | "user.verified";
    timestamp: string;
    data: any;
}

const producer = kafkaClient.producer({
    idempotent: true,
    maxInFlightRequests: 1,
});

export const connectProducer = async () => {
    await producer.connect();
    logger.info("✅ Kafka Producer connected");
};

export const disconnectProducer = async () => {
    await producer.disconnect();
    logger.info("❌ Kafka Producer disconnected");
};

export const publishEvent = async (topic: string, key: string, payload: any) => {
    try {
        await producer.send({
            topic,
            messages: [{ key, value: JSON.stringify(payload) }],

        });
        logger.info(`Event published to ${topic}`, { key });
    } catch (error) {
        logger.error(`Failed to publish event to ${topic}`, { error });
        throw error;
    }
};