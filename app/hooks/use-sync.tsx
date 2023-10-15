import { useRootContext } from "~/components/root-context";
import { sync } from "~/utils/sync";

export function useSync() {
  const { user } = useRootContext();
  return function useSync(url: string, data: any) {
    if (user !== undefined) {
      sync(url, data);
    }
  };
}
