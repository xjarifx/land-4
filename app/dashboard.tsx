"use client";

import { useState, type FormEvent } from "react";
import { analyzeLandCase, type FraudReport } from "@/lib/land-analyzer";
import { getAnalysisInput, lookupRegisteredDeed, type RegistryRecord } from "@/lib/registry-lookup";

export default function Dashboard({ name, nid }: { name: string; nid: string }) {
  const [deedNumber, setDeedNumber] = useState("");
  const [record, setRecord] = useState<RegistryRecord | null>(null);
  const [analysis, setAnalysis] = useState<FraudReport | null>(null);
  const [notFound, setNotFound] = useState(false);

  function checkDeed(event: FormEvent) {
    event.preventDefault();
    const result = lookupRegisteredDeed(deedNumber);
    setRecord(result);
    setAnalysis(result ? analyzeLandCase(getAnalysisInput(result)) : null);
    setNotFound(!result);
  }

  function logout() {
    fetch("/api/auth/logout", { method: "POST" }).then(() => window.location.reload());
  }

  return (
    <main className="lookup-shell">
      <header className="app-header">
        <div>
          <div className="brand-mark">N<span>ID</span> <small>LANDCHECK · DEMO</small></div>
          <p className="header-sub">Check a registered deed before you buy</p>
        </div>
        <div className="header-user"><span>{name} · {nid}</span><button onClick={logout}>Sign out</button></div>
      </header>
      <section className="lookup-hero">
        <span className="eyebrow">PRE-PURCHASE CHECK</span>
        <h1>One number.<br /><em>Clearer decisions.</em></h1>
        <p>Enter the registered deed number to check ownership, duplicate sales, and pending government paperwork.</p>
        <form className="deed-search" onSubmit={checkDeed}>
          <label>Registered deed / document number<input autoFocus value={deedNumber} onChange={(event) => setDeedNumber(event.target.value)} placeholder="e.g. DEMO-1001" required /></label>
          <button className="primary" type="submit">Check status →</button>
        </form>
        <div className="lookup-help">Synthetic demo numbers: <button onClick={() => setDeedNumber("DEMO-1001")}>DEMO-1001</button>, <button onClick={() => setDeedNumber("DEMO-2002")}>DEMO-2002</button>, or try an unknown number for HOLD.</div>
      </section>
      <section className="lookup-result">
        {record ? <RecordResult record={record} analysis={analysis} /> : notFound ? <NotFound deedNumber={deedNumber} /> : <EmptyResult />}
      </section>
      <div className="rulebook-note"><strong>Prototype safety:</strong> This demo uses synthetic records only. A real deployment must connect to authorized government sources and should never display real NID or land records without approval.</div>
    </main>
  );
}

function RecordResult({ record, analysis }: { record: RegistryRecord; analysis: FraudReport | null }) {
  const statusClass = record.status.toLowerCase();
  return <div className="result-card">
    <div className="result-head"><div><span className="eyebrow">STATUS CHECK · {record.deedNumber}</span><h2>{record.statusLabel}</h2></div><div className={`decision-badge ${statusClass}`}>{record.status}</div></div>
    <p className="result-summary">{record.summary}</p>
    <p className="result-disclaimer"><strong>Decision-support prototype:</strong> This is a rule-based result over synthetic data, not legal clearance or proof of ownership.</p>
    <div className="parcel-grid"><div><span>Recorded owner</span><strong>{record.owner}</strong></div><div><span>Deed registered</span><strong>{record.deedRegisteredOn}</strong></div><div><span>Dag</span><strong>{record.parcel.dag}</strong></div><div><span>Khatian</span><strong>{record.parcel.khatian}</strong></div><div><span>Mouza</span><strong>{record.parcel.mouza}</strong></div><div><span>Area</span><strong>{record.parcel.area}</strong></div></div>
    <div className="checks"><h3>Government and ownership checks</h3>{record.checks.map((check) => <div className="check-row" key={check.label}><span className={`check-status ${check.status}`} /> <div><strong>{check.label}</strong><p>{check.detail}</p></div></div>)}</div>
    {analysis && <AnalysisResult report={analysis} />}
    <div className="next-action"><strong>{record.status === "STOP" ? "Recommended action: STOP payment and investigate." : "Recommended action: Continue official verification before payment."}</strong><span>Verify the original deed, Sub-Registry index, AC Land mutation file, tax receipt, possession, and pending cases in person.</span></div>
  </div>;
}

function AnalysisResult({ report }: { report: FraudReport }) {
  return <div className="analysis-panel">
    <div className="analysis-heading"><div><span className="eyebrow">EXPLAINABLE RISK ANALYSIS</span><h3>Why this outcome?</h3></div><span className={`risk-pill ${report.double_selling_risk_level.toLowerCase()}`}>{report.double_selling_risk_level} RISK</span></div>
    <p>{report.summary}</p>
    <div className="analysis-metrics"><div><span>Chain of title</span><strong>{report.chain_of_title_status}</strong></div><div><span>Double-selling risk</span><strong>{report.double_selling_risk_level}</strong></div></div>
    <div className="analysis-columns"><div><h4>Flags</h4><ul>{report.identified_loopholes_and_flags.map((flag) => <li key={flag}>{flag}</li>)}</ul></div><div><h4>Verification steps</h4><ul>{report.recommended_verification_steps.map((step) => <li key={step}>{step}</li>)}</ul></div></div>
  </div>;
}

function NotFound({ deedNumber }: { deedNumber: string }) {
  return <div className="result-card not-found"><div className="empty-symbol">?</div><span className="eyebrow">NO MATCH FOUND</span><h2>HOLD — verify this deed manually.</h2><p>No synthetic registry record was found for <strong>{deedNumber.toUpperCase()}</strong>. This does not prove the deed is invalid. Do not pay until the Sub-Registry Office and AC Land Office confirm it.</p><div className="next-action"><strong>Recommended action: HOLD payment.</strong><span>Ask the seller for the original registered deed and obtain an official search report using the exact document number.</span></div></div>;
}

function EmptyResult() {
  return <div className="result-card empty-result"><div className="scan-icon">⌁</div><h2>Your status check<br />will appear here.</h2><p>Enter one registered deed number to begin.</p></div>;
}
