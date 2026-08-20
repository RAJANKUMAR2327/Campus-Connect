import Crystal from "./Crystal";

export default function CrystalPanel() {
  return (
    <div className="relative h-full flex items-center justify-center">

      <div className="absolute w-72 h-72 bg-purple-500/20 blur-[100px] rounded-full"/>

      <Crystal/>

      <div className="absolute bottom-12 text-center">

        <h2 className="text-5xl font-bold text-white">
          Register
        </h2>

        <p className="text-white/60 mt-2">
          Register & Ascend
        </p>

      </div>

    </div>
  );
}