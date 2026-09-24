/* =====================================================================
   Vistas de consulta: navegación, panel, mapa de calor e inventario.
   ===================================================================== */

/* =====================================================================
   RENDER — navegación
   ===================================================================== */
const VISTAS = [
  {id:"panel",     n:"Panel",        ic:"◼", grupo:"Consulta"},
  {id:"madurez",   n:"Madurez del SIAR", ic:"◐", grupo:"Consulta"},
  {id:"riesgos",   n:"Riesgos",      ic:"▤", grupo:"Consulta"},
  {id:"matriz",    n:"Mapa de calor",ic:"▦", grupo:"Consulta"},
  {id:"historico", n:"Histórico",    ic:"◷", grupo:"Consulta"},
  {id:"perfiles",  n:"Responsables",  ic:"◇", grupo:"Consulta"},
  {id:"solicitudes",n:"Actualización de riesgos", ic:"⇄", grupo:"Ciclo semestral",
   roles:["ADMIN","ENLACE_SIG"]},
  {id:"seguimiento",n:"Reporte de ejecución", ic:"▶", grupo:"Ciclo trimestral", roles:["ADMIN","ENLACE_SIG"]},
  {id:"monitoreo", n:"Monitoreo",    ic:"◎", grupo:"Ciclo trimestral", roles:["ADMIN","MONITOREO"]},
  {id:"usuarios",  n:"Usuarios",     ic:"◉", grupo:"Administración", soloAdmin:true},
  
  {id:"ventanas",  n:"Ventanas",     ic:"◑", grupo:"Administración", soloAdmin:true},
  {id:"metodo",    n:"Metodología",  ic:"◈", grupo:"Administración"}
];

function pintarNav(){
  const nav = document.getElementById("nav");
  let html = "", grupo = "";
  VISTAS.forEach(v => {
    if (v.soloAdmin && S.sesion?.rol !== "ADMIN") return;
    if (v.roles && !v.roles.includes(S.sesion?.rol)) return;
    if (v.grupo !== grupo){ grupo = v.grupo; html += `<div class="nav-sep">${grupo}</div>`; }
    let insignia = "";
    if (v.id === "solicitudes"){
      const p = esAdmin()
        ? S.solicitudes.filter(x => x.estado === "PENDIENTE").length
        : S.solicitudes.filter(x => x.estado === "PENDIENTE"
            && x.solicitadoPor === S.sesion?.nombre).length;
      if (p) insignia = `<span class="zone ${esAdmin() ? "Alto" : "Moderado"}"
        style="margin-left:auto;font-size:10px">${p}</span>`;
    }
    html += `<button data-v="${v.id}" ${S.vista === v.id ? 'aria-current="page"' : ""}>
      <span class="ic">${v.ic}</span><span>${v.n}</span>${insignia}</button>`;
  });
  nav.innerHTML = html;
  nav.querySelectorAll("button").forEach(b =>
    b.onclick = () => { S.vista = b.dataset.v; S.madurezDim = null; render(); });

  document.getElementById("whoName").textContent = S.sesion?.nombre || "Sin sesión";
  const rol = CAT.roles.find(r => r.c === S.sesion?.rol);
  document.getElementById("whoRole").textContent = rol ? rol.n : "";
}

/* =====================================================================
   VISTA: PANEL
   ===================================================================== */
const ORDEN_MACRO = {ESTRATEGICO:1, MISIONAL:2, APOYO:3, EVALUACION:4};
function ordenarRiesgos(rs){
  return [...rs].sort((a, b) => {
    const ma = ORDEN_MACRO[proc(a.proceso)?.m] || 9, mb = ORDEN_MACRO[proc(b.proceso)?.m] || 9;
    if (ma !== mb) return ma - mb;
    const pa = proc(a.proceso)?.n || "", pb = proc(b.proceso)?.n || "";
    if (pa !== pb) return pa.localeCompare(pb, "es");
    const ua = uni(a.unidad)?.n || "", ub = uni(b.unidad)?.n || "";
    if (ua !== ub) return ua.localeCompare(ub, "es");
    return (a.codigo || "").localeCompare(b.codigo || "", "es", {numeric:true});
  });
}

function riesgosFiltrados(){
  const f = S.filtros;
  return ordenarRiesgos(S.riesgos.filter(r => {
    if (r.estado === "OBSOLETO") return false;
    if (f.macroproceso && proc(r.proceso)?.m !== f.macroproceso) return false;
    if (f.proceso && r.proceso !== f.proceso) return false;
    if (f.unidad && r.unidad !== f.unidad) return false;
    if (f.tipo && r.tipo !== f.tipo) return false;
    if (f.zona && r.zonaResidual !== f.zona) return false;
    return true;
  }));
}

