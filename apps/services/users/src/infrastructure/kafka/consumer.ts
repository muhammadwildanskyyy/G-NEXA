import { kafkaClient } from "./client";
import {log} from "../../lib/logger.ts";




const consumer = kafkaClient.consumer({ groupId: "gnexa-finance-group" });

export const connectConsumer = async () => {
    await consumer.connect();
    log.info("Kafka"," Kafka Consumer connected");
};

export const disconnectConsumer = async () => {
    await consumer.disconnect();
    log.info("Kafka"," Kafka Consumer disconnected");
};

export const subscribeToTopics = async (topics: string[]) => {
    await consumer.subscribe({ topics, fromBeginning: false });

    await consumer.run({
        
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const payload = JSON.parse(message.value?.toString() || "{}");
                log.info("Kafka",`Received event from ${topic}`, { offset: message.offset });

              

            } catch (error) {
                
                log.error("Kafka",`Error processing message from ${topic}`, { error, offset: message.offset });

               
            }
        },
    });
};