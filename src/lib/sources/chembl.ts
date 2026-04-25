const CHEMBL_BASE = "https://www.ebi.ac.uk/chembl/api/data";

export interface ChemblTargetHit {
  chemblId: string;
  prefName: string;
  organism: string | null;
  targetType: string | null;
  url: string;
  knownLigands: number;
}

interface RawTargets {
  targets?: {
    target_chembl_id: string;
    pref_name: string;
    organism?: string;
    target_type?: string;
  }[];
}

interface RawCount {
  page_meta?: { total_count?: number };
}

export async function searchTargets(query: string, limit = 4): Promise<ChemblTargetHit[]> {
  const url = new URL(`${CHEMBL_BASE}/target/search.json`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`ChEMBL ${res.status}`);
  const json = (await res.json()) as RawTargets;
  const targets = json.targets ?? [];
  const out: ChemblTargetHit[] = [];
  for (const t of targets) {
    let knownLigands = 0;
    try {
      const cu = new URL(`${CHEMBL_BASE}/activity.json`);
      cu.searchParams.set("target_chembl_id", t.target_chembl_id);
      cu.searchParams.set("limit", "1");
      const cr = await fetch(cu.toString(), { cache: "no-store" });
      if (cr.ok) {
        const cj = (await cr.json()) as RawCount;
        knownLigands = cj.page_meta?.total_count ?? 0;
      }
    } catch {
      // fall through
    }
    out.push({
      chemblId: t.target_chembl_id,
      prefName: t.pref_name,
      organism: t.organism ?? null,
      targetType: t.target_type ?? null,
      knownLigands,
      url: `https://www.ebi.ac.uk/chembl/target_report_card/${t.target_chembl_id}/`,
    });
  }
  return out;
}
