import { ComponentProps } from "react";

export function EditorInput(props: ComponentProps<"input">) {
  return (
    <input
      className="outline-none bg-black/50 rounded px-1 flex-1 placeholder-neutral-600"
      {...props}
    />
  );
}