function barrasFiltros(){
  const opts = (arr, val, fn) => arr.map(x => {
    const [v, t] = fn(x);
    return `<option value="${esc(v)}" ${val === v ? "selected" : ""}>${esc(t)}</option>`;
  }).join("");
  const f = S.filtros;
  /* El usuario solo puede filtrar dentro de los procesos que tiene a cargo */
  const ps = misProcesos();
  const universo = ps ? CAT.procesos.filter(p => ps.includes(p.c)) : CAT.procesos;
  const macros = CAT.macroprocesos.filter(m => universo.some(p => p.m === m.c));
  const procs = f.macroproceso ? universo.filter(p => p.m === f.macroproceso) : universo;
  const unis = f.proceso ? dependenciasDe(f.proceso)
    : universo.flatMap(p => dependenciasDe(p.c)).sort((a, b) => a.n.localeCompare(b.n, "es"));

  return `<div class="card"><div class="body"><div class="filters">
    <div class="f"><label for="f1">Macroproceso</label><select id="f1" autocomplete="off"><option value="">Todos</option>
      ${opts(macros, f.macroproceso, m => [m.c, m.n])}</select></div>
    <div class="f"><label for="f2">Proceso</label><select id="f2" autocomplete="off"><option value="">Todos</option>
      ${opts(procs, f.proceso, p => [p.c, p.n])}</select></div>
    <div class="f"><label for="f3">Dependencia</label><select id="f3" autocomplete="off"><option value="">Todas</option>
      ${opts(unis, f.unidad, u => [u.c, u.n])}</select></div>
    <div class="f"><label for="f4">Tipo de riesgo</label><select id="f4" autocomplete="off"><option value="">Todos</option>
      ${opts(CAT.tiposRiesgo.filter(t => !t.oculto
        || S.riesgos.some(r => r.tipo === t.c && r.estado !== "OBSOLETO")),
        f.tipo, t => [t.c, t.n])}</select></div>
    <div class="f"><label for="f5">Zona residual</label><select id="f5" autocomplete="off"><option value="">Todas</option>
      ${opts(["Bajo","Moderado","Alto","Extremo"], f.zona, z => [z, z])}</select></div>
    <button class="btn ghost" id="fClear">Limpiar</button>
  </div></div></div>`;
}
function enlazarFiltros(){
  const map = {f1:"macroproceso", f2:"proceso", f3:"unidad", f4:"tipo", f5:"zona"};
  Object.entries(map).forEach(([id, k]) => {
    const el = document.getElementById(id);
    if (el) el.onchange = () => {
      S.filtros[k] = el.value;
      if (k === "macroproceso"){ S.filtros.proceso = ""; S.filtros.unidad = ""; }
      if (k === "proceso") S.filtros.unidad = "";
      render();
    };
  });
  const c = document.getElementById("fClear");
  if (c) c.onclick = () => {
    S.filtros = {macroproceso:"",proceso:"",unidad:"",tipo:"",zona:""}; render();
  };
}

const ZCOL = {Bajo:"var(--z-bajo)", Moderado:"var(--z-mod)", Alto:"var(--z-alto)", Extremo:"var(--z-ext)"};

function barrasApiladas(grupos){
  const max = Math.max(1, ...grupos.map(g => g.total));
  return `<div class="bars">${grupos.map(g => `
    <div class="bar-row">
      <span class="nm" title="${esc(g.nombre)}">${esc(g.nombre)}</span>
      <div class="bar-track" style="width:${(g.total / max * 100).toFixed(1)}%">
        ${["Bajo","Moderado","Alto","Extremo"].map(z => g[z]
          ? `<div class="bar-seg" style="width:${(g[z] / g.total * 100).toFixed(1)}%;background:${ZCOL[z]}" title="${z}: ${g[z]}"></div>`
          : "").join("")}
      </div>
      <span class="n">${g.total}</span>
    </div>`).join("")}</div>
    <div class="legend">${["Bajo","Moderado","Alto","Extremo"].map(z =>
      `<span><i style="background:${ZCOL[z]}"></i>${z}</span>`).join("")}</div>`;
}

function agrupar(rs, keyFn, nameFn){
  const m = new Map();
  rs.forEach(r => {
    const k = keyFn(r); if (k == null) return;
    if (!m.has(k)) m.set(k, {nombre:nameFn(k), total:0, Bajo:0, Moderado:0, Alto:0, Extremo:0});
    const g = m.get(k); g.total++; if (r.zonaResidual) g[r.zonaResidual]++;
  });
  return [...m.values()].sort((a, b) => b.total - a.total);
}

