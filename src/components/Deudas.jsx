import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Cuotas from "./Cuotas";
import Swal from "sweetalert2";

export default function Deudas({ usuario }) {
  const [deudas, setDeudas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [bancoSeleccionado, setBancoSeleccionado] = useState("");
  const [nuevoBanco, setNuevoBanco] = useState("");
  const [tasaMora, setTasaMora] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [cuotas, setCuotas] = useState("");
  const [mostrarCuotas, setMostrarCuotas] = useState({});
  const [vista, setVista] = useState("pendientes");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarBancos();
    cargarDeudas();
  }, [vista]);

  const cargarBancos = async () => {
    const { data } = await supabase.from("bancos").select("*");
    setBancos(data || []);
  };

  const cargarDeudas = async () => {
  setCargando(true);
  const { data, error } = await supabase
    .from("deudas")
    .select("*")
    .eq("usuario_id", usuario.id)
    .eq("estado", vista === "pendientes" ? "pendiente" : "pagado")
    .order("fecha_vencimiento", { ascending: true });

  if (!error) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const deudasConMora = data.map((d) => {
      const fechaV = new Date(d.fecha_vencimiento);
      fechaV.setHours(0, 0, 0, 0);

      // ✅ Aplica mora SOLO si la fecha de vencimiento ya pasó (menor que hoy)
      const vencida = fechaV.getTime() < hoy.getTime();

      return { ...d, tiene_mora: vencida && d.estado === "pendiente" };
    });
    setDeudas(deudasConMora);
  }
  setCargando(false);
};
  const registrarDeuda = async () => {
    if (!bancoSeleccionado || !monto || !fecha)
      return Swal.fire({
        icon: "warning",
        title: "Campos incompletos ⚠️",
        text: "Debes ingresar banco, monto y fecha.",
      });

    // ❌ Bloqueo de símbolos, letras o valores inválidos
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!regex.test(monto))
      return Swal.fire({
        icon: "error",
        title: "Monto inválido 💰",
        text: "Solo se permiten números (sin letras ni símbolos).",
      });

    if (monto <= 0)
      return Swal.fire({
        icon: "error",
        title: "Monto inválido 💰",
        text: "El monto debe ser mayor a 0.",
      });

    if (cuotas < 0)
      return Swal.fire({
        icon: "error",
        title: "Número de cuotas inválido",
        text: "No puedes registrar cuotas negativas.",
      });

    let bancoId = bancoSeleccionado;

    // ✅ Crear banco si es nuevo
    if (bancoSeleccionado === "otro") {
      const { data, error } = await supabase
        .from("bancos")
        .insert([{ nombre: nuevoBanco, tasa_mora: parseFloat(tasaMora) }])
        .select();
      if (error) {
        return Swal.fire("Error", "No se pudo registrar el banco", "error");
      }
      bancoId = data[0].id;
      await cargarBancos();
    }

    const bancoEncontrado = bancos.find((b) => b.id === bancoId);
    const bancoNombre = bancoEncontrado ? bancoEncontrado.nombre : nuevoBanco;
    const moraBanco = bancoEncontrado ? bancoEncontrado.tasa_mora : tasaMora;

    // 🕓 Calcular fecha de vencimiento correctamente
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

let fechaSeleccionada = new Date(fecha);
fechaSeleccionada.setHours(0, 0, 0, 0);

