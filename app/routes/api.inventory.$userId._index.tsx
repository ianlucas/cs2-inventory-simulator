import { LoaderFunctionArgs } from "@remix-run/node";
import { CS_Economy } from "cslib";
import { z } from "zod";
import { useUserCache } from "~/models/user-cache.server";

export const ApiInventoryUserIdUrl = "/api/inventory/$userId";

export async function loader({ params }: LoaderFunctionArgs) {
  const userId = z.string().parse(params.userId);
  return await useUserCache({
    url: ApiInventoryUserIdUrl,
    userId,
    throwData: [],
    generate(inventory) {
      return inventory.map(item => ({
        ...item,
        ...CS_Economy.getDefById(item.id)
      }));
    }
  });
}
