"use client";

import { FormEvent, useState } from "react";

export default function AuthForm() {
  const [nid, setNid] = useState("1987654321098");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nid, password })
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Something went wrong.");
        return;
      }
      window.location.reload();
    } catch {
      setMessage("The demo server is unavailable. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="intro">
        <span className="eyebrow">DIGITAL CITIZEN SERVICES</span>
        <h1>Your identity,<br /><em>securely connected.</em></h1>
        <p>Access essential services with one trusted National ID account.</p>
        <div className="trust-row"><span>●</span> Synthetic demo data only — no real records are collected</div>
      </section>
      <section className="auth-card">
        <div className="brand-mark">N<span>ID</span></div>
        <h2>Welcome to the demo</h2>
        <p className="muted">Sign in to the synthetic citizen portal.</p>
        <form onSubmit={submit}>
          <label>National ID number<input value={nid} onChange={(e) => setNid(e.target.value.replace(/\D/g, "").slice(0, 20))} placeholder="13-digit NID number" inputMode="numeric" minLength={10} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required /></label>
          {message && <p className="error">{message}</p>}
          <button className="primary" disabled={loading}>{loading ? "Please wait..." : "Sign in to demo  →"}</button>
        </form>
        <p className="demo-hint">Demo: <strong>1987654321098</strong> / <strong>Demo@1234</strong></p>
        <p className="rulebook-note">Synthetic data only. Do not enter a real person&apos;s NID, name, address, or land information.</p>
      </section>
    </main>
  );
}
