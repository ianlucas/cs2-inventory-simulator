/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ensure } from "@ianlucas/cs2-lib";
import { act } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { range } from "~/shared/number";
import { setupTestRoot } from "~/test-utils";
import { GridList } from "./grid-list";

vi.mock("./app-context", () => ({
  useTranslate: () => (key: string) => key
}));

interface FakeAnimation {
  cancelled: boolean;
  element: Element;
  keyframes: Keyframe[];
  onfinish: (() => void) | null;
  options: unknown;
  progress: number | null;
}

function fakeAnimate() {
  const animations: FakeAnimation[] = [];
  vi.spyOn(Element.prototype, "animate").mockImplementation(function (
    this: Element,
    keyframes,
    options
  ) {
    const animation: FakeAnimation = {
      cancelled: false,
      element: this,
      keyframes: keyframes as Keyframe[],
      onfinish: null,
      options,
      progress: 0
    };
    animations.push(animation);
    return {
      cancel() {
        animation.cancelled = true;
      },
      effect: {
        getComputedTiming: () => ({
          progress: animation.cancelled ? null : animation.progress
        })
      },
      set onfinish(handler: () => void) {
        animation.onfinish = handler;
      }
    } as unknown as Animation;
  });
  return animations;
}

function slideKeyframes(from: string, to: string) {
  return [
    { transform: `translateY(${from})` },
    { transform: `translateY(${to})` }
  ];
}

const NUMBERS = range(20);

