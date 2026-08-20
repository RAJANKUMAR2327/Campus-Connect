import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function MouseGlow() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => {
      setMouse({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <motion.div
      animate={{
        x: mouse.x - 250,
        y: mouse.y - 250,
      }}
      transition={{
        type: "spring",
        damping: 25,
      }}
      className="pointer-events-none fixed
      w-[500px]
      h-[500px]
      rounded-full
      bg-purple-500/10
      blur-[150px]"
    />
  );
}