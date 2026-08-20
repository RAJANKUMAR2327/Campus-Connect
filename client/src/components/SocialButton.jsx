export default function SocialButton({
  icon,
  text
}) {
  return (
    <button
      className="
      h-16
      rounded-2xl
      bg-white/[0.04]
      border border-white/10
      hover:border-purple-500/30
      hover:bg-white/[0.08]
      transition-all
      duration-300
      flex items-center justify-center gap-3
      text-white
      font-medium
    "
    >
      {icon}
      {text}
    </button>
  );
}