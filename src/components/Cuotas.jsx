import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Swal from "sweetalert2";

export default function Cuotas({ deudaId, estado }) {
  const [cuotas, setCuotas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarCuotas();
  }, [deudaId]);

  const cargarCuotas = async () => {
    const { data, error } = await supabase
      .from("cuotas")
      .select("*")
      .eq("deuda_id", deudaId)
      .order("numero_cuota", { ascending: true });

    if (!error) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const cuotasActualizadas = data.map((c) => {
        const fechaPago = new Date(c.fecha_pago);
        fechaPago.setHours(0, 0, 0, 0);
        const vencida = fechaPago < hoy && !c.pagada;
        return {
          ...c,
          vencida,
          mora_aplicada: vencida
            ? (parseFloat(c.monto_cuota) * (c.mora / 100)).toFixed(2)
            : "0.00",
        };
      });
      setCuotas(cuotasActualizadas);
    }
    setCargando(false);
  };

  const marcarPagada = async (id, pagada) => {
    const nuevoEstado = !pagada;
    await supabase.from("cuotas").update({ pagada: nuevoEstado }).eq("id", id);

    Swal.fire({
      icon: "success",
      title: nuevoEstado ? "✅ Cuota pagada" : "↩ Cuota pendiente",
      text: nuevoEstado
        ? "Has marcado esta cuota como pagada."
        : "Has revertido el pago.",
      confirmButtonColor: "#1565c0",
    });

    cargarCuotas();
  };

  return (
  <div className="cuotas-container">
    {cargando ? (
      <p style={{ textAlign: "center" }}>Cargando cuotas...</p>
    ) : cuotas.length === 0 ? (
      <p style={{ textAlign: "center" }}>No hay cuotas registradas</p>
    ) : (
      <table className="cuotas-tabla">
        <thead>
          <tr>
            <th>Cuota</th>
            <th>Monto</th>
            <th>Fecha pago</th>
            <th>Mora</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((c) => (
            <tr key={c.id}>
              <td>{c.numero_cuota}</td>
              <td>
                S/{" "}
                {c.vencida
                  ? (
                      parseFloat(c.monto_cuota) + parseFloat(c.mora_aplicada)
                    ).toFixed(2)
                  : c.monto_cuota}
              </td>
              <td>{c.fecha_pago}</td>
              <td>{c.vencida ? `${c.mora}%` : "0%"}</td>
              <td>
                <button
                  className={c.pagada ? "btn-pagado" : "btn-pendiente"}
                  onClick={() => marcarPagada(c.id, c.pagada)}
                >
                  {c.pagada ? "Pagada" : "Pendiente"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

}
