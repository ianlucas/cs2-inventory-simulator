/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type GameMarkupNode =
  | string
  | { tag: "br" }
  | {
      tag: "b" | "i" | "font";
      color?: string;
      children: GameMarkupNode[];
    };

type GameMarkupElement = Extract<GameMarkupNode, { children: unknown }>;

const TAG_RE = /<(\/?)(br|b|i|font)\b([^>]*)>/gi;
const COLOR_RE = /color\s*=\s*["']?(#[0-9a-f]{3,8})\b/i;

export function parseGameMarkup(markup: string): GameMarkupNode[] {
  const root: Partial<GameMarkupElement> & { children: GameMarkupNode[] } = {
    children: []
  };
  const stack = [root];
  let lastIndex = 0;
  for (const match of markup.matchAll(TAG_RE)) {
    const [raw, closing, rawTag, attributes] = match;
    const tag = rawTag.toLowerCase() as GameMarkupElement["tag"] | "br";
    const parent = stack[stack.length - 1];
    if (match.index > lastIndex) {
      parent.children.push(markup.slice(lastIndex, match.index));
    }
    lastIndex = match.index + raw.length;
    if (tag === "br") {
      parent.children.push({ tag });
    } else if (closing === "") {
      const element: GameMarkupElement = {
        tag,
        color: tag === "font" ? COLOR_RE.exec(attributes)?.[1] : undefined,
        children: []
      };
      parent.children.push(element);
      stack.push(element);
    } else if (stack.length > 1 && parent.tag === tag) {
      stack.pop();
    }
  }
  if (lastIndex < markup.length) {
    stack[stack.length - 1].children.push(markup.slice(lastIndex));
  }
  return root.children;
}
