import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function Dashboard({ usuario }) {
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pagado: 0,
    pendiente: 0,
    cantidad: 0,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data, error } = await supabase
      .from("deudas")
      .select("monto, estado")
      .eq("usuario_id", usuario.id);

    if (error) return console.error(error);

    const total = data.reduce((acc, d) => acc + parseFloat(d.monto), 0);
    const pagado = data
      .filter((d) => d.estado === "pagado")
      .reduce((acc, d) => acc + parseFloat(d.monto), 0);
    const pendiente = total - pagado;

    setEstadisticas({
      total,
      pagado,
      pendiente,
      cantidad: data.length,
    });
  };

  return (
    <section className="panel-financiero">
      <h2>📊 Panel Financiero</h2>
      <div className="cards-container">
        <div className="card">
          <p>💼 Deudas totales</p>
          <h3>{estadisticas.cantidad}</h3>
        </div>
        <div className="card pendiente">
          <p>📉 Total pendiente</p>
          <h3>S/ {estadisticas.pendiente.toFixed(2)}</h3>
        </div>
        <div className="card pagado">
          <p>💰 Total pagado</p>
          <h3>S/ {estadisticas.pagado.toFixed(2)}</h3>
        </div>
        <div className="card total">
          <p>📘 Total</p>
          <h3>S/ {estadisticas.total.toFixed(2)}</h3>
        </div>
      </div>
    </section>
  );
}
