/* =====================================================================
   Evidencias, exportación a Excel e informe imprimible en PDF.
   ===================================================================== */

/* =====================================================================
   EVIDENCIAS
   El archivo se envía a un Web App de Google Apps Script publicado por la
   entidad, que lo guarda en el Drive institucional con el nombre acordado.
   Si no hay punto de recepción configurado, queda registrado el nombre y
   el archivo se conserva en el navegador hasta que se configure.
   ===================================================================== */
function driveURL(){ try { return localStorage.getItem("driveURL") || ""; } catch(e){ return ""; } }
function setDriveURL(v){ try { localStorage.setItem("driveURL", v || ""); } catch(e){} }

function leerArchivo(file){
  return new Promise((ok, err) => {
    const fr = new FileReader();
    fr.onload = () => ok(fr.result.split(",")[1]);
    fr.onerror = () => err(new Error("No se pudo leer el archivo"));
    fr.readAsDataURL(file);
  });
}

async function subirEvidencia(file, riesgo, periodo, tipo){
  const url = driveURL();
  const base64 = await leerArchivo(file);
  const ruta = rutaEvidencia(riesgo, periodo, file.name);
  if (!url){
    return {ok:false, motivo:"sin_configurar", nombre:ruta.archivo,
            carpeta:ruta.carpeta, tam:file.size};
  }
  /* text/plain evita la petición previa de CORS, que Apps Script no atiende */
  const r = await fetch(url, {
    method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"},
    body: JSON.stringify({
      periodo, proceso: riesgo.proceso, dependencia: riesgo.unidad,
      codigoRiesgo: riesgo.codigo, tipo,
      nombreOriginal: file.name, mime: file.type || "application/octet-stream",
      contenido: base64
    })
  });
  const d = await r.json();
  if (!d || d.error) throw new Error(d?.error || "Respuesta inesperada del servidor");
  return {ok:true, ...d};
}


/* =====================================================================
   PARAMETRIZACIÓN DE CALIDAD DE LOS REPORTES
   Todo documento sale con el logo de la entidad y el bloque de código,
   versión y fecha de aprobación que corresponde a su tipo de formato.
   ===================================================================== */
function encabezadoCalidad(codFormato, subtitulo){
  const f = formato(codFormato) || {};
  const logo = logoEntidad();
  return `<header class="rep-cal">
    <div class="rep-logo">${logo
      ? `<img src="${esc(logo)}" alt="${esc(CAT.entidad.nombre)}">`
      : `<div class="rep-logo-falta">${esc(CAT.entidad.nombre)}</div>`}</div>
    <div class="rep-cal-t">
      <div class="rep-tit">${esc(f.titulo || "")}</div>
      ${subtitulo ? `<div class="rep-sub2">${esc(subtitulo)}</div>` : ""}
    </div>
    <table class="rep-cal-d"><tbody>
      <tr><td>Código</td><td class="mono">${esc(f.codigo || "Sin asignar")}</td></tr>
      <tr><td>Versión</td><td class="mono">${esc(f.version || "—")}</td></tr>
      <tr><td>Aprobación</td><td class="mono">${esc(f.fecha || "—")}</td></tr>
    </tbody></table>
  </header>`;
}

/* Bloque de firmas al cierre del documento */
function bloqueFirmas(){
  return `<section class="rep-firmas">
    <div><div class="rep-linea"></div>Firma</div>
    <div><div class="rep-linea"></div>Nombre</div>
    <div><div class="rep-linea"></div>Cargo</div>
  </section>`;
}

/* Pie con fecha y hora de generación, repetido en todas las hojas */
function pieCalidad(){
  const ahora = new Date().toLocaleString("es-CO",
    {dateStyle:"short", timeStyle:"short"});
  return `<div class="rep-pie-fijo">${esc(CAT.entidad.nombre)} ·
    ${esc(CAT.entidad.sistema)} · Generado el ${esc(ahora)}</div>`;
}

/* Abre el diálogo de impresión con un documento ya compuesto */
function imprimirDocumento(codFormato, cuerpoHTML, opciones){
  const o = opciones || {};
  const cont = document.getElementById("informe");
  cont.innerHTML = encabezadoCalidad(codFormato, o.subtitulo)
    + cuerpoHTML
    + (o.firmas ? bloqueFirmas() : "")
    + pieCalidad();
  document.body.classList.add("modo-informe");
  if (o.vertical) document.body.classList.add("modo-vertical");
  window.print();
  setTimeout(() => {
    document.body.classList.remove("modo-informe", "modo-vertical");
    cont.innerHTML = "";
  }, 800);
}

