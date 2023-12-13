import clsx from "clsx";

export function FillSpinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative h-[32px] w-[32px] rotate-45 rounded-[50%] border-[4px] border-transparent before:absolute before:inset-[-4px] before:animate-[fill-spinner_1s_infinite_linear] before:rounded-[50%] before:border-[4px] before:border-white before:content-['']",
        className
      )}
    />
  );
}
