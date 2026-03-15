"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedDigit from "./AnimatedDigit";

interface CountdownProps {
    targetDate: string;
}

const CountdownTimer = ({ targetDate }: CountdownProps) => {
    const calculateTime = () => {
        const difference = +new Date(targetDate) - +new Date();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const items = [
        { label: "Days", value: timeLeft.days },
        { label: "Hrs", value: timeLeft.hours },
        { label: "Min", value: timeLeft.minutes },
        { label: "Sec", value: timeLeft.seconds },
    ];

    return (
        <div className="grid grid-cols-4 gap-2 text-center">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="bg-white/10 p-2 border border-white/20 min-w-15 overflow-hidden"
                >
                    <span className="block text-white text-xl font-black justify-center">
                        {String(item.value)
                            .padStart(2, "0")
                            .split("")
                            .map((digit, i) => (
                                <AnimatedDigit key={i} digit={digit} />
                            ))}
                    </span>

                    <span className="text-white/60 text-[8px] uppercase font-black">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
};
export default CountdownTimer;
