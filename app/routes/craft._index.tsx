import { CS_Item } from "cslib";
import { useState } from "react";
import { CSItemEditor } from "~/components/cs-item-editor";
import CSItemPicker from "~/components/cs-item-picker";
import { Modal } from "~/components/modal";

export default function Craft() {
  const [csItem, setCSItem] = useState<CS_Item>();

  return (
    <Modal className="w-[512px]">
      <div className="font-bold px-4 py-2 select-none">Craft Item</div>
      {csItem === undefined
        ? <CSItemPicker onPickItem={setCSItem} />
        : <CSItemEditor csItem={csItem} />}
    </Modal>
  );
}
