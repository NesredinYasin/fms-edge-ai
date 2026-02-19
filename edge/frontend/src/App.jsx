import React, { useState } from "react";
import { getToken } from "./api";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [token, setTok] = useState(getToken());

  if (!token) return <Login onAuthed={(t) => setTok(t)} />;
  return <Dashboard onLogout={() => { localStorage.removeItem("token"); setTok(null); }} />;
}
