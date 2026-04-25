const OT_GQL = "https://api.platform.opentargets.org/api/v4/graphql";

export interface OpenTargetsAssociation {
  ensemblId: string;
  approvedSymbol: string;
  approvedName: string;
  topDiseases: { name: string; score: number; therapeuticAreas: string[] }[];
  url: string;
}

const SEARCH_QUERY = /* GraphQL */ `
  query Search($q: String!) {
    search(queryString: $q, entityNames: ["target"], page: { index: 0, size: 5 }) {
      hits {
        id
        name
        entity
      }
    }
  }
`;

const TARGET_DETAIL = /* GraphQL */ `
  query TargetDetail($ensemblId: String!) {
    target(ensemblId: $ensemblId) {
      id
      approvedSymbol
      approvedName
      associatedDiseases(page: { index: 0, size: 6 }) {
        rows {
          score
          disease {
            name
            therapeuticAreas { name }
          }
        }
      }
    }
  }
`;

interface SearchResp {
  data?: { search?: { hits?: { id: string; name: string; entity: string }[] } };
}

interface DetailResp {
  data?: {
    target?: {
      id: string;
      approvedSymbol: string;
      approvedName: string;
      associatedDiseases?: {
        rows?: { score: number; disease: { name: string; therapeuticAreas?: { name: string }[] } }[];
      };
    };
  };
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(OT_GQL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OpenTargets ${res.status}`);
  return (await res.json()) as T;
}

export async function findAssociations(query: string): Promise<OpenTargetsAssociation[]> {
  const search = await gql<SearchResp>(SEARCH_QUERY, { q: query });
  const hits = (search.data?.search?.hits ?? []).filter((h) => h.entity === "target").slice(0, 3);
  if (hits.length === 0) return [];

  const out: OpenTargetsAssociation[] = [];
  for (const h of hits) {
    try {
      const detail = await gql<DetailResp>(TARGET_DETAIL, { ensemblId: h.id });
      const t = detail.data?.target;
      if (!t) continue;
      const rows = t.associatedDiseases?.rows ?? [];
      out.push({
        ensemblId: t.id,
        approvedSymbol: t.approvedSymbol,
        approvedName: t.approvedName,
        topDiseases: rows.map((r) => ({
          name: r.disease.name,
          score: r.score,
          therapeuticAreas: (r.disease.therapeuticAreas ?? []).map((a) => a.name),
        })),
        url: `https://platform.opentargets.org/target/${t.id}`,
      });
    } catch {
      // skip on failure for this target
    }
  }
  return out;
}
