/**
 * NCBI E-utilities client for PubMed.
 * Uses esearch + esummary + efetch to retrieve real PMIDs, abstracts and metadata.
 */

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

interface PubmedAuxParams {
  api_key?: string;
  tool?: string;
  email?: string;
}

function authParams(): URLSearchParams {
  const out = new URLSearchParams();
  const aux: PubmedAuxParams = {
    api_key: process.env.NCBI_API_KEY || undefined,
    tool: process.env.NCBI_TOOL || "pepclaw",
    email: process.env.NCBI_EMAIL || undefined,
  };
  for (const [k, v] of Object.entries(aux)) {
    if (v) out.set(k, v);
  }
  return out;
}

export interface PubmedHit {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string | null;
  year: number | null;
  doi: string | null;
  pubTypes: string[];
  mesh: string[];
  url: string;
}

export async function searchPubmed(query: string, retmax = 12): Promise<string[]> {
  const url = new URL(`${EUTILS_BASE}/esearch.fcgi`);
  const p = authParams();
  p.set("db", "pubmed");
  p.set("term", query);
  p.set("retmode", "json");
  p.set("retmax", String(retmax));
  p.set("sort", "relevance");
  url.search = p.toString();

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`PubMed esearch failed: ${res.status}`);
  const json = (await res.json()) as { esearchresult?: { idlist?: string[] } };
  return json.esearchresult?.idlist ?? [];
}

export async function fetchPubmedDetails(pmids: string[]): Promise<PubmedHit[]> {
  if (pmids.length === 0) return [];
  const url = new URL(`${EUTILS_BASE}/efetch.fcgi`);
  const p = authParams();
  p.set("db", "pubmed");
  p.set("id", pmids.join(","));
  p.set("retmode", "xml");
  url.search = p.toString();

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`PubMed efetch failed: ${res.status}`);
  const xml = await res.text();
  return parsePubmedXml(xml);
}

/**
 * Lightweight, dependency-free XML parser for PubMed efetch output.
 * Robust against missing nodes; extracts only what we need.
 */
function parsePubmedXml(xml: string): PubmedHit[] {
  const articles = splitByTag(xml, "PubmedArticle");
  const out: PubmedHit[] = [];
  for (const block of articles) {
    const pmid = textOf(block, "PMID") ?? "";
    if (!pmid) continue;
    const title = stripHtml(textOf(block, "ArticleTitle") ?? "");
    const absParts = matchAll(block, /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g).map((m) =>
      stripHtml(m[1])
    );
    const abstract = absParts.join("\n\n").trim();
    const journal = stripHtml(textOf(block, "Title") ?? "") || null;
    const year = Number(textOf(block, "Year") ?? "") || null;
    const doi =
      (block.match(
        /<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/
      ) ?? [])[1]?.trim() || null;
    const authors = matchAll(
      block,
      /<Author[^>]*>[\s\S]*?<LastName>([\s\S]*?)<\/LastName>[\s\S]*?<\/Author>/g
    )
      .map((m) => stripHtml(m[1]))
      .slice(0, 6);
    const pubTypes = matchAll(block, /<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/g).map(
      (m) => stripHtml(m[1])
    );
    const mesh = matchAll(block, /<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/g)
      .map((m) => stripHtml(m[1]))
      .slice(0, 12);

    out.push({
      pmid,
      title,
      abstract,
      authors,
      journal,
      year,
      doi,
      pubTypes,
      mesh,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    });
  }
  return out;
}

function splitByTag(xml: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, "g");
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[0]);
  return out;
}

function textOf(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = xml.match(re);
  return m ? stripHtml(m[1]).trim() : null;
}

function matchAll(input: string, re: RegExp): RegExpExecArray[] {
  const out: RegExpExecArray[] = [];
  let m;
  while ((m = re.exec(input)) !== null) out.push(m);
  return out;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchAndFetch(query: string, retmax = 10): Promise<PubmedHit[]> {
  const ids = await searchPubmed(query, retmax);
  if (ids.length === 0) return [];
  return fetchPubmedDetails(ids);
}
