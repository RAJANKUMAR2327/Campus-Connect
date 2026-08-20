import { motion } from "framer-motion";

const stars = Array.from({ length: 120 });

export default function Stars() {
  return (
    <>
      {stars.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            repeat: Infinity,
            duration: 2 + Math.random() * 4,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </>
  );
}