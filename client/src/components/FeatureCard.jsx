import { motion } from "framer-motion";

export default function FeatureCard({ icon, title, subtitle }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="
      bg-white/[0.04]
      backdrop-blur-xl
      border border-white/10
      rounded-3xl
      p-6
      text-center
      transition-all
      duration-300
      hover:border-purple-500/40
      hover:shadow-[0_0_40px_rgba(168,85,247,0.25)]
    "
    >
      <div className="text-4xl mb-4">{icon}</div>

      <h3 className="text-white font-semibold">
        {title}
      </h3>

      <p className="text-gray-400 text-sm mt-2">
        {subtitle}
      </p>
    </motion.div>
  );
}