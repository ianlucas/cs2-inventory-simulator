import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { editUserInventory } from "~/models/user.server";
import { noContent } from "~/response.server";
import { inventoryItemShape } from "~/utils/shapes";

export const ApiActionInventoryAddUrl = "/api/action/inventory-add";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory } = await requireUser(request);
  const { item } = z.object({ item: inventoryItemShape })
    .parse(await request.json());
  await editUserInventory(
    userId,
    inventory,
    csInventory => {
      return csInventory.add(item);
    }
  );
  return noContent;
}
