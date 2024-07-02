/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  DEFAULT_APP_DESCRIPTION,
  DEFAULT_APP_IMAGE,
  DEFAULT_APP_TITLE
} from "./app-defaults";

const linkImages = [
  16, 20, 29, 32, 40, 50, 57, 58, 60, 64, 72, 76, 80, 87, 100, 114, 120, 128,
  144, 152, 167, 180, 192, 256, 512, 1024
];

export function getSeoMeta({
  appSeoDescription,
  appSeoImageUrl,
  appSeoTitle,
  meta: { appUrl, appSiteName }
}: {
  appName: string;
  appSeoDescription: string;
  appSeoImageUrl: string;
  appSeoTitle: string;
  meta: { appUrl: string; appSiteName: string };
}) {
  const appDescription = appSeoDescription || DEFAULT_APP_DESCRIPTION;
  const appTitle = appSeoTitle || DEFAULT_APP_TITLE;
  const appImage = appSeoImageUrl || `${appUrl}${DEFAULT_APP_IMAGE}`;

  return [
    {
      name: "theme-color",
      content: "#292524"
    },
    {
      name: "google",
      content: "notranslate"
    },
    {
      name: "description",
      content: appDescription
    },
    {
      property: "og:title",
      content: appTitle
    },
    {
      property: "og:description",
      content: appDescription
    },
    {
      property: "og:url",
      content: appUrl
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:site_name",
      content: appSiteName
    },
    {
      property: "og:image",
      content: appImage
    },
    {
      name: "twitter:card",
      content: "summary"
    },
    {
      name: "twitter:title",
      content: appTitle
    },
    {
      name: "twitter:description",
      content: appDescription
    },
    {
      name: "twitter:image",
      content: appImage
    }
  ];
}

export function getSeoLinks({
  meta: { appUrl }
}: {
  meta: { appUrl: string };
}) {
  return [
    ...linkImages.map((size) => ({
      rel: "apple-touch-icon",
      href: `${appUrl}/images/thumbnails/${size}.png`,
      sizes: `${size}x${size}`
    })),
    ...linkImages.map((size) => ({
      rel: "icon",
      type: "image/png",
      href: `${appUrl}/images/thumbnails/${size}.png`,
      sizes: `${size}x${size}`
    }))
  ];
}
