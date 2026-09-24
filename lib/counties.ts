// lib/counties.ts
// Kenya's 47 counties. This mirrors the canonical list used by tabeza-staff /
// tabeza-crew (bars.county stores the full county name). Only the names are
// needed client-side, to normalise reverse-geocoded GPS to a county.

export interface KenyaCounty {
  code: string;
  number: number;
  name: string;
}

export const KENYA_COUNTIES: KenyaCounty[] = [
  { code: 'MSA', number: 1, name: 'Mombasa' },
  { code: 'KWL', number: 2, name: 'Kwale' },
  { code: 'KLF', number: 3, name: 'Kilifi' },
  { code: 'TRV', number: 4, name: 'Tana River' },
  { code: 'LAM', number: 5, name: 'Lamu' },
  { code: 'TVT', number: 6, name: 'Taita-Taveta' },
  { code: 'GRS', number: 7, name: 'Garissa' },
  { code: 'WJR', number: 8, name: 'Wajir' },
  { code: 'MDR', number: 9, name: 'Mandera' },
  { code: 'MBT', number: 10, name: 'Marsabit' },
  { code: 'ISL', number: 11, name: 'Isiolo' },
  { code: 'MRU', number: 12, name: 'Meru' },
  { code: 'THN', number: 13, name: 'Tharaka-Nithi' },
  { code: 'EMB', number: 14, name: 'Embu' },
  { code: 'KTU', number: 15, name: 'Kitui' },
  { code: 'MCK', number: 16, name: 'Machakos' },
  { code: 'MKN', number: 17, name: 'Makueni' },
  { code: 'NDR', number: 18, name: 'Nyandarua' },
  { code: 'NYR', number: 19, name: 'Nyeri' },
  { code: 'KRG', number: 20, name: 'Kirinyaga' },
  { code: 'MRG', number: 21, name: "Murang'a" },
  { code: 'KMB', number: 22, name: 'Kiambu' },
  { code: 'TRK', number: 23, name: 'Turkana' },
  { code: 'WPK', number: 24, name: 'West Pokot' },
  { code: 'SMB', number: 25, name: 'Samburu' },
  { code: 'TNZ', number: 26, name: 'Trans Nzoia' },
  { code: 'UGS', number: 27, name: 'Uasin Gishu' },
  { code: 'EMK', number: 28, name: 'Elgeyo-Marakwet' },
  { code: 'NDI', number: 29, name: 'Nandi' },
  { code: 'BRG', number: 30, name: 'Baringo' },
  { code: 'LKP', number: 31, name: 'Laikipia' },
  { code: 'NKR', number: 32, name: 'Nakuru' },
  { code: 'NRK', number: 33, name: 'Narok' },
  { code: 'KJD', number: 34, name: 'Kajiado' },
  { code: 'KRC', number: 35, name: 'Kericho' },
  { code: 'BMT', number: 36, name: 'Bomet' },
  { code: 'KKG', number: 37, name: 'Kakamega' },
  { code: 'VHG', number: 38, name: 'Vihiga' },
  { code: 'BGM', number: 39, name: 'Bungoma' },
  { code: 'BSA', number: 40, name: 'Busia' },
  { code: 'SYA', number: 41, name: 'Siaya' },
  { code: 'KSM', number: 42, name: 'Kisumu' },
  { code: 'HMB', number: 43, name: 'Homa Bay' },
  { code: 'MGR', number: 44, name: 'Migori' },
  { code: 'KSI', number: 45, name: 'Kisii' },
  { code: 'NYM', number: 46, name: 'Nyamira' },
  { code: 'NBO', number: 47, name: 'Nairobi' },
];

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\bcounty\b/g, '')
    .replace(/[^a-z]/g, '');
}

/**
 * Map a free-form county string (from reverse geocoding, e.g. "Nairobi",
 * "Kiambu County", "Nairobi / Nairobi", "Taita Taveta") to the canonical
 * KENYA_COUNTIES name, or null when nothing matches.
 */
export function matchCountyName(raw?: string | null): string | null {
  if (!raw) return null;
  const n = normalize(raw);
  if (!n) return null;

  const exact = KENYA_COUNTIES.find((c) => normalize(c.name) === n);
  if (exact) return exact.name;

  return KENYA_COUNTIES.find((c) => n.includes(normalize(c.name)))?.name ?? null;
}