import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../style.css";

export default function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert("Error al iniciar sesión");
    else onLogin(data.user);
  };

  return (
    <div className="auth-container">
      <h2>💰 BancoÁgil</h2>
      <p className="auth-subtitle">Inicia sesión en tu cuenta</p>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Iniciar sesión</button>
      <p>
        ¿No tienes cuenta?{" "}
        <span className="link" onClick={onSwitch}>
          Regístrate aquí
        </span>
      </p>
    </div>
  );
}
