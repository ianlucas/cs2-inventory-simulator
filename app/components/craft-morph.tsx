/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { prefersReducedMotion } from "~/reduced-motion";
import {
  EditorItemImageProvider,
  EditorItemImageTarget
} from "./editor-item-display";

const FADE_MS = 150;
const RESIZE_MS = 300;
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const IMAGE_WAIT_MS = 2000;

type CraftMorphPhase = "picker" | "opening" | "editor" | "closing";

export type CraftMorph = ReturnType<typeof useCraftMorph>;

interface Size {
  height: number;
  width: number;
}

interface Transition {
  animations: Animation[];
  clone?: HTMLImageElement;
  frame?: number;
  from: Size;
  hiddenOrigin?: HTMLElement;
  isCancelled: boolean;
}

function px(value: number) {
  return `${value}px`;
}

function measure(element: HTMLElement): Size {
  return { height: element.offsetHeight, width: element.offsetWidth };
}

function canAnimate(element: HTMLElement) {
  return !prefersReducedMotion() && typeof element.animate === "function";
}

function measureAt<T>(wrapper: HTMLElement, size: Size, read: () => T) {
  const { height, width } = wrapper.style;
  wrapper.style.width = px(size.width);
  wrapper.style.height = px(size.height);
  const value = read();
  wrapper.style.width = width;
  wrapper.style.height = height;
  return value;
}

function animateSize(wrapper: HTMLElement, from: Size, to: Size, delay = 0) {
  return wrapper.animate(
    [
      { height: px(from.height), width: px(from.width) },
      { height: px(to.height), width: px(to.width) }
    ],
    { delay, duration: RESIZE_MS, easing: EASING, fill: "both" }
  );
}

function animateOpacity(
  element: HTMLElement,
  from: number,
  to: number,
  delay = 0
) {
  return element.animate([{ opacity: from }, { opacity: to }], {
    delay,
    duration: FADE_MS,
    fill: "both"
  });
}

function transformOnto(base: DOMRect, rect: DOMRect) {
  return `translate(${rect.left - base.left}px, ${rect.top - base.top}px) scale(${rect.width / base.width}, ${rect.height / base.height})`;
}

function flyImage(
  transition: Transition,
  {
    delay = 0,
    from,
    origin,
    src,
    to
  }: {
    delay?: number;
    from: DOMRect;
    origin: HTMLElement;
    src: string;
    to: DOMRect;
  }
) {
  const base = from.width >= to.width ? from : to;
  const clone = document.createElement("img");
  clone.alt = "";
  clone.draggable = false;
  clone.src = src;
  Object.assign(clone.style, {
    height: px(base.height),
    left: px(base.left),
    margin: "0",
    pointerEvents: "none",
    position: "fixed",
    top: px(base.top),
    transformOrigin: "0 0",
    width: px(base.width),
    zIndex: "60"
  });
  document.body.append(clone);
  transition.clone = clone;
  transition.hiddenOrigin = origin;
  origin.style.visibility = "hidden";
  const animation = clone.animate(
    [
      { transform: transformOnto(base, from) },
      { transform: transformOnto(base, to) }
    ],
    { delay, duration: RESIZE_MS, easing: EASING, fill: "both" }
  );
  transition.animations.push(animation);
  return animation;
}

function isInside(rect: DOMRect, bounds: DOMRect) {
  return (
    rect.width > 0 &&
    rect.left >= bounds.left &&
    rect.right <= bounds.right &&
    rect.top >= bounds.top &&
    rect.bottom <= bounds.bottom
  );
}

