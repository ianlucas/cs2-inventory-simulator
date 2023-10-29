import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { editUserInventory } from "~/models/user.server";
import { noContent } from "~/response.server";
import { csTeamShape } from "~/utils/shapes";

export const ApiActionInventoryUnequipUrl = "/api/action/inventory-unequip";

export async function action({ request }: ActionFunctionArgs) {
  const { id: userId, inventory } = await requireUser(request);
  const { index, csTeam } = z.object({
    index: z.number(),
    csTeam: csTeamShape.optional()
  }).parse(await request.json());
  await editUserInventory(
    userId,
    inventory,
    csInventory => {
      return csInventory.unequip(index, csTeam);
    }
  );
  return noContent;
}
