/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useToggle } from "@uidotdev/usehooks";
import {
  ChangeEvent,
  ElementRef,
  FormEvent,
  useEffect,
  useRef,
  useState
} from "react";
import { colorText } from "~/utils/misc";
import { useStorageState } from "./hooks/use-storage-state";

type Command = (params: {
  args: string[];
  println: (message: string) => void;
  clear: () => void;
}) => Promise<void>;

const commands: Record<string, Command> = {};

export function addCommand(name: string, handler: Command) {
  commands[name] = handler;
}

addCommand("version", async ({ println }) => {
  println("{green}Inventory Simulator's Console Version 1.0");
});

addCommand("iam", async ({ args, println }) => {
  if (args.length < 2) {
    return println("{red}Usage: iam [name]");
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      println(`Hello, ${args.slice(1).join(" ")}.`);
      resolve();
    }, 2000);
  });
});

addCommand("clear", async ({ clear }) => clear());

export function Console() {
  const [isVisible, toggleIsVisible] = useToggle(false);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState("");
  const [consoleSize, setConsoleSize] = useStorageState("consoleSize", {
    height: 240,
    width: 360
  });
  const [buffer, setBuffer] = useState<string[]>([]);
  const containerRef = useRef<ElementRef<"div">>(null);
  const handleRef = useRef<ElementRef<"div">>(null);
  const outputRef = useRef<ElementRef<"div">>(null);

  function println(message: string) {
    setBuffer((buffer) => [...buffer, colorText(message)]);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (isThinking) {
      return;
    }
    setInput(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isThinking) {
      return;
    }
    setIsThinking(true);
    setInput("...");
    const args = input.trim().split(" ");
    const command = args[0];
    if (command !== undefined) {
      println(`{gray}] ${input}`);
      const handler = commands[command];
      if (handler !== undefined) {
        await handler({
          args,
          println,
          clear: () => setBuffer([])
        });
      } else if (command !== "") {
        println(`{red}Command "${command}" not found.`);
      }
    } else {
      println("{red}Type a command.");
    }
    setIsThinking(false);
    setInput("");
  }

  useEffect(() => {
    if (containerRef.current !== null && handleRef.current !== null) {
      const containerElement = containerRef.current;
      const handleElement = handleRef.current;
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;
      function handleMousedown(event: MouseEvent) {
        event.preventDefault();
        isDragging = true;
        offsetX = event.clientX - containerElement.offsetLeft;
        offsetY = event.clientY - containerElement.offsetTop;
      }
      function handleMousemove(event: MouseEvent) {
        if (isDragging) {
          containerElement.style.left = event.clientX - offsetX + "px";
          containerElement.style.top = event.clientY - offsetY + "px";
        }
      }
      function handleMouseup() {
        isDragging = false;
      }
      handleElement.addEventListener("mousedown", handleMousedown);
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { blockSize: height, inlineSize: width } =
            entry.borderBoxSize[0];
          setConsoleSize({ height, width });
        }
      });
      document.addEventListener("mousemove", handleMousemove);
      document.addEventListener("mouseup", handleMouseup);
      resizeObserver.observe(containerElement);
      return () => {
        handleElement.removeEventListener("mousedown", handleMousedown);
        document.removeEventListener("mousemove", handleMousemove);
        document.removeEventListener("mouseup", handleMouseup);
        resizeObserver.disconnect();
      };
    }
  }, [containerRef, handleRef, isVisible]);

  useEffect(() => {
    if (outputRef.current !== null && isVisible) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [buffer, outputRef, isVisible]);

  useEffect(() => {
    function onKeyup(event: KeyboardEvent) {
      const { activeElement } = document;
      if (
        event.code === "Backquote" &&
        !(activeElement instanceof HTMLInputElement)
      ) {
        toggleIsVisible();
      }
    }
    window.addEventListener("keyup", onKeyup);
    return () => {
      window.removeEventListener("keyup", onKeyup);
    };
  });

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed top-2 left-2 z-9999 flex min-h-[240px] min-w-[360px] resize flex-col overflow-hidden rounded-xs border border-black/80 bg-neutral-950/90 text-sm drop-shadow-lg backdrop-blur-sm"
      style={{ height: consoleSize.height, width: consoleSize.width }}
      ref={containerRef}
    >
      <div
        className="font-display flex items-center bg-neutral-950/95 px-2 py-1 pr-1 font-bold text-white select-none"
        ref={handleRef}
      >
        <div className="flex-1">CONSOLE</div>
        <button
          className="flex cursor-default items-center justify-center p-1 hover:bg-neutral-800/50"
          onClick={() => toggleIsVisible()}
        >
          <FontAwesomeIcon className="h-4 w-4" icon={faXmark} />
        </button>
      </div>
      <div
        className="flex-1 overflow-hidden overflow-x-auto overflow-y-scroll font-mono text-sm whitespace-pre-wrap"
        ref={outputRef}
      >
        {buffer.map((line, no) => (
          <div key={no} dangerouslySetInnerHTML={{ __html: line }} />
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          className="w-full bg-black px-1 font-mono text-sm text-white outline-hidden placeholder:text-neutral-600"
          onChange={handleChange}
          placeholder="Type a command..."
          value={input}
        />
      </form>
    </div>
  );
}
