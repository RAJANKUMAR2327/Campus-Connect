import { motion } from "framer-motion";

export default function FloatingCard({
  className = "",
  children,
}) {
  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
      }}
      className={`
        absolute
        rounded-[28px]
        border
        border-white/10
        bg-white/10
        backdrop-blur-3xl
        shadow-xl
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}