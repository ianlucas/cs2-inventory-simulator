import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "cstrike/InventorySim" },
    { name: "description", content: "CS Inventory Sim" }
  ];
};

export default function Index() {
  return null;
}