export function useCraftMorph({ onClosed }: { onClosed: () => void }) {
  const [phase, setPhase] = useState<CraftMorphPhase>("picker");
  const [pickerWidth, setPickerWidth] = useState<number>();
  const [isImageHidden, setIsImageHidden] = useState(false);
  const [isRevealHeld, setIsRevealHeld] = useState(false);
  const [imageTarget] = useState<EditorItemImageTarget>(() => ({
    box: null,
    image: null,
    is3d: false
  }));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<Transition>(undefined);
  const originRef = useRef<HTMLImageElement>(undefined);
  const imageLoadRef = useRef<() => void>(undefined);

  function endTransition() {
    const transition = transitionRef.current;
    transitionRef.current = undefined;
    if (transition === undefined) {
      return;
    }
    transition.isCancelled = true;
    if (transition.frame !== undefined) {
      cancelAnimationFrame(transition.frame);
    }
    transition.animations.forEach((animation) => animation.cancel());
    transition.clone?.remove();
    transition.hiddenOrigin?.style.removeProperty("visibility");
    const wrapper = wrapperRef.current;
    wrapper?.style.removeProperty("height");
    wrapper?.style.removeProperty("overflow");
    wrapper?.style.removeProperty("width");
  }

  function beginTransition(wrapper: HTMLElement) {
    endTransition();
    const from = measure(wrapper);
    wrapper.style.width = px(from.width);
    wrapper.style.height = px(from.height);
    wrapper.style.overflow = "hidden";
    transitionRef.current = { animations: [], from, isCancelled: false };
  }

  function whenFinished(transition: Transition, extra: Promise<void>[] = []) {
    return Promise.all([
      ...transition.animations.map((animation) => animation.finished),
      ...extra
    ]).then(
      () => !transition.isCancelled,
      () => false
    );
  }

  function open(origin?: HTMLElement | null) {
    const wrapper = wrapperRef.current;
    const picker = pickerRef.current;
    if (phase !== "picker" || wrapper === null || picker === null) {
      return false;
    }
    originRef.current = origin instanceof HTMLImageElement ? origin : undefined;
    setPickerWidth(picker.offsetWidth);
    if (!canAnimate(wrapper)) {
      setPhase("editor");
      return true;
    }
    beginTransition(wrapper);
    setIsImageHidden(originRef.current !== undefined);
    setIsRevealHeld(true);
    setPhase("opening");
    return true;
  }

  function close() {
    const wrapper = wrapperRef.current;
    if (phase !== "editor" || wrapper === null) {
      return;
    }
    if (!canAnimate(wrapper)) {
      setPhase("picker");
      onClosed();
      return;
    }
    beginTransition(wrapper);
    setPhase("closing");
  }

  useLayoutEffect(() => {
    const transition = transitionRef.current;
    if (
      transition === undefined ||
      (phase !== "opening" && phase !== "closing")
    ) {
      return;
    }
    transition.frame = requestAnimationFrame(() => {
      transition.frame = undefined;
      const wrapper = wrapperRef.current;
      const picker = pickerRef.current;
      const editor = editorRef.current;
      if (wrapper === null || picker === null || editor === null) {
        return;
      }
      if (phase === "opening") {
        animateOpening(transition, wrapper, picker, editor);
      } else {
        animateClosing(transition, wrapper, picker, editor);
      }
    });
  }, [phase]);

  useLayoutEffect(() => {
    if (phase === "picker" || phase === "editor") {
      endTransition();
    }
  }, [phase]);

  useEffect(() => endTransition, []);

  function animateOpening(
    transition: Transition,
    wrapper: HTMLElement,
    picker: HTMLElement,
    editor: HTMLElement
  ) {
    const { from } = transition;
    const to = measure(editor);
    const target = measureAt(wrapper, to, () =>
      imageTarget.box?.getBoundingClientRect()
    );
    const resize = animateSize(wrapper, from, to);
    transition.animations.push(
      resize,
      animateOpacity(picker, 1, 0),
      animateOpacity(editor, 0, 1, RESIZE_MS)
    );
    resize.finished.then(
      () => {
        if (!transition.isCancelled) {
          setIsRevealHeld(false);
        }
      },
      () => {}
    );

    const origin = originRef.current;
    const imageLoaded: Promise<void>[] = [];
    if (origin !== undefined && target !== undefined) {
      flyImage(transition, {
        from: origin.getBoundingClientRect(),
        origin,
        src: origin.src,
        to: target
      });
      if (imageTarget.image === null) {
        imageLoaded.push(
          new Promise((resolve) => {
            imageLoadRef.current = resolve;
            setTimeout(resolve, IMAGE_WAIT_MS);
          })
        );
      }
    } else {
      setIsImageHidden(false);
    }

    whenFinished(transition, imageLoaded).then((isFinished) => {
      if (isFinished) {
        imageLoadRef.current = undefined;
        setIsImageHidden(false);
        setPhase("editor");
      }
    });
  }

  function animateClosing(
    transition: Transition,
    wrapper: HTMLElement,
    picker: HTMLElement,
    editor: HTMLElement
  ) {
    const { from } = transition;
    const to = measure(picker);
    const origin = originRef.current;
    const target = measureAt(wrapper, to, () =>
      origin?.isConnected === true &&
      isInside(origin.getBoundingClientRect(), picker.getBoundingClientRect())
        ? origin.getBoundingClientRect()
        : undefined
    );
    transition.animations.push(
      animateOpacity(editor, 1, 0),
      animateSize(wrapper, from, to, FADE_MS),
      animateOpacity(picker, 0, 1, RESIZE_MS)
    );

    const { box, image, is3d } = imageTarget;
    if (
      origin !== undefined &&
      target !== undefined &&
      box !== null &&
      image !== null &&
      !is3d
    ) {
      flyImage(transition, {
        delay: FADE_MS,
        from: box.getBoundingClientRect(),
        origin,
        src: image.src,
        to: target
      });
    }

    whenFinished(transition).then((isFinished) => {
      if (isFinished) {
        setPhase("picker");
        onClosed();
      }
    });
  }

  const imageHandoff = useMemo(
    () => ({
      isImageHidden,
      isRevealHeld,
      onImageLoad: () => imageLoadRef.current?.(),
      target: imageTarget
    }),
    [imageTarget, isImageHidden, isRevealHeld]
  );

  return {
    close,
    editorRef,
    imageHandoff,
    isPicking: phase === "picker",
    open,
    phase,
    pickerRef,
    pickerWidth,
    wrapperRef
  };
}

