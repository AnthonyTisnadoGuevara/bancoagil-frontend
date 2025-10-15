import React, { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Deudas from "./components/Deudas";
import "./style.css";

export default function BancoAgil() {
  const [usuario, setUsuario] = useState(null);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUsuario(data.user);
    };
    cargarUsuario();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  if (!usuario) {
    return mostrarRegistro ? (
      <Register onSwitch={() => setMostrarRegistro(false)} />
    ) : (
      <Login onLogin={setUsuario} onSwitch={() => setMostrarRegistro(true)} />
    );
  }

  return (
    <div className="app-container">
      <div className="dashboard-container">
        <header className="header">
          <h1 className="logo">💰 BancoÁgil</h1>
          <div className="user-info">
            <p>
              Bienvenido, <span>{usuario.email}</span>
            </p>
            <button className="logout-btn" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <Dashboard usuario={usuario} />
        <Deudas usuario={usuario} />

        <footer className="footer">
          © {new Date().getFullYear()} BancoÁgil — Desarrollado por{" "}
          <span>TEAM-AGIL</span> 💻
        </footer>
      </div>
    </div>
  );
}
