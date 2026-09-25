/* =====================================================================
   Motor de cálculo, almacenamiento y utilidades.
   No conoce la interfaz: solo consulta el catálogo y opera sobre los datos.
   ===================================================================== */

/* =====================================================================
   MOTOR DE CÁLCULO — solo consulta el catálogo
   ===================================================================== */
const Motor = {
  nivelProbabilidad(frec){
    return CAT.probabilidad.find(p => frec >= p.min && (p.max === null || frec <= p.max)) || null;
  },
  pesoControl(tipo, impl){
    return (CAT.pesoControl.tipo[tipo] || 0) + (CAT.pesoControl.implementacion[impl] || 0);
  },
  afectacion(tipo){ return tipo === "Correctivo" ? "Impacto" : "Probabilidad"; },
  zonaInherente(p, i){
    return CAT.matrizInherente[`${+p}|${+i}`] || null;
  },
  zonaResidual(p, i){
    const r = CAT.matrizResidual.find(r =>
      i > r.iMin && i <= r.iMax && p > r.pMin && p <= r.pMax);
    return r ? r.z : "Bajo";
  },
  /* Mitigación acumulativa: P × Π(1−peso) */
  residual(probInh, impInh, controles){
    let mp = 1, mi = 1;
    const detalle = [];
    (controles || []).forEach((c, k) => {
      const peso = this.pesoControl(c.tipo, c.implementacion);
      const af = this.afectacion(c.tipo);
      if (af === "Probabilidad"){
        const antes = probInh * mp;
        mp *= (1 - peso);
        detalle.push({n:k+1, af, peso, antes, despues: probInh * mp});
      } else {
        const antes = impInh * mi;
        mi *= (1 - peso);
        detalle.push({n:k+1, af, peso, antes, despues: impInh * mi});
      }
    });
    const p = probInh * mp, i = impInh * mi;
    return {probabilidad:p, impacto:i, multP:mp, multI:mi,
            zona:this.zonaResidual(p, i), detalle};
  },
  describir(tipoC, datos){
    const t = CAT.tiposRiesgo.find(x => x.c === tipoC);
    if (!t) return "";
    if (t.plantilla === "__INTEGRIDAD__") return this.describirIntegridad(datos);
    return t.plantilla.replace(/\{(\w+)\}/g, (_, k) => {
      const v = (datos[k] || "").toString().trim();
      return v ? (k === "areaImpacto" ? v.toLowerCase() : v) : `[${CAT.etiquetas[k] || k}]`;
    });
  },

  /* La redacción del riesgo de integridad cambia según la causa inmediata
     (Guía v7, capítulo VI). Las tres variantes están parametrizadas. */
  describirIntegridad(d){
    const ph = k => `[${CAT.etiquetas[k] || k}]`;
    const area = (d.areaIntegridad || "").trim() || ph("areaIntegridad");
    const causa = (d.causaInmediata || "").trim();
    const accion = (d.accion || "").trim() || ph("accion");

    if (!causa) return `Posibilidad de ${area} por ${ph("causaInmediata")}…`;

    if (causa === "LA/FT/FP"){
      const punto = (d.puntoRiesgo || "").trim() || ph("puntoRiesgo");
      return `Posibilidad de ${area} por usar la entidad para dar apariencia de legalidad a los `
        + `activos provenientes de actividades delictivas o para canalizar recursos hacia la `
        + `realización de actividades terroristas o la proliferación de armas de destrucción `
        + `masiva a causa de fallas u omisiones en las operaciones de ${punto}`;
    }

    if (causa === "Inadecuada gestión del conflicto de intereses"){
      return `Posibilidad de ${area} por ${causa} a causa de decidir en un asunto sobre el cual `
        + `el servidor tiene un interés particular y directo en su regulación, gestión, control `
        + `o decisión en la ${accion}`;
    }

    const def = CAT.definicionCausa[causa] || ph("definición de la causa");
    return `Posibilidad de ${area} por ${causa} en la/el ${accion} a causa de ${def}`;
  },
  /* Devuelve la política de apetito aplicable a una zona residual */
  apetito(zona){
    return CAT.apetito.find(a => a.zonas.includes(zona)) || null;
  },
  opcionesTratamiento(zona){
    const a = this.apetito(zona);
    return a ? a.opciones : CAT.tratamiento.map(t => t.c);
  },

  validarTratamiento(opcion, tipoRiesgoC, zonaResidual, subestrategia, acta){
    const o = CAT.tratamiento.find(t => t.c === opcion);
    if (!o) return "Opción de tratamiento no válida en esta versión.";
    if (zonaResidual && !this.opcionesTratamiento(zonaResidual).includes(opcion))
      return `El apetito de riesgo no admite «${opcion}» en zona ${zonaResidual}.`;
    if (o.excluye.includes(tipoRiesgoC))
      return `El tratamiento «${opcion}» no aplica a este tipo de riesgo.`;
    if (o.zonas && zonaResidual && !o.zonas.includes(zonaResidual) && !acta)
      return `«${opcion}» en zona ${zonaResidual} requiere acta de comité.`;
    if (o.exigeSub && !subestrategia)
      return `«${opcion}» exige especificar la subestrategia.`;
    return null;
  }
};

