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

/** VIP ayrıcalıkları — sayfada liste olarak gösterilir */
export interface VipBenefit {
  title: string;
  description: string;
}

export const vipBenefits: VipBenefit[] = [
  {
    title: "Öncelikli giriş",
    description: "Sunucu dolu olsa bile sıra beklemeden öncelikli slot ile giriş hakkı."
  },
  {
    title: "Özel rozet ve isim rengi",
    description: "Oyuncu listesinde VIP rozeti ve özel isim rengi ile fark yaratın."
  },
  {
    title: "Rezerv slot",
    description: "Sunucuda her zaman sizin için ayrılmış bir slot; kesintisiz oyun deneyimi. (Sunucuda herkes VIP ise rezerv slot kullanılamaz.)"
  },
  {
    title: "AWP",
    description: "Sadece VIP üyelere özel sunucuda AWP alın."
  }
];

export const vipPackages: VipPackage[] = [
  { id: "1m", label: "1 Ay", durationMonths: 1, priceTry: 150 },
  { id: "3m", label: "3 Ay", durationMonths: 3, priceTry: 450 },
  { id: "6m", label: "6 Ay", durationMonths: 6, priceTry: 750 }
];
