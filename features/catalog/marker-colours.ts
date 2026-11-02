/**
 * Art-X marker shades by number. Rich's own site gives numbers only, so names come from Turkish shops that sell them:
 * Duo from umraniyehobisanat.com, metallic numbers from product codes on sanatsalkirtasiye.com, with matching barcodes.
 * Bosnian names and families are our translation.
 */
export type MarkerColour = { maker: string; name: string; family: string; note?: string };

export const DUO_MARKERS: Record<string, MarkerColour> = {
  "10": { maker: "Siyah", name: "Crna", family: "bijele-crne" },
  "20": { maker: "Sarı", name: "Žuta", family: "zute" },
  "25": { maker: "Pastel Pembe", name: "Pastelno roza", family: "crvene" },
  "27": { maker: "Eflatun", name: "Eflatun lila", family: "ljubicaste" },
  "29": { maker: "Boncuk Mavi", name: "Perla plava", family: "plave" },
  "31": { maker: "Mavi", name: "Plava", family: "plave" },
  "34": { maker: "Açık Turkuaz Yeşili", name: "Svijetla tirkizno zelena", family: "zelene" },
  "35": { maker: "Turkuaz Yeşil", name: "Tirkizno zelena", family: "zelene" },
  "36": { maker: "Kırmızı", name: "Crvena", family: "crvene" },
  "38": { maker: "Koyu Kahve", name: "Tamnosmeđa", family: "zemljane" },
  "43": { maker: "Beyaz", name: "Bijela", family: "bijele-crne" },
  "45": { maker: "Nar Çiçeği", name: "Cvijet nara", family: "crvene" },
  "46": { maker: "Fuşya", name: "Fuksija", family: "crvene" },
  "47": { maker: "Açık Yeşil", name: "Svijetlozelena", family: "zelene" },
  "48": { maker: "Okyanus Mavi", name: "Okeansko plava", family: "plave" },
  "50": { maker: "Gece Mavi", name: "Noćno plava", family: "plave" },
  "51": { maker: "Mor", name: "Ljubičasta", family: "ljubicaste" },
  "55": { maker: "Tütün", name: "Duhan", family: "zemljane" },
  "57": { maker: "Erguvan", name: "Erguvan ljubičasta", family: "ljubicaste" },
  "63": { maker: "Neon Sarı", name: "Neon žuta", family: "zute" },
  "65": { maker: "Mocha", name: "Moka", family: "zemljane" },
  "130": {
    maker: "Taş Gri",
    name: "Kameno siva",
    family: "bijele-crne",
    note: "Jedna trgovina u naslovu navodi bijelu, a u polju boje sivu. Provjeriti na markeru.",
  },
  "131": { maker: "Açık Mor", name: "Svijetloljubičasta", family: "ljubicaste" },
  "132": { maker: "Zümrüt Yeşili", name: "Smaragdno zelena", family: "zelene" },
  "144": { maker: "Açık Mercan", name: "Svijetli koral", family: "narandzaste" },
  "145": { maker: "Ten Rengi", name: "Boja kože", family: "zemljane" },
  "146": { maker: "Işık Sarı", name: "Svijetložuta", family: "zute" },
  "147": { maker: "Açık Nane Yeşili", name: "Svijetla menta", family: "zelene" },
  "148": { maker: "Bebek Mavi", name: "Baby plava", family: "plave" },
  "149": { maker: "Açık Lila", name: "Svijetlolila", family: "ljubicaste" },
  "150": { maker: "Koyu Ten Rengi", name: "Tamna boja kože", family: "zemljane" },
  "151": { maker: "Pembe", name: "Roza", family: "crvene" },
  "152": { maker: "Deniz Yeşili", name: "Morsko zelena", family: "zelene" },
  "153": { maker: "Gri Mavi", name: "Sivoplava", family: "plave" },
  "154": { maker: "Yaprak Yeşili", name: "Zelena lista", family: "zelene" },
  "158": { maker: "Leylak", name: "Jorgovan", family: "ljubicaste" },
  "201": { maker: "Bej", name: "Bež", family: "zemljane" },
  "202": { maker: "Haki", name: "Haki", family: "zelene" },
  "203": { maker: "Taş Rengi", name: "Boja kamena", family: "zemljane" },
  "204": { maker: "Çikolata", name: "Čokolada", family: "zemljane" },
  "205": {
    maker: "Koyu Gri",
    name: "Tamnosiva",
    family: "bijele-crne",
    note: "Izvori se ne slažu: jedna trgovina navodi tamnosivu, druga plavu. Provjeriti na markeru.",
  },
  "206": { maker: "Sütlü Kahve", name: "Kafa s mlijekom", family: "zemljane" },
  "207": { maker: "Lacivert", name: "Tamnoplava", family: "plave" },
  "208": { maker: "Kahverengi", name: "Smeđa", family: "zemljane" },
  "209": { maker: "Taba", name: "Taba smeđa", family: "zemljane" },
  "210": { maker: "Krem", name: "Krem", family: "zemljane" },
  "211": { maker: "Keten", name: "Lan", family: "zemljane" },
  "212": { maker: "Gri", name: "Siva", family: "bijele-crne" },
};

export const METALLIC_MARKERS: Record<string, MarkerColour> = {
  "136": {
    maker: "Metalik Turkuaz",
    name: "Metalik tirkiz",
    family: "plave",
    note: "Jedan oglas za šifru 18044-136 navodi zelenu, a kod i barkod u dvije trgovine tirkiz. Provjeriti na markeru.",
  },
  "137": { maker: "Metalik Yeşil", name: "Metalik zelena", family: "zelene" },
  "140": { maker: "Metalik Altın", name: "Metalik zlatna", family: "zlatne" },
  "141": { maker: "Metalik Turuncu", name: "Metalik narandžasta", family: "narandzaste" },
  "142": { maker: "Metalik Pembe", name: "Metalik roza", family: "crvene" },
  "143": { maker: "Metalik Mor", name: "Metalik ljubičasta", family: "ljubicaste" },
  "144": { maker: "Metalik Siyah", name: "Metalik crna", family: "bijele-crne" },
  "145": { maker: "Metalik Gümüş", name: "Metalik srebrna", family: "srebrne" },
  "184": { maker: "Metalik Mavi", name: "Metalik plava", family: "plave" },
  "195": { maker: "Metalik Bakır", name: "Metalik bakar", family: "bronza-bakar" },
};

/** The marker's shade from its name: "Akrilni marker Art-X Duo 36", "Akrilni metalik marker Art-X 136". */
export function markerColour(name: string): (MarkerColour & { code: string }) | null {
  const code = name.match(/marker Art-X(?: Duo)? (\d+)$/)?.[1];
  if (!code) return null;
  const colour = (/metalik marker/i.test(name) ? METALLIC_MARKERS : DUO_MARKERS)[code];
  return colour ? { ...colour, code } : null;
}
