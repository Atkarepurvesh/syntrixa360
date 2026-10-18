import { describe, expect, it } from "vitest";

import { ApiError } from "@/types/api/common";

import {
  DraftSaver,
  type DraftSaveState,
  type SaveFn,
} from "../draft-autosave";

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>(
    (res, rej) => ((resolve = res), (reject = rej)),
  );
  return { promise, resolve, reject };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const conflict = () =>
  new ApiError({
    status: 409,
    code: "conflict",
    kind: "conflict",
    message: "stale",
  });

function harness(save: SaveFn) {
  const states: DraftSaveState[] = [];
  const saver = new DraftSaver(
    save,
    (s) => states.push(s),
    () => 123,
  );
  return { saver, states, last: () => states[states.length - 1]! };
}

describe("DraftSaver", () => {
  it("sends the previous revision as baseRevision and ends 'saved'", async () => {
    const calls: Array<[string, unknown, number | undefined]> = [];
    let rev = 0;
    const { saver, last } = harness(
      async (s, d, base) => (calls.push([s, d, base]), { revision: ++rev }),
    );
    saver.enqueue("business_address", { city: "A" });
    await saver.flush();
    saver.enqueue("business_address", { city: "B" });
    await saver.flush();
    expect(calls.map((c) => c[2])).toEqual([undefined, 1]);
    expect(last()).toEqual({ status: "saved", savedAt: 123 });
  });

  it("never has two requests in flight for a section and coalesces to the LATEST value (no stale overwrite)", async () => {
    const gates = [
      deferred<{ revision: number }>(),
      deferred<{ revision: number }>(),
    ];
    const sent: unknown[] = [];
    let inflight = 0;
    let maxInflight = 0;
    const { saver } = harness(async (_s, d) => {
      sent.push(d);
      inflight++;
      maxInflight = Math.max(maxInflight, inflight);
      try {
        return await gates[sent.length - 1]!.promise;
      } finally {
        inflight--;
      }
    });
    saver.enqueue("s", { v: 1 });
    await tick();
    saver.enqueue("s", { v: 2 }); // typed while v1 is in flight
    saver.enqueue("s", { v: 3 }); // supersedes v2 before it was ever sent
    gates[0]!.resolve({ revision: 1 });
    await tick();
    gates[1]!.resolve({ revision: 2 });
    await saver.flush();
    expect(sent).toEqual([{ v: 1 }, { v: 3 }]);
    expect(maxInflight).toBe(1);
  });

  it("a 409 stops writing, reports conflict and does not retry or overwrite", async () => {
    let calls = 0;
    const { saver, last } = harness(async () => {
      calls++;
      throw conflict();
    });
    saver.enqueue("s", { v: 1 });
    expect(await saver.flush()).toBe(false);
    saver.enqueue("s", { v: 2 }); // ignored until the user reloads
    await saver.flush();
    expect(calls).toBe(1);
    expect(last().status).toBe("conflict");
  });

  it("a network failure is shown as an error (never 'saved') and retry re-sends the newest value", async () => {
    let fail = true;
    const sent: unknown[] = [];
    const { saver, last } = harness(async (_s, d) => {
      sent.push(d);
      if (fail)
        throw new ApiError({
          status: 0,
          code: "network",
          kind: "network",
          message: "offline",
        });
      return { revision: 1 };
    });
    saver.enqueue("s", { v: 1 });
    expect(await saver.flush()).toBe(false);
    expect(last().status).toBe("error");
    fail = false;
    saver.retry();
    expect(await saver.flush()).toBe(true);
    expect(sent).toEqual([{ v: 1 }, { v: 1 }]);
    expect(last().status).toBe("saved");
  });

  it("an expired session is reported as such", async () => {
    const { saver, last } = harness(async () => {
      throw new ApiError({
        status: 401,
        code: "unauthorized",
        kind: "unauthorized",
        message: "x",
      });
    });
    saver.enqueue("s", {});
    await saver.flush();
    expect(last()).toMatchObject({
      status: "error",
      message: expect.stringContaining("session expired"),
    });
  });

  it("quiesce drops unsent edits and waits for the in-flight request (so a real save cannot be overtaken)", async () => {
    const gate = deferred<{ revision: number }>();
    const sent: unknown[] = [];
    const { saver } = harness(async (_s, d) => (sent.push(d), gate.promise));
    saver.enqueue("s", { v: 1 });
    await tick();
    saver.enqueue("s", { v: 2 });
    let done = false;
    const q = saver.quiesce().then(() => (done = true));
    await tick();
    expect(done).toBe(false); // still waiting for v1
    gate.resolve({ revision: 1 });
    await q;
    expect(sent).toEqual([{ v: 1 }]); // v2 was dropped, not sent after the real save
  });

  it("reset() forgets revisions: the next draft after a real save is a fresh write", async () => {
    const bases: Array<number | undefined> = [];
    const { saver } = harness(
      async (_s, _d, base) => (bases.push(base), { revision: 5 }),
    );
    saver.enqueue("s", { v: 1 });
    await saver.flush();
    saver.reset();
    saver.enqueue("s", { v: 2 });
    await saver.flush();
    expect(bases).toEqual([undefined, undefined]);
  });

  it("a response that lands after reset() cannot restore a stale revision", async () => {
    const gate = deferred<{ revision: number }>();
    const bases: Array<number | undefined> = [];
    const { saver } = harness(async (_s, _d, base) => {
      bases.push(base);
      return bases.length === 1 ? gate.promise : { revision: 1 };
    });
    saver.enqueue("s", { v: 1 });
    await tick();
    saver.reset();
    gate.resolve({ revision: 9 });
    await saver.flush();
    saver.enqueue("s", { v: 2 });
    await saver.flush();
    expect(bases).toEqual([undefined, undefined]);
  });
});
