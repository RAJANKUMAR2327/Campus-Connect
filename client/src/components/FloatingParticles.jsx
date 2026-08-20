import { motion } from "framer-motion";

const particles = Array.from({ length: 30 });

export default function FloatingParticles() {
  return (
    <>
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-purple-400/60"
          style={{
            width: 4,
            height: 4,
            left: `${Math.random() * 100}%`,
            bottom: -30,
          }}
          animate={{
            y: [-900],
            opacity: [0, 1, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 8 + Math.random() * 4,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </>
  );
}