const AF_BASE = "https://alphafold.ebi.ac.uk/api/prediction";

export interface AlphaFoldEntry {
  uniprotAccession: string;
  modelUrl: string;
  meanPlddt: number | null;
  url: string;
}

interface RawAfHit {
  uniprotAccession?: string;
  pdbUrl?: string;
  cifUrl?: string;
  globalMetricValue?: number;
}

export async function lookupAlphaFold(accession: string): Promise<AlphaFoldEntry | null> {
  try {
    const res = await fetch(`${AF_BASE}/${accession}`, { cache: "no-store" });
    if (!res.ok) return null;
    const arr = (await res.json()) as RawAfHit[];
    const hit = arr[0];
    if (!hit) return null;
    return {
      uniprotAccession: hit.uniprotAccession ?? accession,
      modelUrl: hit.pdbUrl ?? hit.cifUrl ?? "",
      meanPlddt: hit.globalMetricValue ?? null,
      url: `https://alphafold.ebi.ac.uk/entry/${accession}`,
    };
  } catch {
    return null;
  }
}
