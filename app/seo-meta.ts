/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function seoMetaFunction(appUrl: string, appSiteName: string) {
  const appDescription =
    "Counter-Strike 2 Inventory Simulator. Craft items, open cases, and scrape stickers - organize and plan your dream inventory.";
  const appTitle = "The best free, Counter-Strike 2 Inventory Simulator";
  const appWideImage = `${appUrl}/images/inventory-simulator.png`;

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
      content: appWideImage
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
      content: appWideImage
    }
  ];
}