function vistaPanel(){
  const rs = riesgosFiltrados();
  const n = rs.length;
  const crit = rs.filter(r => ["Alto","Extremo"].includes(r.zonaResidual)).length;
  const ord = {Bajo:1, Moderado:2, Alto:3, Extremo:4};
  const bajaron = rs.filter(r => ord[r.zonaResidual] < ord[r.zonaInherente]).length;
  const ctrls = rs.reduce((a, r) => a + (r.controles || []).length, 0);

  if (!n) return (S.semilla?.estado === "error"
      ? `<div class="banner warn" style="margin-bottom:16px"><span>&#9888;</span>
         <div><b>No se pudieron cargar los datos de prueba.</b><br>${esc(S.semilla.detalle)}</div></div>`
      : "")
    + barrasFiltros() + `<div class="card" style="margin-top:16px"><div class="empty">
    <b>Todavía no hay riesgos que mostrar</b>
    ${S.riesgos.length ? "Ningún riesgo coincide con los filtros aplicados."
      : "Registra el primer riesgo desde la sección Riesgos, o carga los datos de prueba."}
    ${S.riesgos.length ? "" : `<div style="margin-top:13px">
      <button class="btn ghost" id="btnSemilla">Cargar datos de prueba</button></div>`}
    </div></div>`;

  return barrasFiltros() + `
  <div class="stack" style="margin-top:16px">
    <div class="kpis">
      <div class="kpi"><div class="v">${n}</div><div class="l">Riesgos vigentes</div></div>
      <div class="kpi"><div class="v" style="color:${crit ? "var(--z-alto)" : "inherit"}">${crit}</div>
        <div class="l">En zona Alto o Extremo</div>
        <div class="d">${n ? Math.round(crit / n * 100) : 0}% del total</div></div>
      <div class="kpi"><div class="v">${bajaron}</div><div class="l">Bajaron de zona</div>
        <div class="d">Tras aplicar controles</div></div>
      <div class="kpi"><div class="v">${ctrls}</div><div class="l">Controles</div>
        <div class="d">${n ? (ctrls / n).toFixed(1) : 0} por riesgo</div></div>
    </div>

    ${(() => { const k = rs.filter(r => (r.revisar || []).length).length;
      return k ? `<div class="banner warn"><span>&#9888;</span><div>
        <b>${k} riesgos migrados requieren revisión.</b> Vienen del consolidado V4 y arrastran
        situaciones que la versión 7 resuelve distinto: impacto de corrupción calculado con el
        cuestionario de 19 preguntas, tratamiento «Evitar» sin subestrategia, o riesgos topados
        en 4 controles.</div></div>` : ""; })()}

    <div class="grid2">
      <div class="card"><header><h2>Por proceso</h2><span class="tag">Zona residual</span></header>
        <div class="body">${barrasApiladas(agrupar(rs, r => r.proceso, k => proc(k)?.n || k))}</div></div>
      <div class="card"><header><h2>Por tipo de riesgo</h2><span class="tag">Zona residual</span></header>
        <div class="body">${barrasApiladas(agrupar(rs, r => r.tipo, k => tipo(k)?.n || k))}</div></div>
    </div>

    <div class="grid2">
      <div class="card"><header><h2>Por macroproceso</h2><span class="tag">Zona residual</span></header>
        <div class="body">${barrasApiladas(agrupar(rs, r => proc(r.proceso)?.m,
          k => macro(k)?.n || k))}</div></div>
      <div class="card"><header><h2>Por dependencia</h2><span class="tag">Zona residual</span></header>
        <div class="body">${barrasApiladas(agrupar(rs, r => r.unidad, k => uni(k)?.n || k))}</div></div>
    </div>
  </div>`;
}

/* =====================================================================
   VISTA: MAPA DE CALOR
   ===================================================================== */
function mapaCalor(rs, modo){
  const probs = CAT.probabilidad.map(p => p.pct);
  const imps = CAT.impacto.map(i => i.pct);
  const conteo = {};
  rs.forEach(r => {
    const p = modo === "inh" ? r.probabilidadPct : r.probResidual;
    const i = modo === "inh" ? r.impactoPct : r.impResidual;
    if (p == null || i == null) return;
    const pp = probs.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a);
    const ii = imps.reduce((a, b) => Math.abs(b - i) < Math.abs(a - i) ? b : a);
    const k = `${pp}|${ii}`; conteo[k] = (conteo[k] || 0) + 1;
  });
  let cells = "";
  [...imps].reverse().forEach(i => probs.forEach(p => {
    const k = `${p}|${i}`, z = CAT.matrizInherente[`${+p}|${+i}`], c = conteo[k] || 0;
    cells += `<div class="cell ${z} ${c ? "" : "empty"}" title="${z} · Probabilidad ${pct(p)} · Impacto ${pct(i)}">${c || ""}</div>`;
  }));
  return `<div class="heat-wrap">
    <div class="heat-y">${CAT.impacto.map(i => `<span>${i.n}</span>`).join("")}</div>
    <div class="heat">${cells}</div>
    <div class="heat-x">${CAT.probabilidad.map(p => `<span>${p.n}</span>`).join("")}</div>
  </div>`;
}