/* =====================================================================
   ALMACENAMIENTO
   ===================================================================== */
const Store = {
  db:null, local:{},
  async init(){
    try { this.db = await window.claude?.use?.("db") || null; } catch(e){ this.db = null; }
    if (!this.db){
      try { this.local = JSON.parse(localStorage.getItem("mriesgos") || "{}"); } catch(e){ this.local = {}; }
    }
  },
  async get(col){
    if (this.db){
      try { const s = await this.db.collection(col).get(); return s.map(d => ({id:d.id, ...d.data})); }
      catch(e){ return []; }
    }
    return Object.values(this.local[col] || {});
  },
  async set(col, id, data){
    if (this.db){
      try { await this.db.doc(`${col}/${id}`).set(data); return; } catch(e){}
    }
    this.local[col] = this.local[col] || {};
    this.local[col][id] = {id, ...data};
    this.flush();
  },
  async del(col, id){
    if (this.db){ try { await this.db.doc(`${col}/${id}`).delete(); return; } catch(e){} }
    if (this.local[col]) delete this.local[col][id];
    this.flush();
  },
  _pend:null, _ultimoError:null,
  /* La escritura se agrupa: varios cambios seguidos producen un solo
     guardado, y nunca bloquea la interacción. */
  flush(){
    if (this._pend) clearTimeout(this._pend);
    this._pend = setTimeout(() => {
      this._pend = null;
      try {
        localStorage.setItem("mriesgos", JSON.stringify(this.local));
        this._ultimoError = null;
      } catch(e){
        this._ultimoError = e.name === "QuotaExceededError"
          ? "El almacenamiento del navegador está lleno. Exporte lo que necesite y use "
            + "«Liberar espacio» en Metodología."
          : "No se pudo guardar: " + e.message;
        console.warn("Store:", this._ultimoError);
      }
    }, 400);
  },
  /* Tamaño aproximado de lo guardado, en kilobytes */
  tamano(){
    try { return Math.round((localStorage.getItem("mriesgos") || "").length / 1024); }
    catch(e){ return 0; }
  }
};

/* =====================================================================
   ESTADO
   ===================================================================== */
const S = {
  riesgos:[], usuarios:[], ventanas:[], historico:[],
  seguimientos:[], monitoreos:[], internos:[], evaluaciones:[], monitoreoBD:[],
  solicitudes:[],
  madurezResp:{}, madurezDim:null,
  periodo: null,
  intervencion: false,   // el administrador actúa sobre una vista operativa
  sesion:null, vista:"panel",
  filtros:{macroproceso:"",proceso:"",unidad:"",tipo:"",zona:""}
};

const uid = () => Math.random().toString(36).slice(2, 10);

/* Ayuda didáctica reutilizable bajo un campo del formulario */
function ayudaCampo(k){
  const a = CAT.ayuda[k]; if (!a) return "";
  return `<p class="hint">${esc(a.q)}${a.ej ? ` <b>Ejemplo:</b> «${esc(a.ej)}»` : ""}</p>`;
}

