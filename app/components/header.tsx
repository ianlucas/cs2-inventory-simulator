import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { HeaderLink } from "./header-link";

export function Header() {
  return (
    <div className="w-full bg-gradient-to-b drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
      <div className="w-[1024px] m-auto text-white py-4 flex items-center gap-8">
        <div className="select-none">
          cstrike/<span className="font-bold">InventorySim</span>
        </div>
        <div className="flex items-center gap-2">
          <HeaderLink to="craft" icon={faPlus} label="Craft Item" />
          <HeaderLink to="sign-in" icon={faSteam} label="Sign-in to sync" />
        </div>
      </div>
    </div>
  );
}
