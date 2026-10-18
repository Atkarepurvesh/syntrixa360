// Ordered, observable server-draft autosave. Replaces fire-and-forget PUTs (unordered, errors swallowed, no UI state).
//
// Guarantees
//  * per section there is at most ONE request in flight; edits made meanwhile coalesce into the latest value, so
//    responses can never arrive out of order and an older value can never overwrite a newer one;
//  * every request carries the revision returned by the previous one (`baseRevision`); if another tab/device wrote
//    in between, the server answers 409 and we stop with state "conflict" instead of clobbering their work;
//  * failures are visible (state "error"), kept for retry, and never reported as saved;
//  * `quiesce()` lets a real section save run only after in-flight drafts have landed, so a late draft cannot
//    resurrect obsolete values after the server deleted the section's draft on the real save.
import { ApiError } from "@/types/api/common";

export type DraftSaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; savedAt: number }
  | { status: "error"; message: string }
  | { status: "conflict"; message: string };

export type SaveFn = (
  section: string,
  data: Record<string, unknown>,
  baseRevision: number | undefined,
) => Promise<{ revision: number }>;

export class DraftSaver {
  private revisions = new Map<string, number>();
  private pending = new Map<string, Record<string, unknown>>();
  private failed = new Map<string, Record<string, unknown>>();
  private conflicted = new Set<string>();
  private running = new Map<string, Promise<void>>();
  private epoch = 0;
  private state: DraftSaveState = { status: "idle" };

  constructor(
    private readonly save: SaveFn,
    private readonly onState: (s: DraftSaveState) => void,
    private readonly now: () => number = Date.now,
  ) {}

  /** Record the latest unsaved values of a section; they are sent as soon as the section is free. */
  enqueue(section: string, data: Record<string, unknown>): void {
    if (this.conflicted.has(section)) return; // resolve the conflict (reload) before writing again
    this.failed.delete(section);
    this.pending.set(section, data);
    this.emit({ status: "saving" });
    void this.kick(section);
  }

  /** Re-send whatever failed. */
  retry(): void {
    for (const [section, data] of this.failed) this.pending.set(section, data);
    this.failed.clear();
    if (this.pending.size) this.emit({ status: "saving" });
    for (const section of [...this.pending.keys()]) void this.kick(section);
  }

  /** Wait until nothing is in flight. Resolves true only if every draft is saved (no error, no conflict). */
  async flush(): Promise<boolean> {
    while (this.running.size > 0) await Promise.all([...this.running.values()]);
    return (
      this.failed.size === 0 &&
      this.conflicted.size === 0 &&
      this.pending.size === 0
    );
  }

  /** Drop unsent values and wait for in-flight requests: call BEFORE a real section save. */
  async quiesce(): Promise<void> {
    this.pending.clear();
    while (this.running.size > 0) await Promise.all([...this.running.values()]);
  }

  /** Forget all revisions/state: call AFTER a real save (the server deleted those drafts). */
  reset(): void {
    this.epoch++;
    this.revisions.clear();
    this.pending.clear();
    this.failed.clear();
    this.conflicted.clear();
    this.emit({ status: "idle" });
  }

  private emit(next: DraftSaveState): void {
    this.state = next;
    this.onState(next);
  }

  private kick(section: string): Promise<void> {
    const existing = this.running.get(section);
    if (existing) return existing; // the running loop will pick up the newer pending value
    const run = this.loop(section).finally(() => {
      this.running.delete(section);
      this.settleState();
    });
    this.running.set(section, run);
    return run;
  }

  private async loop(section: string): Promise<void> {
    while (this.pending.has(section)) {
      const data = this.pending.get(section)!;
      this.pending.delete(section);
      const epoch = this.epoch;
      try {
        const saved = await this.save(
          section,
          data,
          this.revisions.get(section),
        );
        if (epoch === this.epoch) this.revisions.set(section, saved.revision);
      } catch (e) {
        if (epoch !== this.epoch) return; // reset while in flight: outcome no longer relevant
        if (e instanceof ApiError && e.status === 409) {
          this.conflicted.add(section);
          this.pending.delete(section);
          this.emit({
            status: "conflict",
            message:
              "This section was changed elsewhere. Reload the page to continue.",
          });
        } else {
          this.failed.set(section, this.pending.get(section) ?? data); // newest value wins on retry
          this.pending.delete(section);
          this.emit({
            status: "error",
            message:
              e instanceof ApiError && e.kind === "unauthorized"
                ? "Your session expired. Sign in again to keep saving."
                : "Couldn't save your progress. Check your connection.",
          });
        }
        return;
      }
    }
  }

  private settleState(): void {
    if (this.running.size > 0 || this.pending.size > 0) return;
    if (this.conflicted.size > 0 || this.failed.size > 0) return; // keep the error visible
    if (this.state.status === "saving")
      this.emit({ status: "saved", savedAt: this.now() });
  }
}