/* Periodo trimestral vigente, derivado de la fecha */
function periodoActual(){
  const d = new Date(), t = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-T${t}`;
}
function periodosConocidos(){
  const set = new Set([periodoActual()]);
  [...S.seguimientos, ...S.monitoreos, ...S.internos].forEach(x => set.add(x.periodo));
  return [...set].sort().reverse();
}

/* Nombre y ruta sugeridos del archivo de evidencia en Drive */
function rutaEvidencia(r, periodo, nombreArchivo){
  const [anio, tri] = periodo.split("-");
  const base = `${r.proceso}-${r.unidad || ""}-${r.codigo}`
    .replace(/\s+/g, "");
  const ext = (nombreArchivo.split(".").pop() || "pdf").toLowerCase();
  return {carpeta:`Riesgos/${anio}/${tri}`, archivo:`${base}.${ext}`};
}

/* Evalúa el resultado del indicador contra los umbrales definidos en el
   riesgo y devuelve el nivel, su color y el texto formateado. */
function evaluarKRI(r, num, den){
  const nu = parseFloat(num), de = parseFloat(den);
  if (!isFinite(nu) || !isFinite(de) || de === 0) return null;
  const esPct = r.kriUnidad === "Porcentaje";
  const valor = esPct ? (nu / de) * 100 : nu / de;
  const texto = esPct ? valor.toFixed(1).replace(/\.0$/, "") + "%"
                      : (Number.isInteger(valor) ? String(valor) : valor.toFixed(2));

  const crit = parseFloat(r.kriCritico), sat = parseFloat(r.kriSatisfactorio);
  const aMin = parseFloat(r.kriAceptableMin), aMax = parseFloat(r.kriAceptableMax);
  const crece = r.kriTendencia === "Creciente";
  let nivel = null;

  if (isFinite(crit) && (crece ? valor < crit : valor > crit)) nivel = "Crítico";
  else if (isFinite(sat) && (crece ? valor > sat : valor < sat)) nivel = "Satisfactorio";
  else if (isFinite(aMin) && isFinite(aMax)
           && valor >= Math.min(aMin, aMax) && valor <= Math.max(aMin, aMax)) nivel = "Aceptable";

  const zona = nivel === "Crítico" ? "Extremo"
             : nivel === "Aceptable" ? "Moderado"
             : nivel === "Satisfactorio" ? "Bajo" : "";
  return {valor, texto, nivel, zona};
}

/* Calificación del diseño del control a partir de los 7 criterios */
function calificarDiseno(resp){
  let total = 0;
  CAT.evaluacionControl.forEach(cr => {
    const op = cr.op.find(o => o[0] === resp[cr.c]);
    if (op) total += op[1];
  });
  total = Math.round(total * 1e4) / 1e4;
  const r = CAT.rangoDiseno.find(x => total >= x.min && total <= x.max);
  return {total, calificacion: r ? r.n : "Débil"};
}
const esc = s => (s ?? "").toString().replace(/[&<>"']/g, c =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pct = n => (n * 100).toFixed(1).replace(/\.0$/, "") + "%";
/* Tipo oración: mayúscula inicial y el resto en minúscula, respetando
   las siglas en mayúscula y los nombres propios ya escritos así. */
function tipoOracion(t){
  if (!t) return "";
  let x = t.trim().replace(/\s+/g, " ");
  x = x.replace(/(^|[.:;]\s+)([a-záéíóúñ])/g, (m, p, c) => p + c.toUpperCase());
  return x.charAt(0).toUpperCase() + x.slice(1);
}
/* Índices construidos una sola vez: las búsquedas pasan de recorrer el
   arreglo a un acceso directo. */
const IDX = {
  proc:  new Map(CAT.procesos.map(x => [x.c, x])),
  uni:   new Map(CAT.unidades.map(x => [x.c, x])),
  macro: new Map(CAT.macroprocesos.map(x => [x.c, x])),
  tipo:  new Map(CAT.tiposRiesgo.map(x => [x.c, x]))
};
const proc  = c => IDX.proc.get(c);
const uni   = c => IDX.uni.get(c);
const dep   = uni;
const macro = c => IDX.macro.get(c);
const tipo  = c => IDX.tipo.get(c);
/* Dependencias de un proceso, calculadas una vez por proceso */
const _depsCache = new Map();
/* Estructura plana: cada dependencia cuelga directamente de un proceso */
const dependenciasDe = pc => {
  if (!_depsCache.has(pc)) _depsCache.set(pc, CAT.unidades.filter(u => u.p === pc));
  return _depsCache.get(pc);
};
const rutaUnidad = c => {
  const u = uni(c); if (!u) return "";
  return `${proc(u.p)?.n || ""} › ${u.n}`;
};

/* El administrador ve todo, pero para escribir en las vistas operativas
   debe activar la intervención. Así el histórico distingue quién cumplió
   de quién intervino. */
function esAdmin(){ return S.sesion?.rol === "ADMIN"; }

/* Los tres perfiles de monitoreo comparten alcance; los especializados
   además solo ven un tipo de riesgo. */
const ROLES_MONITOREO = ["MONITOREO","MONITOREO_TIC","MONITOREO_FIN"];
/* Reparto del monitoreo por tipo de riesgo:
   TICS ve seguridad digital, Financiera ve fiscal y calidad ve el resto. */
const TIPO_POR_ROL = {MONITOREO_TIC:["SED"], MONITOREO_FIN:["RFI"],
                      MONITOREO:["GES","INT","COR","CI"]};
function esMonitoreo(){ return ROLES_MONITOREO.includes(S.sesion?.rol); }
function tipoRestringido(){ return TIPO_POR_ROL[S.sesion?.rol] || null; }

/* Parametrización de calidad de los reportes */
function formatosGuardados(){
  /* El tipo y el título siempre provienen del catálogo; de lo guardado por
     el administrador solo se toman código, versión y fecha. */
  let prop = {};
  try { (JSON.parse(localStorage.getItem("formatos") || "[]") || [])
    .forEach(x => prop[x.c] = x); } catch(e){}
  return CAT.formatos.map(f => ({...f, ...(prop[f.c] || {}),
    tipo:f.tipo, titulo:f.titulo, c:f.c}));
}
function formato(cod){
  return formatosGuardados().find(f => f.c === cod) || CAT.formatos.find(f => f.c === cod);
}
function guardarFormatos(lista){
  try { localStorage.setItem("formatos", JSON.stringify(lista)); } catch(e){}
}
function logoEntidad(){
  try { return localStorage.getItem("logoEntidad") || CAT.entidad.logo || ""; }
  catch(e){ return CAT.entidad.logo || ""; }
}
function logoEsPropio(){
  try { return !!localStorage.getItem("logoEntidad"); } catch(e){ return false; }
}
function guardarLogo(d){
  try { d ? localStorage.setItem("logoEntidad", d) : localStorage.removeItem("logoEntidad"); }
  catch(e){}
}

/* Qué formatos puede descargar cada rol */
function puedeDescargar(fmt){
  const r = S.sesion?.rol;
  if (r === "PUBLICO") return fmt === "PDF";
  return ["ADMIN","ENLACE_SIG","SEGUIMIENTO", ...ROLES_MONITOREO].includes(r);
}

/* Resuelve la carpeta de evidencia de una dependencia */
function carpetaEvidencia(codUnidad, tipo){
  const u = uni(codUnidad);
  if (u){
    const k = u.n.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ").trim().toUpperCase();
    const esp = CAT.evidencias.porDependencia[k];
    if (esp && esp[tipo]) return esp[tipo];
  }
  return CAT.evidencias.general[tipo] || "";
}
function puedeEscribirOperativo(tipoVentana){
  if (esAdmin()) return S.intervencion;
  return ventanaAbierta(tipoVentana);
}
function bannerAdmin(){
  if (!esAdmin()) return "";
  return S.intervencion
    ? `<div class="banner warn"><span>&#9888;</span><div>
        <b>Intervención administrativa activa.</b> Lo que registres quedará marcado como hecho por
        la administración, no por el responsable del proceso.
        <button class="btn ghost sm" id="btnInterv" style="margin-left:9px">Desactivar</button></div></div>`
    : `<div class="banner info"><span>&#9432;</span><div>
        Estás viendo esta sección como administrador, en modo consulta. La ejecución corresponde a
        los roles operativos.
        <button class="btn ghost sm" id="btnInterv" style="margin-left:9px">Intervenir</button></div></div>`;
}

function ventanaAbierta(kind){
  const now = Date.now();
  return S.ventanas.some(v => v.tipo === kind &&
    now >= new Date(v.desde).getTime() && now <= new Date(v.hasta + "T23:59:59").getTime());
}
function puede(accion){
  const r = S.sesion?.rol;
  if (r === "ADMIN") return true;
  if (accion === "leer") return true;
  if (accion === "riesgo" && r === "ENLACE_SIG") return ventanaAbierta("ACTUALIZACION");
  if (accion === "ejecucion" && r === "ENLACE_SIG") return ventanaAbierta("EJECUCION");
  if (accion === "monitoreo" && ROLES_MONITOREO.includes(r)) return ventanaAbierta("MONITOREO");
  /* Control Interno consulta y descarga; ya no registra seguimiento
     dentro del ciclo trimestral. */
  if (accion === "usuarios") return false;
  return false;
}

/* =====================================================================
   HISTÓRICO
   ===================================================================== */
async function registrarVersion(riesgo, operacion, motivo, previo){
  const cambios = [];
  if (previo){
    const campos = {codigo:"Código", descripcion:"Descripción", tipo:"Tipo de riesgo",
      causaRaiz:"Causa raíz", efectoInmediato:"Efecto inmediato", areaImpacto:"Área de impacto",
      macroproceso:"Macroproceso", proceso:"Proceso", unidad:"Dependencia", frecuencia:"Frecuencia anual",
      impactoNivel:"Nivel de impacto", estado:"Estado"};
    Object.entries(campos).forEach(([k, et]) => {
      if ((previo[k] ?? "") !== (riesgo[k] ?? ""))
        cambios.push({campo:et, antes:previo[k] ?? "—", ahora:riesgo[k] ?? "—"});
    });
    const ca = (previo.controles || []).length, cb = (riesgo.controles || []).length;
    if (ca !== cb) cambios.push({campo:"Número de controles", antes:ca, ahora:cb});
  }
  const v = {
    id: uid(), riesgoId: riesgo.id, version: (S.historico.filter(h => h.riesgoId === riesgo.id).length) + 1,
    operacion, motivo: motivo || "", cambios,
    snapshot: JSON.parse(JSON.stringify(riesgo)),
    usuario: S.sesion?.nombre || "—", rol: S.sesion?.rol || "—",
    fecha: new Date().toISOString()
  };
  S.historico.push(v);
  await Store.set("historico", v.id, v);
}
