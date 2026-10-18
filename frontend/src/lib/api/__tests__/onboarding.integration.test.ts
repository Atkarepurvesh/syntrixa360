// REAL end-to-end test of the onboarding frontend layer (API client + mapper + flow) against a RUNNING backend.
// Skipped unless INTEGRATION_API_URL is set (BACKEND_LOG = backend console log, used to read the verification link):
//   VITE_API_URL=http://localhost:8000/api/v1 INTEGRATION_API_URL=http://localhost:8000/api/v1 BACKEND_LOG=/tmp/uvicorn.log npx vitest run
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const URL_ = process.env["INTEGRATION_API_URL"];
const LOG = process.env["BACKEND_LOG"] ?? "";
const run = URL_ ? describe : describe.skip;

/**
 * Verification token mailed to `email`, read from the backend's console log (EMAIL_BACKEND=console).
 * The e-mail is written by a background task AFTER the register response, so poll for THIS address instead of
 * taking "the last link in the log" (which raced and could return the previous user's already-used token).
 */
async function verifyTokenFor(email: string): Promise<string> {
  const needle = `to='${email.toLowerCase()}'`;
  for (let i = 0; i < 40; i++) {
    const chunks = readFileSync(LOG, "utf8").split("email_console");
    for (let c = chunks.length - 1; c >= 0; c--) {
      const chunk = chunks[c] ?? "";
      if (!chunk.includes(needle)) continue;
      const m = chunk.match(/verify-email\?token=([\w-]+)/);
      if (m?.[1]) return m[1];
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`no verify-email link for ${email} in backend log`);
}

const rnd = () => Math.random().toString(36).slice(2, 8);
const phone = () => `+9198${Math.floor(10000000 + Math.random() * 89999999)}`;
const password = "Str0ng!Pass#1";

run("onboarding frontend layer against the real backend", () => {
  let client: typeof import("../client");
  let auth: typeof import("../auth");
  let api: typeof import("../onboarding").onboardingApi;
  let flow: typeof import("@/lib/onboarding-flow");
  let defaults: typeof import("@/lib/onboarding-schema").businessSetupDefaults;
  let postLoginPath: typeof import("@/lib/post-login-route").postLoginPath;

  type V = import("@/lib/onboarding-schema").BusinessSetupValues;
  const values = (over: Partial<V> = {}): V => ({
    ...defaults,
    companyName: "Sharma Herbal Exports",
    businessType: "exporter",
    industry: "ayurvedic_herbal",
    businessModel: ["b2b", "export"],
    turnoverRange: "1cr_5cr",
    employeeCountRange: "11-25",
    gstin: "27AAPFU0939F1ZV",
    state: "Uttar Pradesh",
    city: "Orai",
    addressLine1: "12 Mandi Road",
    postalCode: "285001",
    website: "sharma-herbal.example.com",
    businessEmail: "sales@sharma-herbal.example.com",
    businessPhone: "+91 98765 43210",
    primarySalesMarket: "both",
    salesRegions: ["india", "middle_east"],
    productCategories: ["ayurvedic", "herbal", "custom"],
    customCategory: "Dry Fruits",
    ...over,
  });

  async function newUser() {
    const email = `ob_${rnd()}@example.com`;
    await auth.register({
      fullName: "Onboarding Tester",
      email,
      phone: phone(),
      password,
    });
    // Backend policy: only a verified mailbox may create an organization.
    await auth.verifyEmail(await verifyTokenFor(email));
    await auth.login(email, password);
    client.setApiOrganizationId(null);
    return email;
  }

  it("loads modules", async () => {
    client = await import("../client");
    auth = await import("../auth");
    api = (await import("../onboarding")).onboardingApi;
    flow = await import("@/lib/onboarding-flow");
    defaults = (await import("@/lib/onboarding-schema")).businessSetupDefaults;
    postLoginPath = (await import("@/lib/post-login-route")).postLoginPath;
  });

  let orgId = "";
  let ownerEmail = "";

  it("a brand-new user has no organization and is sent to the app/wizard correctly", async () => {
    ownerEmail = await newUser();
    const me = await auth.getCurrentUser();
    expect(me.organizations).toEqual([]);
  });

  it("step 1 creates the organization; /auth/me then reports it as onboarding -> wizard", async () => {
    const id = await flow.saveStep("business", values(), null);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    orgId = id!;
    client.setApiOrganizationId(orgId);
    const me = await auth.getCurrentUser();
    expect(me.organizations[0]).toMatchObject({
      organizationId: orgId,
      organizationStatus: "onboarding",
      role: "OWNER",
    });
    expect(postLoginPath(me)).toBe("/onboarding/business");
  });

  it("double submit of step 1 never creates a second organization", async () => {
    const [a, b] = await Promise.all([
      flow.saveStep("business", values(), null),
      flow.saveStep("business", values(), null),
    ]);
    expect(a).toBe(orgId);
    expect(b).toBe(orgId);
  });

  it("server-side validation errors come back mapped to form fields", async () => {
    client.setApiOrganizationId(orgId);
    const err = await flow
      .saveStep("location", values({ postalCode: "12" }), orgId)
      .catch((e: unknown) => e);
    const d = flow.describeError(err);
    expect(d.fields.postalCode).toBeTruthy();
  });

  it("activation before every section is saved -> 409 with the remaining sections, nothing created", async () => {
    const err = await flow.activateWorkspace().catch((e: unknown) => e);
    const d = flow.describeError(err);
    expect(d.remainingSteps).toContain("business_contact");
    expect((await api.getActivation()).trial).toBeNull();
  });

  it("unsaved values survive as drafts and come back on resume (refresh)", async () => {
    const { DraftSaver } = await import("../../draft-autosave");
    const saver = new DraftSaver(flow.saveDraftRequest, () => {});
    flow.queueDrafts(
      saver,
      "location",
      values({ city: "Jhansi-draft" }),
      orgId,
    );
    expect(await saver.flush()).toBe(true); // server confirmed the draft
    const resumed = await flow.resumeOnboarding(orgId);
    expect(resumed.restoredDraft).toBe(true);
    expect(resumed.values.city).toBe("Jhansi-draft"); // the draft wins over the (not yet saved) address
    expect(resumed.values.companyName).toBe("Sharma Herbal Exports"); // saved section restored too
    expect(resumed.step).toBe("tax"); // first unfinished section after business_profile
  });

  it("all seven sections save through the wizard steps and read back identically", async () => {
    for (const step of [
      "tax",
      "company",
      "location",
      "configuration",
    ] as const) {
      await flow.saveStep(step, values(), orgId);
    }
    const resumed = await flow.resumeOnboarding(orgId);
    expect(resumed.step).toBe("review");
    expect(resumed.progress.completionPercentage).toBe(100);
    expect(resumed.restoredDraft).toBe(false); // saving a section removed its draft
    expect(resumed.values).toMatchObject({
      companyName: "Sharma Herbal Exports",
      turnoverRange: "1cr_5cr",
      gstin: "27AAPFU0939F1ZV",
      city: "Orai",
      postalCode: "285001",
      businessEmail: "sales@sharma-herbal.example.com",
      primarySalesMarket: "both",
      website: "https://sharma-herbal.example.com",
      customCategory: "Dry Fruits",
    });
    expect(resumed.values.salesRegions).toEqual(["india", "middle_east"]);
    expect([...(resumed.values.productCategories ?? [])].sort()).toEqual([
      "ayurvedic",
      "custom",
      "herbal",
    ]);
    expect(resumed.values.businessHours?.sunday?.open).toBe(false);
  });

  it("GST: with no provider configured the result is `not_configured` and NOTHING is marked verified", async () => {
    const r = await api.verifyGst();
    expect(r.state).toBe("not_configured");
    expect(r.taxProfile.gstVerificationStatus).toBe("not_verified");
    expect(r.taxProfile.gstVerifiedAt).toBeNull();
    const resumed = await flow.resumeOnboarding(orgId);
    expect(resumed.values.gstStatus).toBe("pending");
  });

  it("another user cannot read or activate this organization (tenant isolation)", async () => {
    await newUser();
    client.setApiOrganizationId(orgId); // forged header
    await expect(api.getSummary()).rejects.toMatchObject({ status: 403 });
    await expect(api.activate()).rejects.toMatchObject({ status: 403 });
    await expect(api.listDrafts()).rejects.toMatchObject({ status: 403 });
    client.setApiOrganizationId(null);
  });

  it("activation: workspace + trial exist, repeat is a no-op, the user lands on /app", async () => {
    await auth.login(ownerEmail, password); // back to the owner
    client.setApiOrganizationId(orgId);

    const first = await flow.activateWorkspace();
    expect(first.alreadyActive).toBe(false);
    expect(first.organization.status).toBe("active");
    expect(first.workspaceStatus).toBe("active");
    expect(first.progress).toMatchObject({
      status: "completed",
      currentStep: "completed",
      completionPercentage: 100,
    });
    expect(first.trial).toMatchObject({
      planCode: "trial",
      status: "trialing",
    });
    const days =
      (Date.parse(first.trial!.trialEndsAt!) -
        Date.parse(first.trial!.trialStartedAt!)) /
      86_400_000;
    expect(days).toBe(14);

    const [again, third] = await Promise.all([
      flow.activateWorkspace(),
      flow.activateWorkspace(),
    ]);
    expect(again.alreadyActive && third.alreadyActive).toBe(true);
    expect(again.trial!.trialStartedAt).toBe(first.trial!.trialStartedAt);

    const me = await auth.getCurrentUser();
    expect(me.organizations[0]).toMatchObject({ organizationStatus: "active" });
    expect(postLoginPath(me)).toBe("/app");
    expect((await api.getStatus()).status).toBe("completed");
  });

  it("editing after activation keeps onboarding completed", async () => {
    await flow.saveStep("location", values({ city: "Kanpur" }), orgId);
    expect((await api.getStatus()).status).toBe("completed");
  });
});
