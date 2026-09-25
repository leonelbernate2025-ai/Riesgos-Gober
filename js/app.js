/* =====================================================================
   Enrutado, navegación y arranque de la aplicación.
   ===================================================================== */

/* =====================================================================
   RENDER PRINCIPAL
   ===================================================================== */
function render(){
  _pendIdx = null;
  pintarNav();
  const v = VISTAS.find(x => x.id === S.vista) || VISTAS[0];
  document.getElementById("vTitle").textContent = v.n;

  const subs = {
    madurez:"Autodiagnóstico del Sistema Integral de Administración del Riesgo",
    formatos:"Parametrización de calidad de los reportes que emite el sistema",
    solicitudes:"Creación, actualización y eliminación pendientes de aprobación",
    seguimiento:"Cuatro veces al año: indicador, actividades, soportes y evaluación de controles",
    monitoreo:"Revisión de la Dirección SIG sobre la calidad de riesgos y controles",
    interno:"Verificación independiente y contraste con el monitoreo de SIG",
    perfiles:"Quién responde por cada proceso en el ciclo de gestión del riesgo",
    panel:"Distribución de los riesgos vigentes",
    riesgos:"Inventario completo por proceso y dependencia",
    matriz:"Ubicación de los riesgos antes y después de los controles",
    historico:"Cada cambio queda registrado de forma permanente",
    usuarios:"Creación y administración de cuentas",
    ventanas:"Cuándo se puede actualizar, monitorear y hacer seguimiento",
    metodo:"Parámetros vigentes de la Guía versión 7"
  };
  document.getElementById("vSub").textContent = subs[v.id] || "";

  const acc = document.getElementById("vActions");
  acc.innerHTML = "";
  const exportar = (puedeDescargar("XLS") ? `<button class="btn ghost" id="btnXls">Excel</button>` : "")
    + (puedeDescargar("PDF") ? `<button class="btn ghost" id="btnPdf">PDF</button>` : "");
  if (S.vista === "riesgos")
    acc.innerHTML = (puede("riesgo") ? `<button class="btn" id="btnNuevo">Registrar riesgo</button>` : "")
      + (puedeDescargar("PDF") ? `<button class="btn ghost" id="btnXlsCtrl">Controles</button>` : "")
      + exportar;
  if (S.vista === "panel" || S.vista === "matriz" || S.vista === "madurez")
    acc.innerHTML = exportar;
  if (S.vista === "solicitudes" && puedeDescargar("XLS"))
    acc.innerHTML = `<button class="btn ghost" id="btnSolCsv">Exportar solicitudes</button>`;
  if (S.vista === "seguimiento")
    acc.innerHTML = (puedeDescargar("XLS")
      ? `<button class="btn ghost" id="btnBD">Base de monitoreo</button>` : "") + exportar;
  if (S.vista === "usuarios")
    acc.innerHTML = `<button class="btn" id="btnNuevoU">Nuevo usuario</button>`;

  const cuerpo = {
    madurez: vistaMadurez,
    formatos: vistaFormatos,
    solicitudes: vistaSolicitudes,
    panel: vistaPanel, riesgos: vistaRiesgos, matriz: vistaMatriz,
    historico: vistaHistorico, usuarios: vistaUsuarios,
    ventanas: vistaVentanas, metodo: vistaMetodo,
    seguimiento: vistaSeguimiento, monitoreo: vistaMonitoreo,
    interno: vistaInterno, perfiles: vistaPerfiles
  }[v.id] || vistaPanel;
  document.getElementById("view").innerHTML = cuerpo();

  enlazarFiltros();
  const on = (id, fn) => { const e = document.getElementById(id); if (e) e.onclick = fn; };
  on("btnInterv", () => { S.intervencion = !S.intervencion; render(); });
  /* --- Formatos --- */
  document.querySelectorAll("[data-fmt]").forEach(el => el.oninput = () => {});
  on("fmtGuardar", () => {
    const fs = formatosGuardados().map(x => ({...x}));
    document.querySelectorAll("[data-fmt]").forEach(el => {
      fs[Number(el.dataset.fmt)][el.dataset.fc] = el.value.trim();
    });
    guardarFormatos(fs); render();
    aviso("Formatos guardados",
      "Los reportes que emita el sistema usarán esta parametrización.");
  });
  on("fmtRestaurar", () => modal("Restaurar los formatos", `
    <p style="margin:0">Se volverá a la parametrización que trae el sistema y se perderán los
      códigos, versiones y fechas que haya registrado.</p>`,
    [{t:"Cancelar", cls:"ghost", fn:cerrarModal},
     {t:"Restaurar", cls:"danger", fn:() => {
       try { localStorage.removeItem("formatos"); } catch(e){}
       cerrarModal(); render();
     }}]));
  const fl = document.getElementById("fmtLogo");
  if (fl) fl.onchange = () => {
    const f = fl.files && fl.files[0]; if (!f) return;
    if (f.size > 300 * 1024)
      return aviso("La imagen pesa demasiado", "Use un archivo de menos de 300 KB.");
    const fr = new FileReader();
    fr.onload = () => { guardarLogo(fr.result); render(); };
    fr.readAsDataURL(f);
  };
  on("fmtLogoQuitar", () => { guardarLogo(""); render(); });

  on("cfgPurga", () => modal("Depurar histórico", `
    <p class="just" style="margin:0">Se conservará la versión más reciente de cada riesgo y se
      eliminarán las anteriores. Los riesgos, controles y reportes no se tocan.</p>
    <p class="hint just" style="margin-top:9px">Hoy hay ${S.historico.length} versiones guardadas.
      En el sistema definitivo el histórico vive en la base de datos y no tiene este límite;
      aquí depende del navegador.</p>`,
    [{t:"Cancelar", cls:"ghost", fn:cerrarModal},
     {t:"Depurar", cls:"danger", fn: async () => {
       const ult = new Map();
       S.historico.forEach(h => {
         const p = ult.get(h.riesgoId);
         if (!p || h.version > p.version) ult.set(h.riesgoId, h);
       });
       const quedan = [...ult.values()];
       Store.local.historico = Object.fromEntries(quedan.map(h => [h.id, h]));
       S.historico = quedan;
       Store.flush(); cerrarModal(); render();
     }}]));

  on("cfgReset", () => modal("Reiniciar con los datos de prueba", `
    <div class="banner warn"><span>&#9888;</span><div>Se borrará todo lo registrado en este
      navegador: riesgos, reportes, monitoreos, solicitudes, usuarios y el autodiagnóstico de
      madurez. Se volverán a cargar los 235 riesgos migrados del consolidado.</div></div>
    <p class="hint just" style="margin-top:11px">Solo afecta a este navegador. Si otras personas
      están probando, sus datos no se ven alterados.</p>`,
    [{t:"Cancelar", cls:"ghost", fn:cerrarModal},
     {t:"Reiniciar", cls:"danger", fn: async () => {
       try { localStorage.removeItem("mriesgos"); } catch(e){}
       location.reload();
     }}]));

  on("cfgDriveSave", () => {
    setDriveURL(document.getElementById("cfgDrive").value.trim()); render();
  });
  on("cfgDriveTest", async () => {
    const m = document.getElementById("cfgDriveMsg");
    m.textContent = "Probando…";
    try {
      const res = await fetch(driveURL(), {method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body: JSON.stringify({ping:true})});
      const d = await res.json();
      m.textContent = d.ok ? `Conexión correcta. Carpeta raíz: ${d.carpeta || "Riesgos"}`
        : `Respondió con error: ${d.error || "desconocido"}`;
    } catch(e){ m.textContent = "No respondió: " + e.message; }
  });
  on("btnSemilla", () => recargarSemilla());
  on("btnNuevo", () => abrirFormulario(null));
  on("btnXlsCtrl", () => exportarControlesPDF());
  on("btnBD", () => exportarMonitoreoCSV());
  on("monReporte", () => imprimirDocumento("REPORTE_MONITOREO", informeMonitoreo(), {firmas:true}));
  on("btnSolCsv", () => {
    const lista = esAdmin() ? S.solicitudes
      : S.solicitudes.filter(x => x.solicitadoPor === S.sesion?.nombre);
    if (!lista.length) return aviso("Nada que exportar", "No hay solicitudes registradas.");
    const cab = ["Operación","Identificador","Proceso","Dependencia","Descripción propuesta",
      "Motivo","Formato ES-SIG-RG-16","Campos modificados","Solicitado por","Fecha de solicitud",
      "Estado","Revisado por","Fecha de revisión","Observación de la revisión"];
    const filas = lista.map(x => [OP_SOLICITUD[x.operacion].n, x.codigo,
      proc(x.proceso)?.n || "", uni(x.unidad)?.n || "", x.propuesta.descripcion || "",
      x.motivo, x.enlaceRG16,
      diffSolicitud(x).map(d => `${d.campo}: ${d.antes} → ${d.ahora}`).join(" | "),
      x.solicitadoPor, x.solicitadoEn, x.estado, x.revisadoPor || "",
      x.revisadoEn || "", x.observacion || ""]);
    descargar("solicitudes-actualizacion.csv", aCSV(cab, filas), "text/csv");
  });
  on("btnXls", () => {
    if (S.vista === "riesgos") exportarRiesgosCSV();
    else if (S.vista === "seguimiento") exportarSeguimientoCSV();
    else if (S.vista === "madurez") exportarMadurezCSV();
    else if (S.vista === "matriz") exportarMapaCalorCSV();
    else exportarResumenCSV();
  });
  on("btnPdf", () => exportarPDF());
  on("expPerfiles", () => {
    const ROLES = [["ENLACE_SIG","Enlace SIG"],["MONITOREO","Monitoreo calidad"]];
    const cab = ["Macroproceso","Proceso","Riesgos", ...ROLES.map(r => r[1])];
    const filas = CAT.macroprocesos.flatMap(m => CAT.procesos.filter(pp => pp.m === m.c).map(pp => [
      m.n, pp.n,
      S.riesgos.filter(r => r.proceso === pp.c && r.estado !== "OBSOLETO").length,
      ...ROLES.map(([rc]) => S.usuarios.filter(u => u.activo !== false && u.rol === rc
        && (u.procesos || []).includes(pp.c)).map(u => u.nombre).join(", "))]));
    descargar("responsables-por-proceso.csv", aCSV(cab, filas), "text/csv");
  });

  const sp = document.getElementById("selPeriodo");
  if (sp) sp.onchange = () => { S.periodo = sp.value; render(); };
  document.querySelectorAll("[data-maddim]").forEach(b =>
    b.onclick = () => { S.madurezDim = Number(b.dataset.maddim); render(); });
  on("madVolver", () => { S.madurezDim = null; render(); });
  document.querySelectorAll("[data-mad]").forEach(el => el.onchange = async () => {
    if (el.value) S.madurezResp[el.dataset.mad] = Number(el.value);
    else delete S.madurezResp[el.dataset.mad];
    await guardarMadurez(); render();
  });
  on("madCsv", () => exportarMadurezCSV());
  on("madCsvViejo", () => {
    const cab = ["Componente","Peso","Nota del componente","Nivel del componente",
      "Principio","Nota del principio","Nivel del principio",
      "N.º","Punto de reflexión","Calificación","Grado de madurez"];
    const filas = [];
    CAT.madurez.forEach((d, di) => {
      const vc = notaComponente(di), nvc = nivelMadurez(vc);
      d.principios.forEach((pr, pi) => {
        const vp = notaPrincipio(di, pi), nvp = nivelMadurez(vp);
        pr.puntos.forEach((pt, k) => {
          const v = S.madurezResp[claveMad(di, pi, k)];
          const g = CAT.madurezGrados.find(x => x.v === v);
          filas.push([d.n, (d.peso * 100).toFixed(0) + "%", num1(vc), nvc ? nvc.n : "",
            pr.n, num1(vp), nvp ? nvp.n : "", k + 1, pt, v ?? "", g ? g.n : ""]);
        });
      });
    });
    const ind = indiceMadurez(), niv = nivelMadurez(ind);
    filas.push(["Madurez del Sistema Integral de Administración del Riesgo", "100%",
      num1(ind), niv ? niv.n : "", "", "", "", "", "", "", ""]);
    descargar("madurez-siar.csv", aCSV(cab, filas), "text/csv");
  });
  document.querySelectorAll("[data-sol]").forEach(b =>
    b.onclick = () => verSolicitud(b.dataset.sol, true));
  document.querySelectorAll("[data-solver]").forEach(b =>
    b.onclick = () => verSolicitud(b.dataset.solver, false));
  document.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => formSeguimiento(b.dataset.seg));
  document.querySelectorAll("[data-mon]").forEach(b => b.onclick = () => formMonitoreo(b.dataset.mon));
  document.querySelectorAll("[data-int]").forEach(b => b.onclick = () => formInterno(b.dataset.int));
  on("btnNuevoU", () => formUsuario(null));

  document.querySelectorAll("[data-ver]").forEach(b => b.onclick = () => verRiesgo(b.dataset.ver));
  document.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => abrirFormulario(b.dataset.edit));
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => eliminarRiesgo(b.dataset.del));
  document.querySelectorAll("[data-uedit]").forEach(b => b.onclick = () => formUsuario(b.dataset.uedit));
  document.querySelectorAll("[data-udel]").forEach(b => b.onclick = async () => {
    const u = S.usuarios.find(x => x.id === b.dataset.udel);
    modal("Eliminar usuario", `<p style="margin:0">Se eliminará la cuenta de <b>${esc(u.nombre)}</b>.
      Su rastro en el histórico de riesgos se conserva, pero perderá el acceso.</p>
      <p class="hint" style="margin-top:9px">Si solo quieres suspenderlo temporalmente, edítalo y márcalo como inactivo.</p>`,
      [{t:"Cancelar", cls:"ghost", fn:cerrarModal},
       {t:"Eliminar", cls:"danger", fn: async () => {
         S.usuarios = S.usuarios.filter(x => x.id !== u.id);
         await Store.del("usuarios", u.id); cerrarModal(); render();
       }}]);
  });
  document.querySelectorAll("[data-ureset]").forEach(b => b.onclick = () => {
    const u = S.usuarios.find(x => x.id === b.dataset.ureset);
    u.requiereCambio = true; Store.set("usuarios", u.id, u);
    mostrarClave(u, generarClave());
  });
  document.querySelectorAll("[data-newv]").forEach(b => b.onclick = () => formVentana(b.dataset.newv));
  document.querySelectorAll("[data-delv]").forEach(b => b.onclick = async () => {
    S.ventanas = S.ventanas.filter(v => v.id !== b.dataset.delv);
    await Store.del("ventanas", b.dataset.delv); render();
  });
  document.querySelectorAll("[data-restore]").forEach(b => b.onclick = async () => {
    const r = S.riesgos.find(x => x.id === b.dataset.restore);
    r.estado = "VIGENTE"; delete r.eliminadoEn; delete r.eliminadoPor;
    await Store.set("riesgos", r.id, r);
    await registrarVersion(r, "RESTAURACION", "Riesgo restaurado por el administrador", null);
    render();
  });
}

