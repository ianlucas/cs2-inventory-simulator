import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Inventory Simulator" }
  ];
};

export default function Index() {
  return null;
}
