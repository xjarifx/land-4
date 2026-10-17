export type LandRecordStatus = "clear" | "pending" | "warning" | "blocked";

export type RegistryRecord = {
  deedNumber: string;
  status: "CLEAR" | "HOLD" | "STOP";
  statusLabel: string;
  summary: string;
  parcel: {
    dag: string;
    khatian: string;
    mouza: string;
    area: string;
  };
  owner: string;
  deedRegisteredOn: string;
  checks: Array<{
    label: string;
    status: LandRecordStatus;
    detail: string;
  }>;
};

const records: Record<string, RegistryRecord> = {
  "DEMO-1001": {
    deedNumber: "DEMO-1001",
    status: "STOP",
    statusLabel: "Do not pay yet",
    summary: "A pending mutation and a later transfer record require official review before this land is purchased.",
    parcel: { dag: "245", khatian: "BS-512", mouza: "Demo Mouza", area: "12.50 decimal" },
    owner: "Demo Seller",
    deedRegisteredOn: "2024-02-01",
    checks: [
      { label: "Recorded owner", status: "warning", detail: "Demo Seller is the recorded seller in the latest supplied record." },
      { label: "Prior or duplicate sale", status: "blocked", detail: "A later transfer reference is associated with this parcel." },
      { label: "Mutation / Namjari", status: "pending", detail: "Mutation application is pending approval at the AC Land office." },
      { label: "Deed registration", status: "clear", detail: "Deed DEMO-1001 is present in the synthetic registry." },
      { label: "Mortgage or encumbrance", status: "clear", detail: "No synthetic mortgage record found." },
      { label: "Court case or dispute", status: "clear", detail: "No synthetic case record found." },
      { label: "Acquisition or khas status", status: "clear", detail: "No synthetic acquisition or khas flag found." },
      { label: "Land tax / Khajna", status: "warning", detail: "The latest tax receipt is not available in the synthetic record." }
    ]
  },
  "DEMO-2002": {
    deedNumber: "DEMO-2002",
    status: "CLEAR",
    statusLabel: "Ready for verification",
    summary: "No blocking government-status issue was found in the synthetic records. Complete physical and legal verification before payment.",
    parcel: { dag: "118", khatian: "BS-77", mouza: "Sample Mouza", area: "8.00 decimal" },
    owner: "Sample Seller",
    deedRegisteredOn: "2025-08-18",
    checks: [
      { label: "Recorded owner", status: "clear", detail: "Sample Seller matches the latest synthetic BS record." },
      { label: "Prior or duplicate sale", status: "clear", detail: "No later or duplicate transfer found." },
      { label: "Mutation / Namjari", status: "clear", detail: "Mutation is approved and linked to the deed." },
      { label: "Deed registration", status: "clear", detail: "Deed DEMO-2002 is present in the synthetic registry." },
      { label: "Mortgage or encumbrance", status: "clear", detail: "No synthetic mortgage record found." },
      { label: "Court case or dispute", status: "clear", detail: "No synthetic case record found." },
      { label: "Acquisition or khas status", status: "clear", detail: "No synthetic acquisition or khas flag found." },
      { label: "Land tax / Khajna", status: "clear", detail: "Recent synthetic tax receipt is available." }
    ]
  }
};

export function lookupRegisteredDeed(deedNumber: string): RegistryRecord | null {
  return records[deedNumber.trim().toUpperCase()] ?? null;
}