document.getElementById("switchUser").onclick = elegirSesion;

/* =====================================================================
   CARGA DE DATOS DE PRUEBA (datos.json)
   ===================================================================== */
S.semilla = {estado:"pendiente", detalle:""};

async function cargarSemilla(){
  const url = new URL("datos.json?v=" + Date.now(), location.href).href;
  let r;
  try { r = await fetch(url, {cache:"no-store"}); }
  catch(e){
    S.semilla = {estado:"error", detalle:
      "No se pudo pedir el archivo (" + e.message + "). Si abriste index.html con doble clic "
      + "desde tu computador, el navegador bloquea la lectura de archivos locales: "
      + "debe servirse desde GitHub Pages."};
    return 0;
  }
  if (!r.ok){
    S.semilla = {estado:"error", detalle:
      "El servidor respondió " + r.status + " al pedir " + url
      + ". Verifica que datos.json esté en la raíz del repositorio, junto a index.html."};
    return 0;
  }
  let d;
  try { d = await r.json(); }
  catch(e){
    S.semilla = {estado:"error", detalle:
      "El archivo se descargó pero no es JSON válido. Vuelve a subir datos.json."};
    return 0;
  }
  const lista = d.riesgos || [];
  if (!lista.length){
    S.semilla = {estado:"error", detalle:"datos.json no contiene riesgos."};
    return 0;
  }
  try {
    lista.forEach(x => {
      x.codigo = x.codigoOriginal || x.id;
      x.frecuencia = x.frecuencia ?? "";
      S.riesgos.push(x);
    });
    /* Una sola escritura en lugar de 235 */
    Store.local.riesgos = Object.fromEntries(lista.map(x => [x.id, x]));
    Store.flush();
    if (Store.db) for (const x of lista) await Store.set("riesgos", x.id, x);
  } catch(e){
    S.semilla = {estado:"error", detalle:
      "Los riesgos se leyeron pero no se pudieron guardar: " + e.message
      + ". Si dice QuotaExceeded, el almacenamiento del navegador está lleno."};
    return lista.length;
  }
  S.semilla = {estado:"ok", detalle: lista.length + " riesgos cargados"};
  return lista.length;
}

