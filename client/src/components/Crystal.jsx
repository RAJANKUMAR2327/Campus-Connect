import { motion } from "framer-motion";

export default function Crystal() {
  return (
    <motion.img
      src="/crystal.png"
      alt=""
      className="w-64"

      animate={{
        y:[0,-20,0],
        rotate:[-2,2,-2],
        scale:[1,1.03,1]
      }}

      transition={{
        repeat:Infinity,
        duration:6
      }}
    />
  );
}