/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useRef } from "react";
import { wait } from "~/utils/promise";

export function TextSlider({
  className,
  text
}: {
  className?: string;
  text: string;
}) {
  const wrapperElement = useRef<HTMLDivElement | null>(null);
  const textElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

    async function animate(goToRight: boolean = true) {
      await wait(2500);
      if (textElement.current === null || wrapperElement.current === null) {
        return;
      }
      const duration = text.length * 50 * (goToRight ? 1 : 0.5); // 50 ms per letter.
      const wrapperWidth = wrapperElement.current.clientWidth ?? 0;
      const textWidth = textElement.current.scrollWidth ?? 0;
      const translation =
        goToRight && textWidth > wrapperWidth ? -(textWidth - wrapperWidth) : 0;
      textElement.current.style.transitionProperty = "all";
      textElement.current.style.transitionDuration = `${duration}ms`;
      textElement.current.style.transform = `translateX(${translation}px)`;
      timeout = setTimeout(() => animate(!goToRight), duration);
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
