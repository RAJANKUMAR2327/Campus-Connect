import { motion } from "framer-motion";

export default function CircuitLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1600 900"
      fill="none"
    >
      {/* Horizontal Lines */}
      {[0, 1, 2, 3].map((i) => (
        <motion.path
          key={i}
          d={`M450 ${220 + i * 70} H760 V${280 + i * 70} H980`}
          stroke="#76B6FF"
          strokeWidth="2"
          strokeOpacity=".45"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            delay: i * 0.3,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}

      {/* Vertical Lines */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i + 20}
          d={`M920 ${140 + i * 60} V520`}
          stroke="#8B5CF6"
          strokeWidth="2"
          strokeOpacity=".4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
      ))}
    </svg>
  );
}