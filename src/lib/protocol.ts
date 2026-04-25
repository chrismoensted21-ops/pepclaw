/**
 * Pepclaw cryptographic commit/reveal protocol.
 *
 * Before a mission runs, the orchestrator commits to the user's query + target
 * by hashing it with a per-mission salt. The hash is stored on the mission row.
 * After the mission completes, the salt is revealed so anyone can re-hash and
 * verify Pepclaw did not change the question post-hoc.
 *
 * This is the same falsifiability primitive described in the Autonomous Thesis Loop:
 * tamper-evident, replayable, economically accountable.
 */
import crypto from "node:crypto";

export interface CommitResult {
  hash: string;
  salt: string;
  commitMessage: string;
}

export function commit(query: string, targetClass: string | null): CommitResult {
  const salt = crypto.randomBytes(16).toString("hex");
  const commitMessage = JSON.stringify({
    query: query.trim(),
    target_class: targetClass?.trim() ?? null,
    schema: "pepclaw.commit.v1",
    salt,
  });
  const hash = crypto.createHash("sha256").update(commitMessage).digest("hex");
  return { hash, salt, commitMessage };
}

export function verify(query: string, targetClass: string | null, salt: string, hash: string): boolean {
  const commitMessage = JSON.stringify({
    query: query.trim(),
    target_class: targetClass?.trim() ?? null,
    schema: "pepclaw.commit.v1",
    salt,
  });
  const recomputed = crypto.createHash("sha256").update(commitMessage).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(recomputed), Buffer.from(hash));
}