function vistaMatriz(){
  const rs = riesgosFiltrados();
  return barrasFiltros() + `<div class="grid2" style="margin-top:16px">
    <div class="card"><header><h2>Riesgo inherente</h2><span class="tag">${rs.length} riesgos</span></header>
      <div class="body">${mapaCalor(rs, "inh")}
        <p class="hint" style="margin-top:12px">El eje vertical es el impacto; el horizontal, la probabilidad.
        Con impacto Mayor o Catastrófico la zona es Alto o Extremo sin importar la probabilidad.</p></div></div>
    <div class="card"><header><h2>Riesgo residual</h2><span class="tag">Después de controles</span></header>
      <div class="body">${mapaCalor(rs, "res")}
        <p class="hint" style="margin-top:12px">Solo los controles correctivos mueven el impacto.
        Preventivos y detectivos mueven únicamente la probabilidad.</p></div></div>
  </div>`;
}

/* =====================================================================
   VISTA: RIESGOS
   ===================================================================== */
function vistaRiesgos(){
  const rs = riesgosFiltrados();
  const puedeEditar = puede("riesgo");
  const aviso = !puedeEditar && S.sesion?.rol === "ENLACE_SIG"
    ? `<div class="banner warn" style="margin-bottom:16px"><span>⚠</span>
       <div>La ventana de actualización está cerrada. Puedes consultar los riesgos, pero no crear,
       editar ni eliminar hasta que el administrador habilite la siguiente ventana.</div></div>` : "";

  const filas = rs.map(r => `<tr>
    <td class="rid">${esc(r.codigo)}
      ${solicitudPendiente(r.id) ? `<div style="margin-top:4px"><span class="zone Moderado">En revisión</span></div>` : ""}</td>
    <td><div class="just">${esc(r.descripcion)}</div>
      <div style="margin-top:4px"><span class="tag">${esc(tipo(r.tipo)?.n || r.tipo)}</span></div></td>
    <td><div class="just">${esc(proc(r.proceso)?.n || "")}</div>
      <div class="hint just">${esc(uni(r.unidad)?.n || "")}</div></td>
    <td class="ctr"><span class="zone ${r.zonaInherente}">${r.zonaInherente || "—"}</span></td>
    <td class="ctr">${(r.controles || []).length}</td>
    <td class="ctr"><span class="zone ${r.zonaResidual}">${r.zonaResidual || "—"}</span></td>
    <td>${esc(r.tratamiento || "—")}</td>
    <td style="white-space:nowrap">
      <button class="btn ghost sm" data-ver="${r.id}">Ver</button>
      ${puedeEditar ? `<button class="btn ghost sm" data-edit="${r.id}">Editar</button>
        <button class="btn ghost sm" data-del="${r.id}">Eliminar</button>` : ""}
    </td></tr>`).join("");

  return aviso + barrasFiltros() + `<div class="card" style="margin-top:16px">
    <header><h2>Inventario de riesgos</h2><span class="tag">${rs.length} de ${S.riesgos.filter(r => r.estado !== "OBSOLETO").length}</span></header>
    ${rs.length ? `<div class="scroll-x"><table class="fija" style="min-width:1200px">
      <colgroup><col style="width:150px"><col style="width:400px"><col style="width:220px">
        <col style="width:100px"><col style="width:80px"><col style="width:100px">
        <col style="width:110px"><col style="width:150px"></colgroup>
      <thead><tr>
      <th>Identificador</th><th>Riesgo</th><th>Proceso y dependencia</th><th class="ctr">Inherente</th>
      <th class="ctr">Controles</th><th class="ctr">Residual</th><th>Tratamiento</th><th></th>
    </tr></thead><tbody>${filas}</tbody></table></div>`
    : `<div class="empty"><b>Sin riesgos registrados</b>
       ${puedeEditar ? "Usa el botón «Registrar riesgo» para crear el primero."
         : "Cuando las dependencias registren riesgos, aparecerán aquí."}
       <div style="margin-top:13px">
         <button class="btn ghost" id="btnSemilla">Cargar datos de prueba</button></div>
       </div>`}
  </div>`;
}
