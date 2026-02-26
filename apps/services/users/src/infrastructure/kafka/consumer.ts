import { kafkaClient } from "./client";
import {logger} from "../../lib/logger.ts";


// Setiap service harus punya Group ID yang unik (misal: gnexa-finance-group)
const consumer = kafkaClient.consumer({ groupId: "gnexa-finance-group" });

export const connectConsumer = async () => {
    await consumer.connect();
    logger.info("✅ Kafka Consumer connected");
};

export const disconnectConsumer = async () => {
    await consumer.disconnect();
    logger.info("❌ Kafka Consumer disconnected");
};

export const subscribeToTopics = async (topics: string[]) => {
    await consumer.subscribe({ topics, fromBeginning: false });

    await consumer.run({
        // BEST PRACTICE: autoCommit di-handle KafkaJS, tapi kita pastikan error tidak mematikan consumer
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const payload = JSON.parse(message.value?.toString() || "{}");
                logger.info(`Received event from ${topic}`, { offset: message.offset });

                // Panggil UseCase/Service logic di sini berdasarkan topic
                // await handleEvent(topic, payload);

            } catch (error) {
                // BEST PRACTICE: Jangan throw error ke luar, atau consumer akan terus me-restart dan memproses pesan yang sama (Poison Pill)
                logger.error(`Error processing message from ${topic}`, { error, offset: message.offset });

                // Opsional: Kirim pesan ini ke Dead Letter Queue (DLQ) topic agar bisa diinvestigasi nanti
            }
        },
    });
};