<div className="glass-shine pointer-events-none" />

export default function GlassPanel({
  children,
  className = "",
}) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[40px]
        border border-white/15
        bg-white/5
        backdrop-blur-3xl
        shadow-[0_0_60px_rgba(120,80,255,0.18)]
        ${className}
      `}
    >
      {/* Glass reflection */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-white/15
          via-transparent
          to-white/5
          pointer-events-none
        "
      />

      {children}
    </div>
  );
}