/* Nombre de archivo a partir del formato */
function nombreArchivoFormato(codFormato, extra){
  const f = formato(codFormato) || {};
  const base = (f.titulo || codFormato).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base}${extra ? "-" + extra : ""}`;
}

/* =====================================================================
   EXPORTACIÓN
   ===================================================================== */
function descargar(nombre, contenido, mime){
  const blob = new Blob(["\ufeff" + contenido], {type: mime + ";charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* CSV con punto y coma: es lo que Excel en español abre sin pedir importación */
/* Primeras filas del archivo con la parametrización de calidad */
function filasCalidad(codFormato){
  const f = formato(codFormato) || {};
  return [
    [CAT.entidad.nombre],
    [CAT.entidad.sistema],
    [f.titulo || ""],
    ["Tipo de reporte", f.tipo || ""],
    ["Código", f.codigo || "", "Versión", f.version || "",
     "Fecha de aprobación", f.fecha || ""],
    ["Generado", new Date().toLocaleString("es-CO")],
    []
  ];
}

function aCSV(cabeceras, filas, codFormato){
  const q = v => {
    const t = (v ?? "").toString().replace(/"/g, '""').replace(/\r?\n/g, " ");
    return /[";]/.test(t) ? `"${t}"` : t;
  };
  const previas = codFormato ? filasCalidad(codFormato).map(f => f.map(q).join(";")) : [];
  return [...previas, cabeceras.map(q).join(";"),
          ...filas.map(f => f.map(q).join(";"))].join("\r\n");
}

function sufijoFiltros(){
  const f = S.filtros, p = [];
  if (f.macroproceso) p.push(macro(f.macroproceso)?.n);
  if (f.proceso) p.push(proc(f.proceso)?.n);
  if (f.unidad) p.push(uni(f.unidad)?.n);
  if (f.tipo) p.push(tipo(f.tipo)?.n);
  if (f.zona) p.push("Zona " + f.zona);
  return p.length ? " (" + p.join(", ") + ")" : "";
}

function exportarRiesgosCSV(){
  const rs = riesgosFiltrados();
  if (!rs.length) return aviso("Nada que exportar", "No hay riesgos con los filtros aplicados.");

  /* Cuántas columnas de control hace falta: tantas como el riesgo con más
     controles, para que ninguna información quede fuera del archivo. */
  const maxC = Math.max(1, ...rs.map(r => (r.controles || []).length));
  const cabC = [];
  for (let k = 1; k <= maxC; k++)
    cabC.push(`Control ${k}`, `Tipo ${k}`, `Implementación ${k}`, `Peso ${k}`,
              `Afectación ${k}`, `Documentación ${k}`, `Frecuencia ${k}`, `Evidencia ${k}`,
              `Diseño ${k}`);

  const cab = ["Identificador","Macroproceso","Proceso","Dependencia",
    "Tipo de riesgo","Clase de riesgo","Factores","Descripción del riesgo",
    "Causa raíz","Efecto inmediato","Área de impacto","Activo","Propiedad afectada",
    "Frecuencia anual","Probabilidad inherente","Impacto inherente","Zona inherente",
    "Nº de controles", ...cabC,
    "Multiplicador probabilidad","Multiplicador impacto",
    "Probabilidad residual","Impacto residual","Zona residual",
    "Tratamiento","Subestrategia","Plan de acción","Responsable del plan","Indicador (KRI)",
    "Fecha de cumplimiento",
    "Periodo","Resultado del indicador","Actividades ejecutadas","Soporte de ejecución",
    "Estado de la acción",
    "Monitoreo: descripción conforme","Monitoreo: control conforme","Monitoreo: control eficaz",
    "Monitoreo: se materializó","Monitoreo: instancia","Monitoreo: recomendaciones",
    "CI: actividades verificadas","CI: se materializó","CI: justificación",
    "CI: acciones correctivas","CI: soporte",
    "Estado del riesgo","Pendientes de revisión"];

  const filas = rs.map(r => {
    const res = Motor.residual(r.probabilidadPct || 0, r.impactoPct || 0, r.controles || []);
    const ctrl = [];
    for (let k = 0; k < maxC; k++){
      const c = (r.controles || [])[k];
      if (!c){ ctrl.push("", "", "", "", "", "", "", "", ""); continue; }
      const e = S.evaluaciones.find(x => x.controlId === r.id + ":" + k && x.periodo === S.periodo);
      ctrl.push([c.responsable, c.accion, c.complemento].filter(Boolean).join(" "),
        c.tipo, c.implementacion, pct(Motor.pesoControl(c.tipo, c.implementacion)),
        Motor.afectacion(c.tipo), c.documentacion || "", c.frecuencia || "", c.evidencia || "",
        e ? `${e.calificacion} (${pct(e.total)})` : "");
    }
    const g = S.seguimientos.find(x => x.riesgoId === r.id && x.periodo === S.periodo) || {};
    const m = S.monitoreos.find(x => x.riesgoId === r.id && x.periodo === S.periodo) || {};
    const ci = S.internos.find(x => x.riesgoId === r.id && x.periodo === S.periodo) || {};

    return [r.codigo, macro(proc(r.proceso)?.m)?.n, proc(r.proceso)?.n, uni(r.unidad)?.n,
      tipo(r.tipo)?.n, r.clase || "",
      (r.factores || []).join(" | "), r.descripcion,
      r.causaRaiz || "", r.efectoInmediato || "", r.areaImpacto || r.areaFiscal || "",
      r.activo || "", r.propiedadSD || "",
      r.frecuencia ?? "", pct(r.probabilidadPct || 0), pct(r.impactoPct || 0), r.zonaInherente,
      (r.controles || []).length, ...ctrl,
      res.multP.toFixed(4), res.multI.toFixed(4),
      pct(r.probResidual || 0), pct(r.impResidual || 0), r.zonaResidual,
      r.tratamiento || "", r.subestrategia || "", r.planAccion || "", r.responsablePlan || "",
      r.kri || "", r.fechaPlan || "",
      S.periodo, g.resultado || "", g.actividades || "", g.soporte || "", g.estadoAccion || "",
      m.descripcionConforme || "", m.controlConforme || "", m.controlEficaz || "",
      m.materializo || "", m.instancia || "", m.recomendaciones || "",
      ci.actividades || "", ci.materializo || "", ci.justificacion || "",
      ci.accionesCorrectivas || "", ci.soporteAccion || "",
      r.estado, (r.revisar || []).join(" | ")];
  });
  descargar(`${nombreArchivoFormato("INVENTARIO_RIESGOS")}${sufijoFiltros()}.csv`,
    aCSV(cab, filas, "INVENTARIO_RIESGOS"), "text/csv");
}

/* El inventario de controles se entrega únicamente en PDF */
function informeControles(){
  const rs = riesgosFiltrados();
  const fa = filtrosAplicados();
  const total = rs.reduce((a, r) => a + (r.controles || []).length, 0);
  return `<section class="rep-s">
    <table class="rep-t rep-mini"><tbody>
      <tr><td>Riesgos incluidos</td><td class="num">${rs.length}</td></tr>
      <tr><td>Controles registrados</td><td class="num">${total}</td></tr>
      ${fa.length ? fa.map(([k, v]) => `<tr><td>Filtro · ${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")
        : `<tr><td>Filtros aplicados</td><td>Ninguno: inventario completo</td></tr>`}
    </tbody></table>
  </section>
  <section class="rep-s">
    <table class="rep-t"><thead><tr>
      <th style="width:105px">Riesgo</th><th style="width:34px">N.º</th>
      <th>Descripción del control</th>
      <th style="width:74px">Tipo</th><th style="width:78px">Implementación</th>
      <th style="width:52px" class="num">Peso</th><th style="width:78px">Afecta</th>
      <th style="width:96px">Periodicidad</th>
    </tr></thead><tbody>
    ${rs.flatMap(r => (r.controles || []).map((c, k) => `<tr>
      <td class="mono">${k === 0 ? esc(r.codigo) : ""}</td>
      <td class="num">${k + 1}</td>
      <td class="just">${esc([c.responsable, c.accion, c.periodicidad, c.complemento]
        .filter(Boolean).join(" "))}</td>
      <td>${esc(c.tipo)}</td><td>${esc(c.implementacion)}</td>
      <td class="num">${pct(Motor.pesoControl(c.tipo, c.implementacion))}</td>
      <td>${esc(Motor.afectacion(c.tipo))}</td>
      <td>${esc(c.periodicidad || "—")}</td>
    </tr>`)).join("") || `<tr><td colspan="8">Sin controles registrados.</td></tr>`}
    </tbody></table>
  </section>`;
}

function exportarControlesPDF(){
  const rs = riesgosFiltrados();
  if (!rs.some(r => (r.controles || []).length))
    return aviso("Nada que imprimir", "No hay controles con los filtros aplicados.");
  imprimirDocumento("INVENTARIO_CONTROLES", informeControles());
}

function exportarControlesCSV(){
  const rs = riesgosFiltrados();
  const cab = ["Identificador del riesgo","Proceso","Nº control","Descripción del control",
    "Tipo","Implementación","Peso","Afectación","Documentación","Frecuencia","Evidencia"];
  const filas = [];
  rs.forEach(r => (r.controles || []).forEach((c, k) => filas.push([
    r.codigo, proc(r.proceso)?.n, k + 1,
    [c.responsable, c.accion, c.complemento].filter(Boolean).join(" "),
    c.tipo, c.implementacion, pct(Motor.pesoControl(c.tipo, c.implementacion)),
    Motor.afectacion(c.tipo), c.documentacion, c.frecuencia, c.evidencia])));
  if (!filas.length) return aviso("Nada que exportar", "No hay controles con los filtros aplicados.");
  descargar(`${nombreArchivoFormato("INVENTARIO_CONTROLES")}${sufijoFiltros()}.csv`,
    aCSV(cab, filas, "INVENTARIO_CONTROLES"), "text/csv");
}

function exportarResumenCSV(){
  const rs = riesgosFiltrados();
  if (!rs.length) return aviso("Nada que exportar", "No hay riesgos con los filtros aplicados.");
  const ord = {Bajo:1, Moderado:2, Alto:3, Extremo:4};
  const cab = ["Agrupación","Categoría","Riesgos","Bajo","Moderado","Alto","Extremo",
    "Alto o Extremo","% crítico","Bajaron de zona","% reducidos"];
  const filas = [];
  const bloque = (etiqueta, keyFn, nameFn) => {
    agrupar(rs, keyFn, nameFn).forEach(g => {
      const sub = rs.filter(r => nameFn(keyFn(r)) === g.nombre);
      const crit = g.Alto + g.Extremo;
      const baj = sub.filter(r => ord[r.zonaResidual] < ord[r.zonaInherente]).length;
      filas.push([etiqueta, g.nombre, g.total, g.Bajo, g.Moderado, g.Alto, g.Extremo,
        crit, g.total ? Math.round(crit / g.total * 100) + "%" : "0%",
        baj, g.total ? Math.round(baj / g.total * 100) + "%" : "0%"]);
    });
  };
  bloque("Macroproceso", r => proc(r.proceso)?.m, k => macro(k)?.n || k);
  bloque("Proceso", r => r.proceso, k => proc(k)?.n || k);
  bloque("Dependencia", r => r.unidad, k => uni(k)?.n || k);
  bloque("Tipo de riesgo", r => r.tipo, k => tipo(k)?.n || k);
  descargar(`${nombreArchivoFormato("INFORME_GENERAL")}${sufijoFiltros()}.csv`,
    aCSV(cab, filas, "INFORME_GENERAL"), "text/csv");
}

function exportarSeguimientoCSV(){
  const cab = ["Periodo","Identificador","Proceso","Dependencia","Indicador (KRI)",
    "Resultado de la medición","Actividades del plan","Soporte","Estado de la acción"];
  const filas = S.seguimientos.map(x => {
    const r = S.riesgos.find(y => y.id === x.riesgoId) || {};
    return [x.periodo, r.codigo, proc(r.proceso)?.n, uni(r.unidad)?.n,
      r.kri, x.resultado, x.actividades, x.soporte, x.estadoAccion];
  });
  if (!filas.length) return aviso("Nada que exportar", "Todavía no hay reportes de seguimiento.");
  descargar("seguimiento.csv", aCSV(cab, filas), "text/csv");
}


/* =====================================================================
   INFORME COMPLETO PARA PDF
   Arma un documento con portada, filtros aplicados, indicadores,
   gráficas, mapas de calor y el detalle de todos los riesgos en orden.
   Se imprime desde el navegador: no requiere librerías externas.
   ===================================================================== */
function filtrosAplicados(){
  const f = S.filtros, out = [];
  if (f.macroproceso) out.push(["Macroproceso", macro(f.macroproceso)?.n]);
  if (f.proceso)      out.push(["Proceso", proc(f.proceso)?.n]);
  if (f.unidad)       out.push(["Dependencia", uni(f.unidad)?.n]);
  if (f.tipo)         out.push(["Tipo de riesgo", tipo(f.tipo)?.n]);
  if (f.zona)         out.push(["Zona residual", f.zona]);
  return out;
}

function tablaAgrupada(titulo, grupos){
  if (!grupos.length) return "";
  const tot = grupos.reduce((a, g) => a + g.total, 0);
  return `<h3 class="rep-h3">${esc(titulo)}</h3>
  <table class="rep-t"><thead><tr>
    <th>${esc(titulo)}</th><th class="num">Riesgos</th><th class="num">Bajo</th>
    <th class="num">Moderado</th><th class="num">Alto</th><th class="num">Extremo</th>
    <th class="num">% crítico</th><th>Distribución</th>
  </tr></thead><tbody>
  ${grupos.map(g => `<tr>
    <td>${esc(g.nombre)}</td>
    <td class="num">${g.total}</td><td class="num">${g.Bajo}</td><td class="num">${g.Moderado}</td>
    <td class="num">${g.Alto}</td><td class="num">${g.Extremo}</td>
    <td class="num">${g.total ? Math.round((g.Alto + g.Extremo) / g.total * 100) : 0}%</td>
    <td style="width:170px"><div class="bar-track" style="height:11px">
      ${["Bajo","Moderado","Alto","Extremo"].map(z => g[z]
        ? `<div class="bar-seg" style="width:${(g[z] / g.total * 100).toFixed(1)}%;background:${ZCOL[z]}"></div>`
        : "").join("")}</div></td>
  </tr>`).join("")}
  <tr class="rep-tot"><td>Total</td><td class="num">${tot}</td>
    <td class="num">${grupos.reduce((a, g) => a + g.Bajo, 0)}</td>
    <td class="num">${grupos.reduce((a, g) => a + g.Moderado, 0)}</td>
    <td class="num">${grupos.reduce((a, g) => a + g.Alto, 0)}</td>
    <td class="num">${grupos.reduce((a, g) => a + g.Extremo, 0)}</td>
    <td class="num"></td><td></td></tr>
  </tbody></table>`;
}

function construirInforme(){
  const rs = riesgosFiltrados();
  const ord = {Bajo:1, Moderado:2, Alto:3, Extremo:4};
  const crit = rs.filter(r => ["Alto","Extremo"].includes(r.zonaResidual)).length;
  const baj = rs.filter(r => ord[r.zonaResidual] < ord[r.zonaInherente]).length;
  const ctrl = rs.reduce((a, r) => a + (r.controles || []).length, 0);
  const fa = filtrosAplicados();
  const hoy = new Date().toLocaleString("es-CO", {dateStyle:"long", timeStyle:"short"});

  let html = `
  <header class="rep-cab">
    <div>
      <h1>Mapa de Riesgos Institucional</h1>
      <p>Gobernación de Santander · Guía para la Gestión Integral del Riesgo, versión 7</p>
    </div>
    <div class="rep-meta">
      <div>Generado: ${esc(hoy)}</div>
      <div>Periodo: ${esc(S.periodo || "—")}</div>
      <div>Emitido por: ${esc(S.sesion?.nombre || "—")}</div>
    </div>
  </header>

  <section class="rep-s">
    <h2 class="rep-h2">1. Alcance del informe</h2>
    <table class="rep-t rep-mini"><tbody>
      <tr><td>Riesgos incluidos</td><td class="num">${rs.length}</td></tr>
      <tr><td>Riesgos vigentes en el sistema</td>
        <td class="num">${S.riesgos.filter(r => r.estado !== "OBSOLETO").length}</td></tr>
      ${fa.length ? fa.map(([k, v]) => `<tr><td>Filtro · ${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")
        : `<tr><td>Filtros aplicados</td><td>Ninguno: informe del inventario completo</td></tr>`}
    </tbody></table>
  </section>

  <section class="rep-s">
    <h2 class="rep-h2">2. Indicadores</h2>
    <div class="rep-kpis">
      <div class="rep-k"><b>${rs.length}</b><span>Riesgos</span></div>
      <div class="rep-k"><b>${crit}</b><span>En zona Alto o Extremo</span>
        <i>${rs.length ? Math.round(crit / rs.length * 100) : 0}% del total</i></div>
      <div class="rep-k"><b>${baj}</b><span>Bajaron de zona</span>
        <i>${rs.length ? Math.round(baj / rs.length * 100) : 0}% tras controles</i></div>
      <div class="rep-k"><b>${ctrl}</b><span>Controles</span>
        <i>${rs.length ? (ctrl / rs.length).toFixed(1) : 0} por riesgo</i></div>
    </div>
  </section>

  <section class="rep-s">
    <h2 class="rep-h2">3. Distribución del riesgo residual</h2>
    ${tablaAgrupada("Macroproceso", agrupar(rs, r => proc(r.proceso)?.m, k => macro(k)?.n || k))}
    ${tablaAgrupada("Proceso", agrupar(rs, r => r.proceso, k => proc(k)?.n || k))}
    ${tablaAgrupada("Dependencia", agrupar(rs, r => r.unidad, k => uni(k)?.n || k))}
    ${tablaAgrupada("Tipo de riesgo", agrupar(rs, r => r.tipo, k => tipo(k)?.n || k))}
    ${tablaAgrupada("Tratamiento", agrupar(rs, r => r.tratamiento || "Sin definir", k => k))}
  </section>

  <section class="rep-s rep-brk">
    <h2 class="rep-h2">4. Mapa de calor</h2>
    <div class="rep-heats">
      <div><h3 class="rep-h3">Riesgo inherente</h3>${mapaCalor(rs, "inh")}</div>
      <div><h3 class="rep-h3">Riesgo residual</h3>${mapaCalor(rs, "res")}</div>
    </div>
    <p class="rep-n">El eje vertical corresponde al impacto y el horizontal a la probabilidad.
    Cada celda indica cuántos riesgos se ubican en esa combinación.</p>
  </section>

  <section class="rep-s rep-brk">
    <h2 class="rep-h2">5. Inventario de riesgos</h2>
    <p class="rep-n">Ordenado por macroproceso, proceso, dependencia e identificador.</p>
    <table class="rep-t"><thead><tr>
      <th>Identificador</th><th>Riesgo</th><th>Proceso y dependencia</th>
      <th>Tipo</th><th class="num">P inh.</th><th class="num">I inh.</th><th>Inherente</th>
      <th class="num">Ctrl</th><th class="num">P res.</th><th class="num">I res.</th>
      <th>Residual</th><th>Tratamiento</th>
    </tr></thead><tbody>
    ${rs.map(r => `<tr>
      <td class="mono">${esc(r.codigo)}</td>
      <td class="just" style="min-width:200px;max-width:300px">${esc(r.descripcion)}</td>
      <td>${esc(proc(r.proceso)?.n || "")}<br><span class="rep-sub">${esc(uni(r.unidad)?.n || "")}</span></td>
      <td>${esc(tipo(r.tipo)?.n || "")}</td>
      <td class="num">${pct(r.probabilidadPct || 0)}</td>
      <td class="num">${pct(r.impactoPct || 0)}</td>
      <td><span class="zone ${r.zonaInherente}">${esc(r.zonaInherente || "—")}</span></td>
      <td class="num">${(r.controles || []).length}</td>
      <td class="num">${pct(r.probResidual || 0)}</td>
      <td class="num">${pct(r.impResidual || 0)}</td>
      <td><span class="zone ${r.zonaResidual}">${esc(r.zonaResidual || "—")}</span></td>
      <td>${esc(r.tratamiento || "—")}${r.subestrategia ? "<br><span class='rep-sub'>" + esc(r.subestrategia) + "</span>" : ""}</td>
    </tr>`).join("")}
    </tbody></table>
  </section>

  <section class="rep-s rep-brk">
    <h2 class="rep-h2">6. Controles</h2>
    <table class="rep-t"><thead><tr>
      <th>Riesgo</th><th>Nº</th><th>Descripción del control</th>
      <th>Tipo</th><th>Implementación</th><th class="num">Peso</th><th>Afecta</th><th>Diseño</th>
    </tr></thead><tbody>
    ${rs.flatMap(r => (r.controles || []).map((c, k) => {
      const e = S.evaluaciones.find(x => x.controlId === r.id + ":" + k && x.periodo === S.periodo);
      return `<tr>
        <td class="mono">${k === 0 ? esc(r.codigo) : ""}</td>
        <td class="num">${k + 1}</td>
        <td class="just" style="min-width:220px;max-width:340px">${esc([c.responsable, c.accion, c.complemento].filter(Boolean).join(" "))}</td>
        <td>${esc(c.tipo)}</td><td>${esc(c.implementacion)}</td>
        <td class="num">${pct(Motor.pesoControl(c.tipo, c.implementacion))}</td>
        <td>${esc(Motor.afectacion(c.tipo))}</td>
        <td>${e ? esc(e.calificacion) + " (" + pct(e.total) + ")" : "—"}</td>
      </tr>`;
    })).join("") || `<tr><td colspan="8">Sin controles registrados.</td></tr>`}
    </tbody></table>
  </section>`;

  /* Sección del ciclo trimestral, solo si hay algo reportado */
  const conCiclo = rs.filter(r =>
    S.seguimientos.some(x => x.riesgoId === r.id && x.periodo === S.periodo) ||
    S.monitoreos.some(x => x.riesgoId === r.id && x.periodo === S.periodo) ||
    S.internos.some(x => x.riesgoId === r.id && x.periodo === S.periodo));

  if (conCiclo.length){
    html += `<section class="rep-s rep-brk">
      <h2 class="rep-h2">7. Ciclo trimestral · ${esc(S.periodo)}</h2>
      <table class="rep-t"><thead><tr>
        <th>Riesgo</th><th>Resultado del indicador</th><th>Estado acción</th>
        <th>Descr. conforme</th><th>Ctrl. conforme</th><th>Ctrl. eficaz</th>
        <th>Materializó SIG</th><th>Materializó CI</th><th>Recomendaciones</th>
      </tr></thead><tbody>
      ${conCiclo.map(r => {
        const g = S.seguimientos.find(x => x.riesgoId === r.id && x.periodo === S.periodo) || {};
        const m = S.monitoreos.find(x => x.riesgoId === r.id && x.periodo === S.periodo) || {};
        const ci = S.internos.find(x => x.riesgoId === r.id && x.periodo === S.periodo) || {};
        const dis = m.materializo && ci.materializo && m.materializo !== ci.materializo;
        return `<tr${dis ? ' class="rep-dis"' : ""}>
          <td class="mono">${esc(r.codigo)}</td>
          <td>${esc(g.resultado || "—")}</td><td>${esc(g.estadoAccion || "—")}</td>
          <td>${esc(m.descripcionConforme || "—")}</td><td>${esc(m.controlConforme || "—")}</td>
          <td>${esc(m.controlEficaz || "—")}</td>
          <td>${esc(m.materializo || "—")}</td><td>${esc(ci.materializo || "—")}</td>
          <td class="just" style="max-width:220px">${esc(m.recomendaciones || "")}</td>
        </tr>`;
      }).join("")}
      </tbody></table>
      <p class="rep-n">Las filas resaltadas corresponden a riesgos donde el criterio de la Dirección
      SIG y el de Control Interno sobre la materialización no coinciden.</p>
    </section>`;
  }

  const pend = rs.filter(r => (r.revisar || []).length);
  if (pend.length){
    html += `<section class="rep-s rep-brk">
      <h2 class="rep-h2">${conCiclo.length ? 8 : 7}. Pendientes de revisión</h2>
      <table class="rep-t"><thead><tr><th>Riesgo</th><th>Situación</th></tr></thead><tbody>
      ${pend.map(r => `<tr><td class="mono">${esc(r.codigo)}</td>
        <td class="just">${r.revisar.map(x => esc(x)).join("<br>")}</td></tr>`).join("")}
      </tbody></table></section>`;
  }

  html += `<footer class="rep-pie">Documento generado automáticamente por el sistema de gestión
    del riesgo. Los valores de probabilidad, impacto y zona se calculan con los parámetros vigentes
    de la Guía para la Gestión Integral del Riesgo, versión 7.</footer>`;

  return html;
}

const FORMATO_DE_VISTA = {
  panel:"INFORME_GENERAL", riesgos:"INVENTARIO_RIESGOS",
  matriz:"MAPA_CALOR", madurez:"MADUREZ"
};

function exportarPDF(){
  const cod = FORMATO_DE_VISTA[S.vista] || "INFORME_GENERAL";
  if (S.vista === "madurez") return imprimirDocumento(cod, informeMadurez(), {vertical:true});
  if (S.vista === "matriz")  return imprimirDocumento(cod, informeMapaCalor());
  const cont = document.getElementById("informe");
  cont.innerHTML = encabezadoCalidad(cod) + construirInforme() + pieCalidad();
  document.body.classList.add("modo-informe");
  window.print();
  setTimeout(() => {
    document.body.classList.remove("modo-informe");
    cont.innerHTML = "";
  }, 800);
}


/* =====================================================================
   INFORMES ESPECÍFICOS
   ===================================================================== */
function informeMapaCalor(){
  const rs = riesgosFiltrados();
  const fa = filtrosAplicados();
  return `<section class="rep-s">
    <table class="rep-t rep-mini"><tbody>
      <tr><td>Riesgos incluidos</td><td class="num">${rs.length}</td></tr>
      ${fa.length ? fa.map(([k, v]) => `<tr><td>Filtro · ${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")
        : `<tr><td>Filtros aplicados</td><td>Ninguno: inventario completo</td></tr>`}
    </tbody></table>
  </section>
  <section class="rep-s">
    <div class="rep-heats">
      <div><h3 class="rep-h3">Riesgo inherente</h3>${mapaCalor(rs, "inh")}</div>
      <div><h3 class="rep-h3">Riesgo residual</h3>${mapaCalor(rs, "res")}</div>
    </div>
    <p class="rep-n">El eje vertical corresponde al impacto y el horizontal a la probabilidad.
    Cada celda indica cuántos riesgos se ubican en esa combinación.</p>
  </section>
  <section class="rep-s">
    <h2 class="rep-h2">Distribución por zona</h2>
    ${tablaAgrupada("Macroproceso", agrupar(rs, r => proc(r.proceso)?.m, k => macro(k)?.n || k))}
    ${tablaAgrupada("Proceso", agrupar(rs, r => r.proceso, k => proc(k)?.n || k))}
  </section>`;
}

function informeMadurez(){
  const ind = indiceMadurez(), niv = nivelMadurez(ind), av = avanceMadurez();
  return `<section class="rep-s">
    <table class="rep-t rep-mini"><tbody>
      <tr><td>Índice general de madurez</td><td class="num"><b>${num1(ind)}</b></td></tr>
      <tr><td>Nivel alcanzado</td><td>${niv ? niv.n : "—"}</td></tr>
      <tr><td>Puntos calificados</td><td class="num">${av.hechos} de ${av.total}</td></tr>
    </tbody></table>
    ${niv ? `<p class="rep-n">${esc(niv.d)}</p>` : ""}
  </section>

  <section class="rep-s">
    <h2 class="rep-h2">Resultado por componente</h2>
    <table class="rep-t"><thead><tr>
      <th>Componente</th><th class="num">Peso</th><th class="num">Nota</th><th>Nivel</th>
    </tr></thead><tbody>
    ${CAT.madurez.map((d, di) => {
      const v = notaComponente(di), nv = nivelMadurez(v);
      return `<tr><td>${esc(d.n)}</td><td class="num">${(d.peso * 100).toFixed(0)}%</td>
        <td class="num">${num1(v)}</td><td>${nv ? nv.n : "—"}</td></tr>`;
    }).join("")}
    <tr class="rep-tot"><td>Madurez del Sistema Integral de Administración del Riesgo</td>
      <td class="num">100%</td><td class="num"><b>${num1(ind)}</b></td>
      <td>${niv ? niv.n : "—"}</td></tr>
    </tbody></table>
  </section>

  <section class="rep-s rep-brk">
    <h2 class="rep-h2">Detalle por punto de reflexión</h2>
    <table class="rep-t"><thead><tr>
      <th style="width:150px">Componente</th><th style="width:170px">Principio</th>
      <th>Punto de reflexión</th><th class="num">Calif.</th><th style="width:90px">Grado</th>
    </tr></thead><tbody>
    ${CAT.madurez.flatMap((d, di) => d.principios.flatMap((pr, pi) =>
      pr.puntos.map((pt, k) => {
        const v = S.madurezResp[claveMad(di, pi, k)];
        const g = CAT.madurezGrados.find(x => x.v === v);
        return `<tr>
          <td class="rep-sub">${pi === 0 && k === 0 ? esc(d.n) : ""}</td>
          <td class="rep-sub">${k === 0 ? esc(pr.n) : ""}</td>
          <td class="just">${esc(pt)}</td>
          <td class="num">${v ?? "—"}</td><td>${g ? esc(g.n) : "—"}</td></tr>`;
      }))).join("")}
    </tbody></table>
  </section>`;
}

function informeMonitoreo(){
  const rs = conAlcance(S.riesgos.filter(r => r.estado !== "OBSOLETO"));
  const mon = id => S.monitoreos.find(x => x.riesgoId === id && x.periodo === S.periodo) || {};
  const rol = CAT.roles.find(x => x.c === S.sesion?.rol);
  const mat = rs.filter(r => mon(r.id).materializo === "Si").length;
  const noConf = rs.filter(r => {
    const m = mon(r.id);
    return m.descripcionConforme === "No" || m.controlConforme === "No" || m.controlEficaz === "No";
  }).length;

  return `<section class="rep-s">
    <table class="rep-t rep-mini"><tbody>
      <tr><td>Periodo evaluado</td><td>${esc(S.periodo)}</td></tr>
      <tr><td>Perfil que monitorea</td><td>${esc(rol ? rol.n : S.sesion?.rol || "")}</td></tr>
      <tr><td>Responsable</td><td>${esc(S.sesion?.nombre || "")}</td></tr>
      <tr><td>Riesgos monitoreados</td><td class="num">${rs.length}</td></tr>
      <tr><td>Riesgos materializados</td><td class="num">${mat}</td></tr>
      <tr><td>Hallazgos de no conformidad</td><td class="num">${noConf}</td></tr>
    </tbody></table>
  </section>

  <section class="rep-s">
    <h2 class="rep-h2">Resultado del monitoreo</h2>
    <table class="rep-t"><thead><tr>
      <th style="width:110px">Riesgo</th><th>Descripción</th>
      <th style="width:60px">Descr.<br>conforme</th><th style="width:60px">Control<br>conforme</th>
      <th style="width:55px">Control<br>eficaz</th><th style="width:60px">Se<br>materializó</th>
      <th style="width:180px">Recomendaciones</th>
    </tr></thead><tbody>
    ${rs.map(r => { const m = mon(r.id); return `<tr>
      <td class="mono">${esc(r.codigo)}</td>
      <td class="just">${esc(r.descripcion)}</td>
      <td>${esc(m.descripcionConforme || "—")}</td>
      <td>${esc(m.controlConforme || "—")}</td>
      <td>${esc(m.controlEficaz || "—")}</td>
      <td>${esc(m.materializo || "—")}</td>
      <td class="just">${esc(m.recomendaciones || "")}</td>
    </tr>`; }).join("")}
    </tbody></table>
  </section>`;
}

function certificadoSolicitud(sol){
  const d = diffSolicitud(sol);
  return `<section class="rep-s">
    <table class="rep-t rep-mini"><tbody>
      <tr><td>Operación solicitada</td><td>${esc(OP_SOLICITUD[sol.operacion].n)}</td></tr>
      <tr><td>Identificador del riesgo</td><td class="mono">${esc(sol.codigo)}</td></tr>
      <tr><td>Proceso</td><td>${esc(proc(sol.proceso)?.n || "")}</td></tr>
      <tr><td>Dependencia</td><td>${esc(uni(sol.unidad)?.n || "")}</td></tr>
      <tr><td>Solicitado por</td><td>${esc(sol.solicitadoPor)}</td></tr>
      <tr><td>Fecha de la solicitud</td>
        <td>${new Date(sol.solicitadoEn).toLocaleString("es-CO")}</td></tr>
      <tr><td>Estado</td><td>${esc(sol.estado)}</td></tr>
      ${sol.revisadoPor ? `<tr><td>Revisado por</td><td>${esc(sol.revisadoPor)}</td></tr>
      <tr><td>Fecha de la revisión</td>
        <td>${new Date(sol.revisadoEn).toLocaleString("es-CO")}</td></tr>` : ""}
    </tbody></table>
  </section>

  <section class="rep-s">
    <h2 class="rep-h2">Riesgo</h2>
    <p class="just">${esc(sol.propuesta.descripcion || "")}</p>
    <table class="rep-t"><tbody>
      <tr><td style="width:190px">Tipo de riesgo</td>
        <td>${esc(tipo(sol.propuesta.tipo)?.n || "")}</td></tr>
      <tr><td>Zona inherente</td><td>${esc(sol.propuesta.zonaInherente || "—")}</td></tr>
      <tr><td>Zona residual</td><td>${esc(sol.propuesta.zonaResidual || "—")}</td></tr>
      <tr><td>Tratamiento</td><td>${esc(sol.propuesta.tratamiento || "—")}</td></tr>
      <tr><td>Controles</td><td class="num">${(sol.propuesta.controles || []).length}</td></tr>
    </tbody></table>
  </section>

  ${sol.motivo ? `<section class="rep-s"><h2 class="rep-h2">Motivo</h2>
    <p class="just">${esc(sol.motivo)}</p></section>` : ""}

  ${d.length ? `<section class="rep-s"><h2 class="rep-h2">Cambios registrados</h2>
    <table class="rep-t"><thead><tr><th style="width:190px">Campo</th>
      <th>Valor anterior</th><th>Valor propuesto</th></tr></thead>
    <tbody>${d.map(x => `<tr><td>${esc(x.campo)}</td>
      <td class="just">${esc(x.antes)}</td><td class="just">${esc(x.ahora)}</td></tr>`).join("")}
    </tbody></table></section>` : ""}

  ${sol.observacion ? `<section class="rep-s"><h2 class="rep-h2">Observación de la revisión</h2>
    <p class="just">${esc(sol.observacion)}</p></section>` : ""}`;
}

function certificadoEvidencias(r, g){
  return `<section class="rep-s">
    <table class="rep-t rep-mini"><tbody>
      <tr><td>Periodo</td><td>${esc(g.periodo)}</td></tr>
      <tr><td>Identificador del riesgo</td><td class="mono">${esc(r.codigo)}</td></tr>
      <tr><td>Proceso</td><td>${esc(proc(r.proceso)?.n || "")}</td></tr>
      <tr><td>Dependencia</td><td>${esc(uni(r.unidad)?.n || "")}</td></tr>
      <tr><td>Reportado por</td><td>${esc(g.reportadoPor || "")}</td></tr>
      <tr><td>Fecha del reporte</td>
        <td>${new Date(g.reportadoEn || Date.now()).toLocaleString("es-CO")}</td></tr>
    </tbody></table>
    <p class="just" style="margin-top:9px">${esc(r.descripcion)}</p>
  </section>

  <section class="rep-s">
    <h2 class="rep-h2">Ejecución de los controles</h2>
    <table class="rep-t"><thead><tr><th style="width:38px">N.º</th>
      <th>Control</th><th>Descripción de la evidencia</th></tr></thead>
    <tbody>${(r.controles || []).map((c, k) => `<tr>
      <td class="num">${k + 1}</td>
      <td class="just">${esc([c.responsable, c.accion, c.periodicidad, c.complemento]
        .filter(Boolean).join(" "))}</td>
      <td class="just">${esc((g.controles || {})[k] || "Sin descripción")}</td>
    </tr>`).join("") || `<tr><td colspan="3">Sin controles registrados.</td></tr>`}
    </tbody></table>
  </section>

  ${r.kri ? `<section class="rep-s">
    <h2 class="rep-h2">Indicador clave de riesgo</h2>
    <table class="rep-t"><thead><tr><th>Indicador</th><th>Fórmula</th>
      <th class="num">Numerador</th><th class="num">Denominador</th>
      <th class="num">Resultado</th><th>Nivel</th></tr></thead>
    <tbody><tr><td class="just">${esc(r.kriNombre || "")}</td>
      <td class="mono">${esc(r.kri)}</td>
      <td class="num">${esc(g.kriNumerador ?? "")}</td>
      <td class="num">${esc(g.kriDenominador ?? "")}</td>
      <td class="num"><b>${esc(g.resultado || "—")}</b></td>
      <td>${esc(g.resultadoNivel || "—")}</td></tr></tbody></table>
  </section>` : ""}

  ${(r.plan || []).length ? `<section class="rep-s">
    <h2 class="rep-h2">Plan de implementación de controles</h2>
    <table class="rep-t"><thead><tr><th style="width:38px">N.º</th><th>Actividad</th>
      <th style="width:150px">Responsable</th><th style="width:85px">Fecha</th>
      <th>Acciones realizadas</th></tr></thead>
    <tbody>${(r.plan || []).map((a, k) => `<tr>
      <td class="num">${k + 1}</td><td class="just">${esc(a.actividad || "")}</td>
      <td class="just">${esc(a.responsable || "")}</td>
      <td class="mono">${esc(a.fecha || "")}</td>
      <td class="just">${esc((g.acciones || {})[k] || "Sin descripción")}</td>
    </tr>`).join("")}</tbody></table>
  </section>` : ""}`;
}


function exportarMadurezCSV(){
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
  descargar(nombreArchivoFormato("MADUREZ") + ".csv", aCSV(cab, filas, "MADUREZ"), "text/csv");
}

function exportarMapaCalorCSV(){
  const rs = riesgosFiltrados();
  if (!rs.length) return aviso("Nada que exportar", "No hay riesgos con los filtros aplicados.");
  const probs = CAT.probabilidad, imps = CAT.impacto;
  const cab = ["Momento","Impacto","% impacto", ...probs.map(p => `${p.n} (${pct(p.pct)})`), "Total"];
  const filas = [];
  [["Inherente","inh"], ["Residual","res"]].forEach(([et, modo]) => {
    [...imps].reverse().forEach(i => {
      const f = [et, i.n, pct(i.pct)];
      let tot = 0;
      probs.forEach(p => {
        const c = rs.filter(r => {
          const pp = modo === "inh" ? r.probabilidadPct : r.probResidual;
          const ii = modo === "inh" ? r.impactoPct : r.impResidual;
          if (pp == null || ii == null) return false;
          const cp = probs.reduce((a, b) => Math.abs(b.pct - pp) < Math.abs(a.pct - pp) ? b : a);
          const ci = imps.reduce((a, b) => Math.abs(b.pct - ii) < Math.abs(a.pct - ii) ? b : a);
          return cp.pct === p.pct && ci.pct === i.pct;
        }).length;
        f.push(c); tot += c;
      });
      f.push(tot); filas.push(f);
    });
  });
  descargar(`${nombreArchivoFormato("MAPA_CALOR")}${sufijoFiltros()}.csv`,
    aCSV(cab, filas, "MAPA_CALOR"), "text/csv");
}
