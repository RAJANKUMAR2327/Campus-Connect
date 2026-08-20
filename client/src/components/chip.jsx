import { motion } from "framer-motion";

export default function Chip() {
  return (
    <motion.div
      animate={{
        boxShadow: [
          "0 0 10px #60a5fa",
          "0 0 35px #8b5cf6",
          "0 0 10px #60a5fa",
        ],
      }}
      transition={{
        repeat: Infinity,
        duration: 3,
      }}
      className="
        absolute
        left-1/2
        top-[280px]
        -translate-x-1/2
        w-16
        h-16
        rounded-xl
        border
        border-white/20
        bg-white/10
        backdrop-blur-xl
      "
    />
  );
}