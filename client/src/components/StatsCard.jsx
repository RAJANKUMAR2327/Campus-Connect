export default function StatsCard({
  number,
  label
}) {
  return (
    <div className="text-center">
      <h3 className="
      text-4xl
      font-black
      bg-gradient-to-r
      from-pink-400
      to-purple-400
      text-transparent
      bg-clip-text
      ">
        {number}
      </h3>

      <p className="text-gray-400 mt-2">
        {label}
      </p>
    </div>
  );
}