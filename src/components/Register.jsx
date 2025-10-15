import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../style.css";

export default function Register({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, apellidos } },
    });
    if (error) alert("Error al registrarse");
    else alert("Cuenta creada correctamente, inicia sesión");
  };

  return (
    <div className="auth-container">
      <h2>📝 Crear cuenta en BancoÁgil</h2>
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <input
        type="text"
        placeholder="Apellidos"
        value={apellidos}
        onChange={(e) => setApellidos(e.target.value)}
      />
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
      <button onClick={handleRegister}>Registrarse</button>
      <p>
        ¿Ya tienes una cuenta?{" "}
        <span className="link" onClick={onSwitch}>
          Inicia sesión
        </span>
      </p>
    </div>
  );
}
