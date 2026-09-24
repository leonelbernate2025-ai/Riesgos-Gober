/* =====================================================================
   Madurez del SIAR, solicitudes de actualización y ciclo trimestral:
   reporte de ejecución, monitoreo, perfiles, modales y sesión.
   ===================================================================== */

/* =====================================================================
   MADUREZ DEL SIAR
   Estructura COSO ERM adaptada por Función Pública. Cada punto de reflexión
   se califica de 1 a 5; el principio promedia sus puntos, el componente
   promedia sus principios y el índice general pondera los componentes.
   ===================================================================== */
const claveMad = (d, p, k) => `${d}|${p}|${k}`;

function nivelMadurez(v){
  if (v == null || isNaN(v)) return null;
  return CAT.madurezNiveles.find(x => v <= x.hasta) || CAT.madurezNiveles[0];
}

/* Promedio de los puntos calificados de un principio */
function notaPrincipio(di, pi){
  const pr = CAT.madurez[di].principios[pi];
  const vals = pr.puntos.map((_, k) => S.madurezResp[claveMad(di, pi, k)])
    .filter(v => typeof v === "number");
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function notaComponente(di){
  const vals = CAT.madurez[di].principios.map((_, pi) => notaPrincipio(di, pi))
    .filter(v => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/* Índice general: promedio de los componentes ponderado por su peso */
function indiceMadurez(){
  let suma = 0, peso = 0;
  CAT.madurez.forEach((d, di) => {
    const v = notaComponente(di);
    if (v != null){ suma += v * d.peso; peso += d.peso; }
  });
  return peso ? suma / peso : null;
}

function avanceMadurez(){
  const total = CAT.madurez.reduce((a, d) =>
    a + d.principios.reduce((b, p) => b + p.puntos.length, 0), 0);
  const hechos = Object.values(S.madurezResp).filter(v => typeof v === "number").length;
  return {hechos, total, pct: total ? hechos / total : 0};
}

const num1 = v => v == null ? "—" : v.toFixed(2).replace(/\.?0+$/, "");

async function guardarMadurez(){
  await Store.set("madurez", "actual", {resp:S.madurezResp,
    actualizadoPor:S.sesion?.nombre, actualizadoEn:new Date().toISOString()});
}

/* Gráfico radial de los cinco componentes, en SVG */
function radarMadurez(){
  const pts = CAT.madurez.map((d, di) => ({n:d.n, v:notaComponente(di)}));
  const cx = 150, cy = 140, R = 100, N = pts.length;
  const ang = i => (Math.PI * 2 * i / N) - Math.PI / 2;
  const xy = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];

  let rejilla = "";
  for (let a = 1; a <= 5; a++){
    const d = pts.map((_, i) => xy(i, R * a / 5).join(",")).join(" ");
    rejilla += `<polygon points="${d}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
  }
  pts.forEach((_, i) => {
    const [x, y] = xy(i, R);
    rejilla += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`;
  });

  const conNota = pts.every(p => p.v != null);
  const area = conNota
    ? `<polygon points="${pts.map((p, i) => xy(i, R * p.v / 5).join(",")).join(" ")}"
        fill="var(--accent)" fill-opacity="0.22" stroke="var(--accent)" stroke-width="2"/>`
    : "";
  const marcas = conNota ? pts.map((p, i) => {
    const [x, y] = xy(i, R * p.v / 5);
    return `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"/>`;
  }).join("") : "";

  const etiquetas = pts.map((p, i) => {
    const [x, y] = xy(i, R + 26);
    const anchor = Math.abs(x - cx) < 12 ? "middle" : (x > cx ? "start" : "end");
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="9"
      fill="var(--muted)">${esc(p.n.split(".")[0])}. ${esc(p.n.split(". ")[1]?.slice(0, 18) || "")}</text>
      <text x="${x}" y="${y + 11}" text-anchor="${anchor}" font-size="10" font-weight="600"
      fill="var(--ink)">${num1(p.v)}</text>`;
  }).join("");

  return `<svg viewBox="0 0 300 290" style="width:100%;max-width:330px;height:auto"
    role="img" aria-label="Gráfico radial de madurez por componente">
    ${rejilla}${area}${marcas}${etiquetas}</svg>`;
}

function vistaMadurez(){
  const ind = indiceMadurez();
  const niv = nivelMadurez(ind);
  const av = avanceMadurez();
  const puedeCalificar = ["ADMIN","MONITOREO"].includes(S.sesion?.rol);

  /* Detalle de un componente */
  if (S.madurezDim != null){
    const di = S.madurezDim, d = CAT.madurez[di];
    const nc = notaComponente(di), nvc = nivelMadurez(nc);
    return `<div class="stack">
      <div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">
        <button class="btn ghost sm" id="madVolver">Volver al resumen</button>
        <h2>${esc(d.n)}</h2>
        ${nc != null ? `<span class="zone ${nvc.z}">${num1(nc)} · ${nvc.n}</span>` : ""}
        <span class="tag">Peso ${(d.peso * 100).toFixed(0)}%</span>
      </div>

      ${!puedeCalificar ? `<div class="banner info"><span>&#9432;</span><div>Está consultando el
        autodiagnóstico. La calificación la registran el administrador y el perfil de
        Monitoreo de calidad.</div></div>` : ""}

      ${d.principios.map((pr, pi) => {
        const np = notaPrincipio(di, pi), nvp = nivelMadurez(np);
        return `<div class="card">
          <header><h2 style="font-size:13.5px">${esc(pr.n)}</h2>
            ${np != null ? `<span class="zone ${nvp.z}">${num1(np)} · ${nvp.n}</span>`
              : `<span class="tag">Sin calificar</span>`}</header>
          <div class="scroll-x"><table class="fija" style="min-width:760px">
            <colgroup><col style="width:56px"><col style="width:470px"><col style="width:230px"></colgroup>
            <thead><tr><th class="ctr">N.º</th><th>Punto de reflexión</th>
              <th>Grado de madurez</th></tr></thead>
            <tbody>${pr.puntos.map((pt, k) => {
              const v = S.madurezResp[claveMad(di, pi, k)];
              return `<tr>
                <td class="ctr mono">${k + 1}</td>
                <td><div class="just" style="font-size:12.5px">${esc(pt)}</div></td>
                <td><select data-mad="${claveMad(di, pi, k)}" autocomplete="off"
                  ${puedeCalificar ? "" : "disabled"}>
                  <option value="">Sin calificar</option>
                  ${CAT.madurezGrados.map(g =>
                    `<option value="${g.v}" ${v === g.v ? "selected" : ""}>${g.v}. ${g.n}</option>`).join("")}
                </select></td>
              </tr>`;
            }).join("")}</tbody></table></div>
        </div>`;
      }).join("")}
    </div>`;
  }

  /* Resumen general */
  return `<div class="stack">
    <div class="banner info"><span>&#9432;</span><div>Instrumento de autodiagnóstico basado en
      COSO ERM, adaptado por Función Pública. Se califica cada punto de reflexión de 1 a 5;
      el principio promedia sus puntos, el componente promedia sus principios y el índice general
      pondera los componentes según su peso.</div></div>

    <div class="grid2">
      <div class="card"><header><h2>Índice general de madurez</h2>
        <span class="tag">${av.hechos} de ${av.total} puntos calificados</span></header>
        <div class="body" style="text-align:center;padding:24px 15px">
          <div class="mono" style="font-size:52px;font-weight:300;line-height:1;
            letter-spacing:-.02em">${num1(ind)}</div>
          ${niv ? `<div style="margin-top:11px"><span class="zone ${niv.z}"
            style="font-size:14px;padding:5px 15px">${niv.n}</span></div>
            <p class="hint just" style="margin-top:11px">${esc(niv.d)}</p>` : ""}
          <div class="bar-track" style="height:7px;margin-top:15px">
            <div class="bar-seg" style="width:${(av.pct * 100).toFixed(1)}%;background:var(--accent)"></div>
          </div>
          <p class="hint" style="margin-top:6px">${(av.pct * 100).toFixed(0)}% del autodiagnóstico
            diligenciado</p>
        </div></div>

      <div class="card"><header><h2>Perfil por componente</h2></header>
        <div class="body" style="display:flex;justify-content:center">${radarMadurez()}</div></div>
    </div>

    <div class="card"><header><h2>Resumen de resultados</h2>
      <button class="btn ghost sm" id="madCsv">Exportar</button></header>
      <div class="scroll-x"><table class="fija" style="min-width:900px">
        <colgroup><col style="width:300px"><col style="width:80px"><col style="width:90px">
          <col style="width:130px"><col style="width:220px"><col style="width:100px"></colgroup>
        <thead><tr><th>Componente</th><th class="num">Peso</th><th class="num">Nota</th>
          <th class="ctr">Nivel</th><th>Principios</th><th class="ctr"></th></tr></thead>
        <tbody>${CAT.madurez.map((d, di) => {
          const v = notaComponente(di), nv = nivelMadurez(v);
          const cal = d.principios.filter((_, pi) => notaPrincipio(di, pi) != null).length;
          return `<tr>
            <td><div class="just"><b style="font-weight:500">${esc(d.n)}</b></div></td>
            <td class="num">${(d.peso * 100).toFixed(0)}%</td>
            <td class="num mono" style="font-size:14px">${num1(v)}</td>
            <td class="ctr">${nv ? `<span class="zone ${nv.z}">${nv.n}</span>`
              : `<span class="tag">Sin calificar</span>`}</td>
            <td class="hint">${cal} de ${d.principios.length} calificados</td>
            <td class="ctr"><button class="btn ghost sm" data-maddim="${di}"
              style="width:100%;justify-content:center">${puedeCalificar ? "Calificar" : "Ver"}</button></td>
          </tr>`;
        }).join("")}
        <tr class="rep-tot"><td><b style="font-weight:600">Madurez del Sistema Integral
          de Administración del Riesgo</b></td>
          <td class="num">100%</td>
          <td class="num mono" style="font-size:14px"><b>${num1(ind)}</b></td>
          <td class="ctr">${niv ? `<span class="zone ${niv.z}">${niv.n}</span>` : "—"}</td>
          <td colspan="2"></td></tr>
        </tbody></table></div></div>

    <div class="card"><header><h2>Detalle por principio</h2></header>
      <div class="scroll-x"><table class="fija" style="min-width:820px">
        <colgroup><col style="width:240px"><col style="width:340px"><col style="width:80px">
          <col style="width:130px"></colgroup>
        <thead><tr><th>Componente</th><th>Principio</th><th class="num">Nota</th>
          <th class="ctr">Nivel</th></tr></thead>
        <tbody>${CAT.madurez.flatMap((d, di) => d.principios.map((pr, pi) => {
          const v = notaPrincipio(di, pi), nv = nivelMadurez(v);
          return `<tr>
            <td class="hint">${pi === 0 ? esc(d.n) : ""}</td>
            <td><div class="just" style="font-size:12.5px">${esc(pr.n)}</div>
              <div class="hint">${pr.puntos.length} puntos de reflexión</div></td>
            <td class="num mono">${num1(v)}</td>
            <td class="ctr">${nv ? `<span class="zone ${nv.z}">${nv.n}</span>` : "—"}</td>
          </tr>`;
        })).join("")}</tbody></table></div></div>

    <div class="card"><header><h2>Niveles de madurez</h2></header>
      <div class="scroll-x"><table><thead><tr>
        <th class="ctr">Nivel</th><th>Denominación</th><th>Qué significa</th></tr></thead>
        <tbody>${CAT.madurezNiveles.slice(0, 5).map((x, i) => `<tr>
          <td class="ctr mono">${i + 1}</td>
          <td><span class="zone ${x.z}">${x.n}</span></td>
          <td class="just hint">${esc(x.d)}</td></tr>`).join("")}</tbody></table></div></div>
  </div>`;
}

/* =====================================================================
   CICLO SEMESTRAL — SOLICITUDES DE ACTUALIZACIÓN
   Lo que registra el Enlace SIG no entra directo a la matriz: queda como
   solicitud hasta que el administrador la apruebe. Así la matriz general
   siempre refleja lo que SIG validó.
   ===================================================================== */
const OP_SOLICITUD = {
  CREACION:    {n:"Creación",     z:"Bajo"},
  ACTUALIZACION:{n:"Actualización", z:"Moderado"},
  ELIMINACION: {n:"Eliminación",  z:"Extremo"}
};

/* ¿Los cambios de este rol requieren aprobación? */
function requiereAprobacion(){
  return S.sesion?.rol === "ENLACE_SIG";
}

let _pendIdx = null;
function reconstruirPendientes(){
  _pendIdx = new Map();
  S.solicitudes.forEach(x => {
    if (x.estado === "PENDIENTE") _pendIdx.set(x.riesgoId, x);
  });
}
function solicitudPendiente(riesgoId){
  if (!_pendIdx) reconstruirPendientes();
  return _pendIdx.get(riesgoId);
}

async function crearSolicitud(operacion, riesgo, previo, motivo, enlaceRG16){
  const sol = {
    id: uid(),
    operacion,
    riesgoId: riesgo.id,
    codigo: riesgo.codigo || "(nuevo)",
    proceso: riesgo.proceso,
    unidad: riesgo.unidad,
    propuesta: JSON.parse(JSON.stringify(riesgo)),
    anterior: previo ? JSON.parse(JSON.stringify(previo)) : null,
    motivo: motivo || "",
    enlaceRG16: enlaceRG16 || "",
    estado: "PENDIENTE",
    solicitadoPor: S.sesion?.nombre || "—",
    solicitadoEn: new Date().toISOString()
  };
  S.solicitudes.push(sol);
  _pendIdx = null;
  await Store.set("solicitudes", sol.id, sol);
  return sol;
}

/* Diferencias legibles entre lo vigente y lo propuesto */
function diffSolicitud(sol){
  const campos = {
    descripcion:"Descripción", tipo:"Tipo de riesgo", clase:"Clase de riesgo",
    causaRaiz:"Causa raíz", efectoInmediato:"Efecto inmediato",
    causaInmediata:"Causa inmediata", areaImpacto:"Área de impacto",
    areaIntegridad:"Área de impacto", areaFiscal:"Área de impacto fiscal",
    activo:"Activo de información", vulnerabilidad:"Vulnerabilidad", amenaza:"Amenaza",
    proceso:"Proceso", unidad:"Dependencia", frecuencia:"Frecuencia anual",
    impactoEconomico:"Afectación económica", impactoReputacional:"Afectación reputacional",
    zonaInherente:"Zona inherente", zonaResidual:"Zona residual",
    tratamiento:"Tratamiento", kriNombre:"Indicador"
  };
  const out = [];
  if (!sol.anterior) return out;
  Object.entries(campos).forEach(([k, et]) => {
    const a = sol.anterior[k] ?? "", b = sol.propuesta[k] ?? "";
    if (String(a) !== String(b)) out.push({campo:et, antes:a || "—", ahora:b || "—"});
  });
  const ca = (sol.anterior.controles || []).length, cb = (sol.propuesta.controles || []).length;
  if (ca !== cb) out.push({campo:"Número de controles", antes:ca, ahora:cb});
  return out;
}

async function resolverSolicitud(sol, aprobar, observacion){
  sol.estado = aprobar ? "APROBADA" : "RECHAZADA";
  sol.revisadoPor = S.sesion?.nombre;
  sol.revisadoEn = new Date().toISOString();
  sol.observacion = observacion || "";
  _pendIdx = null;
  await Store.set("solicitudes", sol.id, sol);

  if (!aprobar) return;

  const ix = S.riesgos.findIndex(r => r.id === sol.riesgoId);
  if (sol.operacion === "ELIMINACION"){
    if (ix >= 0){
      S.riesgos[ix].estado = "OBSOLETO";
      S.riesgos[ix].eliminadoEn = new Date().toISOString();
      S.riesgos[ix].eliminadoPor = sol.solicitadoPor;
      S.riesgos[ix].motivoEliminacion = sol.motivo;
      await Store.set("riesgos", S.riesgos[ix].id, S.riesgos[ix]);
      await registrarVersion(S.riesgos[ix], "ELIMINACION",
        `${sol.motivo} — aprobado por ${S.sesion?.nombre}`, null);
    }
    return;
  }

  const nuevo = JSON.parse(JSON.stringify(sol.propuesta));
  nuevo.aprobadoPor = S.sesion?.nombre;
  nuevo.aprobadoEn = sol.revisadoEn;
  nuevo.enlaceRG16 = sol.enlaceRG16;
  if (ix >= 0) S.riesgos[ix] = nuevo; else S.riesgos.push(nuevo);
  await Store.set("riesgos", nuevo.id, nuevo);
  await registrarVersion(nuevo,
    sol.operacion === "CREACION" ? "CREACION" : "ACTUALIZACION",
    `${sol.motivo} — aprobado por ${S.sesion?.nombre}`, sol.anterior);
}

function vistaSolicitudes(){
  const admin = esAdmin();
  const ventana = ventanaAbierta("ACTUALIZACION");
  const mias = admin ? S.solicitudes
    : S.solicitudes.filter(x => x.solicitadoPor === S.sesion?.nombre);
  const pend = mias.filter(x => x.estado === "PENDIENTE");
  const resueltas = mias.filter(x => x.estado !== "PENDIENTE")
    .sort((a, b) => (b.revisadoEn || "").localeCompare(a.revisadoEn || ""));

  const tabla = (lista, conAcciones) => `<div class="scroll-x">
    <table class="fija" style="min-width:1080px">
      <colgroup><col style="width:120px"><col style="width:140px"><col style="width:330px">
        <col style="width:180px"><col style="width:150px"><col style="width:160px"></colgroup>
      <thead><tr><th>Operación</th><th>Identificador</th><th>Riesgo y motivo</th>
        <th>Solicitado por</th><th class="ctr">Formato RG-16</th><th class="ctr">Estado</th></tr></thead>
      <tbody>${lista.map(x => {
        const d = diffSolicitud(x);
        return `<tr>
          <td><span class="zone ${OP_SOLICITUD[x.operacion].z}">${OP_SOLICITUD[x.operacion].n}</span></td>
          <td class="mono">${esc(x.codigo)}
            <div class="hint">${esc(proc(x.proceso)?.n || "")}</div></td>
          <td><div class="just" style="font-size:12.5px">${esc(x.propuesta.descripcion || "")}</div>
            ${x.motivo ? `<div class="hint just" style="margin-top:4px"><b>Motivo:</b> ${esc(x.motivo)}</div>` : ""}
            ${d.length ? `<div class="hint">${d.length} campos modificados</div>` : ""}</td>
          <td>${esc(x.solicitadoPor)}
            <div class="hint">${new Date(x.solicitadoEn).toLocaleString("es-CO")}</div></td>
          <td class="ctr">${x.enlaceRG16
            ? `<a href="${esc(x.enlaceRG16)}" target="_blank" rel="noopener">Abrir</a>`
            : `<span class="hint">Sin enlace</span>`}</td>
          <td class="ctr">${x.estado === "PENDIENTE"
            ? (conAcciones && admin
                ? `<button class="btn sm" data-sol="${x.id}" style="width:100%;justify-content:center">Revisar</button>`
                : `<span class="tag">En revisión</span>`)
            : `<span class="zone ${x.estado === "APROBADA" ? "Bajo" : "Extremo"}">
                 ${x.estado === "APROBADA" ? "Aprobada" : "Rechazada"}</span>
               <div class="hint">${esc(x.revisadoPor || "")}</div>`}
            ${x.estado !== "PENDIENTE" ? `<button class="btn ghost sm" data-solver="${x.id}"
              style="width:100%;justify-content:center;margin-top:4px">Ver</button>` : ""}</td>
        </tr>`;
      }).join("")}</tbody></table></div>`;

  return `<div class="stack">
    ${admin
      ? (pend.length
          ? `<div class="banner warn"><span>&#9888;</span><div>
              <b>${pend.length} solicitudes esperan su aprobación.</b> Mientras no las revise, los
              cambios no se reflejan en la matriz general.</div></div>`
          : `<div class="banner ok"><span>&#9679;</span><div>No hay solicitudes pendientes.
              La matriz general está al día.</div></div>`)
      : `<div class="banner info"><span>&#9432;</span><div>Los riesgos que cree, actualice o
          elimine quedan aquí como solicitud hasta que la Dirección SIG los apruebe. Solo entonces
          entran a la matriz general.</div></div>`}
    ${!admin && !ventana ? `<div class="banner warn"><span>&#9888;</span><div>
      La ventana de actualización está cerrada. Puede consultar sus solicitudes, pero no enviar
      nuevas hasta que el administrador habilite la siguiente ventana.</div></div>` : ""}

    <div class="card">
      <header><h2>Solicitudes pendientes</h2><span class="tag">${pend.length}</span></header>
      ${pend.length ? tabla(pend, true)
        : `<div class="empty"><b>Sin solicitudes pendientes</b>
           ${admin ? "Cuando un enlace registre un cambio, aparecerá aquí."
                   : "Sus cambios aparecerán aquí mientras esperan aprobación."}</div>`}
    </div>

    ${resueltas.length ? `<div class="card">
      <header><h2>Historial de solicitudes</h2><span class="tag">${resueltas.length}</span></header>
      ${tabla(resueltas.slice(0, 60), false)}</div>` : ""}
  </div>`;
}

function verSolicitud(id, revisable){
  const sol = S.solicitudes.find(x => x.id === id); if (!sol) return;
  const d = diffSolicitud(sol);
  const pr = sol.propuesta;

  const cuerpo = `
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:13px">
      <span class="zone ${OP_SOLICITUD[sol.operacion].z}">${OP_SOLICITUD[sol.operacion].n}</span>
      <span class="tag mono">${esc(sol.codigo)}</span>
      <span class="tag">${esc(proc(sol.proceso)?.n || "")}</span>
      <span class="tag">${esc(uni(sol.unidad)?.n || "")}</span>
    </div>
    <p class="just" style="font-size:13.5px;line-height:1.6;margin:0 0 13px">${esc(pr.descripcion || "")}</p>

    <div class="calc" style="margin-bottom:13px">
      <div class="calc-row"><span>Solicitado por</span><span>${esc(sol.solicitadoPor)}</span></div>
      <div class="calc-row"><span>Fecha</span>
        <span class="mono">${new Date(sol.solicitadoEn).toLocaleString("es-CO")}</span></div>
      <div class="calc-row"><span>Formato ES-SIG-RG-16</span>
        <span>${sol.enlaceRG16 ? `<a href="${esc(sol.enlaceRG16)}" target="_blank" rel="noopener">Abrir el formato</a>`
          : "Sin enlace adjunto"}</span></div>
    </div>
    ${sol.motivo ? `<div class="field"><label>Motivo</label>
      <div class="calc just">${esc(sol.motivo)}</div></div>` : ""}

    ${sol.operacion === "ELIMINACION" ? `<div class="banner warn"><span>&#9888;</span><div>
      Al aprobar, el riesgo se marca como obsoleto y sale de la matriz. Su histórico se conserva
      y puede restaurarse desde la sección Histórico.</div></div>` : ""}

    ${d.length ? `<h3 style="margin:15px 0 9px">Cambios propuestos</h3>
      <div class="scroll-x"><table style="font-size:12.5px"><thead><tr>
        <th style="width:180px">Campo</th><th>Valor vigente</th><th>Valor propuesto</th>
      </tr></thead><tbody>${d.map(x => `<tr>
        <td>${esc(x.campo)}</td>
        <td class="just" style="color:var(--z-ext)">${esc(x.antes)}</td>
        <td class="just" style="color:var(--z-bajo)">${esc(x.ahora)}</td>
      </tr>`).join("")}</tbody></table></div>`
      : sol.operacion === "CREACION" ? "" : `<p class="hint">Sin cambios de campo detectables.</p>`}

    ${sol.operacion !== "ELIMINACION" ? `
    <h3 style="margin:15px 0 9px">Valoración propuesta</h3>
    <div class="grid3">
      <div class="kpi"><div class="v mono" style="font-size:19px">${pct(pr.probabilidadPct || 0)}</div>
        <div class="l">Probabilidad residual ${pct(pr.probResidual || 0)}</div></div>
      <div class="kpi"><div class="v mono" style="font-size:19px">${pct(pr.impactoPct || 0)}</div>
        <div class="l">Impacto residual ${pct(pr.impResidual || 0)}</div></div>
      <div class="kpi" style="display:flex;flex-direction:column;justify-content:center">
        <div><span class="zone ${pr.zonaInherente}">${esc(pr.zonaInherente || "—")}</span>
          <span style="margin:0 5px;color:var(--faint)">&rarr;</span>
          <span class="zone ${pr.zonaResidual}">${esc(pr.zonaResidual || "—")}</span></div>
        <div class="l" style="margin-top:6px">Inherente y residual</div></div>
    </div>
    <p class="hint" style="margin-top:9px">${(pr.controles || []).length} controles ·
      tratamiento ${esc(pr.tratamiento || "sin definir")} ·
      ${(pr.plan || []).length} actividades en el plan</p>` : ""}

    ${sol.estado !== "PENDIENTE" ? `<div class="banner ${sol.estado === "APROBADA" ? "ok" : "warn"}"
      style="margin-top:13px"><span>${sol.estado === "APROBADA" ? "&#10003;" : "&#10007;"}</span>
      <div><b>${sol.estado === "APROBADA" ? "Aprobada" : "Rechazada"}</b> por
      ${esc(sol.revisadoPor || "")} el ${new Date(sol.revisadoEn).toLocaleString("es-CO")}.
      ${sol.observacion ? `<br>${esc(sol.observacion)}` : ""}</div></div>` : ""}

    ${revisable ? `<div class="field" style="margin-top:15px">
      <label>Observación de la revisión</label>
      <textarea id="solObs" placeholder="Obligatoria si rechaza la solicitud"></textarea></div>` : ""}
  `;

  const botones = revisable ? [
    {t:"Cerrar", cls:"ghost", fn: cerrarModal},
    {t:"Rechazar", cls:"danger", fn: async () => {
      const o = document.getElementById("solObs").value.trim();
      if (o.length < 15) return aviso("Falta la observación",
        "Al rechazar una solicitud debe explicar por qué, para que el enlace pueda corregir.");
      await resolverSolicitud(sol, false, o);
      cerrarModal(); render();
    }},
    {t:"Aprobar", cls:"", fn: async () => {
      await resolverSolicitud(sol, true, document.getElementById("solObs").value.trim());
      cerrarModal(); render();
    }}
  ] : [{t:"Cerrar", cls:"ghost", fn: cerrarModal}];

  modal(`Solicitud · ${OP_SOLICITUD[sol.operacion].n} · ${sol.codigo}`, cuerpo, botones);
}

/* =====================================================================
   CICLO TRIMESTRAL — SEGUIMIENTO (Enlace SIG)
   Indicador, actividades, soportes y evaluación de los controles.
   ===================================================================== */
/* Procesos a cargo de la sesión actual. Vacío o ausente = todos. */
function misProcesos(){
  const p = S.sesion?.procesos;
  return Array.isArray(p) && p.length ? p : null;
}
function misRiesgos(){
  const rs = S.riesgos.filter(r => r.estado !== "OBSOLETO");
  const ps = misProcesos();
  return ps ? rs.filter(r => ps.includes(r.proceso)) : rs;
}
/* Aplica el alcance por proceso sobre los riesgos ya filtrados en pantalla */
function conAlcance(rs){
  const ps = misProcesos();
  return ps ? rs.filter(r => ps.includes(r.proceso)) : rs;
}

function selPeriodo(){
  return `<select id="selPeriodo" autocomplete="off" style="max-width:150px">
    ${periodosConocidos().map(p =>
      `<option value="${p}" ${S.periodo === p ? "selected" : ""}>${p.replace("-", " · ")}</option>`).join("")}
  </select>`;
}

function vistaSeguimiento(){
  const abierta = puedeEscribirOperativo("EJECUCION");
  const f = S.filtros;
  const rs = ordenarRiesgos(misRiesgos().filter(r => {
    if (f.macroproceso && proc(r.proceso)?.m !== f.macroproceso) return false;
    if (f.proceso && r.proceso !== f.proceso) return false;
    if (f.unidad && r.unidad !== f.unidad) return false;
    if (f.tipo && r.tipo !== f.tipo) return false;
    if (f.zona && r.zonaResidual !== f.zona) return false;
    return true;
  }));
  const total = misRiesgos().length;
  const seg = id => S.seguimientos.find(x => x.riesgoId === id && x.periodo === S.periodo) || {};

  const filas = rs.map(r => {
    const g = seg(r.id);
    const nC = (r.controles || []).length, nA = (r.plan || []).length;
    const cC = Object.keys(g.controles || {}).length;
    const cA = Object.keys(g.acciones || {}).length;
    const completo = cC === nC && cA === nA && (!r.kri || g.resultado);
    return `<tr>
      <td class="rid">${esc(r.codigo)}</td>
      <td><div class="just">${esc(r.descripcion)}</div>
        <div class="hint">${esc(uni(r.unidad)?.n || "")}</div></td>
      <td><div class="just">${r.kri ? esc(r.kri) : `<span class="hint">Sin indicador</span>`}</div></td>
      <td class="num mono">${g.resultado
        ? `<span class="zone ${g.resultadoNivel === "Crítico" ? "Extremo"
            : g.resultadoNivel === "Aceptable" ? "Moderado"
            : g.resultadoNivel === "Satisfactorio" ? "Bajo" : ""}">${esc(g.resultado)}</span>`
        : "—"}</td>
      <td class="ctr">${nC || nA ? `${cC}/${nC} · ${cA}/${nA}` : "—"}</td>
      <td class="ctr">${g.estadoAccion ? `<span class="zone ${g.estadoAccion === "Cerrada" ? "Bajo"
        : g.estadoAccion === "Vencida" ? "Extremo" : "Moderado"}">${esc(g.estadoAccion)}</span>` : "—"}</td>
      <td class="ctr"><button class="btn ${completo ? "ghost" : ""} sm" data-seg="${r.id}"
        style="width:100%;justify-content:center">${abierta ? "Reportar" : "Ver"}</button>
        <div style="margin-top:4px">${completo ? `<span class="zone Bajo">Completo</span>`
          : `<span class="tag">Pendiente</span>`}</div>
        ${g.porAdministracion ? `<div class="hint">Por administración</div>` : ""}</td>
    </tr>`;
  }).join("");

  return `<div class="stack">
    ${bannerAdmin()}
    ${barrasFiltros()}
    ${S.sesion?.rol === "ENLACE_SIG" ? `<div class="banner info"><span>&#9432;</span><div>
      Aquí reportas la <b>ejecución</b> del trimestre: resultado del indicador, actividades del plan
      de acción, soportes y evaluación del diseño de tus controles. La revisión de calidad la hace
      después el perfil de Monitoreo, y el seguimiento independiente, Control Interno.</div></div>` : ""}
    ${abierta ? `<div class="banner ok"><span>&#9679;</span><div>La ventana de reporte de ejecución
      está abierta. Registra el resultado del indicador, las actividades del plan de acción, el
      soporte y la evaluación del diseño de cada control.</div></div>`
      : `<div class="banner warn"><span>&#9888;</span><div>La ventana de reporte de ejecución está
      cerrada. Puedes consultar lo reportado, pero no modificarlo. Recuerda que la actualización de
      riesgos tiene su propia ventana, dos veces al año.</div></div>`}

    <div class="card">
      <header><div style="display:flex;gap:10px;align-items:center">
        <h2>Reporte de ejecución</h2>${selPeriodo()}</div>
        <span class="tag">${rs.length === total ? `${total} riesgos a cargo`
          : `${rs.length} de ${total} riesgos`}</span></header>
      ${rs.length ? `<div class="scroll-x"><table class="fija" style="min-width:1000px">
        <colgroup><col style="width:130px"><col style="width:300px"><col style="width:215px">
          <col style="width:85px"><col style="width:85px"><col style="width:95px">
          <col style="width:90px"></colgroup>
        <thead><tr>
        <th>Identificador</th><th>Riesgo</th><th>Indicador</th><th class="num">Resultado</th>
        <th class="ctr">Controles ·<br>actividades</th><th class="ctr">Estado<br>acción</th>
        <th class="ctr">Acción</th>
      </tr></thead><tbody>${filas}</tbody></table></div>`
      : total ? `<div class="empty"><b>Ningún riesgo coincide con los filtros</b>
         Tienes ${total} riesgos a cargo. Ajusta o limpia los filtros para verlos.</div>`
      : `<div class="empty"><b>No tienes riesgos asignados</b>
         ${(S.sesion?.procesos || []).length
           ? "Los procesos a tu cargo no tienen riesgos registrados en este momento."
           : "Tu usuario no tiene procesos asignados. El administrador debe asignarte al menos uno desde la sección Usuarios."}</div>`}
    </div>
  </div>`;
}

function formSeguimiento(rid){
  const r = S.riesgos.find(x => x.id === rid); if (!r) return;
  const abierta = puedeEscribirOperativo("EJECUCION");
  const g = S.seguimientos.find(x => x.riesgoId === rid && x.periodo === S.periodo)
    || {id:uid(), riesgoId:rid, periodo:S.periodo, resultado:"", actividades:"",
        soporte:"", estadoAccion:"", observacion:""};
  const ruta = rutaEvidencia(r, S.periodo, g.soporte || "soporte.pdf");

  const urlCtrl = carpetaEvidencia(r.unidad, "control");
  const urlPlan = carpetaEvidencia(r.unidad, "plan");
  g.controles = g.controles || {};
  g.acciones  = g.acciones  || {};
  const kri = evaluarKRI(r, g.kriNumerador, g.kriDenominador);

  modal(`Reporte de ejecución · ${r.codigo} · ${S.periodo.replace("-", " ")}`, `
    <p class="just" style="margin:0 0 15px;font-size:13px">${esc(r.descripcion)}</p>

    <h3 style="margin-bottom:9px">Controles existentes</h3>
    <p class="hint" style="margin-top:-4px">Describa cómo se ejecutó cada control en el trimestre
      y cargue la evidencia en la carpeta de su dependencia.</p>
    ${(r.controles || []).length ? `<div class="scroll-x"><table class="fija" style="min-width:820px">
      <colgroup><col style="width:330px"><col style="width:330px"><col style="width:140px"></colgroup>
      <thead><tr><th>Control</th><th>Descripción de la evidencia</th><th class="ctr">Evidencia</th></tr></thead>
      <tbody>${(r.controles || []).map((c, k) => `<tr>
        <td><div class="just" style="font-size:12.5px">${esc([c.responsable, c.accion,
          c.periodicidad, c.complemento].filter(Boolean).join(" "))}</div>
          <div style="margin-top:4px"><span class="tag">${esc(c.tipo)} · ${esc(c.implementacion)}</span></div></td>
        <td><textarea data-ctrl="${k}" ${abierta ? "" : "disabled"} style="min-height:76px"
          placeholder="Explique cómo se ejecutó el control y qué soportes aporta">${esc(g.controles[k] || "")}</textarea></td>
        <td class="ctr">${urlCtrl
          ? `<a class="btn ghost sm" href="${esc(urlCtrl)}" target="_blank" rel="noopener"
               style="width:100%;justify-content:center">Agregar</a>`
          : `<span class="hint">Sin carpeta configurada</span>`}
          <div class="hint" style="margin-top:5px">Nombre el archivo<br>
            <b class="mono" style="font-size:10px">${esc(r.codigo)}-C${k + 1}</b></div></td>
      </tr>`).join("")}</tbody></table></div>`
      : `<p class="hint">Este riesgo no tiene controles registrados.</p>`}

    <h3 style="margin:20px 0 9px;padding-top:15px;border-top:1px solid var(--line)">
      Indicador clave de riesgo</h3>
    ${r.kriNombre || r.kri ? `<div class="scroll-x"><table class="fija" style="min-width:840px">
      <colgroup><col style="width:200px"><col style="width:240px"><col style="width:130px">
        <col style="width:130px"><col style="width:140px"></colgroup>
      <thead><tr><th>Nombre del indicador</th><th>Fórmula</th>
        <th class="num">Numerador</th><th class="num">Denominador</th><th class="ctr">Resultado</th></tr></thead>
      <tbody><tr>
        <td><div class="just">${esc(r.kriNombre || "Sin nombre")}</div></td>
        <td><div class="mono" style="font-size:11.5px">${esc(r.kri || "—")}</div>
          ${r.kriUnidad ? `<div class="hint">Unidad: ${esc(r.kriUnidad)}</div>` : ""}</td>
        <td><input type="number" step="any" id="kriNum" ${abierta ? "" : "disabled"}
          value="${esc(g.kriNumerador ?? "")}" style="text-align:right"></td>
        <td><input type="number" step="any" id="kriDen" ${abierta ? "" : "disabled"}
          value="${esc(g.kriDenominador ?? "")}" style="text-align:right">
          <p class="hint">Si la fórmula solo tiene numerador, el denominador es 1.</p></td>
        <td class="ctr" id="kriRes" ${kri?.zona ? `style="background:var(--z-${
          kri.zona === "Extremo" ? "ext" : kri.zona === "Moderado" ? "mod" : "bajo"}-bg)"` : ""}>
          ${kri ? `<div class="mono" style="font-size:17px;font-weight:600">${esc(kri.texto)}</div>
            ${kri.nivel ? `<span class="zone ${kri.zona}">${esc(kri.nivel)}</span>`
              : `<span class="hint">Fuera de los umbrales definidos</span>`}`
            : `<span class="hint">Registre numerador y denominador</span>`}</td>
      </tr></tbody></table></div>
      ${r.kriTendencia ? `<p class="hint">Tendencia ${esc(r.kriTendencia.toLowerCase())} ·
        crítico ${r.kriTendencia === "Creciente" ? "menor que" : "mayor que"} ${esc(r.kriCritico ?? "—")} ·
        aceptable entre ${esc(r.kriAceptableMin ?? "—")} y ${esc(r.kriAceptableMax ?? "—")} ·
        satisfactorio ${r.kriTendencia === "Creciente" ? "mayor que" : "menor que"} ${esc(r.kriSatisfactorio ?? "—")}</p>` : ""}`
      : `<p class="hint">Este riesgo no tiene indicador formulado. Debe definirse en la ventana
         de actualización.</p>`}

    ${(r.plan || []).length ? `
    <h3 style="margin:20px 0 9px;padding-top:15px;border-top:1px solid var(--line)">Plan de acción</h3>
    <p class="hint" style="margin-top:-4px">Actividades del plan de implementación de controles
      formulado para este riesgo.</p>
    <div class="scroll-x"><table class="fija" style="min-width:980px">
      <colgroup><col style="width:270px"><col style="width:160px"><col style="width:110px">
        <col style="width:300px"><col style="width:140px"></colgroup>
      <thead><tr><th>Actividad</th><th>Responsable</th><th class="ctr">Fecha</th>
        <th>Descripción de las acciones realizadas</th><th class="ctr">Evidencia</th></tr></thead>
      <tbody>${(r.plan || []).map((a, k) => `<tr>
        <td><div class="just" style="font-size:12.5px">${esc(a.actividad || "")}</div></td>
        <td><div class="just" style="font-size:12.5px">${esc(a.responsable || "")}</div></td>
        <td class="ctr mono" style="font-size:11.5px">${esc(a.fecha || "—")}</td>
        <td><textarea data-acc="${k}" ${abierta ? "" : "disabled"} style="min-height:76px"
          placeholder="Qué se ejecutó de esta actividad en el trimestre">${esc(g.acciones[k] || "")}</textarea></td>
        <td class="ctr">${urlPlan
          ? `<a class="btn ghost sm" href="${esc(urlPlan)}" target="_blank" rel="noopener"
               style="width:100%;justify-content:center">Agregar</a>`
          : `<span class="hint">Sin carpeta configurada</span>`}
          <div class="hint" style="margin-top:5px">Nombre el archivo<br>
            <b class="mono" style="font-size:10px">${esc(r.codigo)}-A${k + 1}</b></div></td>
      </tr>`).join("")}</tbody></table></div>` : ""}

    <div class="field" style="margin-top:17px"><label>Estado de la acción</label>
      <div class="calc">${g.estadoAccion
        ? `<span class="zone ${g.estadoAccion === "Cerrada" ? "Bajo"
            : g.estadoAccion === "Vencida" ? "Extremo" : "Moderado"}">${esc(g.estadoAccion)}</span>`
        : `<span class="hint">Pendiente de determinación</span>`}</div>
      <p class="hint">Lo determina el perfil de Monitoreo a partir de lo que reporte aquí.</p></div>
  `, abierta ? [
    {t:"Cancelar", cls:"ghost", fn: cerrarModal},
    {t:"Guardar reporte", cls:"", fn: async () => {
      /* Descripción de la evidencia de cada control */
      g.controles = {};
      document.querySelectorAll("[data-ctrl]").forEach(el => {
        const v = el.value.trim(); if (v) g.controles[el.dataset.ctrl] = v;
      });
      /* Descripción de las acciones realizadas de cada actividad del plan */
      g.acciones = {};
      document.querySelectorAll("[data-acc]").forEach(el => {
        const v = el.value.trim(); if (v) g.acciones[el.dataset.acc] = v;
      });

      const nu = document.getElementById("kriNum");
      const de = document.getElementById("kriDen");
      g.kriNumerador = nu ? nu.value : "";
      g.kriDenominador = de ? de.value : "";
      const ev = evaluarKRI(r, g.kriNumerador, g.kriDenominador);
      g.resultado = ev ? ev.texto : "";
      g.resultadoNivel = ev ? ev.nivel : "";
      g.actividades = Object.values(g.acciones).join(" | ");

      g.reportadoPor = S.sesion?.nombre;
      g.reportadoEn = new Date().toISOString();
      g.porAdministracion = esAdmin();

      const ix = S.seguimientos.findIndex(x => x.id === g.id);
      if (ix >= 0) S.seguimientos[ix] = g; else S.seguimientos.push(g);
      await Store.set("seguimientos", g.id, g);
      await registrarMonitoreo(r, g);
      cerrarModal(); render();
    }}
  ] : [{t:"Cerrar", cls:"ghost", fn: cerrarModal}]);

  /* El resultado se recalcula en su propia celda, sin reconstruir la
     ventana: así no se pierde el foco ni se cancela el clic en Guardar. */
  const celda = document.getElementById("kriRes");
  const pintarResultado = () => {
    if (!celda) return;
    const ev = evaluarKRI(r,
      document.getElementById("kriNum")?.value,
      document.getElementById("kriDen")?.value);
    const z = ev?.zona;
    celda.style.background = z
      ? `var(--z-${z === "Extremo" ? "ext" : z === "Moderado" ? "mod" : "bajo"}-bg)` : "";
    celda.innerHTML = ev
      ? `<div class="mono" style="font-size:17px;font-weight:600">${esc(ev.texto)}</div>`
        + (ev.nivel ? `<span class="zone ${ev.zona}">${esc(ev.nivel)}</span>`
                    : `<span class="hint">Fuera de los umbrales definidos</span>`)
      : `<span class="hint">Registre numerador y denominador</span>`;
  };
  ["kriNum","kriDen"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = pintarResultado;
  });
}

/* =====================================================================
   BASE DE DATOS DE MONITOREO
   Una fila por riesgo y periodo con todo lo reportado. Es la fuente del
   informe trimestral y se puede descargar desde el reporte de ejecución.
   ===================================================================== */
async function registrarMonitoreo(r, g){
  const reg = {
    id: `${r.id}-${S.periodo}`,
    periodo: S.periodo,
    codigoRiesgo: r.codigo,
    tipoRiesgo: tipo(r.tipo)?.n || r.tipo,
    macroproceso: macro(proc(r.proceso)?.m)?.n || "",
    proceso: proc(r.proceso)?.n || "",
    dependencia: uni(r.unidad)?.n || "",
    descripcion: r.descripcion,
    inherenteProbabilidad: r.probabilidadPct,
    inherenteImpacto: r.impactoPct,
    inherenteZona: r.zonaInherente,
    residualProbabilidad: r.probResidual,
    residualImpacto: r.impResidual,
    residualZona: r.zonaResidual,
    controles: (r.controles || []).map((c, k) => ({
      n: k + 1,
      descripcion: [c.responsable, c.accion, c.periodicidad, c.complemento].filter(Boolean).join(" "),
      tipo: c.tipo, implementacion: c.implementacion,
      peso: Motor.pesoControl(c.tipo, c.implementacion),
      evidencia: (g.controles || {})[k] || ""
    })),
    kriNombre: r.kriNombre || "",
    kriFormula: r.kri || "",
    kriNumerador: g.kriNumerador ?? "",
    kriDenominador: g.kriDenominador ?? "",
    kriResultado: g.resultado || "",
    kriNivel: g.resultadoNivel || "",
    plan: (r.plan || []).map((a, k) => ({
      n: k + 1, actividad: a.actividad || "", responsable: a.responsable || "",
      fecha: a.fecha || "", acciones: (g.acciones || {})[k] || ""
    })),
    estadoAccion: g.estadoAccion || "",
    reportadoPor: g.reportadoPor || "",
    reportadoEn: g.reportadoEn || new Date().toISOString()
  };
  const ix = S.monitoreoBD.findIndex(x => x.id === reg.id);
  if (ix >= 0) S.monitoreoBD[ix] = reg; else S.monitoreoBD.push(reg);
  await Store.set("monitoreoBD", reg.id, reg);
}

function exportarMonitoreoCSV(){
  const rs = S.monitoreoBD.filter(x => x.periodo === S.periodo);
  if (!rs.length) return aviso("Nada que exportar",
    "Todavía no se ha guardado ningún reporte de ejecución en este periodo.");
  const maxC = Math.max(1, ...rs.map(x => x.controles.length));
  const maxA = Math.max(1, ...rs.map(x => x.plan.length));
  const cab = ["Periodo","Código del riesgo","Tipo de riesgo","Macroproceso","Proceso",
    "Dependencia","Descripción del riesgo",
    "Probabilidad inherente","Impacto inherente","Zona inherente",
    "Probabilidad residual","Impacto residual","Zona residual"];
  for (let k = 1; k <= maxC; k++)
    cab.push(`Control ${k}`, `Tipo ${k}`, `Peso ${k}`, `Descripción de la evidencia ${k}`);
  cab.push("Indicador","Fórmula","Numerador","Denominador","Resultado","Nivel del resultado");
  for (let k = 1; k <= maxA; k++)
    cab.push(`Actividad ${k}`, `Responsable ${k}`, `Fecha ${k}`, `Acciones realizadas ${k}`);
  cab.push("Estado de la acción","Reportado por","Fecha del reporte");

  const filas = rs.map(x => {
    const f = [x.periodo, x.codigoRiesgo, x.tipoRiesgo, x.macroproceso, x.proceso,
      x.dependencia, x.descripcion,
      pct(x.inherenteProbabilidad || 0), pct(x.inherenteImpacto || 0), x.inherenteZona,
      pct(x.residualProbabilidad || 0), pct(x.residualImpacto || 0), x.residualZona];
    for (let k = 0; k < maxC; k++){
      const c = x.controles[k];
      f.push(c ? c.descripcion : "", c ? c.tipo : "", c ? pct(c.peso) : "", c ? c.evidencia : "");
    }
    f.push(x.kriNombre, x.kriFormula, x.kriNumerador, x.kriDenominador, x.kriResultado, x.kriNivel);
    for (let k = 0; k < maxA; k++){
      const a = x.plan[k];
      f.push(a ? a.actividad : "", a ? a.responsable : "", a ? a.fecha : "", a ? a.acciones : "");
    }
    f.push(x.estadoAccion, x.reportadoPor, x.reportadoEn);
    return f;
  });
  descargar(`base-monitoreo-${S.periodo}.csv`, aCSV(cab, filas), "text/csv");
}

/* =====================================================================
   CICLO TRIMESTRAL — MONITOREO (Dirección SIG)
   ===================================================================== */
function vistaMonitoreo(){
  const abierta = puedeEscribirOperativo("MONITOREO");
  const rs = conAlcance(riesgosFiltrados());
  const mon = id => S.monitoreos.find(x => x.riesgoId === id && x.periodo === S.periodo) || {};
  const si = v => v === "Si" ? `<span class="zone Bajo">Sí</span>`
    : v === "No" ? `<span class="zone Alto">No</span>` : "—";

  return bannerAdmin() + barrasFiltros() + `<div class="card" style="margin-top:16px">
    <header><div style="display:flex;gap:10px;align-items:center">
      <h2>Monitoreo</h2>${selPeriodo()}</div>
      <span class="tag">${rs.filter(r => mon(r.id).revisado).length} de ${rs.length} revisados</span></header>
    ${!abierta ? `<div class="body" style="padding-bottom:0"><div class="banner warn">
      <span>&#9888;</span><div>La ventana de monitoreo está cerrada.</div></div></div>` : ""}
    ${rs.length ? `<div class="scroll-x"><table class="fija" style="min-width:1200px">
      <colgroup><col style="width:150px"><col style="width:360px"><col style="width:95px">
        <col style="width:95px"><col style="width:90px"><col style="width:95px">
        <col style="width:225px"><col style="width:90px"></colgroup>
      <thead><tr>
      <th>Identificador</th><th>Riesgo</th>
      <th class="ctr">Descripción<br>conforme</th><th class="ctr">Control<br>conforme</th>
      <th class="ctr">Control<br>eficaz</th><th class="ctr">Se<br>materializó</th>
      <th>Recomendaciones</th><th></th>
    </tr></thead><tbody>${rs.map(r => { const m = mon(r.id); return `<tr>
      <td class="rid">${esc(r.codigo)}</td>
      <td><div class="just">${esc(r.descripcion)}</div>
        <div class="hint">${esc(proc(r.proceso)?.n || "")}</div></td>
      <td class="ctr">${si(m.descripcionConforme)}</td>
      <td class="ctr">${si(m.controlConforme)}</td>
      <td class="ctr">${si(m.controlEficaz)}</td>
      <td class="ctr">${m.materializo === "Si" ? `<span class="zone Extremo">Sí</span>`
        : m.materializo === "No" ? `<span class="zone Bajo">No</span>` : "—"}</td>
      <td class="hint just">${esc(m.recomendaciones || "")}
        ${m.porAdministracion ? `<div><span class="tag">Por administración</span></div>` : ""}</td>
      <td><button class="btn ${m.revisado ? "ghost" : ""} sm" data-mon="${r.id}">
        ${abierta ? "Monitorear" : "Ver"}</button></td>
    </tr>`; }).join("")}</tbody></table></div>`
    : `<div class="empty"><b>Sin riesgos</b> No hay riesgos con los filtros aplicados.</div>`}
  </div>`;
}

function formMonitoreo(rid){
  const r = S.riesgos.find(x => x.id === rid); if (!r) return;
  const abierta = puedeEscribirOperativo("MONITOREO");
  const m = S.monitoreos.find(x => x.riesgoId === rid && x.periodo === S.periodo)
    || {id:uid(), riesgoId:rid, periodo:S.periodo, instancia:"SIG"};
  const rolActual = CAT.roles.find(x => x.c === S.sesion?.rol)?.n || "";
  const pregunta = (id, etiqueta, val, ayuda) => `<div class="field">
    <label>${etiqueta}</label>
    <select id="${id}" ${abierta ? "" : "disabled"} autocomplete="off">
      <option value="">Seleccione</option>
      ${CAT.siNo.map(x => `<option ${val === x ? "selected" : ""}>${x}</option>`).join("")}
    </select>${ayuda ? `<p class="hint">${ayuda}</p>` : ""}</div>`;

  modal(`Monitoreo · ${r.codigo}`, `
    <p style="margin:0 0 6px;font-size:13px">${esc(r.descripcion)}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:15px">
      <span class="tag">${esc(proc(r.proceso)?.n)}</span>
      <span class="zone ${r.zonaResidual}">${esc(r.zonaResidual || "")}</span>
      <span class="tag">${(r.controles || []).length} controles</span></div>

    ${pregunta("moDesc", "¿La descripción del riesgo se ajusta a los lineamientos de la política?",
      m.descripcionConforme,
      "Verifique que inicie con «Posibilidad de» y contenga impacto, causa inmediata y causa raíz.")}
    ${pregunta("moCtrl", "¿La descripción del control se ajusta a los lineamientos de la política?",
      m.controlConforme,
      "Cada control debe tener responsable, acción y complemento, con periodicidad explícita.")}
    ${pregunta("moEfic", "¿El control ha sido eficaz?", m.controlEficaz,
      "Contraste con el resultado del indicador y los soportes aportados por la dependencia.")}
    ${pregunta("moMat", "¿El riesgo se materializó en el periodo evaluado?", m.materializo,
      "Si responde Sí, debe existir una acción correctiva formulada en el formato ES-SIG-RG-02.")}

    <div class="field"><label>Instancia que monitorea</label>
      <select id="moInst" ${abierta ? "" : "disabled"} autocomplete="off">
        ${CAT.instancias.map(x => `<option ${m.instancia === x ? "selected" : ""}>${x}</option>`).join("")}
      </select>
      <p class="hint">Registrando como <b>${esc(rolActual)}</b>.
        Este concepto es independiente de lo que reportó la dependencia: esa separación es lo que
        le da validez. Cada instancia guarda el suyo por separado.</p></div>

    <div class="field"><label>Estado de la acción</label>
      <select id="moEst" ${abierta ? "" : "disabled"} autocomplete="off">
        <option value="">Seleccione</option>
        ${CAT.estadoAccion.map(x => `<option ${(S.seguimientos.find(y =>
          y.riesgoId === rid && y.periodo === S.periodo)?.estadoAccion) === x
          ? "selected" : ""}>${x}</option>`).join("")}
      </select>
      <p class="hint">Determine el avance del plan de acción a partir de lo reportado por la
        dependencia. Es el único rol que fija este estado.</p></div>

    <div class="field"><label>Recomendaciones</label>
      <textarea id="moRec" ${abierta ? "" : "disabled"}
        placeholder="Qué debe ajustar la dependencia">${esc(m.recomendaciones || "")}</textarea></div>

    ${(() => { const g = S.seguimientos.find(x => x.riesgoId === rid && x.periodo === S.periodo);
      return g ? `<div class="calc"><b style="font-size:12px">Lo reportado por la dependencia</b>
        <div class="calc-row"><span>Resultado del indicador</span><span class="mono">${esc(g.resultado || "—")}</span></div>
        <div class="calc-row"><span>Controles con evidencia descrita</span>
          <span class="mono">${Object.keys(g.controles || {}).length} de ${(r.controles || []).length}</span></div>
        <div class="calc-row"><span>Actividades reportadas</span>
          <span class="mono">${Object.keys(g.acciones || {}).length} de ${(r.plan || []).length}</span></div>
        <div class="just" style="margin-top:7px;font-size:12px">${esc(g.actividades || "Sin actividades reportadas")}</div>
        ${r.planAccion ? `<div class="hint just" style="margin-top:7px"><b>Plan formulado:</b>
          ${esc(r.planAccion)}</div>` : ""}
        </div>` : `<div class="banner warn"><span>&#9888;</span><div>La dependencia todavía no ha
        reportado el seguimiento de este periodo.</div></div>`; })()}
  `, abierta ? [
    {t:"Cancelar", cls:"ghost", fn: cerrarModal},
    {t:"Guardar monitoreo", cls:"", fn: async () => {
      m.descripcionConforme = document.getElementById("moDesc").value;
      m.controlConforme = document.getElementById("moCtrl").value;
      m.controlEficaz = document.getElementById("moEfic").value;
      m.materializo = document.getElementById("moMat").value;
      m.instancia = document.getElementById("moInst").value;
      m.recomendaciones = document.getElementById("moRec").value.trim();
      m.revisado = true; m.monitoreadoPor = S.sesion?.nombre;
      m.porAdministracion = esAdmin();

      /* El estado de la acción se guarda en el reporte de la dependencia,
         pero lo determina este rol. */
      const est = document.getElementById("moEst").value;
      let g = S.seguimientos.find(x => x.riesgoId === rid && x.periodo === S.periodo);
      if (!g && est){
        g = {id:uid(), riesgoId:rid, periodo:S.periodo, resultado:"", actividades:"", soporte:""};
        S.seguimientos.push(g);
      }
      if (g){
        g.estadoAccion = est;
        g.estadoDefinidoPor = S.sesion?.nombre;
        g.estadoDefinidoEn = new Date().toISOString();
        await Store.set("seguimientos", g.id, g);
      }
      m.monitoreadoEn = new Date().toISOString();
      const ix = S.monitoreos.findIndex(x => x.id === m.id);
      if (ix >= 0) S.monitoreos[ix] = m; else S.monitoreos.push(m);
      await Store.set("monitoreos", m.id, m);
      cerrarModal(); render();
    }}
  ] : [{t:"Cerrar", cls:"ghost", fn: cerrarModal}]);
}

/* =====================================================================
   CICLO TRIMESTRAL — CONTROL INTERNO
   ===================================================================== */
function vistaInterno(){
  const abierta = puedeEscribirOperativo("SEGUIMIENTO");
  const rs = conAlcance(riesgosFiltrados());
  const ci = id => S.internos.find(x => x.riesgoId === id && x.periodo === S.periodo) || {};

  const discrepa = r => {
    const m = S.monitoreos.find(x => x.riesgoId === r.id && x.periodo === S.periodo);
    const c = ci(r.id);
    return m?.materializo && c.materializo && m.materializo !== c.materializo;
  };
  const enDisputa = rs.filter(discrepa);

  return bannerAdmin() + barrasFiltros() + `<div class="stack" style="margin-top:16px">
    ${enDisputa.length ? `<div class="banner warn"><span>&#9888;</span><div>
      <b>${enDisputa.length} riesgos con criterio discrepante.</b> Control Interno y la Dirección SIG
      responden distinto sobre la materialización: ${enDisputa.map(r => esc(r.codigo)).join(", ")}.
      Requieren conciliación con acta.</div></div>` : ""}

    <div class="card">
      <header><div style="display:flex;gap:10px;align-items:center">
        <h2>Seguimiento de Control Interno</h2>${selPeriodo()}</div>
        <span class="tag">${rs.filter(r => ci(r.id).revisado).length} de ${rs.length}</span></header>
      ${!abierta ? `<div class="body" style="padding-bottom:0"><div class="banner warn">
        <span>&#9888;</span><div>La ventana de seguimiento está cerrada.</div></div></div>` : ""}
      ${rs.length ? `<div class="scroll-x"><table class="fija" style="min-width:1140px">
        <colgroup><col style="width:160px"><col style="width:360px"><col style="width:230px">
          <col style="width:110px"><col style="width:200px"><col style="width:90px"></colgroup>
        <thead><tr>
        <th>Identificador</th><th>Riesgo</th><th>Actividades verificadas</th>
        <th class="ctr">Se materializó</th><th>Acción correctiva</th><th></th>
      </tr></thead><tbody>${rs.map(r => { const c = ci(r.id); return `<tr>
        <td class="rid">${esc(r.codigo)}${discrepa(r) ? ` <span class="zone Extremo">Discrepa</span>` : ""}</td>
        <td><div class="just">${esc(r.descripcion)}</div></td>
        <td class="hint just">${esc(c.actividades || "")}</td>
        <td class="ctr">${c.materializo === "Si" ? `<span class="zone Extremo">Sí</span>`
          : c.materializo === "No" ? `<span class="zone Bajo">No</span>` : "—"}</td>
        <td class="hint just">${esc(c.accionesCorrectivas || "")}</td>
        <td><button class="btn ${c.revisado ? "ghost" : ""} sm" data-int="${r.id}">
          ${abierta ? "Registrar" : "Ver"}</button></td>
      </tr>`; }).join("")}</tbody></table></div>`
      : `<div class="empty"><b>Sin riesgos</b> No hay riesgos con los filtros aplicados.</div>`}
    </div>
  </div>`;
}

function formInterno(rid){
  const r = S.riesgos.find(x => x.id === rid); if (!r) return;
  const abierta = puedeEscribirOperativo("SEGUIMIENTO");
  const c = S.internos.find(x => x.riesgoId === rid && x.periodo === S.periodo)
    || {id:uid(), riesgoId:rid, periodo:S.periodo};
  const m = S.monitoreos.find(x => x.riesgoId === rid && x.periodo === S.periodo);
  const ruta = rutaEvidencia(r, S.periodo, c.soporteAccion || "ES-SIG-RG-02.pdf");

  modal(`Control Interno · ${r.codigo}`, `
    <p style="margin:0 0 15px;font-size:13px">${esc(r.descripcion)}</p>

    <div class="field"><label>Descripción de las actividades realizadas para la ejecución del control</label>
      <textarea id="ciAct" ${abierta ? "" : "disabled"}
        placeholder="Describa brevemente las actividades realizadas y los soportes aportados">${esc(c.actividades || "")}</textarea></div>

    <div class="field"><label>Según su criterio, durante el periodo evaluado ¿se materializó el riesgo?</label>
      <select id="ciMat" ${abierta ? "" : "disabled"} autocomplete="off">
        <option value="">Seleccione</option>
        ${CAT.siNo.map(x => `<option ${c.materializo === x ? "selected" : ""}>${x}</option>`).join("")}
      </select>
      ${m?.materializo ? `<p class="hint">La Dirección SIG respondió <b>${esc(m.materializo)}</b>.
        Si su criterio difiere, la discrepancia queda registrada y requiere conciliación.</p>` : ""}</div>

    <div class="field"><label>Justifique brevemente por qué considera que se materializó el riesgo</label>
      <textarea id="ciJus" ${abierta ? "" : "disabled"}
        placeholder="En caso de no haberse materializado, escriba No Aplica">${esc(c.justificacion || "")}</textarea></div>

    <div class="field"><label>¿Qué acciones correctivas se realizaron ante la materialización del riesgo?</label>
      <textarea id="ciAcc" ${abierta ? "" : "disabled"}
        placeholder="En caso que no se haya materializado escriba No Aplica">${esc(c.accionesCorrectivas || "")}</textarea></div>

    <div class="field"><label>Soporte de formulación de la acción correctiva</label>
      <input type="text" id="ciSop" value="${esc(c.soporteAccion || "")}" ${abierta ? "" : "disabled"}
        placeholder="ES-SIG-RG-02.pdf">
      <div class="banner info" style="margin-top:7px"><span>&#9432;</span><div>
        Cargue el formato ES-SIG-RG-02. Se guardará en Drive como<br>
        <b class="mono">${esc(ruta.carpeta)}/${esc(ruta.archivo)}</b></div></div></div>
  `, abierta ? [
    {t:"Cancelar", cls:"ghost", fn: cerrarModal},
    {t:"Guardar", cls:"", fn: async () => {
      c.actividades = document.getElementById("ciAct").value.trim();
      c.materializo = document.getElementById("ciMat").value;
      c.justificacion = document.getElementById("ciJus").value.trim();
      c.accionesCorrectivas = document.getElementById("ciAcc").value.trim();
      c.soporteAccion = document.getElementById("ciSop").value.trim();
      if (c.materializo === "Si" && !c.accionesCorrectivas)
        return aviso("Falta la acción correctiva",
          "Si el riesgo se materializó debe registrar qué acciones correctivas se realizaron.");
      c.revisado = true; c.evaluadoPor = S.sesion?.nombre;
      c.porAdministracion = esAdmin();
      c.evaluadoEn = new Date().toISOString();
      const ix = S.internos.findIndex(x => x.id === c.id);
      if (ix >= 0) S.internos[ix] = c; else S.internos.push(c);
      await Store.set("internos", c.id, c);
      cerrarModal(); render();
    }}
  ] : [{t:"Cerrar", cls:"ghost", fn: cerrarModal}]);
}

/* =====================================================================
   PERFILES POR PROCESO
   ===================================================================== */
function vistaPerfiles(){
  const ROLES = ["ENLACE_SIG","MONITOREO","SEGUIMIENTO"];
  const conRol = (pc, rol) => S.usuarios.filter(u =>
    u.activo !== false && u.rol === rol && (u.procesos || []).includes(pc));

  const filas = CAT.macroprocesos.flatMap(m =>
    CAT.procesos.filter(p => p.m === m.c).map((p, i) => {
      const nr = S.riesgos.filter(r => r.proceso === p.c && r.estado !== "OBSOLETO").length;
      return `<tr>
        <td>${i === 0 ? `<b style="font-weight:500">${esc(m.n)}</b>` : ""}</td>
        <td><div class="just">${esc(p.n)}</div>
          <div class="hint">${nr} ${nr === 1 ? "riesgo" : "riesgos"}</div></td>
        ${ROLES.map(rol => {
          const us = conRol(p.c, rol);
          return `<td>${us.length
            ? us.map(u => `<div>${esc(u.nombre)}</div>`).join("")
            : `<span class="zone ${nr ? "Alto" : "Moderado"}">Sin asignar</span>`}</td>`;
        }).join("")}
      </tr>`;
    })).join("");

  const sinCobertura = CAT.procesos.filter(p =>
    S.riesgos.some(r => r.proceso === p.c && r.estado !== "OBSOLETO") &&
    ROLES.some(rol => !conRol(p.c, rol).length));

  return `<div class="stack">
    <div class="banner info"><span>&#9432;</span><div>Esta tabla muestra quién responde por cada
      proceso en el ciclo de gestión del riesgo. Es información pública: cualquier persona puede
      consultarla sin iniciar sesión.</div></div>

    ${sinCobertura.length ? `<div class="banner warn"><span>&#9888;</span><div>
      <b>${sinCobertura.length} procesos con riesgos registrados no tienen todos los roles asignados.</b>
      Mientras falte un responsable, esa etapa del ciclo trimestral no se puede cumplir.</div></div>` : ""}

    <div class="card">
      <header><h2>Responsables por proceso</h2>
        <button class="btn ghost sm" id="expPerfiles">Exportar</button></header>
      <div class="scroll-x"><table class="fija" style="min-width:1020px">
        <colgroup><col style="width:130px"><col style="width:270px"><col style="width:206px">
          <col style="width:206px"><col style="width:206px"></colgroup>
        <thead><tr>
          <th>Macroproceso</th><th>Proceso</th>
          <th>Enlace SIG</th><th>Monitoreo calidad</th><th>Control Interno</th>
        </tr></thead><tbody>${filas}</tbody></table></div>
    </div>
  </div>`;
}

/* =====================================================================
   MODALES
   ===================================================================== */
function modal(titulo, cuerpo, botones){
  const host = document.getElementById("modalHost");
  host.innerHTML = `<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true">
    <header><h2>${esc(titulo)}</h2><button class="x" id="mX" aria-label="Cerrar">×</button></header>
    <div class="body">${cuerpo}</div>
    <footer>${botones.map((b, i) =>
      `<button class="btn ${b.cls}" data-mb="${i}">${esc(b.t)}</button>`).join("")}</footer>
  </div></div>`;
  host.querySelector("#mX").onclick = cerrarModal;
  host.querySelectorAll("[data-mb]").forEach(b =>
    b.onclick = () => botones[Number(b.dataset.mb)].fn());
  host.querySelector(".modal-bg").onclick = e => { if (e.target.classList.contains("modal-bg")) cerrarModal(); };
}
function cerrarModal(){ document.getElementById("modalHost").innerHTML = ""; }
function aviso(t, m){
  const host = document.getElementById("modalHost");
  const prev = host.innerHTML;
  host.innerHTML = `<div class="modal-bg" style="z-index:110"><div class="modal" style="max-width:420px">
    <header><h2>${esc(t)}</h2></header><div class="body"><p style="margin:0">${esc(m)}</p></div>
    <footer><button class="btn" id="aOk">Entendido</button></footer></div></div>`;
  document.getElementById("aOk").onclick = () => { host.innerHTML = prev; reenlazar(); };
}
function reenlazar(){ if (F) enlazarFormulario(); }

/* =====================================================================
   SESIÓN
   ===================================================================== */
function elegirSesion(){
  const opciones = [
    {nombre:"Administrador", rol:"ADMIN", procesos:[]},
    ...S.usuarios.filter(u => u.activo !== false).map(u =>
      ({nombre:u.nombre, rol:u.rol, procesos:u.procesos || []})),
    {nombre:"Visitante", rol:"PUBLICO", procesos:[]}
  ];
  modal("Entrar como", `
    <p class="hint" style="margin:0 0 13px">Este prototipo no pide contraseña: sirve para probar
    qué ve y qué puede hacer cada rol. La autenticación real va en el servidor.</p>
    <div style="display:flex;flex-direction:column;gap:7px">
      ${opciones.map((o, i) => {
        const r = CAT.roles.find(x => x.c === o.rol);
        return `<button class="btn ghost" data-sesion="${i}"
          style="justify-content:flex-start;text-align:left;padding:10px 13px;flex-direction:column;align-items:flex-start;gap:2px">
          <b style="font-weight:500">${esc(o.nombre)}</b>
          <span class="hint">${esc(r?.n || o.rol)}${(o.procesos || []).length
            ? " · " + o.procesos.length + " procesos" : ""}</span>
        </button>`;
      }).join("")}
    </div>
  `, []);
  document.querySelectorAll("[data-sesion]").forEach(b => b.onclick = () => {
    S.sesion = opciones[Number(b.dataset.sesion)];
    S.intervencion = false;
    if (!VISTAS.find(v => v.id === S.vista && (!v.soloAdmin || S.sesion.rol === "ADMIN")))
      S.vista = "panel";
    cerrarModal(); render();
  });
}
