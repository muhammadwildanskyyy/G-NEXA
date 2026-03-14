import { kafkaClient } from "./client";
import { log } from "../../lib/logger.ts";

export const KAFKA_USER_TOPIC: string = "user.events";

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
  log.info("kafka", "✅ Kafka Producer connected");
};

export const disconnectProducer = async () => {
  await producer.disconnect();
  log.info("kafka", "❌ Kafka Producer disconnected");
};

export const publishEvent = async (
  topic: string,
  key: string,
  payload: any,
) => {
  try {
    await producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(payload) }],
    });
    log.info("kafka", `Event published to ${topic}`, { key });
  } catch (error) {
    log.error("kafka", `Failed to publish event to ${topic}`, { error });
    throw error;
  }
};
