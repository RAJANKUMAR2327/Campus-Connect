export default function MiniMapCard() {
  return (
    <div
      className="
      h-40
      rounded-3xl
      border
      border-white/10
      overflow-hidden
      bg-white/5
      backdrop-blur-xl
    "
    >
      <img
        src="/map.png"
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  );
}