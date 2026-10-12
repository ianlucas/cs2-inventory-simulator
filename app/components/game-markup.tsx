/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ReactNode } from "react";
import { GameMarkupNode, parseGameMarkup } from "~/shared/game-markup";

function render(nodes: GameMarkupNode[]): ReactNode {
  return nodes.map((node, index) => {
    if (typeof node === "string") {
      return node;
    }
    switch (node.tag) {
      case "br":
        return <br key={index} />;
      case "b":
        return <b key={index}>{render(node.children)}</b>;
      case "i":
        return <i key={index}>{render(node.children)}</i>;
      case "font":
        return (
          <span key={index} style={{ color: node.color }}>
            {render(node.children)}
          </span>
        );
    }
  });
}

export function GameMarkup({ markup }: { markup: string }) {
  return render(parseGameMarkup(markup));
}
