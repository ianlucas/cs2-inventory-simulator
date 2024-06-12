/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ElementRef, useEffect, useRef } from "react";

export function TextSlider({
  className,
  text
}: {
  className?: string;
  text: string;
}) {
  const wrapperElement = useRef<ElementRef<"div">>(null);
  const textElement = useRef<ElementRef<"div">>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

    async function animate(frame: number = 0) {
      if (textElement.current === null || wrapperElement.current === null) {
        return;
      }
      const wrapperWidth = wrapperElement.current.clientWidth;
      const textWidth = textElement.current.scrollWidth;
      if (wrapperWidth >= textWidth) {
        return;
      }
      let duration = 0;
      switch (frame) {
        case 0:
          duration = 1000;
          textElement.current.style.opacity = "1";
          textElement.current.style.transform = "translateX(0px)";
          frame++;
          break;

        case 1:
          duration = text.length * 50; // 50 ms per letter.
          const translation = -(textWidth - wrapperWidth);
          textElement.current.style.transitionProperty = "transform";
          textElement.current.style.transitionDuration = `${duration}ms`;
          textElement.current.style.transform = `translateX(${translation}px)`;
          frame++;
          break;

        case 2:
          duration = 400;
          frame++;
          break;

        case 3:
          duration = 200;
          textElement.current.style.transitionProperty = "opacity";
          textElement.current.style.transitionDuration = `${duration}ms`;
          textElement.current.style.opacity = "0";
          frame = 0;
          break;
      }
      timeout = setTimeout(() => animate(frame), duration);
    }
    animate();
    return () => clearTimeout(timeout);
  }, [textElement.current]);

  return (
    <div className="overflow-hidden" ref={wrapperElement}>
      <div className={className} ref={textElement}>
        {text}
      </div>
    </div>
  );
}
