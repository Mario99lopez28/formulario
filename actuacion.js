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
function apiBuscarLP(lp){
  const url = `${BACKEND_URL}?accion=buscarLP&token=${encodeURIComponent(APP_TOKEN)}&lp=${encodeURIComponent(lp)}`;
  return fetch(url).then(r => r.json());
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

  // Guardamos “metadatos” del efectivo para el guardado final
  tr.dataset.lp = lp;

  tr.append(tdN, tdLP, tdDatos, tdDestino, tdSituacion, tdAcc);
  tbody.appendChild(tr);

  apiBuscarLP(lp)
    .then(data => {
      if(data && data.ok){
        // Guardar datos en dataset para guardar después en Sheets
        tr.dataset.grado = data.grado || "";
        tr.dataset.apellido = data.apellido || "";
        tr.dataset.nombre = data.nombre || "";
        tr.dataset.dni = data.dni || "";

        tdDatos.textContent = `${data.grado} LP ${data.lp} (DNI ${data.dni}) ${data.apellido} ${data.nombre}`;
      } else {
        tdDatos.textContent = "LP no encontrado";
        tr.dataset.grado = "";
        tr.dataset.apellido = "";
        tr.dataset.nombre = "";
        tr.dataset.dni = "";
      }
    })
    .catch(() => {
      tdDatos.textContent = "Error al buscar LP";
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
// Diligencias / Procuración
// =============================
function agregarDiligenciaConValores(d = {}){
  const tbody = qs("#tabla_diligencias tbody");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${tbody.rows.length + 1}</td>
    <td><input class="input" type="text" placeholder="Diligencia" value="${escapeAttr(d.diligencia || "")}"></td>
    <td><input class="input" type="text" placeholder="Tipo" value="${escapeAttr(d.tipo || "")}"></td>
    <td><input class="input" type="date" value="${escapeAttr(d.fecha_solicitud || "")}"></td>
    <td><input class="input" type="date" value="${escapeAttr(d.fecha_respuesta || "")}"></td>
    <td><input class="input" type="text" placeholder="Observación" value="${escapeAttr(d.observacion || "")}"></td>
    <td></td>
  `;

  tr.lastElementChild.appendChild(crearBtnEliminar("tabla_diligencias"));
  tbody.appendChild(tr);
}

function agregarDiligencia(){
  agregarDiligenciaConValores({});
}

function agregarProcuracionConValores(p = {}){
  const tbody = qs("#tabla_procuracion tbody");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${tbody.rows.length + 1}</td>
    <td><input class="input" type="text" placeholder="Procuración" value="${escapeAttr(p.procuracion || "")}"></td>
    <td><input class="input" type="date" value="${escapeAttr(p.fecha_solicitud || "")}"></td>
    <td><input class="input" type="text" placeholder="Rta Positiva - Negativa" value="${escapeAttr(p.respuesta || "")}"></td>
    <td><input class="input" type="date" value="${escapeAttr(p.fecha_respuesta || "")}"></td>
    <td><input class="input" type="text" placeholder="Observación" value="${escapeAttr(p.observacion || "")}"></td>
    <td></td>
  `;

  tr.lastElementChild.appendChild(crearBtnEliminar("tabla_procuracion"));
  tbody.appendChild(tr);
}

function agregarProcuracion(){
  agregarProcuracionConValores({});
}

// =============================
// Construcción de payload
// =============================
function buildPayload(){
  const nro_ex = qs("#nro_ex").value.trim();

  const actuacion = {
    nro_ex,
    tipo_actuacion: qs("#tipo_actuacion").value || "",
    nro_actuacion: qs("#nro_actuacion").value || "",
    articulacion: qs("#articulacion").value || "",
    tematica: qs("#tematica").value || "",

    resolucion: qs("#resolucion") ? (qs("#resolucion").value || "") : "",
    fecha_resolucion: qs("#fecha_resolucion") ? (qs("#fecha_resolucion").value || "") : "",
    nro_ex_interno: qs("#nro_ex_interno") ? (qs("#nro_ex_interno").value || "") : "",

    fecha_hecho: qs("#fecha_hecho").value || "",
    circunstancia: qs("#circunstancia").value || "",
    resena: qs("#resena").value || "",

    actuacion_judicial: !!qs("#act_judicial").checked,
    fecha_actuacion_judicial: qs("#fecha_act_judicial").value || "",

    calificacion_evento: !!qs("#calificacion_evento").checked,
    fecha_evento: qs("#fecha_evento").value || "",
    nro_ex_evento: qs("#nro_ex_evento").value || ""
  };

  const imputados = qsa("#tabla_imputados tbody tr").map(tr => {
    const destino = tr.querySelector('td:nth-child(4) input')?.value || "";
    const situacion = tr.querySelector('td:nth-child(5) input')?.value || "";

    return {
      lp: tr.dataset.lp || tr.children[1]?.textContent?.trim() || "",
      grado: tr.dataset.grado || "",
      apellido: tr.dataset.apellido || "",
      nombre: tr.dataset.nombre || "",
      dni: tr.dataset.dni || "",
      destino,
      situacion_revista: situacion
    };
  });

  const damnificados = qsa("#tabla_damnificados tbody tr").map(tr => {
    const inputs = tr.querySelectorAll("input");
    return {
      datos: inputs[0]?.value || "",
      relacion: inputs[1]?.value || "",
      dni: inputs[2]?.value || ""
    };
  });

  const diligencias = qsa("#tabla_diligencias tbody tr").map(tr => {
    const inputs = tr.querySelectorAll("input");
    return {
      diligencia: inputs[0]?.value || "",
      tipo: inputs[1]?.value || "",
      fecha_solicitud: inputs[2]?.value || "",
      fecha_respuesta: inputs[3]?.value || "",
      observacion: inputs[4]?.value || ""
    };
  });

  const procuracion = qsa("#tabla_procuracion tbody tr").map(tr => {
    const inputs = tr.querySelectorAll("input");
    return {
      procuracion: inputs[0]?.value || "",
      fecha_solicitud: inputs[1]?.value || "",
      respuesta: inputs[2]?.value || "",
      fecha_respuesta: inputs[3]?.value || "",
      observacion: inputs[4]?.value || ""
    };
  });

  return { actuacion, imputados, damnificados, diligencias, procuracion };
}

// =============================
// Cargar payload en pantalla
// =============================
function clearTbody(sel){
  const tbody = qs(sel);
  if (tbody) tbody.innerHTML = "";
}

function setActuacionFields(act){
  qs("#nro_ex").value = act.nro_ex || "";
  qs("#tipo_actuacion").value = act.tipo_actuacion || "";
  qs("#nro_actuacion").value = act.nro_actuacion || "";
  qs("#articulacion").value = act.articulacion || "";
  qs("#tematica").value = act.tematica || "";

  if (qs("#resolucion")) qs("#resolucion").value = act.resolucion || "";
  if (qs("#fecha_resolucion")) qs("#fecha_resolucion").value = act.fecha_resolucion || "";
  if (qs("#nro_ex_interno")) qs("#nro_ex_interno").value = act.nro_ex_interno || "";

  qs("#fecha_hecho").value = act.fecha_hecho || "";
  qs("#circunstancia").value = act.circunstancia || "";
  qs("#resena").value = act.resena || "";

  qs("#act_judicial").checked = !!act.actuacion_judicial;
  qs("#fecha_act_judicial").value = act.fecha_actuacion_judicial || "";

  qs("#calificacion_evento").checked = !!act.calificacion_evento;
  qs("#fecha_evento").value = act.fecha_evento || "";
  qs("#nro_ex_evento").value = act.nro_ex_evento || "";

  toggleBloqueResolucion();
  toggleActJudicial();
  toggleCalificacionEvento();
}

function addImputadoRowFromData(r){
  const tbody = qs("#tabla_imputados tbody");
  const tr = document.createElement("tr");

  const tdN = document.createElement("td");
  tdN.textContent = String(tbody.rows.length + 1);

  const tdLP = document.createElement("td");
  tdLP.textContent = r.lp || "";

  const tdDatos = document.createElement("td");
  tdDatos.textContent = `${r.grado || ""} LP ${r.lp || ""} (DNI ${r.dni || ""}) ${r.apellido || ""} ${r.nombre || ""}`.trim();

  const tdDestino = document.createElement("td");
  tdDestino.innerHTML = `<input class="input" type="text" placeholder="Destino" value="${escapeAttr(r.destino || "")}">`;

  const tdSituacion = document.createElement("td");
  tdSituacion.innerHTML = `<input class="input" type="text" placeholder="Situación de revista" value="${escapeAttr(r.situacion_revista || "")}">`;

  const tdAcc = document.createElement("td");
  tdAcc.appendChild(crearBtnEliminar("tabla_imputados"));

  tr.dataset.lp = r.lp || "";
  tr.dataset.grado = r.grado || "";
  tr.dataset.apellido = r.apellido || "";
  tr.dataset.nombre = r.nombre || "";
  tr.dataset.dni = r.dni || "";

  tr.append(tdN, tdLP, tdDatos, tdDestino, tdSituacion, tdAcc);
  tbody.appendChild(tr);
}

function loadPayload(payload){
  setActuacionFields(payload.actuacion || {});

  // imputados
  clearTbody("#tabla_imputados tbody");
  (payload.imputados || []).forEach(addImputadoRowFromData);

  // damnificados
  clearTbody("#tabla_damnificados tbody");
  (payload.damnificados || []).forEach(agregarDamnificadoConValores);

  // diligencias
  clearTbody("#tabla_diligencias tbody");
  (payload.diligencias || []).forEach(agregarDiligenciaConValores);

  // procuracion
  clearTbody("#tabla_procuracion tbody");
  (payload.procuracion || []).forEach(agregarProcuracionConValores);
}

// =============================
// Botones
// =============================
async function onGuardar(){
  const nroEx = qs("#nro_ex").value.trim();
  if(!nroEx){
    alert("Debe ingresar N° EX.");
    return;
  }

  const payload = buildPayload();

  try{
    const resp = await apiGuardarExpediente(payload);
    if(resp && resp.ok){
      alert("Guardado OK: " + nroEx);
    } else {
      alert("Error al guardar: " + (resp?.error || "desconocido"));
    }
  } catch(e){
    alert("Error de conexión al guardar.");
  }
}

async function onBuscar(){
  const nroEx = qs("#nro_ex").value.trim();
  if(!nroEx){
    alert("Ingrese N° EX para buscar.");
    return;
  }

  try{
    const resp = await apiBuscarExpediente(nroEx);
    if(resp && resp.ok){
      loadPayload(resp.payload);
      alert("Expediente cargado: " + nroEx);
    } else {
      alert("No encontrado: " + (resp?.error || ""));
    }
  } catch(e){
    alert("Error de conexión al buscar.");
  }
}

function onImprimir(){
  window.print();
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
  qs("#btnAgregarDiligencia").addEventListener("click", agregarDiligencia);
  qs("#btnAgregarProcuracion").addEventListener("click", agregarProcuracion);

  qs("#btnGuardar").addEventListener("click", onGuardar);
  qs("#btnBuscar").addEventListener("click", onBuscar);
  qs("#btnImprimir").addEventListener("click", onImprimir);
});