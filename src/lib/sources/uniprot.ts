const UNIPROT_BASE = "https://rest.uniprot.org";

export interface UniprotEntry {
  accession: string;
  proteinName: string;
  geneName: string | null;
  organism: string | null;
  length: number | null;
  sequence: string | null;
  function: string | null;
  features: { type: string; description: string }[];
  url: string;
}

interface RawProteinName {
  recommendedName?: { fullName?: { value?: string } };
  submissionNames?: { fullName?: { value?: string } }[];
}

interface RawSearchResult {
  primaryAccession: string;
  proteinDescription?: RawProteinName;
  genes?: { geneName?: { value?: string } }[];
  organism?: { scientificName?: string };
  sequence?: { length?: number; value?: string };
  comments?: { commentType?: string; texts?: { value?: string }[] }[];
  features?: { type?: string; description?: string }[];
}

function pickName(d?: RawProteinName): string {
  if (!d) return "Unknown protein";
  return (
    d.recommendedName?.fullName?.value ??
    d.submissionNames?.[0]?.fullName?.value ??
    "Unknown protein"
  );
}

export async function searchUniprot(query: string, size = 5): Promise<UniprotEntry[]> {
  const url = new URL(`${UNIPROT_BASE}/uniprotkb/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("size", String(size));
  url.searchParams.set(
    "fields",
    "accession,id,protein_name,gene_names,organism_name,length,sequence,cc_function,ft_act_site,ft_binding"
  );

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`UniProt search failed: ${res.status}`);
  const json = (await res.json()) as { results?: RawSearchResult[] };
  return (json.results ?? []).map((r) => ({
    accession: r.primaryAccession,
    proteinName: pickName(r.proteinDescription),
    geneName: r.genes?.[0]?.geneName?.value ?? null,
    organism: r.organism?.scientificName ?? null,
    length: r.sequence?.length ?? null,
    sequence: r.sequence?.value ?? null,
    function:
      (r.comments ?? [])
        .filter((c) => c.commentType === "FUNCTION")
        .flatMap((c) => c.texts ?? [])
        .map((t) => t.value ?? "")
        .join(" ") || null,
    features: (r.features ?? [])
      .slice(0, 8)
      .map((f) => ({ type: f.type ?? "", description: f.description ?? "" })),
    url: `https://www.uniprot.org/uniprotkb/${r.primaryAccession}/entry`,
  }));
}
