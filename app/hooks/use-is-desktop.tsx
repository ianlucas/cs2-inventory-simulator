import { useWindowSize } from "@uidotdev/usehooks";

export function useIsDesktop() {
  const { width } = useWindowSize();
  if (width === null) {
    return false;
  }
  return width > 1024;
}
