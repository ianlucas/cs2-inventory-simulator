import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faPlus, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { HeaderLink } from "./header-link";
import { useRootContext } from "./root-context";

export function Header() {
  const { user } = useRootContext();

  return (
    <div className="w-full bg-gradient-to-b drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
      <div className="w-[1024px] m-auto text-white py-4 flex items-center gap-8">
        <div className="select-none">
          cstrike/<span className="font-bold">InventorySim</span>
        </div>
        <div className="flex items-center gap-4">
          <HeaderLink to="craft" icon={faPlus} label="Craft Item" />
          {user === undefined && (
            <HeaderLink to="sign-in" icon={faSteam} label="Sign-in to sync" />
          )}
          {user !== undefined && (
            <>
              <div className="flex items-center gap-2 select-none">
                <span className="text-neutral-400">Signed in as</span>
                <span>{user.name}</span>{" "}
                <img
                  className="h-6 w-6 rounded-full"
                  src={user.avatar}
                  draggable={false}
                />
              </div>
              <HeaderLink
                to="sign-out"
                icon={faRightFromBracket}
                label="Sign out"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
