// =============================
// CONFIG BACKEND
// =============================
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbxlqrV2_07W6CdIFYdxYENBRi1WJCVDVKRYT7Qf6b5oanpdit3UFqRXWBHnYEoros4LSA/exec";
const APP_TOKEN   = "M@rio";

// =============================
// Helpers
// =============================
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function renumerarTabla(tableId){
  const tbody = qs(`#${tableId} tbody`);
  Array.from(tbody.rows).forEach((row, idx) => row.cells[0].textContent = idx + 1);
}

function crearBtnEliminar(tableId){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--secondary";
  btn.textContent = "Eliminar";
  btn.onclick = e => {
    e.target.closest("tr").remove();
    renumerarTabla(tableId);
  };
  return btn;
}

// =============================
// Lógica condicional
// =============================
function toggleBloqueResolucion(){
  qs("#bloque_resolucion").style.display =
    qs("#tipo_actuacion").value === "SA" ? "grid" : "none";
}

function toggleActJudicial(){
  qs("#fecha_act_judicial").disabled = !qs("#act_judicial").checked;
}

function toggleCalificacionEvento(){
  const ok = qs("#calificacion_evento").checked;
  qs("#fecha_evento").disabled = !ok;
  qs("#nro_ex_evento").disabled = !ok;
}

// =============================
// API PERSONAL (PHP)
// =============================
function apiBuscarLP(lp){
  const url = `https://sofw.link/buscar_personal.php?token=M@rio&legajo=${encodeURIComponent(lp)}`;
  return fetch(url).then(r => r.json());
}

// =============================
// API EXPEDIENTES (Apps Script)
// =============================
function apiBuscarExpediente(nroEx){
  return fetch(`${BACKEND_URL}?accion=buscarExpediente&token=${APP_TOKEN}&nro_ex=${encodeURIComponent(nroEx)}`)
    .then(r => r.json());
}

function apiGuardarExpediente(payload){
  return fetch(BACKEND_URL,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ accion:"guardarExpediente", token:APP_TOKEN, payload })
  }).then(r=>r.json());
}

// =============================
// IMPUTADOS
// =============================
function agregarImputado(){
  const lp = qs("#lp_input").value.trim();
  if(!lp) return alert("Ingrese LP");

  const tbody = qs("#tabla_imputados tbody");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${tbody.rows.length + 1}</td>
    <td>${lp}</td>
    <td>Buscando...</td>
    <td><input class="input" placeholder="Destino"></td>
    <td><input class="input" placeholder="Situación de revista"></td>
    <td></td>
  `;

  tr.dataset.lp = lp;
  tr.lastElementChild.appendChild(crearBtnEliminar("tabla_imputados"));
  tbody.appendChild(tr);

  apiBuscarLP(lp)
    .then(r=>{
      if(!Array.isArray(r) || !r.length){
        tr.cells[2].textContent = "LP no encontrado";
        return;
      }
      const p = r[0];
      tr.dataset.grado = p.Grado || "";
      tr.dataset.apellido = p.Apellido || "";
      tr.dataset.nombre = p.Nombres || "";
      tr.dataset.dni = p.DNI || "";

      tr.cells[2].textContent =
        `${p.Grado} LP ${p.Legajo} (DNI ${p.DNI}) ${p.Apellido} ${p.Nombres}`;
    })
    .catch(()=> tr.cells[2].textContent="Error al consultar");

  qs("#lp_input").value="";
}

// =============================
// DAMNIFICADOS
// =============================
function agregarDamnificado(){
  const tbody = qs("#tabla_damnificados tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${tbody.rows.length + 1}</td>
    <td><input class="input"></td>
    <td><input class="input"></td>
    <td><input class="input"></td>
    <td></td>
  `;
  tr.lastElementChild.appendChild(crearBtnEliminar("tabla_damnificados"));
  tbody.appendChild(tr);
}

// =============================
// DILIGENCIAS
// =============================
function agregarDiligencia(){
  const tbody = qs("#tabla_diligencias tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${tbody.rows.length + 1}</td>
    <td><input class="input"></td>
    <td><input class="input"></td>
    <td><input class="input" type="date"></td>
    <td><input class="input" type="date"></td>
    <td><input class="input"></td>
    <td></td>
  `;
  tr.lastElementChild.appendChild(crearBtnEliminar("tabla_diligencias"));
  tbody.appendChild(tr);
}

// =============================
// PROCURACIÓN
// =============================
function agregarProcuracion(){
  const tbody = qs("#tabla_procuracion tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${tbody.rows.length + 1}</td>
    <td><input class="input"></td>
    <td><input class="input" type="date"></td>
    <td><input class="input"></td>
    <td><input class="input" type="date"></td>
    <td><input class="input"></td>
    <td></td>
  `;
  tr.lastElementChild.appendChild(crearBtnEliminar("tabla_procuracion"));
  tbody.appendChild(tr);
}

// =============================
// GUARDAR / BUSCAR / IMPRIMIR
// =============================
function buildPayload(){
  return {
    nro_ex: qs("#nro_ex").value,
    actuacion: {
      tipo: qs("#tipo_actuacion").value,
      nro_actuacion: qs("#nro_actuacion").value,
      articulacion: qs("#articulacion").value,
      tematica: qs("#tematica").value,
      fecha_hecho: qs("#fecha_hecho").value,
      circunstancia: qs("#circunstancia").value,
      resena: qs("#resena").value
    },
    imputados: qsa("#tabla_imputados tbody tr").map(tr=>({
      lp: tr.dataset.lp,
      grado: tr.dataset.grado,
      apellido: tr.dataset.apellido,
      nombre: tr.dataset.nombre,
      dni: tr.dataset.dni,
      destino: tr.cells[3].querySelector("input").value,
      situacion: tr.cells[4].querySelector("input").value
    }))
  };
}

async function onGuardar(){
  const payload = buildPayload();
  const r = await apiGuardarExpediente(payload);
  r.ok ? alert("Guardado correctamente") : alert("Error al guardar");
}

async function onBuscar(){
  const nro = qs("#nro_ex").value;
  const r = await apiBuscarExpediente(nro);
  if(!r.ok) return alert("No encontrado");
  alert("Expediente cargado (estructura lista)");
}

function onImprimir(){
  window.print();
}

// =============================
// INIT
// =============================
document.addEventListener("DOMContentLoaded",()=>{
  toggleBloqueResolucion();
  toggleActJudicial();
  toggleCalificacionEvento();

  qs("#tipo_actuacion").onchange = toggleBloqueResolucion;
  qs("#act_judicial").onchange = toggleActJudicial;
  qs("#calificacion_evento").onchange = toggleCalificacionEvento;

  qs("#btnAgregarImputado").onclick = agregarImputado;
  qs("#btnAgregarDamnificado").onclick = agregarDamnificado;
  qs("#btnAgregarDiligencia").onclick = agregarDiligencia;
  qs("#btnAgregarProcuracion").onclick = agregarProcuracion;

  qs("#btnGuardar").onclick = onGuardar;
  qs("#btnBuscar").onclick = onBuscar;
  qs("#btnImprimir").onclick = onImprimir;
});

