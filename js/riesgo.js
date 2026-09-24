/* =====================================================================
   Formulario de riesgo: campos por tipo, valoración, tratamiento,
   indicador y plan de implementación de controles.
   ===================================================================== */

/* =====================================================================
   FORMULARIO DE RIESGO
   ===================================================================== */
let F = null;

function abrirFormulario(id){
  const existente = id ? S.riesgos.find(r => r.id === id) : null;
  F = existente ? JSON.parse(JSON.stringify(existente)) : {
    id: uid(), tipo:"GES", macroproceso:"", proceso:"", unidad:"", dependencia:"", clase:"", factores:[],
    areaImpacto:"", areaFiscal:"", activo:"", tipoActivo:"", propiedadSD:"",
    vulnerabilidad:"", amenaza:"",
    causaInmediata:"", areaIntegridad:"", factorLAFT:"", puntoRiesgo:"",
    causaRaiz:"", efectoInmediato:"", accion:"",
    frecuencia:"", impactoNivel:"", impactoEconomico:"", impactoReputacional:"",
    controles:[], tratamiento:"", subestrategia:"", acta:"",
    kriNombre:"", kriDescripcion:"", kriObjetivo:"", kriNumerador:"", kriDenominador:"",
    kriUnidad:"", kriResponsable:"", kriDisponibilidad:"", kriUbicacion:"",
    kriFrecuencia:"", kriTendencia:"", kriCritico:"", kriAceptableMin:"",
    kriAceptableMax:"", kriSatisfactorio:"", plan:[],
    estado:"VIGENTE", motivo:""
  };
  F._nuevo = !existente;
  pintarFormulario();
}

function recalcular(){
  const np = F.frecuencia !== "" ? Motor.nivelProbabilidad(Number(F.frecuencia)) : null;

  /* Cuando el área de impacto comprende lo económico y lo reputacional se
     valoran ambas y se toma la más alta (Guía v7, numeral 3.6). */
  const area = (F.areaImpacto || F.areaIntegridad || "").toLowerCase();
  F._pideEco = !F.areaFiscal ? area.includes("econ") : true;
  F._pideRep = area.includes("reputacion");
  if (!F._pideEco && !F._pideRep){ F._pideEco = true; F._pideRep = true; }

  const nEco = CAT.impacto.find(i => i.n === F.impactoEconomico) || null;
  const nRep = CAT.impacto.find(i => i.n === F.impactoReputacional) || null;
  const candidatos = [];
  if (F._pideEco && nEco) candidatos.push(nEco);
  if (F._pideRep && nRep) candidatos.push(nRep);
  const ni = candidatos.length
    ? candidatos.reduce((a, b) => b.pct > a.pct ? b : a)
    : null;
  F.impactoNivel = ni ? ni.n : "";
  F._impactoOrigen = ni ? (ni === nEco && ni === nRep ? "ambas"
    : ni === nEco ? "económica" : "reputacional") : "";
  F.probabilidadPct = np ? np.pct : null;
  F.probabilidadNivel = np ? np.n : null;
  F.impactoPct = ni ? ni.pct : null;
  F.zonaInherente = (np && ni) ? Motor.zonaInherente(np.pct, ni.pct) : null;
  if (np && ni){
    const res = Motor.residual(np.pct, ni.pct, F.controles);
    F.probResidual = res.probabilidad; F.impResidual = res.impacto;
    F.zonaResidual = res.zona; F._detalle = res.detalle;
    F._multP = res.multP; F._multI = res.multI;
  } else { F.probResidual = F.impResidual = F.zonaResidual = null; F._detalle = []; }
  F.descripcion = tipoOracion(Motor.describir(F.tipo, F));
}