async function recargarSemilla(){
  S.riesgos = []; Store.local.riesgos = {}; Store.flush();
  await cargarSemilla(); render();
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */
/* Si el arranque falla, se muestra el motivo en pantalla con una salida,
   en lugar de dejar la página en blanco. */
function mostrarFalla(e){
  console.error(e);
  const v = document.getElementById("view");
  const nav = document.getElementById("nav");
  if (nav && !nav.children.length) nav.innerHTML = "";
  if (!v) return;
  v.innerHTML = `<div class="card" style="max-width:720px">
    <header><h2>La aplicación no pudo iniciar</h2></header>
    <div class="body">
      <p class="just" style="margin-top:0">Lo más común es que el navegador tenga guardados
        datos de una versión anterior del prototipo que la versión actual no reconoce.
        Reiniciar los datos de prueba lo resuelve: se borra lo guardado en este navegador y se
        vuelven a cargar los 235 riesgos del consolidado.</p>
      <div class="calc mono" style="font-size:11.5px;white-space:pre-wrap;margin:11px 0">${
        String(e && (e.stack || e.message) || e).replace(/[<>&]/g, c =>
          ({"<":"&lt;",">":"&gt;","&":"&amp;"}[c])).slice(0, 900)}</div>
      <button class="btn" id="fallaReset">Reiniciar los datos de prueba</button>
      <button class="btn ghost" id="fallaRecargar" style="margin-left:7px">Volver a intentar</button>
    </div></div>`;
  const r = document.getElementById("fallaReset");
  if (r) r.onclick = () => { try { localStorage.removeItem("mriesgos"); } catch(_){}; location.reload(); };
  const k = document.getElementById("fallaRecargar");
  if (k) k.onclick = () => location.reload();
}
window.addEventListener("error", ev => { if (!window.__arrancado) mostrarFalla(ev.error || ev.message); });
window.addEventListener("unhandledrejection", ev => { if (!window.__arrancado) mostrarFalla(ev.reason); });

(async function(){
  await Store.init();
  S.riesgos   = await Store.get("riesgos");
  if (!S.riesgos.length) await cargarSemilla();
  S.usuarios  = await Store.get("usuarios");
  S.ventanas  = await Store.get("ventanas");
  S.historico = await Store.get("historico");
  S.seguimientos = await Store.get("seguimientos");
  S.monitoreos   = await Store.get("monitoreos");
  S.internos     = await Store.get("internos");
  S.evaluaciones = await Store.get("evaluaciones");
  S.monitoreoBD  = await Store.get("monitoreoBD");
  S.solicitudes  = await Store.get("solicitudes");
  const md = await Store.get("madurez");
  S.madurezResp = (md[0] && md[0].resp) || {};
  S.periodo = periodoActual();
  /* Con un único proceso a cargo, el filtro arranca fijado en él */
  const mp = misProcesos();
  if (mp && mp.length === 1) S.filtros.proceso = mp[0];
  S.sesion = {nombre:"Administrador", rol:"ADMIN", procesos:[]};
  render();
  window.__arrancado = true;
})().catch(mostrarFalla);
