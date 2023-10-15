import { faLongArrowLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "@remix-run/react";
import { CS_Item } from "cslib";
import { useState } from "react";
import { CSItemEditor } from "~/components/cs-item-editor";
import CSItemPicker from "~/components/cs-item-picker";
import { Modal } from "~/components/modal";

export default function Craft() {
  const [csItem, setCSItem] = useState<CS_Item>();

  return (
    <Modal className="w-[512px]">
      <div className="font-bold px-4 py-2 select-none flex items-center justify-between">
        <span>Craft Item</span>
        <div className="flex items-center gap-8">
          {csItem !== undefined && (
            <button
              className="flex items-center gap-1 text-neutral-200 cursor-default hover:bg-black/30 px-2 rounded"
              onClick={() => setCSItem(undefined)}
            >
              <FontAwesomeIcon icon={faLongArrowLeft} />
              Reset
            </button>
          )}
          <Link to="/">
            <FontAwesomeIcon
              icon={faXmark}
              className="h-4 opacity-50 hover:opacity-100"
            />
          </Link>
        </div>
      </div>
      {csItem === undefined
        ? <CSItemPicker onPickItem={setCSItem} />
        : <CSItemEditor csItem={csItem} />}
    </Modal>
  );
}