export function CraftMorphLayers({
  editor,
  morph,
  picker
}: {
  editor?: ReactNode;
  morph: CraftMorph;
  picker: ReactNode;
}) {
  const { phase } = morph;
  return (
    <div className="relative flex justify-center" ref={morph.wrapperRef}>
      <div
        className={clsx(
          phase === "picker" ? "min-w-0 flex-1" : "absolute top-0",
          phase === "editor" && "size-0 overflow-hidden",
          phase === "closing" && "opacity-0"
        )}
        inert={phase !== "picker"}
        ref={morph.pickerRef}
      >
        <div
          style={phase === "picker" ? undefined : { width: morph.pickerWidth }}
        >
          {picker}
        </div>
      </div>
      {editor !== undefined && phase !== "picker" && (
        <div
          className={clsx(
            phase !== "editor" && "absolute top-0",
            phase === "opening" && "opacity-0"
          )}
          inert={phase !== "editor"}
          ref={morph.editorRef}
        >
          <EditorItemImageProvider value={morph.imageHandoff}>
            {editor}
          </EditorItemImageProvider>
        </div>
      )}
    </div>
  );
}

export function CraftMorphTitles({
  editor,
  morph,
  picker
}: {
  editor: ReactNode;
  morph: CraftMorph;
  picker: ReactNode;
}) {
  const { phase } = morph;
  const isEditorTitle = phase === "opening" || phase === "editor";
  const styles =
    "col-start-1 row-start-1 flex items-center transition-opacity motion-reduce:transition-none";
  const timing = {
    transitionDelay: phase === "closing" ? `${FADE_MS}ms` : undefined,
    transitionDuration: `${RESIZE_MS}ms`
  };
  const hidden = "pointer-events-none opacity-0";
  return (
    <span className="grid">
      <span
        className={clsx(styles, isEditorTitle && hidden)}
        inert={phase !== "picker"}
        style={timing}
      >
        {picker}
      </span>
      <span
        className={clsx(styles, !isEditorTitle && hidden)}
        inert={phase !== "editor"}
        style={timing}
      >
        {editor}
      </span>
    </span>
  );
}
