/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface VipPackage {
  id: string;
  label: string;
  durationMonths: number;
  priceTry: number;
}

export const vipBenefitsText =
  "VIP üyeliği ile sunucuda özel ayrıcalıklardan yararlanın: öncelikli giriş, özel rozet ve daha fazlası.";

export const vipPackages: VipPackage[] = [
  { id: "1m", label: "1 Ay", durationMonths: 1, priceTry: 99 },
  { id: "3m", label: "3 Ay", durationMonths: 3, priceTry: 249 },
  { id: "6m", label: "6 Ay", durationMonths: 6, priceTry: 449 }
];
