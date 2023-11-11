import { useWindowSize } from "@uidotdev/usehooks";

export function useIsDesktop() {
  if (typeof document === "undefined") {
    return false;
  }
  const { width } = useWindowSize();
  if (width === null) {
    return false;
  }
  return width > 1024;
}
