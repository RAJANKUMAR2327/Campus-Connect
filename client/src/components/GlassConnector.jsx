export default function GlassConnector({ className = "" }) {
  return (
    <div
      className={`
        absolute
        w-8
        h-20
        rounded-xl
        bg-white/10
        backdrop-blur-2xl
        border
        border-white/10
        ${className}
      `}
    />
  );
}