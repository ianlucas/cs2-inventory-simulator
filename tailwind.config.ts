/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'stratum-2-web'", "'Exo 2'", "sans-serif"],
        sans: ["'Noto Sans'", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Cascadia Code",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ]
      },
      fontSize: {
        sm: "0.9rem",
        base: "1.1rem",
        xl: "1.35rem",
        "2xl": "1.663rem",
        "3xl": "2.053rem",
        "4xl": "2.541rem",
        "5xl": "3.152rem"
      }
    }
  },
  plugins: []
} satisfies Config;
