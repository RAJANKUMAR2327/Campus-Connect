import { Link2 } from "lucide-react";
import MiniMapCard from "./MiniMapCard";

export default function LeftPanel() {
  return (
    <div className="relative h-full p-8 flex flex-col justify-between">

      <div>
        <div className="flex items-center gap-3 mb-10">
          <Link2 className="text-purple-400" size={40} />

          <span className="text-3xl font-bold text-white">
            Campus
            <span className="text-purple-400">
              Connect
            </span>
          </span>
        </div>

        <h1 className="text-6xl font-black text-white leading-tight">
          Join the
          <br />
          Community
        </h1>

        <p className="mt-6 text-white/70 text-lg leading-8">
          Create your account to start connecting
          with your campus peers and unlock endless
          opportunities.
        </p>
      </div>

      <MiniMapCard />

    </div>
  );
}