describe("GridList", () => {
  const view = setupTestRoot();

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function render(items: (number | string)[] = NUMBERS) {
    view.render(
      <GridList itemHeight={10} items={items} maxItemsIntoView={3}>
        {(item, index) => (
          <div data-item key={index}>
            {item}
          </div>
        )}
      </GridList>
    );
  }

  function firstItem() {
    return ensure(view.container.querySelector("[data-item]"));
  }

  function track() {
    return ensure(firstItem().parentElement);
  }

  function scrollbar() {
    const element = ensure(track().parentElement?.nextElementSibling);
    Object.defineProperty(element, "clientHeight", { value: 30 });
    return element;
  }

  function dispatchWheel(deltaY: number) {
    firstItem().dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, deltaY })
    );
  }

  function wheel(deltaY: number) {
    act(() => dispatchWheel(deltaY));
  }

  function rendered() {
    return Array.from(view.container.querySelectorAll("[data-item]"))
      .map((element) => element.textContent)
      .join(",");
  }

  function finish(animation: FakeAnimation) {
    animation.progress = null;
    act(() => animation.onfinish?.());
  }

  function trackAnimations(animations: FakeAnimation[]) {
    return animations.filter(({ element }) => element === track());
  }

  function thumbAnimations(animations: FakeAnimation[]) {
    return animations.filter(({ element }) => element !== track());
  }

  test("slides one slot per wheel step and drops the slot it left once it settles", () => {
    const animations = fakeAnimate();
    render();
    wheel(1);
    const [slide] = trackAnimations(animations);
    expect(slide.keyframes).toEqual(slideKeyframes("0px", "-10px"));
    expect(rendered()).toBe("0,1,2,3");
    finish(slide);
    expect(rendered()).toBe("1,2,3");
  });

  test("glides through every step when several wheel events land before React renders", () => {
    const animations = fakeAnimate();
    render();
    act(() => {
      dispatchWheel(1);
      dispatchWheel(1);
    });
    const slides = trackAnimations(animations);
    expect(slides).toHaveLength(1);
    expect(slides[0].keyframes).toEqual(slideKeyframes("0px", "-20px"));
    expect(rendered()).toBe("0,1,2,3,4");
  });

  test("picks the slide up from where it is when the wheel turns mid-slide", () => {
    const animations = fakeAnimate();
    render();
    wheel(1);
    finish(trackAnimations(animations)[0]);
    wheel(1);
    const [, second] = trackAnimations(animations);
    second.progress = 0.5;
    wheel(1);
    const [, , third] = trackAnimations(animations);
    expect(second.cancelled).toBe(true);
    expect(third.keyframes).toEqual(slideKeyframes("-15px", "-30px"));
    expect(rendered()).toBe("1,2,3,4,5");
  });

  test("starts from where the list is when React renders, not where the event caught it", () => {
    const animations = fakeAnimate();
    render();
    wheel(1);
    const [first] = trackAnimations(animations);
    first.progress = 0.5;
    act(() => {
      dispatchWheel(1);
      first.progress = 0.8;
    });
    const [, second] = trackAnimations(animations);
    expect(second.keyframes).toEqual(slideKeyframes("-8px", "-20px"));
  });

  test("slides the scrollbar thumb in step with the list", () => {
    const animations = fakeAnimate();
    render();
    wheel(1);
    const [list] = trackAnimations(animations);
    const [thumb] = thumbAnimations(animations);
    expect(thumb.keyframes).toEqual(slideKeyframes("0px", "1.5px"));
    expect(thumb.options).toBe(list.options);
    finish(list);
    wheel(-1);
    expect(thumbAnimations(animations)[1].keyframes).toEqual(
      slideKeyframes("1.5px", "0px")
    );
  });

  test("does not slide past either end", () => {
    const animations = fakeAnimate();
    render();
    wheel(-1);
    expect(animations).toHaveLength(0);
    expect(rendered()).toBe("0,1,2");
  });

  test("slides the list but keeps the thumb under the cursor while dragging the scrollbar", () => {
    const animations = fakeAnimate();
    render();
    act(() => {
      scrollbar().dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    act(() => {
      document.dispatchEvent(new MouseEvent("mousemove", { clientY: 3 }));
    });
    expect(trackAnimations(animations)[0].keyframes).toEqual(
      slideKeyframes("0px", "-10px")
    );
    expect(thumbAnimations(animations)).toHaveLength(0);
  });

  test("snaps when the scrollbar is dragged further than one view", () => {
    const animations = fakeAnimate();
    render();
    act(() => {
      scrollbar().dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    act(() => {
      document.dispatchEvent(new MouseEvent("mousemove", { clientY: 30 }));
    });
    expect(animations).toHaveLength(0);
    expect(rendered()).toBe("17,18,19");
  });

  test("slides one slot per touch move", () => {
    const animations = fakeAnimate();
    render();
    function touch(type: string, clientY: number) {
      act(() => {
        firstItem().dispatchEvent(
          new TouchEvent(type, {
            bubbles: true,
            touches: [{ clientY } as Touch]
          })
        );
      });
    }
    touch("touchstart", 50);
    touch("touchmove", 40);
    expect(trackAnimations(animations)[0].keyframes).toEqual(
      slideKeyframes("0px", "-10px")
    );
  });

  test("slides one slot toward the half of the scrollbar that was clicked", () => {
    const animations = fakeAnimate();
    render();
    function click(offsetY: number) {
      act(() => {
        scrollbar().dispatchEvent(
          new MouseEvent("click", { bubbles: true, offsetY } as MouseEventInit)
        );
      });
    }
    click(25);
    const [down] = trackAnimations(animations);
    expect(down.keyframes).toEqual(slideKeyframes("0px", "-10px"));
    finish(down);
    click(5);
    expect(trackAnimations(animations)[1].keyframes).toEqual(
      slideKeyframes("-10px", "0px")
    );
  });

  test("snaps without sliding when the user prefers reduced motion", () => {
    const animations = fakeAnimate();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)"
    }));
    render();
    wheel(1);
    expect(animations).toHaveLength(0);
    expect(rendered()).toBe("1,2,3");
  });

  test("snaps back to the top without sliding when the items change", () => {
    const animations = fakeAnimate();
    render();
    wheel(1);
    wheel(1);
    render(["a", "b", "c", "d"]);
    expect(animations.every(({ cancelled }) => cancelled)).toBe(true);
    expect(animations).toHaveLength(4);
    expect(rendered()).toBe("a,b,c");
    expect(track().style.transform).toBe("translateY(0px)");
  });
});
