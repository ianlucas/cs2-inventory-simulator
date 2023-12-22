/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const linkImages = [
  16, 20, 29, 32, 40, 50, 57, 58, 60, 64, 72, 76, 80, 87, 100, 114, 120, 128,
  144, 152, 167, 180, 192, 256, 512, 1024
];

export function seoLinksFunction(appUrl: string) {
  return [
    ...linkImages.map((size) => ({
      rel: "apple-touch-icon",
      href: `${appUrl}/link-images/${size}.png`,
      sizes: `${size}x${size}`
    })),
    ...linkImages.map((size) => ({
      rel: "icon",
      type: "image/png",
      href: `${appUrl}/link-images/${size}.png`,
      sizes: `${size}x${size}`
    }))
  ];
}
