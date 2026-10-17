export type MutationStatus = "Not applied" | "In progress" | "Approved";

export type LandCaseInput = {
  buyer: string;
  seller: string;
  dagNo: string;
  csPlotNo: string;
  saPlotNo: string;
  rsPlotNo: string;
  bsPlotNo: string;
  khatianType: string;
  khatianNo: string;
  mouza: string;
  landArea: string;
  executionDate: string;
  registrationDate: string;
  mutationApplicationDate: string;
  mutationApprovalDate: string;
  mutationStatus: MutationStatus;
  chainComplete: boolean;
  originalDocuments: boolean;
  duplicateCopyUsed: boolean;
  poaPresent: boolean;
  poaVerified: boolean;
  recentTaxReceipt: boolean;
  cleanRegistrySearch: boolean;
  quickPaymentPressure: boolean;
  spellingVariation: boolean;
};

export type FraudReport = {
  summary: string;
  chain_of_title_status: "Valid" | "Incomplete" | "Broken";
  double_selling_risk_level: "High" | "Medium" | "Low";
  identified_loopholes_and_flags: string[];
  recommended_verification_steps: string[];
};

function daysBetween(from: string, to: string) {
  if (!from || !to) return null;
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.floor((end - start) / 86400000);
}

export function analyzeLandCase(input: LandCaseInput): FraudReport {
  const flags: string[] = [];
  const steps: string[] = [];
  const registrationToMutation = daysBetween(
    input.registrationDate,
    input.mutationApprovalDate || input.mutationApplicationDate
  );
  const staleUnmutated =
    input.mutationStatus === "Not applied" &&
    input.registrationDate &&
    Date.now() - new Date(`${input.registrationDate}T00:00:00`).getTime() > 183 * 86400000;
  const plotNumbers = [input.csPlotNo, input.saPlotNo, input.rsPlotNo, input.bsPlotNo].filter(Boolean);
  const plotMismatch = new Set(plotNumbers).size > 1;

  if (!input.buyer || !input.seller || !input.dagNo || !input.khatianNo || !input.mouza || !input.landArea) {
    flags.push("Core parcel attributes are incomplete; buyer, seller, Dag, Khatian, Mouza, and area must be verified.");
    steps.push("Collect and cross-check the buyer, seller, Dag, Khatian, Mouza, area, boundaries, and all deed dates.");
  }
  if (staleUnmutated) {
    flags.push("High-risk double-selling window: the deed was registered more than six months ago and mutation has not been applied.");
    steps.push("Confirm mutation application and approval directly with the AC Land office before payment or possession.");
  } else if (input.mutationStatus === "In progress") {
    flags.push("Mutation is still in progress; the current seller may retain apparent control in older land records.");
    steps.push("Obtain the mutation case number, application date, hearing status, and written AC Land office confirmation.");
  }
  if (registrationToMutation !== null && registrationToMutation > 183) {
    flags.push(`The registration-to-mutation interval is ${registrationToMutation} days, exceeding the six-month review threshold.`);
  }
  if (plotMismatch) {
    flags.push("CS/SA/RS/BS plot numbers do not match; this may indicate a survey conversion issue or an ownership-record break.");
    steps.push("Obtain certified CS, SA, RS, and BS maps and have a licensed surveyor reconcile every plot-number conversion.");
  }
  if (!input.chainComplete) {
    flags.push("One or more intermediate transfer deeds are missing, so the chain from CS to the current seller is not proven.");
    steps.push("Obtain every intermediate transfer deed and certified Sub-Registry search copies before relying on the seller's title.");
  }
  if (!input.originalDocuments) {
    flags.push("Original deeds or original supporting records were not verified.");
    steps.push("Inspect originals at the issuing Sub-Registry office and compare deed numbers, seals, signatures, pages, and registration books.");
  }
  if (input.duplicateCopyUsed) {
    flags.push("Duplicate or repeated certified-copy usage was reported; document provenance requires enhanced verification.");
    steps.push("Verify why each certified copy was issued and rule out a prior sale, mortgage, cancellation, or altered copy.");
  }
  if (input.poaPresent && !input.poaVerified) {
    flags.push("Power of Attorney is present but unverified.");
    steps.push("Verify PoA registration, scope, validity, revocation status, principal identity, and authority to sell this exact parcel.");
  }
  if (!input.recentTaxReceipt) {
    flags.push("Recent land-tax (Khajna) receipt was not provided.");
    steps.push("Check recent Khajna receipts and reconcile payer, Khatian, Dag, Mouza, and area against the proposed deed.");
  }
  if (input.quickPaymentPressure) {
    flags.push("Pressure to complete payment quickly is a transaction red flag.");
    steps.push("Do not release funds until registry, mutation, litigation, tax, possession, and title-chain checks are complete.");
  }
  if (input.spellingVariation) flags.push("Minor name spelling variation exists across records and requires identity reconciliation.");
  if (!input.cleanRegistrySearch) {
    flags.push("A clean Sub-Registry search index has not been established.");
    steps.push("Search for prior, later, cancelled, mortgaged, and overlapping deeds for the same Dag, Khatian, Mouza, area, and boundaries.");
  }

  const hasCoreChainData = plotNumbers.length > 0 && Boolean(input.khatianNo);
  const chainStatus = plotMismatch ? "Broken" : !input.chainComplete || !hasCoreChainData ? "Incomplete" : "Valid";
  const highRisk = staleUnmutated || plotMismatch || !input.chainComplete || (input.poaPresent && !input.poaVerified) || input.quickPaymentPressure;
  const mediumRisk = input.mutationStatus === "In progress" || !input.recentTaxReceipt || input.spellingVariation || !input.cleanRegistrySearch;
  const risk = highRisk ? "High" : mediumRisk ? "Medium" : "Low";

  if (!steps.length) {
    steps.push("Confirm the latest BS Khatian, original deeds, clean Sub-Registry search, mutation, tax receipts, possession, and pending-case status in person.");
  }

  const parcel = [input.dagNo && `Dag ${input.dagNo}`, input.khatianNo && `${input.khatianType || "Khatian"} ${input.khatianNo}`, input.mouza && `Mouza ${input.mouza}`, input.landArea && `${input.landArea} area`].filter(Boolean).join(", ");
  return {
    summary: `${parcel || "The submitted land parcel"} is proposed for transfer from ${input.seller || "the stated seller"} to ${input.buyer || "the stated buyer"}. Mutation status: ${input.mutationStatus}. ${registrationToMutation === null ? "The registration-to-mutation interval could not be calculated from the supplied dates." : `Registration-to-mutation interval: ${registrationToMutation} days.`}`,
    chain_of_title_status: chainStatus,
    double_selling_risk_level: risk,
    identified_loopholes_and_flags: flags.length ? flags : ["No rule-based red flags were identified from the supplied synthetic data; independent official verification remains necessary."],
    recommended_verification_steps: steps
  };
}
