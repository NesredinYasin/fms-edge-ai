import React, { useEffect, useState } from "react";
import { Api } from "../api";

export default function Dashboard({ onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vehicle_code, setCode] = useState("V001");
  const [label, setLabel] = useState("Truck 1");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setError("");
      const [v, t, a] = await Promise.all([Api.vehicles(), Api.latestTelemetry(50), Api.latestAlerts(50)]);
      setVehicles(v);
      setTelemetry(t);
      setAlerts(a);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function addVehicle() {
    try {
      setError("");
      await Api.addVehicle(vehicle_code, label);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Fleet Dashboard</h2>
        <button onClick={onLogout}>Logout</button>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, alignItems: "end", marginBottom: 20 }}>
        <div>
          <div>Vehicle Code</div>
          <input value={vehicle_code} onChange={(e) => setCode(e.target.value)} style={{ padding: 8 }} />
        </div>
        <div>
          <div>Label</div>
          <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ padding: 8 }} />
        </div>
        <button onClick={addVehicle} style={{ padding: "10px 14px" }}>Add Vehicle</button>
        <button onClick={refresh} style={{ padding: "10px 14px" }}>Refresh</button>
      </div>

      <h3>Vehicles</h3>
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Code</th><th>Label</th><th>Created</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(v => (
            <tr key={v.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{v.vehicle_code}</td>
              <td>{v.label}</td>
              <td>{new Date(v.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Latest Telemetry</h3>
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Time</th><th>Vehicle</th><th>Speed</th><th>Fuel</th><th>Temp</th><th>Lat</th><th>Lon</th>
          </tr>
        </thead>
        <tbody>
          {telemetry.map(t => (
            <tr key={t.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{new Date(t.ts).toLocaleString()}</td>
              <td>{t.vehicle_code}</td>
              <td>{t.speed_kmh ?? "-"}</td>
              <td>{t.fuel_rate ?? "-"}</td>
              <td>{t.engine_temp ?? "-"}</td>
              <td>{t.lat ?? "-"}</td>
              <td>{t.lon ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Latest Alerts</h3>
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Time</th><th>Vehicle</th><th>Type</th><th>Severity</th><th>Message</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map(a => (
            <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{new Date(a.ts).toLocaleString()}</td>
              <td>{a.vehicle_code}</td>
              <td>{a.type}</td>
              <td>{a.severity}</td>
              <td>{a.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
