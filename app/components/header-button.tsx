import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ComponentProps } from "react";

export function HeaderButton(
  { icon, label, ...rest }: ComponentProps<"button"> & {
    icon: IconProp;
    label: string;
  }
) {
  return (
    <button
      {...rest}
      className="flex items-center gap-2 hover:bg-black/30 active:bg-black/70 transition-all px-1.5 py-0.5"
    >
      <FontAwesomeIcon className="h-4" icon={icon} />
      {label}
    </button>
  );
}
