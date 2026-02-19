import React, { useState } from "react";
import { Api, setToken } from "../api";

export default function Login({ onAuthed }) {
  const [email, setEmail] = useState("admin@fms.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");

  async function register() {
    setError("");
    try {
      await Api.register(email, password);
      const r = await Api.login(email, password);
      setToken(r.token);
      onAuthed(r.token);
    } catch (e) {
      setError(e.message);
    }
  }

  async function login() {
    setError("");
    try {
      const r = await Api.login(email, password);
      setToken(r.token);
      onAuthed(r.token);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "system-ui" }}>
      <h2>Fleet FMS Login</h2>
      <p style={{ color: "#555" }}>Register once, then log in.</p>

      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10 }} />

      <label>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10 }} />

      {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={register} style={{ padding: "10px 14px" }}>Register</button>
        <button onClick={login} style={{ padding: "10px 14px" }}>Login</button>
      </div>
    </div>
  );
}
