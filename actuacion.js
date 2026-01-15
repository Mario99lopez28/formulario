// =============================
// CONFIG BACKEND (EDITAR)
// =============================
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbxEBgoFWkwI371OY-JOXKcwxrq1iQY6-RhB4df5D67ZweZ6_KRdExl1JxgJ6keojIU3/exec";
const APP_TOKEN   = "M@rio";

// =============================
// Helpers
// =============================
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function renumerarTabla(tableId){
  const tbody = qs(`#${tableId} tbody`);
  Array.from(tbody.rows).forEach((row, idx) => {
    row.cells[0].textContent = String(idx + 1);
  });
}

function crearBtnEliminar(tableId){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--secondary";
  btn.textContent = "Eliminar";
  btn.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    row.remove();
    renumerarTabla(tableId);
  });
  return btn;
}

// =============================
// Lógica condicional
// =============================
function toggleBloqueResolucion(){
  const tipo = qs("#tipo_actuacion").value;
  const bloque = qs("#bloque_resolucion");
  bloque.style.display = (tipo === "SA") ? "grid" : "none";
}

function toggleActJudicial(){
  const chk = qs("#act_judicial").checked;
  const fecha = qs("#fecha_act_judicial");
  fecha.disabled = !chk;
  if(!chk) fecha.value = "";
}

function toggleCalificacionEvento(){
  const chk = qs("#calificacion_evento").checked;
  const nro = qs("#nro_ex_evento");
  const fecha = qs("#fecha_evento");
  nro.disabled = !chk;
  fecha.disabled = !chk;
  if(!chk){
    nro.value = "";
    fecha.value = "";
  }
}

// =============================
// Backend calls
// =============================

// 🔴 LP SE BUSCA DIRECTO EN TU PHP (NO Apps Script)
function apiBuscarLP(lp){
  const url = `https://sofw.link/buscar_personal.php?token=M@rio&legajo=${encodeURIComponent(lp)}`;
  return fetch(url)
    .then(r => r.json())
    .then(arr => {
      if (!Array.isArray(arr) || arr.length === 0) {
        return { ok: false };
      }
      const r0 = arr[0];
      return {
        ok: true,
        lp: r0.Legajo,
        grado: r0.Grado,
        apellido: r0.Apellido,
        nombre: r0.Nombres,
        dni: r0.DNI
      };
    });
}

function apiBuscarExpediente(nroEx){
  const url = `${BACKEND_URL}?accion=buscarExpediente&token=${encodeURIComponent(APP_TOKEN)}&nro_ex=${encodeURIComponent(nroEx)}`;
  return fetch(url).then(r => r.json());
}

function apiGuardarExpediente(payload){
  return fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accion: "guardarExpediente",
      token: APP_TOKEN,
      payload
    })
  }).then(r => r.json());
}

// =============================
// Imputados (LP)
// =============================
function agregarImputado(){
  const lp = qs("#lp_input").value.trim();
  if(!lp){
    alert("Ingrese un LP.");
    return;
  }

  const tbody = qs("#tabla_imputados tbody");
  const tr = document.createElement("tr");

  const tdN = document.createElement("td");
  tdN.textContent = String(tbody.rows.length + 1);

  const tdLP = document.createElement("td");
  tdLP.textContent = lp;

  const tdDatos = document.createElement("td");
  tdDatos.textContent = "Buscando datos...";

  const tdDestino = document.createElement("td");
  tdDestino.innerHTML = `<input class="input" type="text" placeholder="Destino">`;

  const tdSituacion = document.createElement("td");
  tdSituacion.innerHTML = `<input class="input" type="text" placeholder="Situación de revista">`;

  const tdAcc = document.createElement("td");
  tdAcc.appendChild(crearBtnEliminar("tabla_imputados"));

  tr.dataset.lp = lp;

  tr.append(tdN, tdLP, tdDatos, tdDestino, tdSituacion, tdAcc);
  tbody.appendChild(tr);

  apiBuscarLP(lp)
    .then(data => {
      if(data && data.ok){
        tr.dataset.grado = data.grado || "";
        tr.dataset.apellido = data.apellido || "";
        tr.dataset.nombre = data.nombre || "";
        tr.dataset.dni = data.dni || "";

        tdDatos.textContent =
          `${data.grado} LP ${data.lp} (DNI ${data.dni}) ${data.apellido} ${data.nombre}`;
      } else {
        tdDatos.textContent = "LP no encontrado";
      }
    })
    .catch(() => {
      tdDatos.textContent = "Error al consultar la base";
    });

  qs("#lp_input").value = "";
}

// =============================
// Damnificados (manual)
// =============================
function agregarDamnificadoConValores(d = {}){
  const tbody = qs("#tabla_damnificados tbody");
  const tr = document.createElement("tr");

  const tdN = document.createElement("td");
  tdN.textContent = String(tbody.rows.length + 1);

  const tdDatos = document.createElement("td");
  tdDatos.innerHTML = `<input class="input" type="text" placeholder="Apellido y Nombre / Datos" value="${escapeAttr(d.datos || "")}">`;

  const tdRel = document.createElement("td");
  tdRel.innerHTML = `<input class="input" type="text" placeholder="Relación" value="${escapeAttr(d.relacion || "")}">`;

  const tdDni = document.createElement("td");
  tdDni.innerHTML = `<input class="input" type="text" placeholder="DNI" value="${escapeAttr(d.dni || "")}">`;

  const tdAcc = document.createElement("td");
  tdAcc.appendChild(crearBtnEliminar("tabla_damnificados"));

  tr.append(tdN, tdDatos, tdRel, tdDni, tdAcc);
  tbody.appendChild(tr);
}

function agregarDamnificado(){
  agregarDamnificadoConValores({});
}

// =============================
// Utils
// =============================
function escapeAttr(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll('"',"&quot;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

// =============================
// Init
// =============================
document.addEventListener("DOMContentLoaded", () => {
  toggleBloqueResolucion();
  toggleActJudicial();
  toggleCalificacionEvento();

  qs("#tipo_actuacion").addEventListener("change", toggleBloqueResolucion);
  qs("#act_judicial").addEventListener("change", toggleActJudicial);
  qs("#calificacion_evento").addEventListener("change", toggleCalificacionEvento);

  qs("#btnAgregarImputado").addEventListener("click", agregarImputado);
  qs("#btnAgregarDamnificado").addEventListener("click", agregarDamnificado);

  qs("#btnGuardar").addEventListener("click", onGuardar);
  qs("#btnBuscar").addEventListener("click", onBuscar);
  qs("#btnImprimir").addEventListener("click", onImprimir);
});