// Si la fecha es igual o anterior a hoy ➜ se suma 1 mes automáticamente
if (fechaSeleccionada.getTime() <= hoy.getTime()) {
  fechaSeleccionada.setMonth(fechaSeleccionada.getMonth() + 1);
  Swal.fire({
    icon: "info",
    title: "Fecha ajustada 📅",
    text: "El vencimiento fue establecido automáticamente un mes después.",
    timer: 2000,
    showConfirmButton: false
  });
}
// Convertir a formato YYYY-MM-DD
const fechaVencimientoFinal = fechaSeleccionada.toISOString().split("T")[0];

    // ✅ Registrar deuda
    const { data: deudaData, error } = await supabase
      .from("deudas")
      .insert([
        {
          usuario_id: usuario.id,
          banco: bancoNombre,
          monto: parseFloat(monto),
          fecha_vencimiento: fechaVencimientoFinal,
          estado: "pendiente",
          banco_id: bancoId,
        },
      ])
      .select();

    if (error) {
      return Swal.fire("Error", "No se pudo registrar la deuda", "error");
    }

    const deudaId = deudaData[0].id;

    // ✅ Generar cuotas automáticamente
    if (cuotas && cuotas > 0) {
      const montoCuota = parseFloat(monto) / parseInt(cuotas);
      const fechaBase = new Date(fechaVencimientoFinal);
      const cuotasInsertar = Array.from({ length: cuotas }, (_, i) => {
        const fechaCuota = new Date(fechaBase);
        fechaCuota.setMonth(fechaBase.getMonth() + i);
        return {
          deuda_id: deudaId,
          numero_cuota: i + 1,
          monto_cuota: montoCuota.toFixed(2),
          fecha_pago: fechaCuota.toISOString().split("T")[0],
          pagada: false, // 👈 inicia pendiente
          mora: moraBanco,
        };
      });
      const { error: errorCuotas } = await supabase
        .from("cuotas")
        .insert(cuotasInsertar);
      if (errorCuotas) {
        console.error(errorCuotas);
        Swal.fire(
          "Advertencia ⚠️",
          "La deuda fue creada, pero hubo un error al registrar las cuotas.",
          "warning"
        );
      }
    }

    Swal.fire({
      title: "Deuda registrada 💰",
      text: "La deuda y sus cuotas se han creado correctamente.",
      icon: "success",
      confirmButtonColor: "#1565c0",
    });

    setBancoSeleccionado("");
    setNuevoBanco("");
    setTasaMora("");
    setMonto("");
    setFecha("");
    setCuotas("");
    cargarDeudas();
  };

  const togglePago = async (id, estado) => {
    const { data: cuotas } = await supabase
      .from("cuotas")
      .select("id")
      .eq("deuda_id", id);
    if (cuotas && cuotas.length > 0) {
      return Swal.fire({
        title: "Acción no permitida ⚠️",
        text: "Esta deuda tiene cuotas. Gestiona los pagos desde ellas.",
        icon: "warning",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#1565c0",
      });
    }
    const nuevoEstado = estado === "pagado" ? "pendiente" : "pagado";
    await supabase.from("deudas").update({ estado: nuevoEstado }).eq("id", id);
    if (nuevoEstado === "pagado") {
      Swal.fire({
        title: "¡Pago completado! 💸",
        text: "Has marcado esta deuda como pagada.",
        icon: "success",
        confirmButtonColor: "#1565c0",
      });
    }
    cargarDeudas();
  };

  const toggleCuotas = (id) => {
    setMostrarCuotas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="deudas-section">
      <h2>💳 Mis Deudas</h2>

      <div className="tabs-container">
        <button
          className={vista === "pendientes" ? "tab active" : "tab"}
          onClick={() => setVista("pendientes")}
        >
          📅 Pendientes
        </button>
        <button
          className={vista === "historial" ? "tab active" : "tab"}
          onClick={() => setVista("historial")}
        >
          📜 Historial de pagos
        </button>
      </div>

      {vista === "pendientes" && (
        <div className="deuda-form">
          <select
            value={bancoSeleccionado}
            onChange={(e) => setBancoSeleccionado(e.target.value)}
          >
            <option value="">Selecciona un banco</option>
            {bancos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} (Mora {b.tasa_mora}%)
              </option>
            ))}
            <option value="otro">➕ Otro banco</option>
          </select>

          {bancoSeleccionado === "otro" && (
            <>
              <input
                type="text"
                placeholder="Nombre del banco"
                value={nuevoBanco}
                onChange={(e) => setNuevoBanco(e.target.value)}
              />
              <input
                type="number"
                placeholder="Mora (%)"
                value={tasaMora}
                onChange={(e) => setTasaMora(e.target.value)}
              />
            </>
          )}

          <input
            type="text"
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ""))}
          />
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <input
            type="number"
            placeholder="N° cuotas"
            value={cuotas}
            onChange={(e) => setCuotas(e.target.value)}
          />
          <button onClick={registrarDeuda}>Registrar deuda</button>
        </div>
      )}

      {cargando ? (
        <p style={{ textAlign: "center" }}>⏳ Cargando deudas...</p>
      ) : (
        <table className="deudas-tabla">
          <thead>
            <tr>
              <th>Banco</th>
              <th>Monto</th>
              <th>Fecha Vencimiento</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {deudas.length === 0 ? (
              <tr>
                <td colSpan="5">No hay deudas en esta sección</td>
              </tr>
            ) : (
              deudas.map((d) => (
                <React.Fragment key={d.id}>
                  <tr>
                    <td>
                      {d.banco}
                      {d.tiene_mora && (
                        <span style={{ color: "red", marginLeft: "5px" }}>
                          (Con mora)
                        </span>
                      )}
                    </td>
                    <td>S/ {d.monto}</td>
                    <td>{d.fecha_vencimiento}</td>
                    <td
                      className={
                        d.estado === "pagado"
                          ? "estado-pagado"
                          : "estado-pendiente"
                      }
                    >
                      {d.estado}
                    </td>
                    <td>
                      {vista === "pendientes" && (
                        <button
                          className={
                            d.estado === "pagado"
                              ? "btn-pendiente"
                              : "btn-pagado"
                          }
                          onClick={() => togglePago(d.id, d.estado)}
                        >
                          {d.estado === "pagado"
                            ? "↩ Pendiente"
                            : "✅ Pagada"}
                        </button>
                      )}
                      <button
                        className="btn-cuotas"
                        onClick={() => toggleCuotas(d.id)}
                      >
                        {mostrarCuotas[d.id] ? "▲ Ocultar" : "▼ Ver cuotas"}
                      </button>
                    </td>
                  </tr>
                  {mostrarCuotas[d.id] && (
                    <Cuotas deudaId={d.id} estado={d.estado} />
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
