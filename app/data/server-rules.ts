/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface ServerRulesSection {
  id: string;
  title: string;
  body: string;
}

export const serverRulesSections: ServerRulesSection[] = [
  {
    id: "behavior",
    title: "Davranış",
    body:
      "Tüm oyunculara saygılı davranın. Taciz, nefret söylemi ve kişisel saldırılar kesinlikle yasaktır. Sunucuyu herkes için güvenli ve dostça tutacak şekilde iletişim kurun."
  },
  {
    id: "no-cheating",
    title: "Hile Yok",
    body:
      "Hile yapmak, açıkları kullanmak veya yetkisiz yazılım kullanmak kesinlikle yasaktır. Buna aim desteği, wallhack ve diğer tüm haksız avantajlar dahildir. İhlaller kalıcı banla sonuçlanır."
  },
  {
    id: "respect",
    title: "Saygı",
    body:
      "Sunucu yetkililerine ve kararlarına saygı gösterin. Sohbette tartışmayın; itiraz için uygun kanalları kullanın. Yetkililere veya diğer oyunculara saygısızlık mute veya ban ile sonuçlanabilir."
  },
  {
    id: "consequences",
    title: "Yaptırımlar",
    body:
      "Kuralları ihlal etmek; ihlalin ciddiyetine ve geçmişe bağlı olarak uyarı, mute, kick veya ban ile sonuçlanabilir. Tekrarlayan veya ağır ihlaller kalıcı uzaklaştırmaya neden olabilir."
  }
];
