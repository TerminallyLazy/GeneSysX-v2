export interface UniProtEntry {
  primaryAccession: string;
  uniProtkbId: string;
  organism?: { scientificName?: string };
  sequence?: { length?: number; value?: string };
  proteinDescription?: { recommendedName?: { fullName?: { value?: string } } };
}

export async function fetchUniProtByAccession(accession: string): Promise<UniProtEntry> {
  const url = `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(accession)}?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`UniProt fetch failed: ${res.status}`);
  return await res.json();
}