function pintarFormulario(){
  recalcular();
  const t = tipo(F.tipo);
  const campos = t.campos;
  const pr = proc(F.proceso);
  const procsDe = F.macroproceso ? CAT.procesos.filter(p => p.m === F.macroproceso) : [];
  const unisDe = pr ? dependenciasDe(pr.c) : [];

  const sel = (id, val, arr, fn, ph) => `<select id="${id}">
    <option value="">${ph}</option>
    ${arr.map(x => { const [v, tx] = fn(x);
      return `<option value="${esc(v)}" ${val === v ? "selected" : ""}>${esc(tx)}</option>`; }).join("")}
  </select>`;

  /* Cada campo se pinta en el orden que define el tipo de riesgo.
     Cambiar el orden es cambiar el arreglo campos del catálogo. */
  const campoSelect = (id, key, lista, ph, ayuda) => `<div class="field">
    <label class="req">${esc(CAT.etiquetas[key] || key)}</label>
    ${sel(id, F[key], lista, x => [x, x], ph || "Seleccione")}
    ${ayuda !== false ? ayudaCampo(key) : ""}</div>`;

  const campoTexto = (id, key, ph, ayuda) => `<div class="field">
    <label class="req">${esc(CAT.etiquetas[key] || key)}</label>
    <input type="text" id="${id}" value="${esc(F[key] || "")}" placeholder="${esc(ph || "")}">
    ${ayuda ? `<p class="hint">${ayuda}</p>` : ayudaCampo(key)}</div>`;

  const esLAFT = F.causaInmediata === "LA/FT/FP";

  const PINTAR = {
    causaRaiz: () => F.tipo === "INT"
      ? campoTexto("fCausa", "causaRaiz", "la inexistencia de segregación de funciones en la aprobación",
          "Identifique la causa raíz del riesgo utilizando metodologías como los cinco porqués o la espina de pescado.")
      : campoTexto("fCausa", "causaRaiz", CAT.ayuda.causaRaiz.ej),

    efectoInmediato: () => campoTexto("fEfecto", "efectoInmediato", CAT.ayuda.efectoInmediato.ej),

    areaImpacto: () => campoSelect("fArea", "areaImpacto", CAT.areaImpacto),

    areaFiscal: () => `<div class="field"><label class="req">Área de impacto fiscal</label>
      ${sel("fAreaF", F.areaFiscal, CAT.areaFiscal, x => [x, x], "Seleccione")}
      <p class="hint">Patrimonio público sobre el que recae el efecto dañoso.</p></div>`,

    tipoActivo: () => campoSelect("fTipoAct", "tipoActivo", CAT.tipoActivo),

    activo: () => `<div class="field"><label class="req">Nombre del activo de información</label>
      <input type="text" id="fActivo" value="${esc(F.activo || "")}"
        placeholder="Base de datos del Sistema de Información de Hacienda">
      <p class="hint">Debe coincidir con el inventario de activos del proceso, que se actualiza
        varias veces al año.
        <a href="${CAT.inventarioActivos}" target="_blank" rel="noopener">Consultar el registro
        de activos de información</a></p></div>`,

    propiedadSD: () => campoSelect("fProp", "propiedadSD", CAT.propiedadSD),

    vulnerabilidad: () => campoSelect("fVul", "vulnerabilidad", CAT.vulnerabilidad),

    amenaza: () => campoSelect("fAme", "amenaza", CAT.amenaza),

    causaInmediata: () => campoSelect("fCausaInm", "causaInmediata", CAT.causaInmediata),

    areaIntegridad: () => campoSelect("fAreaInt", "areaIntegridad", CAT.areaIntegridad),

    factorLAFT: () => esLAFT ? campoSelect("fFactorL", "factorLAFT", CAT.factorLAFT) : "",

    puntoRiesgo: () => esLAFT ? campoSelect("fPunto", "puntoRiesgo", CAT.puntoRiesgo) : "",

    accion: () => (F.tipo === "INT" && esLAFT) ? "" : campoTexto("fAccion", "accion",
      F.tipo === "INT" ? "revisión de los estudios previos" : CAT.ayuda.accion.ej,
      F.tipo === "INT"
        ? "Utilice sustantivos de acción como: planeación, ejecución, elaboración, revisión, recaudo."
        : null),

    factores: () => `<div class="field"><label>Factores de riesgo</label>
      <div style="display:flex;gap:7px;flex-wrap:wrap">
        ${CAT.factores.map(f => `<label style="display:flex;align-items:center;gap:5px;margin:0;
          padding:4px 9px;border:1px solid var(--line);border-radius:14px;cursor:pointer;
          background:${(F.factores || []).includes(f) ? "var(--accent-soft)" : "var(--surface)"};
          color:${(F.factores || []).includes(f) ? "var(--accent-ink)" : "var(--ink-2)"};font-size:12px">
          <input type="checkbox" data-fac="${esc(f)}" ${(F.factores || []).includes(f) ? "checked" : ""}
            style="width:auto;margin:0">${esc(f)}</label>`).join("")}
      </div></div>`
  };

  const condicionales = campos.map(k => (PINTAR[k] ? PINTAR[k]() : "")).join("");

  const npNivel = F.probabilidadNivel;
  const controles = (F.controles || []).map((c, k) => {
    const peso = Motor.pesoControl(c.tipo, c.implementacion);
    return `<div class="ctrl-item">
      <div class="ctrl-head"><b>Control ${k + 1}</b>
        <div style="display:flex;gap:7px;align-items:center">
          <span class="tag">${Motor.afectacion(c.tipo)} · ${pct(peso)}</span>
          <button class="btn ghost sm" data-delctrl="${k}">Quitar</button></div></div>
      <div class="grid2">
        <div class="field" style="margin-bottom:9px"><label class="req">Responsable</label>
          <input type="text" data-c="${k}" data-f="responsable" value="${esc(c.responsable)}"
            placeholder="${esc(CAT.ayuda.controlResponsable.ej)}">
          <p class="hint">Debe corresponder a un cargo perteneciente al área.</p></div>
        <div class="field" style="margin-bottom:9px"><label class="req">Acción</label>
          <input type="text" data-c="${k}" data-f="accion" value="${esc(c.accion)}"
            placeholder="verifica y aprueba">
          <p class="hint">Utilice verbos en presente como: planea, ejecuta, elabora, revisa, recauda.</p></div>
      </div>
      <div class="grid2">
        <div class="field" style="margin-bottom:9px"><label class="req">Periodicidad</label>
          <select data-c="${k}" data-f="periodicidad" autocomplete="off">
            <option value="">Seleccione</option>
            ${CAT.periodicidad.map(x =>
              `<option ${c.periodicidad === x ? "selected" : ""}>${esc(x)}</option>`).join("")}
          </select></div>
        <div class="field" style="margin-bottom:9px"><label class="req">Complemento</label>
          <input type="text" data-c="${k}" data-f="complemento" value="${esc(c.complemento)}"
            placeholder="las conciliaciones bancarias contra el extracto">
          <p class="hint">Señale el objetivo de la acción y la calidad esperada.</p></div>
      </div>
      <div class="grid2">
        <div class="field" style="margin-bottom:0"><label>Tipo</label>
          <select data-c="${k}" data-f="tipo">
            ${Object.keys(CAT.pesoControl.tipo).map(x =>
              `<option ${c.tipo === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="field" style="margin-bottom:0"><label>Implementación</label>
          <select data-c="${k}" data-f="implementacion">
            ${Object.keys(CAT.pesoControl.implementacion).map(x =>
              `<option ${c.implementacion === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
      </div>
    </div>`;
  }).join("");

  const detalle = (F._detalle || []).map(d =>
    `<div class="calc-row"><span>Control ${d.n} · ${d.af}</span>
     <span class="mono">${pct(d.antes)} × (1 − ${pct(d.peso)}) = ${pct(d.despues)}</span></div>`).join("");

  const trat = CAT.tratamiento.find(x => x.c === F.tratamiento);
  const errTrat = F.tratamiento
    ? Motor.validarTratamiento(F.tratamiento, F.tipo, F.zonaResidual, F.subestrategia, F.acta)
    : null;

  modal(F._nuevo ? "Registrar riesgo" : "Editar riesgo", `
    <div class="grid2">
      <div class="field"><label class="req">Macroproceso</label>
        ${sel("fMacro", F.macroproceso, CAT.macroprocesos, m => [m.c, m.n], "Seleccione")}</div>
      <div class="field"><label class="req">Proceso</label>
        ${F.macroproceso ? sel("fProc", F.proceso, procsDe, p => [p.c, p.n], "Seleccione el proceso")
          : `<select disabled><option>Seleccione primero el macroproceso</option></select>`}</div>
    </div>
    <div class="field"><label class="req">Dependencia</label>
      ${F.proceso ? sel("fUni", F.unidad, unisDe, u => [u.c, u.n], "Seleccione la dependencia")
        : `<select disabled><option>Seleccione primero el proceso</option></select>`}
      <p class="hint">Solo aparecen las dependencias que participan en el proceso, según el
        organigrama vigente. Define quién responde por el riesgo.</p></div>

    <div class="grid2">
      <div class="field"><label class="req">Tipo de riesgo</label>
        ${sel("fTipo", F.tipo, CAT.tiposRiesgo.filter(t => !t.oculto || t.c === F.tipo),
              t => [t.c, t.n], "")}
        <p class="hint">Determina qué campos se habilitan y cómo se redacta el riesgo.</p></div>
      <div class="field"><label>Clase de riesgo</label>
        ${sel("fClase", F.clase, CAT.claseRiesgo, x => [x, x], "Seleccione")}</div>
    </div>

    ${F.tipo === "INT" ? `<div class="banner info"><span>&#9432;</span><div>
      La versión 7 reemplaza la categoría de corrupción por <b>riesgo de integridad</b>, que agrupa
      soborno, fraude, corrupción, conflicto de intereses y LA/FT/FP. La redacción del riesgo cambia
      según la causa inmediata que elija, y el impacto se valora con la tabla general, ya no con el
      cuestionario de diecinueve preguntas.</div></div>` : ""}

    ${condicionales}

    <div class="field">
      <label>Descripción generada</label>
      <div class="calc" style="line-height:1.55">${esc(F.descripcion)}</div>
      <p class="hint">Se arma con la plantilla del tipo de riesgo. Si cambia la guía, se ajusta la plantilla, no el código.</p>
    </div>

    <h2 style="margin:22px 0 11px;padding-top:15px;border-top:1px solid var(--line)">Riesgo inherente</h2>
    <div class="grid2">
      <div class="field"><label class="req">Frecuencia anual de la actividad</label>
        <input type="number" id="fFrec" min="0" value="${esc(F.frecuencia)}" placeholder="Número de veces al año">
        ${npNivel ? `<p class="hint">Probabilidad: <b>${npNivel}</b> (${pct(F.probabilidadPct)})</p>`
          : ayudaCampo("frecuencia")}</div>
      <div class="field"></div>
    </div>

    <div class="grid2">
      ${F._pideEco ? `<div class="field"><label class="req">Afectación económica</label>
        ${sel("fImpEco", F.impactoEconomico, CAT.impacto, i => [i.n, `${i.n} — ${i.eco}`], "Seleccione")}
        </div>` : ""}
      ${F._pideRep ? `<div class="field"><label class="req">Afectación reputacional</label>
        ${sel("fImpRep", F.impactoReputacional, CAT.impacto, i => [i.n, `${i.n} — ${i.rep}`], "Seleccione")}
        </div>` : ""}
    </div>
    ${F.impactoNivel ? `<p class="hint" style="margin:-6px 0 13px">Impacto inherente:
      <b>${esc(F.impactoNivel)} (${pct(F.impactoPct)})</b>, tomado de la afectación
      ${esc(F._impactoOrigen)}. Cuando ambas se valoran con niveles distintos, la guía indica
      tomar el más alto.</p>` : ""}

    ${F.zonaInherente ? `
    <h3 style="margin:16px 0 9px">Valoración del riesgo inherente</h3>
    <div class="grid3">
      <div class="kpi"><div class="v mono" style="font-size:22px">${pct(F.probabilidadPct)}</div>
        <div class="l">Probabilidad inherente</div>
        <div class="d">${esc(F.probabilidadNivel || "")}</div></div>
      <div class="kpi"><div class="v mono" style="font-size:22px">${pct(F.impactoPct)}</div>
        <div class="l">Impacto inherente</div>
        <div class="d">${esc(F.impactoNivel || "")}</div></div>
      <div class="kpi" style="display:flex;flex-direction:column;justify-content:center">
        <div><span class="zone ${F.zonaInherente}" style="font-size:14px;padding:4px 13px">${F.zonaInherente}</span></div>
        <div class="l" style="margin-top:6px">Severidad</div>
        <div class="d">Zona de riesgo inherente</div></div>
    </div>` : ""}

    <h2 style="margin:22px 0 11px;padding-top:15px;border-top:1px solid var(--line)">Controles</h2>
    <div class="banner info" style="margin-bottom:13px"><span>&#9432;</span><div>
      Un control se escribe como una frase:
      <b>responsable + acción + periodicidad + complemento</b>. Ejemplo:
      «El profesional universitario de la Dirección de Contabilidad verifica y aprueba
      mensualmente las conciliaciones bancarias contra el extracto». Los preventivos y detectivos
      bajan la probabilidad; solo los correctivos bajan el impacto.</div></div>
    ${controles || `<p class="hint" style="margin-bottom:11px">Sin controles registrados. El riesgo residual será igual al inherente.</p>`}
    <button class="btn ghost sm" id="addCtrl">Agregar control</button>

    ${F.zonaResidual ? `
    <h2 style="margin:22px 0 11px;padding-top:15px;border-top:1px solid var(--line)">Riesgo residual</h2>
    <div class="calc" style="margin-bottom:13px">
      <div class="calc-row"><span>Probabilidad inherente</span><span class="mono">${pct(F.probabilidadPct)}</span></div>
      <div class="calc-row"><span>Impacto inherente</span><span class="mono">${pct(F.impactoPct)}</span></div>
      ${detalle}
      <div class="calc-row"><span>Residual</span>
        <span class="mono">P ${pct(F.probResidual)} · I ${pct(F.impResidual)}</span></div>
    </div>
    <div class="grid3">
      <div class="kpi"><div class="v mono" style="font-size:22px">${pct(F.probResidual)}</div>
        <div class="l">Probabilidad residual</div></div>
      <div class="kpi"><div class="v mono" style="font-size:22px">${pct(F.impResidual)}</div>
        <div class="l">Impacto residual</div></div>
      <div class="kpi" style="display:flex;flex-direction:column;justify-content:center">
        <div><span class="zone ${F.zonaResidual}" style="font-size:14px;padding:4px 13px">${F.zonaResidual}</span></div>
        <div class="l" style="margin-top:6px">Zona de riesgo residual</div></div>
    </div>` : ""}

    <h2 style="margin:22px 0 11px;padding-top:15px;border-top:1px solid var(--line)">Tratamiento</h2>
    ${(() => {
      const ap = F.zonaResidual ? Motor.apetito(F.zonaResidual) : null;
      if (!ap) return `<p class="hint">Complete la valoración para determinar el tratamiento
        que admite el apetito de riesgo institucional.</p>`;
      return `<div class="banner ${ap.aceptable ? "ok" : "warn"}"><span>${ap.aceptable ? "&#9679;" : "&#9888;"}</span>
        <div>Zona residual <b>${esc(F.zonaResidual)}</b> · apetito <b>${esc(ap.nivel)}</b>.
        ${esc(ap.descripcion)} <b>${esc(ap.accion)}</b>
        ${ap.requiereTratamiento ? "Este riesgo exige tratamiento." : "No exige tratamiento obligatorio."}</div></div>`;
    })()}
    <div class="grid2">
      <div class="field"><label class="req">Opción de tratamiento</label>
        ${F.zonaResidual
          ? sel("fTrat", F.tratamiento, Motor.opcionesTratamiento(F.zonaResidual),
                x => [x, x], "Seleccione")
          : `<select disabled><option>Complete la valoración primero</option></select>`}
        <p class="hint">Solo se ofrecen las opciones que admite el apetito de riesgo para esta zona.</p></div>
      ${trat?.exigeSub ? `<div class="field"><label class="req">Subestrategia</label>
        ${sel("fSub", F.subestrategia, CAT.subestrategia, x => [x, x], "Seleccione")}</div>` : ""}
    </div>
    ${errTrat ? `<div class="banner warn"><span>&#9888;</span><div>${esc(errTrat)}</div></div>` : ""}

    <h2 style="margin:22px 0 11px;padding-top:15px;border-top:1px solid var(--line)">
      Identificación del indicador clave de riesgo (KRI)</h2>
    <div class="grid2">
      <div class="field"><label>Nombre del indicador</label>
        <input type="text" id="kNom" value="${esc(F.kriNombre || "")}"
          placeholder="${esc(CAT.ayuda.kriNombre.ej)}">
        <p class="hint">El nombre debe describir lo que se mide.</p></div>
      <div class="field"><label>Unidad de medida</label>
        ${sel("kUni", F.kriUnidad, CAT.unidadMedida, x => [x, x], "Seleccione")}</div>
    </div>
    <div class="grid2">
      <div class="field"><label>Descripción</label>
        <textarea id="kDes" style="min-height:52px"
          placeholder="Qué se va a medir">${esc(F.kriDescripcion || "")}</textarea>
        <p class="hint">Describir lo que se va a medir.</p></div>
      <div class="field"><label>Objetivo</label>
        <textarea id="kObj" style="min-height:52px"
          placeholder="Para qué se mide">${esc(F.kriObjetivo || "")}</textarea>
        <p class="hint">Describir para qué se mide el indicador.</p></div>
    </div>

    <div class="field"><label>Fórmula</label>
      <div style="border:1px solid var(--line);border-radius:var(--radius);padding:11px;
        background:var(--surface-2)">
        <input type="text" id="kNum" value="${esc(F.kriNumerador || "")}"
          placeholder="${esc(CAT.ayuda.kriNumerador.ej)}" style="text-align:center">
        <div style="border-top:1px solid var(--ink-2);margin:7px 0"></div>
        <input type="text" id="kDen" value="${esc(F.kriDenominador || "")}"
          placeholder="${esc(CAT.ayuda.kriDenominador.ej)}" style="text-align:center">
        ${F.kriNumerador && F.kriDenominador ? `<p class="hint mono" style="text-align:center;margin-top:9px">
          (${esc(F.kriNumerador)} / ${esc(F.kriDenominador)})${F.kriUnidad === "Porcentaje" ? " × 100" : ""}</p>` : ""}
      </div></div>

    <h3 style="margin:15px 0 9px">Fuente de información</h3>
    <div class="grid3">
      <div class="field"><label>Responsable de la información</label>
        <input type="text" id="kResp" value="${esc(F.kriResponsable || "")}" placeholder="Cargo"></div>
      <div class="field"><label>Disponibilidad</label>
        ${sel("kDisp", F.kriDisponibilidad, CAT.disponibilidadFuente, x => [x, x], "Seleccione")}</div>
      <div class="field"><label>Ubicación</label>
        <input type="text" id="kUbi" value="${esc(F.kriUbicacion || "")}"
          placeholder="Serie 200-14 o enlace">
        <p class="hint">Incorpore la serie y subserie o el enlace de acceso al documento.</p></div>
    </div>

    <div class="grid2">
      <div class="field"><label>Frecuencia de medición</label>
        ${sel("kFrec", F.kriFrecuencia, CAT.frecuenciaMedicion, x => [x, x], "Seleccione")}</div>
      <div class="field"><label>Tendencia</label>
        ${sel("kTend", F.kriTendencia, CAT.tendenciaKRI, x => [x, x], "Seleccione")}
        <p class="hint">Creciente si un valor mayor es mejor; decreciente si es al revés.</p></div>
    </div>

    ${F.kriTendencia ? (() => {
      const crece = F.kriTendencia === "Creciente";
      return `<h3 style="margin:15px 0 9px">Umbrales de alerta</h3>
      <div class="grid3">
        <div class="field"><label><span class="zone Extremo">Crítico</span></label>
          <div style="display:flex;align-items:center;gap:7px">
            <span class="hint" style="white-space:nowrap">${crece ? "menor que" : "mayor que"}</span>
            <input type="number" id="kCrit" step="any" value="${esc(F.kriCritico ?? "")}"></div></div>
        <div class="field"><label><span class="zone Moderado">Aceptable</span></label>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="hint">entre</span>
            <input type="number" id="kAcepMin" step="any" value="${esc(F.kriAceptableMin ?? "")}">
            <span class="hint">y</span>
            <input type="number" id="kAcepMax" step="any" value="${esc(F.kriAceptableMax ?? "")}"></div></div>
        <div class="field"><label><span class="zone Bajo">Satisfactorio</span></label>
          <div style="display:flex;align-items:center;gap:7px">
            <span class="hint" style="white-space:nowrap">${crece ? "mayor que" : "menor que"}</span>
            <input type="number" id="kSat" step="any" value="${esc(F.kriSatisfactorio ?? "")}"></div></div>
      </div>`;
    })() : ""}

    ${F.tratamiento && F.tratamiento !== "Aceptar" ? `
    <h2 style="margin:22px 0 11px;padding-top:15px;border-top:1px solid var(--line)">
      Plan de implementación de controles</h2>
    <p class="hint" style="margin-top:-6px">Actividades para poner en marcha los controles nuevos
      que exige el tratamiento seleccionado.</p>
    ${(F.plan || []).map((a, k) => `<div class="ctrl-item">
      <div class="ctrl-head"><b>Actividad ${k + 1}</b>
        <button class="btn ghost sm" data-delact="${k}">Quitar</button></div>
      <div class="field" style="margin-bottom:9px"><label class="req">Actividad</label>
        <input type="text" data-a="${k}" data-af="actividad" value="${esc(a.actividad || "")}"
          placeholder="${esc(CAT.ayuda.planActividad.ej)}">
        <p class="hint">Describir las actividades a desarrollar para implementar un nuevo control,
          iniciando por un verbo en infinitivo.</p></div>
      <div class="grid2">
        <div class="field" style="margin-bottom:0"><label class="req">Responsable</label>
          <input type="text" data-a="${k}" data-af="responsable" value="${esc(a.responsable || "")}"
            placeholder="Profesional universitario de la Dirección">
          <p class="hint">Debe corresponder a un cargo perteneciente al área.</p></div>
        <div class="field" style="margin-bottom:0"><label class="req">Fecha de implementación</label>
          <input type="date" data-a="${k}" data-af="fecha" value="${esc(a.fecha || "")}"></div>
      </div>
    </div>`).join("")}
    <button class="btn ghost sm" id="addAct">Agregar actividad</button>
    ` : ""}

    <h2 style="margin:22px 0 11px;padding-top:15px;border-top:1px solid var(--line)">Soporte de la solicitud</h2>
    <div class="field"><label${requiereAprobacion() ? ' class="req"' : ''}>Enlace al formato ES-SIG-RG-16</label>
      <input type="text" id="fRG16" value="${esc(F.enlaceRG16 || "")}"
        placeholder="https://santandergov-my.sharepoint.com/...">
      <p class="hint">Pegue el enlace del formato diligenciado que respalda esta
        ${F._nuevo ? "creación" : "actualización"}. Es el soporte que revisa la Dirección SIG.</p></div>

    ${requiereAprobacion() ? `<div class="banner info"><span>&#9432;</span><div>
      Este ${F._nuevo ? "riesgo nuevo" : "cambio"} no entra directo a la matriz general: queda como
      solicitud en <b>Ciclo semestral &rarr; Actualización de riesgos</b> hasta que la Dirección SIG
      lo apruebe.</div></div>` : ""}

    ${(!F._nuevo || requiereAprobacion()) ? `<div class="field" style="margin-top:17px">
      <label class="req">Motivo ${F._nuevo ? "de la solicitud" : "del cambio"}</label>
      <textarea id="fMotivo" placeholder="Describa por qué se modifica este riesgo (mínimo 20 caracteres)">${esc(F.motivo)}</textarea>
      <p class="hint">Queda registrado en el histórico junto con los campos que cambiaron.</p></div>` : ""}
  `, [
    {t:"Cancelar", cls:"ghost", fn: cerrarModal},
    {t: F._nuevo ? "Registrar riesgo" : "Guardar cambios", cls:"", fn: guardarRiesgo}
  ]);

  enlazarFormulario();
}

function enlazarFormulario(){
  const on = (id, ev, fn) => { const e = document.getElementById(id); if (e) e[ev] = fn; };
  const bind = (id, key, refresca) => on(id, "onchange", e => {
    F[key] = e.target.value;
    if (refresca) pintarFormulario(); else { recalcular(); pintarFormulario(); }
  });

  on("fMacro", "onchange", e => {
    F.macroproceso = e.target.value; F.proceso = ""; F.unidad = ""; F.dependencia = ""; pintarFormulario(); });
  on("fProc", "onchange", e => {
    F.proceso = e.target.value; F.unidad = ""; F.dependencia = ""; pintarFormulario(); });
  on("fUni", "onchange", e => { F.unidad = e.target.value; pintarFormulario(); });
  on("fTipo", "onchange", e => { F.tipo = e.target.value; pintarFormulario(); });
  bind("fClase", "clase");
  bind("fArea", "areaImpacto"); bind("fAreaF", "areaFiscal");
  bind("fTipoAct", "tipoActivo"); bind("fProp", "propiedadSD");
  bind("fVul", "vulnerabilidad"); bind("fAme", "amenaza");
  bind("fAreaInt", "areaIntegridad"); bind("fFactorL", "factorLAFT");
  bind("fPunto", "puntoRiesgo");
  /* Cambiar la causa inmediata habilita o esconde factor y punto de riesgo */
  on("fCausaInm", "onchange", e => {
    F.causaInmediata = e.target.value;
    if (F.causaInmediata !== "LA/FT/FP"){ F.factorLAFT = ""; F.puntoRiesgo = ""; }
    pintarFormulario();
  });
  bind("fImpEco", "impactoEconomico"); bind("fImpRep", "impactoReputacional");
  bind("fTrat", "tratamiento"); bind("fSub", "subestrategia");
  bind("kUni", "kriUnidad"); bind("kDisp", "kriDisponibilidad");
  bind("kFrec", "kriFrecuencia"); bind("kTend", "kriTendencia");

  ["fActivo:activo","fAccion:accion","fEfecto:efectoInmediato","fCausa:causaRaiz",
   "fFrec:frecuencia"].forEach(pair => {
    const [id, key] = pair.split(":");
    const el = document.getElementById(id);
    if (!el) return;
    el.oninput = () => { F[key] = el.value; };
    el.onblur  = () => { pintarFormulario(); };
  });
  ["fRG16:enlaceRG16","kNom:kriNombre","kDes:kriDescripcion","kObj:kriObjetivo","kNum:kriNumerador",
   "kDen:kriDenominador","kResp:kriResponsable","kUbi:kriUbicacion",
   "kCrit:kriCritico","kAcepMin:kriAceptableMin","kAcepMax:kriAceptableMax",
   "kSat:kriSatisfactorio","fMotivo:motivo"].forEach(pair => {
    const [id, key] = pair.split(":");
    const el = document.getElementById(id);
    if (!el) return;
    el.oninput = () => { F[key] = el.value; };
    if (id === "kNum" || id === "kDen") el.onblur = () => pintarFormulario();
  });

  /* Plan de implementación de controles: lista variable de actividades */
  const btnAct = document.getElementById("addAct");
  if (btnAct) btnAct.onclick = () => {
    F.plan = F.plan || [];
    F.plan.push({actividad:"", responsable:"", fecha:""});
    pintarFormulario();
  };
  document.querySelectorAll("[data-delact]").forEach(b => b.onclick = () => {
    F.plan.splice(Number(b.dataset.delact), 1); pintarFormulario();
  });
  document.querySelectorAll("[data-a]").forEach(el => {
    const k = Number(el.dataset.a), f = el.dataset.af;
    el.oninput = () => { F.plan[k][f] = el.value; };
    if (el.type === "date") el.onchange = () => { F.plan[k][f] = el.value; };
  });

  document.querySelectorAll("[data-fac]").forEach(cb => cb.onchange = () => {
    F.factores = F.factores || [];
    const v = cb.dataset.fac;
    F.factores = cb.checked ? [...F.factores, v] : F.factores.filter(x => x !== v);
    pintarFormulario();
  });

  on("addCtrl", "onclick", () => {
    F.controles = F.controles || [];
    F.controles.push({responsable:"", accion:"", periodicidad:"", complemento:"",
      tipo:"Preventivo", implementacion:"Manual"});
    pintarFormulario();
  });
  document.querySelectorAll("[data-delctrl]").forEach(b => b.onclick = () => {
    F.controles.splice(Number(b.dataset.delctrl), 1); pintarFormulario();
  });
  document.querySelectorAll("[data-c]").forEach(el => {
    const k = Number(el.dataset.c), f = el.dataset.f;
    if (el.tagName === "SELECT") el.onchange = () => { F.controles[k][f] = el.value; pintarFormulario(); };
    else { el.oninput = () => { F.controles[k][f] = el.value; };
           el.onblur = () => pintarFormulario(); }
  });
}

async function guardarRiesgo(){
  const falta = [];
  if (!F.macroproceso) falta.push("macroproceso");
  if (!F.proceso) falta.push("proceso");
  if (!F.unidad) falta.push("dependencia");
  if (F.frecuencia === "") falta.push("frecuencia anual");
  if (F._pideEco && !F.impactoEconomico) falta.push("afectación económica");
  if (F._pideRep && !F.impactoReputacional) falta.push("afectación reputacional");
  if (!F.tratamiento) falta.push("tratamiento");
  tipo(F.tipo).campos.forEach(c => {
    if (c === "factores") return;                       // opcional
    if ((c === "factorLAFT" || c === "puntoRiesgo")
        && F.causaInmediata !== "LA/FT/FP") return;     // solo para LA/FT/FP
    if (c === "accion" && F.tipo === "INT"
        && F.causaInmediata === "LA/FT/FP") return;     // no aplica a LA/FT/FP
    if (!F[c]) falta.push((CAT.etiquetas[c] || c).toLowerCase());
  });
  if (falta.length) return aviso("Faltan datos", `Completa: ${falta.join(", ")}.`);

  const err = Motor.validarTratamiento(F.tratamiento, F.tipo, F.zonaResidual, F.subestrategia, F.acta);
  if (err) return aviso("Tratamiento no válido", err);

  if (F.tratamiento && F.tratamiento !== "Aceptar" && !(F.plan || []).length)
    return aviso("Falta el plan de implementación",
      `El tratamiento «${F.tratamiento}» exige al menos una actividad en el plan de implementación de controles.`);

  const previo = S.riesgos.find(r => r.id === F.id);
  const necesitaAval = requiereAprobacion();

  if ((previo || necesitaAval) && (!F.motivo || F.motivo.trim().length < 20))
    return aviso("Falta el motivo",
      "Explique en al menos 20 caracteres por qué registra este cambio. Queda en el histórico y lo revisa SIG.");

  if (necesitaAval && !(F.enlaceRG16 || "").trim())
    return aviso("Falta el formato ES-SIG-RG-16",
      "Adjunte el enlace del formato diligenciado que respalda la solicitud.");

  if (necesitaAval && solicitudPendiente(F.id))
    return aviso("Ya hay una solicitud en curso",
      "Este riesgo tiene una solicitud esperando aprobación. Espere la respuesta de SIG antes de enviar otra.");

  recalcular();
  /* Fórmula legible que consumen el reporte de ejecución y los informes */
  F.kri = F.kriNumerador && F.kriDenominador
    ? `(${F.kriNumerador} / ${F.kriDenominador})${F.kriUnidad === "Porcentaje" ? " × 100" : ""}`
    : (F.kri || "");
  F.planAccion = (F.plan || []).map((a, i) =>
    `${i + 1}. ${a.actividad}${a.responsable ? ` — ${a.responsable}` : ""}${a.fecha ? ` (${a.fecha})` : ""}`)
    .join("\n") || F.planAccion || "";
  F.fechaPlan = (F.plan || []).map(a => a.fecha).filter(Boolean).sort().pop() || F.fechaPlan || "";
  F.responsablePlan = (F.plan || [])[0]?.responsable || F.responsablePlan || "";
  if (F._nuevo){
    const n = S.riesgos.filter(r => r.proceso === F.proceso && r.unidad === F.unidad).length + 1;
    F.codigo = `${F.unidad}-${String(n).padStart(2, "0")}`;
    F.fechaCreacion = new Date().toISOString().slice(0, 10);
  }
  F.fechaActualizacion = new Date().toISOString().slice(0, 10);
  const previoCopia = previo ? JSON.parse(JSON.stringify(previo)) : null;
  const nuevo = JSON.parse(JSON.stringify(F));
  ["_nuevo","_detalle","_pideEco","_pideRep","_impactoOrigen","_multP","_multI"]
    .forEach(k => delete nuevo[k]);

  if (necesitaAval){
    const sol = await crearSolicitud(previoCopia ? "ACTUALIZACION" : "CREACION",
      nuevo, previoCopia, F.motivo, F.enlaceRG16);
    cerrarModal(); F = null;
    S.vista = "solicitudes"; render();
    return modal("Solicitud enviada", `
      <p class="just" style="margin:0">La Dirección SIG debe aprobarla para que el cambio se
        refleje en la matriz general. Puede seguir su estado en Ciclo semestral,
        Actualización de riesgos.</p>
      <p class="hint just" style="margin-top:9px">Descargue la solicitud en PDF como constancia
        del trámite.</p>`,
      [{t:"Cerrar", cls:"ghost", fn:cerrarModal},
       {t:"Descargar la solicitud", cls:"", fn:() => {
         cerrarModal();
         imprimirDocumento("SOLICITUD_MOD", certificadoSolicitud(sol),
           {vertical:true, firmas:true});
       }}]);
  }

  const ix = S.riesgos.findIndex(r => r.id === F.id);
  if (ix >= 0) S.riesgos[ix] = nuevo; else S.riesgos.push(nuevo);
  await Store.set("riesgos", nuevo.id, nuevo);
  await registrarVersion(nuevo, previoCopia ? "ACTUALIZACION" : "CREACION", F.motivo, previoCopia);

  cerrarModal(); F = null; render();
}

function verRiesgo(id){
  const r = S.riesgos.find(x => x.id === id); if (!r) return;
  const res = Motor.residual(r.probabilidadPct, r.impactoPct, r.controles);
  const hist = S.historico.filter(h => h.riesgoId === id).sort((a, b) => b.version - a.version);
  modal(r.codigo, `
    <p class="just" style="font-size:15px;line-height:1.6;margin:0 0 15px">${esc(r.descripcion)}</p>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:17px">
      <span class="tag">${esc(tipo(r.tipo)?.n)}</span>
      <span class="tag">${esc(proc(r.proceso)?.n)}</span>
      <span class="tag">${esc(macro(proc(r.proceso)?.m)?.n || "")}</span>
      <span class="tag">${esc(uni(r.unidad)?.n || "")}</span>
      ${(r.factores || []).map(f => `<span class="tag">${esc(f)}</span>`).join("")}
    </div>
    <div class="grid2" style="margin-bottom:17px">
      <div class="card"><div class="body" style="text-align:center">
        <div class="l" style="font-size:11px;color:var(--muted)">Riesgo inherente</div>
        <div style="margin:7px 0"><span class="zone ${r.zonaInherente}" style="font-size:13px;padding:3px 12px">${r.zonaInherente}</span></div>
        <div class="mono" style="font-size:11px;color:var(--muted)">P ${pct(r.probabilidadPct)} · I ${pct(r.impactoPct)}</div>
      </div></div>
      <div class="card"><div class="body" style="text-align:center">
        <div class="l" style="font-size:11px;color:var(--muted)">Riesgo residual</div>
        <div style="margin:7px 0"><span class="zone ${r.zonaResidual}" style="font-size:13px;padding:3px 12px">${r.zonaResidual}</span></div>
        <div class="mono" style="font-size:11px;color:var(--muted)">P ${pct(r.probResidual)} · I ${pct(r.impResidual)}</div>
      </div></div>
    </div>
    ${(r.revisar || []).length ? `<div class="banner warn" style="margin-bottom:15px"><span>&#9888;</span>
      <div><b>Pendiente de revisión</b><ul style="margin:6px 0 0;padding-left:17px">
      ${r.revisar.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>` : ""}
    ${(r.revisar || []).length ? `<div class="banner warn" style="margin-bottom:15px">
      <span>&#9888;</span><div><b>Pendiente de revisión</b>
      <ul style="margin:6px 0 0;padding-left:17px">${r.revisar.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      </div></div>` : ""}
    <h3 style="margin-bottom:9px">Controles</h3>
    ${(r.controles || []).length ? (r.controles || []).map((c, k) => `<div class="ctrl-item">
      <div class="ctrl-head"><b>Control ${k + 1}</b>
        <span class="tag">${c.tipo} · ${c.implementacion} · ${pct(Motor.pesoControl(c.tipo, c.implementacion))}</span></div>
      <div style="font-size:13px">${esc([c.responsable, c.accion, c.complemento].filter(Boolean).join(" "))}</div>
    </div>`).join("") : `<p class="hint">Sin controles registrados.</p>`}
    <h3 style="margin:17px 0 9px">Cálculo del residual</h3>
    <div class="calc">
      ${res.detalle.map(d => `<div class="calc-row"><span>Control ${d.n} · ${d.af}</span>
        <span class="mono">${pct(d.antes)} × (1 − ${pct(d.peso)}) = ${pct(d.despues)}</span></div>`).join("")
        || `<div class="calc-row"><span>Sin controles</span><span class="mono">residual = inherente</span></div>`}
      <div class="calc-row"><span>Resultado</span>
        <span class="mono">P ${pct(res.probabilidad)} · I ${pct(res.impacto)} → ${res.zona}</span></div>
    </div>
    <h3 style="margin:17px 0 9px">Tratamiento y plan de acción</h3>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px">
      <span class="tag">${esc(r.tratamiento || "Sin definir")}</span>
      ${r.subestrategia ? `<span class="tag">${esc(r.subestrategia)}</span>` : ""}
      ${r.fechaPlan ? `<span class="tag">Cumplimiento: ${esc(r.fechaPlan)}</span>` : ""}
    </div>
    ${r.planAccion ? `<div class="calc just">${esc(r.planAccion)}</div>`
      : `<p class="hint">Sin plan de acción formulado.</p>`}
    ${r.kri ? `<div style="margin-top:9px"><h3 style="margin-bottom:5px">Indicador clave del riesgo</h3>
      <div class="calc mono" style="font-size:12px">${esc(r.kri)}</div>
      ${r.responsablePlan ? `<p class="hint">Responsable: ${esc(r.responsablePlan)}</p>` : ""}</div>` : ""}
    ${(() => {
      const gs = S.seguimientos.filter(x => x.riesgoId === r.id)
        .sort((a, b) => (b.periodo || "").localeCompare(a.periodo || ""));
      return gs.length ? `<h3 style="margin:17px 0 9px">Reportes de ejecución</h3>
        <div class="scroll-x"><table style="font-size:12px"><thead><tr>
          <th>Periodo</th><th>Resultado</th><th>Actividades</th><th>Soporte</th><th>Estado</th>
        </tr></thead><tbody>${gs.map(g => `<tr>
          <td class="mono">${esc(g.periodo)}</td>
          <td>${esc(g.resultado || "—")}</td>
          <td class="just">${esc(g.actividades || "—")}</td>
          <td>${g.soporte ? (g.soporteURL
            ? `<a href="${esc(g.soporteURL)}" target="_blank" rel="noopener">${esc(g.soporte)}</a>`
            : esc(g.soporte)) : "—"}</td>
          <td>${g.estadoAccion ? `<span class="zone ${g.estadoAccion === "Cerrada" ? "Bajo"
            : g.estadoAccion === "Vencida" ? "Extremo" : "Moderado"}">${esc(g.estadoAccion)}</span>` : "—"}</td>
        </tr>`).join("")}</tbody></table></div>` : "";
    })()}
    <h3 style="margin:17px 0 9px">Histórico · ${hist.length} ${hist.length === 1 ? "versión" : "versiones"}</h3>
    <div class="timeline">${hist.map(h => `<div class="tl-item">
      <div class="tl-when">${new Date(h.fecha).toLocaleString("es-CO")} · ${esc(h.usuario)}</div>
      <div class="tl-what">Versión ${h.version} — ${h.operacion.toLowerCase()}</div>
      ${h.motivo ? `<div class="hint">${esc(h.motivo)}</div>` : ""}
      ${h.cambios.length ? `<div class="diff">${h.cambios.map(c =>
        `<div><b>${esc(c.campo)}:</b> <span class="old">${esc(c.antes)}</span> →
         <span class="new">${esc(c.ahora)}</span></div>`).join("")}</div>` : ""}
    </div>`).join("")}</div>
  `, [{t:"Cerrar", cls:"ghost", fn: cerrarModal}]);
}

function eliminarRiesgo(id){
  const r = S.riesgos.find(x => x.id === id); if (!r) return;
  const aval = requiereAprobacion();
  if (aval && solicitudPendiente(id))
    return aviso("Ya hay una solicitud en curso",
      "Este riesgo tiene una solicitud esperando aprobación de SIG.");

  modal(aval ? "Solicitar la eliminación del riesgo" : "Eliminar riesgo", `
    <div class="banner warn"><span>&#9888;</span><div>El riesgo <b class="rid">${esc(r.codigo)}</b>
      no se borra: se marca como obsoleto y deja de aparecer en el inventario.
      Su histórico se conserva y puede restaurarse.</div></div>
    ${aval ? `<div class="banner info" style="margin-top:9px"><span>&#9432;</span><div>
      La eliminación se hará efectiva cuando la Dirección SIG apruebe la solicitud.</div></div>` : ""}
    <div class="field" style="margin-top:15px"><label class="req">Motivo de la eliminación</label>
      <textarea id="delMotivo" placeholder="Explique por qué se elimina (mínimo 20 caracteres)"></textarea></div>
    ${aval ? `<div class="field"><label class="req">Enlace al formato ES-SIG-RG-16</label>
      <input type="text" id="delRG16" placeholder="https://santandergov-my.sharepoint.com/...">
      <p class="hint">Soporte de la solicitud de eliminación.</p></div>` : ""}
  `, [
    {t:"Cancelar", cls:"ghost", fn: cerrarModal},
    {t: aval ? "Enviar solicitud" : "Eliminar", cls: aval ? "" : "danger", fn: async () => {
      const m = document.getElementById("delMotivo").value.trim();
      if (m.length < 20) return aviso("Falta el motivo", "Escriba al menos 20 caracteres.");
      if (aval){
        const link = document.getElementById("delRG16").value.trim();
        if (!link) return aviso("Falta el formato ES-SIG-RG-16",
          "Adjunte el enlace del formato que respalda la solicitud.");
        await crearSolicitud("ELIMINACION", r, r, m, link);
        cerrarModal(); S.vista = "solicitudes"; render();
        return aviso("Solicitud enviada",
          "La Dirección SIG debe aprobarla para que el riesgo salga de la matriz general.");
      }
      r.estado = "OBSOLETO"; r.eliminadoEn = new Date().toISOString();
      r.eliminadoPor = S.sesion?.nombre; r.motivoEliminacion = m;
      await Store.set("riesgos", r.id, r);
      await registrarVersion(r, "ELIMINACION", m, null);
      cerrarModal(); render();
    }}
  ]);
}
