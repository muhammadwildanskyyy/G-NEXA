import { motion, AnimatePresence } from "framer-motion";

interface AnimatedDigitProps {
    digit: string;
}

const AnimatedDigit = ({ digit }: AnimatedDigitProps) => {
    return (
        <span className="relative inline-block w-[0.65em] h-4 overflow-hidden">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={digit}
                    initial={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {digit}
                </motion.span>
            </AnimatePresence>
        </span>
    );
};
export default AnimatedDigit;
