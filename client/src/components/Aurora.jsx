import { motion } from "framer-motion";

export default function Aurora() {
  return (
    <>
      <motion.div
        animate={{
          x: [-80, 80, -80],
          y: [-40, 40, -40],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: "linear",
        }}
        className="absolute
        top-[-200px]
        left-[-200px]
        w-[700px]
        h-[700px]
        rounded-full
        bg-purple-600/20
        blur-[180px]"
      />

      <motion.div
        animate={{
          x: [80, -80, 80],
          y: [40, -40, 40],
        }}
        transition={{
          repeat: Infinity,
          duration: 22,
          ease: "linear",
        }}
        className="absolute
        bottom-[-250px]
        right-[-200px]
        w-[700px]
        h-[700px]
        rounded-full
        bg-cyan-500/20
        blur-[180px]"
      />
    </>
  );
}