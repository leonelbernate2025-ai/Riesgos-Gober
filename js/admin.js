/* =====================================================================
   Administración: histórico, usuarios, ventanas y metodología.
   ===================================================================== */

/* =====================================================================
   VISTA: HISTÓRICO
   ===================================================================== */
function vistaHistorico(){
  const hs = [...S.historico].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const eliminados = S.riesgos.filter(r => r.estado === "OBSOLETO");

  return `<div class="stack">
    ${eliminados.length ? `<div class="card">
      <header><h2>Riesgos eliminados</h2><span class="tag">${eliminados.length}</span></header>
      <div class="scroll-x"><table class="fija" style="min-width:1000px">
        <colgroup><col style="width:160px"><col style="width:360px"><col style="width:160px">
          <col style="width:230px"><col style="width:110px"></colgroup>
        <thead><tr>
        <th>Identificador</th><th>Riesgo</th><th>Eliminado por</th><th>Motivo</th><th></th>
      </tr></thead><tbody>${eliminados.map(r => `<tr>
        <td class="rid">${esc(r.codigo)}</td>
        <td><div class="just">${esc(r.descripcion)}</div></td>
        <td>${esc(r.eliminadoPor || "—")}<div class="hint">${r.eliminadoEn
          ? new Date(r.eliminadoEn).toLocaleDateString("es-CO") : ""}</div></td>
        <td style="max-width:240px">${esc(r.motivoEliminacion || "")}</td>
        <td>${S.sesion?.rol === "ADMIN"
          ? `<button class="btn ghost sm" data-restore="${r.id}">Restaurar</button>` : ""}</td>
      </tr>`).join("")}</tbody></table></div></div>` : ""}

    <div class="card"><header><h2>Registro de cambios</h2><span class="tag">${hs.length} eventos</span></header>
      <div class="body">${hs.length ? `<div class="timeline">${hs.slice(0, 60).map(h => {
        const r = S.riesgos.find(x => x.id === h.riesgoId);
        return `<div class="tl-item">
          <div class="tl-when">${new Date(h.fecha).toLocaleString("es-CO")} · ${esc(h.usuario)}
            <span class="tag" style="margin-left:5px">${esc(h.rol)}</span></div>
          <div class="tl-what"><span class="rid">${esc(r?.codigo || "—")}</span> ·
            versión ${h.version} — ${h.operacion.toLowerCase()}</div>
          ${h.motivo ? `<div class="hint">${esc(h.motivo)}</div>` : ""}
          ${h.cambios.length ? `<div class="diff">${h.cambios.map(c =>
            `<div><b>${esc(c.campo)}:</b> <span class="old">${esc(c.antes)}</span> →
             <span class="new">${esc(c.ahora)}</span></div>`).join("")}</div>` : ""}
        </div>`;
      }).join("")}</div>` : `<div class="empty"><b>Sin movimientos todavía</b>
        Cada creación, edición o eliminación de un riesgo queda registrada aquí de forma permanente.</div>`}
      </div></div>
  </div>`;
}

/* =====================================================================
   VISTA: USUARIOS
   ===================================================================== */
function generarClave(){
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ", b = "abcdefghijkmnopqrstuvwxyz",
        n = "23456789", s = "!@#$%&*";
  const pick = x => x[Math.floor(Math.random() * x.length)];
  let p = [pick(a), pick(a), pick(b), pick(b), pick(b), pick(n), pick(n), pick(n), pick(s), pick(s)];
  for (let i = p.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  return p.join("");
}

function vistaUsuarios(){
  return `<div class="stack">
    <div class="banner info"><span>◉</span><div>El sistema genera la contraseña temporal y te la muestra
      una sola vez para que la entregues. No queda almacenada en ningún lado: en el servidor solo vive su
      hash. El usuario debe cambiarla en su primer ingreso.</div></div>
    <div class="card">
      <header><h2>Usuarios del sistema</h2><span class="tag">${S.usuarios.length}</span></header>
      ${S.usuarios.length ? `<div class="scroll-x"><table><thead><tr>
        <th>Nombre</th><th>Correo</th><th>Rol</th><th>Procesos a cargo</th><th>Estado</th><th></th>
      </tr></thead><tbody>${S.usuarios.map(u => {
        const rol = CAT.roles.find(r => r.c === u.rol);
        return `<tr>
          <td><b style="font-weight:500">${esc(u.nombre)}</b></td>
          <td class="mono" style="font-size:12px">${esc(u.correo)}</td>
          <td>${esc(rol?.n || u.rol)}</td>
          <td style="max-width:280px">${(u.procesos || []).length
            ? `<div class="just">${(u.procesos || []).map(c => esc(proc(c)?.n || c)).join(" · ")}</div>
               <div class="hint">${S.riesgos.filter(r => (u.procesos || []).includes(r.proceso)
                 && r.estado !== "OBSOLETO").length} riesgos</div>`
            : `<span class="tag">Sin asignar</span>`}</td>
          <td>${u.activo === false ? `<span class="tag">Inactivo</span>`
            : u.requiereCambio ? `<span class="zone Moderado">Clave temporal</span>`
            : `<span class="zone Bajo">Activo</span>`}</td>
          <td style="white-space:nowrap">
            <button class="btn ghost sm" data-uedit="${u.id}">Editar</button>
            <button class="btn ghost sm" data-ureset="${u.id}">Restablecer clave</button>
            <button class="btn ghost sm" data-udel="${u.id}">Eliminar</button>
          </td></tr>`;
      }).join("")}</tbody></table></div>`
      : `<div class="empty"><b>Aún no hay usuarios</b>
         Crea el primero con «Nuevo usuario». Asígnale un rol y los procesos que tendrá a cargo.</div>`}
    </div>
    <div class="card"><header><h2>Qué puede hacer cada rol</h2></header>
      <div class="scroll-x"><table><thead><tr><th>Rol</th><th>Alcance</th></tr></thead>
      <tbody>${CAT.roles.map(r => `<tr><td style="white-space:nowrap"><b style="font-weight:500">${esc(r.n)}</b>
        <div class="hint mono">${esc(r.c)}</div></td><td>${esc(r.d)}</td></tr>`).join("")}</tbody></table></div>
    </div>
  </div>`;
}

function formUsuario(id){
  const u = id ? S.usuarios.find(x => x.id === id) : null;
  const d = u ? {...u, procesos:[...(u.procesos || [])]}
              : {id:uid(), nombre:"", correo:"", rol:"ENLACE_SIG", procesos:[], activo:true};
  modal(u ? "Editar usuario" : "Nuevo usuario", `
    <div class="field"><label class="req">Nombre completo</label>
      <input type="text" id="uNom" value="${esc(d.nombre)}" placeholder="Nombre y apellidos"></div>
    <div class="field"><label class="req">Correo institucional</label>
      <input type="text" id="uMail" value="${esc(d.correo)}" placeholder="nombre.apellido@santander.gov.co">
      <p class="hint">Es el usuario de ingreso.</p></div>
    <div class="grid2">
      <div class="field"><label class="req">Rol</label><select id="uRol">
        ${CAT.roles.filter(r => r.c !== "PUBLICO").map(r =>
          `<option value="${r.c}" ${d.rol === r.c ? "selected" : ""}>${esc(r.n)}</option>`).join("")}
      </select></div>
      <div class="field"><label>Estado</label>
        <select id="uAct2" autocomplete="off" ${u ? "" : "disabled"}>
          <option value="1" ${d.activo !== false ? "selected" : ""}>Activo</option>
          <option value="0" ${d.activo === false ? "selected" : ""}>Inactivo</option></select></div>
    </div>

    <div class="field"><label class="req">Procesos a cargo</label>
      <p class="hint" style="margin:-1px 0 7px">Marque uno o varios. Define qué riesgos puede ver
        y gestionar. Sin ninguno marcado, el usuario no verá riesgos.</p>
      <div style="max-height:250px;overflow-y:auto;border:1px solid var(--line);
        border-radius:var(--radius);padding:9px">
        ${CAT.macroprocesos.map(m => `
          <div style="margin-bottom:9px">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
              <b style="font-size:11px;color:var(--muted);letter-spacing:.03em">${esc(m.n).toUpperCase()}</b>
              <button type="button" class="btn ghost sm" data-todos="${m.c}">Todos</button>
            </div>
            ${CAT.procesos.filter(pp => pp.m === m.c).map(pp => `
              <label style="display:flex;align-items:center;gap:7px;margin:0 0 3px;
                padding:3px 6px;border-radius:var(--radius);cursor:pointer;font-size:12.5px;
                color:var(--ink);background:${d.procesos.includes(pp.c) ? "var(--accent-soft)" : "transparent"}">
                <input type="checkbox" data-proc="${pp.c}" ${d.procesos.includes(pp.c) ? "checked" : ""}
                  style="width:auto;margin:0">${esc(pp.n)}
                <span class="hint" style="margin-left:auto">${dependenciasDe(pp.c).length} dep.</span>
              </label>`).join("")}
          </div>`).join("")}
      </div>
      <p class="hint" id="uConteo">${d.procesos.length} procesos seleccionados ·
        ${S.riesgos.filter(r => d.procesos.includes(r.proceso) && r.estado !== "OBSOLETO").length} riesgos a cargo</p>
    </div>
    ${u ? `<p class="hint">Desactivar un usuario conserva el histórico de sus acciones; eliminarlo no.</p>` : ""}
  `, [
    {t:"Cancelar", cls:"ghost", fn: cerrarModal},
    {t: u ? "Guardar cambios" : "Crear usuario", cls:"", fn: async () => {
      d.nombre = document.getElementById("uNom").value.trim();
      d.correo = document.getElementById("uMail").value.trim().toLowerCase();
      d.rol = document.getElementById("uRol").value;
      d.procesos = [...document.querySelectorAll("[data-proc]:checked")].map(x => x.dataset.proc);
      const act = document.getElementById("uAct2");
      if (act && !act.disabled) d.activo = act.value === "1";

      if (!d.nombre || !d.correo) return aviso("Faltan datos", "El nombre y el correo son obligatorios.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo))
        return aviso("Correo no válido", "Escribe una dirección de correo completa.");
      if (S.usuarios.some(x => x.correo === d.correo && x.id !== d.id))
        return aviso("Correo repetido", "Ya existe un usuario con ese correo.");
      if (d.rol !== "ADMIN" && !d.procesos.length)
        return aviso("Faltan los procesos",
          "Asigne al menos un proceso. Sin procesos a cargo el usuario no verá ningún riesgo.");

      const nuevo = !u;
      if (nuevo) d.requiereCambio = true;
      const ix = S.usuarios.findIndex(x => x.id === d.id);
      if (ix >= 0) S.usuarios[ix] = d; else S.usuarios.push(d);
      await Store.set("usuarios", d.id, d);
      cerrarModal();
      if (nuevo) mostrarClave(d, generarClave()); else render();
    }}
  ]);

  const refrescarConteo = () => {
    const ps = [...document.querySelectorAll("[data-proc]:checked")].map(x => x.dataset.proc);
    const el = document.getElementById("uConteo");
    if (el) el.textContent = `${ps.length} procesos seleccionados · `
      + `${S.riesgos.filter(r => ps.includes(r.proceso) && r.estado !== "OBSOLETO").length} riesgos a cargo`;
    document.querySelectorAll("[data-proc]").forEach(cb =>
      cb.closest("label").style.background = cb.checked ? "var(--accent-soft)" : "transparent");
  };
  document.querySelectorAll("[data-proc]").forEach(cb => cb.onchange = refrescarConteo);
  document.querySelectorAll("[data-todos]").forEach(b => b.onclick = () => {
    const m = b.dataset.todos;
    const cbs = CAT.procesos.filter(pp => pp.m === m)
      .map(pp => document.querySelector(`[data-proc="${pp.c}"]`)).filter(Boolean);
    const marcar = !cbs.every(c => c.checked);
    cbs.forEach(c => c.checked = marcar);
    refrescarConteo();
  });
}

function mostrarClave(u, clave){
  modal("Contraseña temporal", `
    <p style="margin:0 0 4px">Entrega esta contraseña a <b>${esc(u.nombre)}</b> por un canal seguro.</p>
    <p class="hint" style="margin:0">Es la única vez que se muestra. El sistema guarda solo su hash.</p>
    <div class="pw">
      <small>Contraseña de primer ingreso</small>
      <div class="k">${esc(clave)}</div>
      <small>Se exigirá cambiarla al iniciar sesión</small>
    </div>
    <div class="banner warn" style="margin-top:14px"><span>⚠</span>
      <div>No la envíes por chat ni por correo sin cifrar. Si se pierde, genera una nueva
      con «Restablecer clave»; no hay forma de recuperarla.</div></div>
  `, [{t:"Ya la copié", cls:"", fn:() => { cerrarModal(); render(); }}]);
}

/* =====================================================================
   VISTA: VENTANAS
   ===================================================================== */
function vistaVentanas(){
  const tipos = [
    {c:"ACTUALIZACION", n:"Actualización de riesgos", r:"Enlace SIG",
     d:"Dos veces al año. Habilita crear, editar y eliminar riesgos y controles."},
    {c:"EJECUCION",     n:"Reporte de ejecución", r:"Enlace SIG",
     d:"Cuatro veces al año. Habilita reportar indicador, actividades, soportes y evaluación de controles."},
    {c:"MONITOREO",     n:"Monitoreo de calidad", r:"Monitoreo calidad",
     d:"Cuatro veces al año. Habilita el monitoreo de la Dirección SIG. Abre después del reporte de ejecución."},
    {c:"SEGUIMIENTO",   n:"Seguimiento Control Interno", r:"Control Interno",
     d:"Cuatro veces al año. Habilita el seguimiento independiente. Abre después del monitoreo."}
  ];
  return `<div class="stack">
    <div class="banner info"><span>&#9432;</span><div>Fuera de ventana el sistema queda en solo lectura
      para todos los roles salvo el administrador. La validación ocurre al guardar, no solo en la
      pantalla.</div></div>

    <div class="card"><header><h2>Calendario del año</h2></header>
      <div class="scroll-x"><table><thead><tr>
        <th>Ventana</th><th>Rol</th><th>Veces al año</th><th>Qué habilita</th></tr></thead>
      <tbody>
        <tr><td><b style="font-weight:500">Actualización de riesgos</b></td><td>Enlace SIG</td>
          <td class="mono">2</td><td class="hint">Crear, editar y eliminar riesgos, controles,
          tratamiento y plan de acción</td></tr>
        <tr><td><b style="font-weight:500">Reporte de ejecución</b></td><td>Enlace SIG</td>
          <td class="mono">4</td><td class="hint">Resultado del indicador, actividades, soportes,
          estado de la acción y evaluación del diseño de controles</td></tr>
        <tr><td><b style="font-weight:500">Monitoreo de calidad</b></td><td>Monitoreo calidad</td>
          <td class="mono">4</td><td class="hint">Las cuatro preguntas sobre descripción del riesgo,
          del control, eficacia y materialización</td></tr>
        <tr><td><b style="font-weight:500">Seguimiento</b></td><td>Control Interno</td>
          <td class="mono">4</td><td class="hint">Verificación independiente, criterio propio sobre
          materialización y acciones correctivas</td></tr>
      </tbody></table></div>
      <div class="body" style="border-top:1px solid var(--line)"><p class="hint" style="margin:0">
        Las tres ventanas trimestrales deberían abrir en cadena: primero la dependencia reporta,
        luego calidad monitorea lo reportado, y al final Control Interno verifica. Si se superponen,
        cada instancia trabaja sobre información incompleta.</p></div></div>
    ${tipos.map(t => {
      const vs = S.ventanas.filter(v => v.tipo === t.c)
        .sort((a, b) => new Date(b.desde) - new Date(a.desde));
      const abierta = ventanaAbierta(t.c);
      return `<div class="card">
        <header><div><h2>${t.n}</h2>
          <p class="hint" style="margin:2px 0 0"><span class="tag">${esc(t.r)}</span> ${t.d}</p></div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="zone ${abierta ? "Bajo" : "Moderado"}">${abierta ? "Abierta" : "Cerrada"}</span>
            <button class="btn ghost sm" data-newv="${t.c}">Programar</button></div></header>
        ${vs.length ? `<div class="scroll-x"><table><thead><tr>
          <th>Nombre</th><th>Desde</th><th>Hasta</th><th>Estado</th><th></th></tr></thead>
          <tbody>${vs.map(v => {
            const ini = new Date(v.desde).getTime(), fin = new Date(v.hasta + "T23:59:59").getTime();
            const now = Date.now();
            const e = now < ini ? "Programada" : now > fin ? "Cerrada" : "Abierta";
            return `<tr><td>${esc(v.nombre)}</td><td class="mono">${esc(v.desde)}</td>
              <td class="mono">${esc(v.hasta)}</td>
              <td><span class="zone ${e === "Abierta" ? "Bajo" : e === "Programada" ? "Moderado" : ""}">${e}</span></td>
              <td><button class="btn ghost sm" data-delv="${v.id}">Quitar</button></td></tr>`;
          }).join("")}</tbody></table></div>`
        : `<div class="empty" style="padding:22px">Sin ventanas programadas para este ciclo.</div>`}
      </div>`;
    }).join("")}
  </div>`;
}

function formVentana(tipoV){
  const hoy = new Date().toISOString().slice(0, 10);
  modal("Programar ventana", `
    <div class="field"><label class="req">Nombre</label>
      <input type="text" id="vNom" placeholder="Actualización I semestre ${new Date().getFullYear()}"></div>
    <div class="grid2">
      <div class="field"><label class="req">Desde</label><input type="date" id="vDesde" value="${hoy}"></div>
      <div class="field"><label class="req">Hasta</label><input type="date" id="vHasta"></div>
    </div>
    <p class="hint">Durante este rango, los roles correspondientes podrán guardar cambios.</p>
  `, [
    {t:"Cancelar", cls:"ghost", fn: cerrarModal},
    {t:"Programar", cls:"", fn: async () => {
      const v = {id:uid(), tipo:tipoV,
        nombre: document.getElementById("vNom").value.trim(),
        desde: document.getElementById("vDesde").value,
        hasta: document.getElementById("vHasta").value};
      if (!v.nombre || !v.desde || !v.hasta)
        return aviso("Faltan datos", "Completa el nombre y las dos fechas.");
      if (new Date(v.hasta) < new Date(v.desde))
        return aviso("Fechas invertidas", "La fecha de cierre debe ser posterior a la de apertura.");
      S.ventanas.push(v); await Store.set("ventanas", v.id, v);
      cerrarModal(); render();
    }}
  ]);
}

/* =====================================================================
   VISTA: METODOLOGÍA
   ===================================================================== */
function vistaMetodo(){
  return `<div class="stack">
    ${S.sesion?.rol === "ADMIN" ? `<div class="card">
      <header><h2>Almacenamiento del navegador</h2>
        <span class="tag">${Store.tamano()} KB de 5.120 KB</span></header>
      <div class="body">
        <div class="bar-track" style="height:11px">
          <div class="bar-seg" style="width:${Math.min(100, Store.tamano() / 5120 * 100).toFixed(1)}%;
            background:${Store.tamano() > 4096 ? "var(--z-ext)"
              : Store.tamano() > 3072 ? "var(--z-mod)" : "var(--z-bajo)"}"></div>
        </div>
        <p class="hint just" style="margin-top:9px">El prototipo guarda todo en el navegador de
          cada persona, con un límite cercano a cinco megabytes. El histórico es lo que más pesa,
          porque conserva una copia del riesgo por cada versión. Si el espacio se agota, la
          aplicación deja de guardar y el navegador puede cerrar la pestaña.</p>
        <div class="grid3" style="margin-top:11px">
          <div class="kpi"><div class="v mono" style="font-size:19px">${S.riesgos.length}</div>
            <div class="l">Riesgos</div></div>
          <div class="kpi"><div class="v mono" style="font-size:19px">${S.historico.length}</div>
            <div class="l">Versiones del histórico</div></div>
          <div class="kpi"><div class="v mono" style="font-size:19px">${S.monitoreoBD.length}</div>
            <div class="l">Registros de monitoreo</div></div>
        </div>
        <div style="margin-top:13px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn ghost" id="cfgPurga">Depurar histórico</button>
          <button class="btn ghost" id="cfgReset">Reiniciar con los datos de prueba</button>
        </div>
        ${Store._ultimoError ? `<div class="banner warn" style="margin-top:11px">
          <span>&#9888;</span><div>${esc(Store._ultimoError)}</div></div>` : ""}
      </div></div>` : ""}

    ${S.sesion?.rol === "ADMIN" ? `<div class="card"><header><h2>Carpeta de evidencias en Drive</h2>
      <span class="tag">${driveURL() ? "Configurada" : "Sin configurar"}</span></header>
      <div class="body">
        <div class="field" style="margin-bottom:9px">
          <label>Dirección del Web App de Apps Script</label>
          <input type="text" id="cfgDrive" value="${esc(driveURL())}"
            placeholder="https://script.google.com/macros/s/AKfy.../exec">
          <p class="hint">Publique el archivo <b class="mono">drive_evidencias.gs</b> como aplicación
            web desde la cuenta institucional y pegue aquí la dirección que entrega Google.
            Sin esto, las evidencias quedan registradas solo por su nombre.</p>
        </div>
        <button class="btn" id="cfgDriveSave">Guardar dirección</button>
        ${driveURL() ? `<button class="btn ghost" id="cfgDriveTest" style="margin-left:7px">Probar conexión</button>` : ""}
        <div id="cfgDriveMsg" class="hint" style="margin-top:7px"></div>
      </div></div>` : ""}

    <div class="banner info"><span>◈</span><div>Todos estos valores viven en tablas, no en el código.
      Cuando salga la versión 8 de la guía se cargan como una versión nueva y los riesgos existentes
      siguen calculándose con la versión con la que fueron formulados.</div></div>

    <div class="grid2">
      <div class="card"><header><h2>Probabilidad</h2><span class="tag">Tabla 4</span></header>
        <div class="scroll-x"><table><thead><tr><th>Nivel</th><th>%</th><th>Frecuencia de la actividad</th></tr></thead>
          <tbody>${CAT.probabilidad.map(p => `<tr><td>${p.n}</td>
            <td class="mono">${pct(p.pct)}</td><td>${p.d}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="card"><header><h2>Impacto económico</h2><span class="tag">Tabla 5</span></header>
        <div class="scroll-x"><table><thead><tr><th>Nivel</th><th class="num">%</th><th>Afectación económica</th></tr></thead>
          <tbody>${CAT.impacto.map(i => `<tr><td>${i.n}</td>
            <td class="num mono">${pct(i.pct)}</td><td>${i.eco}</td></tr>`).join("")}</tbody></table></div></div>
    </div>

    <div class="card"><header><h2>Impacto reputacional</h2>
      <span class="tag">Tabla 5 · numeral 3.6</span></header>
      <div class="scroll-x"><table><thead><tr>
        <th style="width:130px">Nivel</th><th class="num" style="width:70px">%</th>
        <th>Afectación reputacional</th></tr></thead>
        <tbody>${CAT.impacto.map(i => `<tr><td>${i.n}</td>
          <td class="num mono">${pct(i.pct)}</td>
          <td class="just">${esc(i.rep)}</td></tr>`).join("")}</tbody></table></div>
      <div class="body" style="border-top:1px solid var(--line)"><p class="hint just" style="margin:0">
        Cuando un riesgo presenta afectación económica y reputacional con niveles distintos, se toma
        el más alto. Si el impacto económico resulta Mayor y el reputacional Moderado, el impacto
        del riesgo es Mayor.</p></div></div>

    <div class="card"><header><h2>Apetito de riesgo</h2>
      <span class="tag">Política institucional</span></header>
      <div class="scroll-x"><table><thead><tr>
        <th>Zona residual</th><th>Nivel de apetito</th><th>Descripción</th>
        <th>Acción recomendada</th><th class="ctr">¿Aceptable?</th>
        <th class="ctr">Requiere<br>tratamiento</th><th>Opciones admitidas</th>
      </tr></thead><tbody>${CAT.apetito.map(a => `<tr>
        <td>${a.zonas.map(z => `<span class="zone ${z}">${z}</span>`).join(" ")}</td>
        <td>${esc(a.nivel)}</td>
        <td class="just">${esc(a.descripcion)}</td>
        <td class="just">${esc(a.accion)}</td>
        <td class="ctr">${a.aceptable ? `<span class="zone Bajo">Sí</span>`
          : `<span class="zone Extremo">No</span>`}</td>
        <td class="ctr">${a.requiereTratamiento ? "Sí" : "No"}</td>
        <td>${a.opciones.map(o => `<span class="tag">${esc(o)}</span>`).join(" ")}</td>
      </tr>`).join("")}</tbody></table></div>
      <div class="body" style="border-top:1px solid var(--line)"><p class="hint just" style="margin:0">
        Al formular un riesgo, el sistema solo ofrece las opciones de tratamiento que admite el
        apetito para su zona residual. Un riesgo en zona Baja únicamente puede aceptarse; uno en
        zona Alta o Extrema no puede aceptarse en ningún caso.</p></div></div>

    <div class="card"><header><h2>Estructura de procesos</h2></header>
      <div class="scroll-x"><table><thead><tr><th>Macroproceso</th><th>Proceso</th><th class="num">Dep.</th><th>Dependencias</th></tr></thead>
      <tbody>${CAT.macroprocesos.flatMap(m => CAT.procesos.filter(p => p.m === m.c).map((p, i) => `<tr>
        <td>${i === 0 ? esc(m.n) : ""}</td><td>${esc(p.n)}</td>
        <td class="num">${dependenciasDe(p.c).length}</td>
        <td class="hint just" style="font-size:12px">${dependenciasDe(p.c).map(u => esc(u.n)).join(" · ")}</td>
      </tr>`)).join("")}</tbody></table></div>
      <div class="body" style="border-top:1px solid var(--line)"><p class="hint" style="margin:0">
        Estructura tomada del organigrama SIG. Estas son las dependencias que aparecen al registrar
        un riesgo, según el proceso seleccionado.</p></div></div>

    <div class="card"><header><h2>Matriz de severidad</h2><span class="tag">Figura 18</span></header>
      <div class="body">${mapaCalor([], "inh")}
        <p class="hint" style="margin-top:12px">La guía indica que esta matriz no es ajustable por la entidad.</p></div></div>

    <div class="grid2">
      <div class="card"><header><h2>Pesos de control</h2><span class="tag">Tabla 6</span></header>
        <div class="scroll-x"><table><thead><tr><th>Atributo</th><th>Valor</th><th>Peso</th></tr></thead><tbody>
          ${Object.entries(CAT.pesoControl.tipo).map(([k, v]) =>
            `<tr><td>Tipo</td><td>${k}</td><td class="mono">${pct(v)}</td></tr>`).join("")}
          ${Object.entries(CAT.pesoControl.implementacion).map(([k, v]) =>
            `<tr><td>Implementación</td><td>${k}</td><td class="mono">${pct(v)}</td></tr>`).join("")}
        </tbody></table></div>
        <div class="body" style="border-top:1px solid var(--line)">
          <p class="hint" style="margin:0">El peso de un control es la suma de su tipo más su implementación.
          Preventivo automático da 50%; correctivo manual, 25%.</p></div></div>

      <div class="card"><header><h2>Opciones de tratamiento</h2></header>
        <div class="scroll-x"><table><thead><tr><th>Opción</th><th>Reglas</th></tr></thead><tbody>
          ${CAT.tratamiento.map(t => `<tr><td>${t.c}</td><td class="hint" style="font-size:12px">
            ${[t.exigePlan ? "Exige plan de acción" : null,
               t.exigeSub ? "Exige subestrategia" : null,
               t.zonas ? `Solo en zona ${t.zonas.join(" o ")}` : null,
               t.excluye.length ? `No aplica a ${t.excluye.join(", ")}` : null]
              .filter(Boolean).join(" · ") || "Sin restricciones"}</td></tr>`).join("")}
        </tbody></table></div></div>
    </div>

    <div class="card"><header><h2>Tipos de riesgo y sus plantillas</h2></header>
      <div class="scroll-x"><table><thead><tr><th>Tipo</th><th>Campos que activa</th><th>Plantilla de redacción</th></tr></thead>
        <tbody>${CAT.tiposRiesgo.map(t => `<tr>
          <td style="white-space:nowrap">${esc(t.n)}<div class="hint mono">${t.c}</div></td>
          <td class="hint" style="font-size:12px">${t.campos.map(c => CAT.etiquetas[c] || c).join(", ")}</td>
          <td class="mono" style="font-size:11px">${esc(t.plantilla)}</td></tr>`).join("")}</tbody></table></div></div>
  </div>`;
}


/* =====================================================================
   FORMATOS
   Parametrización de calidad de los documentos que emite el sistema.
   El tipo y el título provienen del documento de codificación; el código,
   la versión y la fecha de aprobación los mantiene el administrador.
   ===================================================================== */
const USO_FORMATO = {
  INFORME_GENERAL:"Panel · botones Excel y PDF",
  MADUREZ:"Madurez del SIAR · botones Excel y PDF",
  INVENTARIO_RIESGOS:"Riesgos · botones Excel y PDF",
  MAPA_CALOR:"Mapa de calor · botones Excel y PDF",
  INVENTARIO_CONTROLES:"Riesgos · botón Controles",
  SOLICITUD_MOD:"Enlace SIG · al guardar cambios en un riesgo",
  CERT_APROBACION:"Actualización de riesgos · al ver una solicitud resuelta",
  CERT_EVIDENCIAS:"Reporte de ejecución · al guardar el reporte",
  REPORTE_MONITOREO:"Monitoreo · al completar todos los riesgos del periodo"
};

function vistaFormatos(){
  const fs = formatosGuardados();
  const logo = logoEntidad();
  return `<div class="stack">
    ${tarjetaOrganigrama()}

    <div class="banner info"><span>&#9432;</span><div>Cada documento que emite el sistema sale con
      el logo de la entidad y el bloque de código, versión y fecha de aprobación del formato que le
      corresponde. El tipo y el título se toman del documento de codificación; los demás datos se
      editan aquí.</div></div>

    <div class="card"><header><h2>Logo institucional</h2>
      <span class="tag">${logoEsPropio() ? "Personalizado" : "Escudo del departamento"}</span></header>
      <div class="body">
        <div style="display:flex;gap:17px;align-items:center;flex-wrap:wrap">
          <div style="min-width:170px;min-height:74px;border:1px dashed var(--line);
            border-radius:var(--radius);display:flex;align-items:center;justify-content:center;
            padding:9px;background:#fff">
            ${logo ? `<img src="${esc(logo)}" alt="Logo" style="max-width:200px;max-height:66px">`
              : `<span class="hint">Sin logo</span>`}
          </div>
          <div style="flex:1;min-width:230px">
            <input type="file" id="fmtLogo" accept="image/png,image/jpeg,image/svg+xml"
              style="padding:7px;background:var(--surface-2)">
            <p class="hint">Imagen en PNG, JPG o SVG, de menos de 300 KB. Se guarda en este
              navegador y aparece en el encabezado de todos los reportes.</p>
            ${logoEsPropio()
              ? `<button class="btn ghost sm" id="fmtLogoQuitar">Volver al escudo institucional</button>`
              : `<p class="hint">Se está usando el escudo institucional que trae el sistema.</p>`}
          </div>
        </div>
      </div></div>

    <div class="card"><header><h2>Formatos del sistema</h2>
      <div style="display:flex;gap:7px">
        <button class="btn ghost sm" id="fmtGuardar">Guardar cambios</button>
        <button class="btn ghost sm" id="fmtRestaurar">Restaurar</button>
      </div></header>
      <div class="scroll-x"><table class="fija" style="min-width:1060px">
        <colgroup><col style="width:125px"><col style="width:295px"><col style="width:150px">
          <col style="width:85px"><col style="width:140px"><col style="width:265px"></colgroup>
        <thead><tr><th>Tipo de reporte</th><th>Título del formato</th><th>Código</th>
          <th class="ctr">Versión</th><th>Fecha de aprobación</th><th>Dónde se usa</th></tr></thead>
        <tbody>${fs.map((f, i) => `<tr>
          <td><div class="just" style="font-size:12px"><b style="font-weight:500">${esc(f.tipo)}</b></div></td>
          <td><div class="just hint" style="font-size:11.5px">${esc(f.titulo)}</div></td>
          <td><input type="text" data-fmt="${i}" data-fc="codigo" value="${esc(f.codigo)}"
            class="mono" style="font-size:12px" placeholder="ES-SIG-RG-00"></td>
          <td><input type="text" data-fmt="${i}" data-fc="version" value="${esc(f.version)}"
            class="mono" style="text-align:center" placeholder="1"></td>
          <td><input type="date" data-fmt="${i}" data-fc="fecha" value="${esc(f.fecha)}"></td>
          <td class="hint just">${esc(USO_FORMATO[f.c] || "")}</td>
        </tr>`).join("")}</tbody></table></div>
      <div class="body" style="border-top:1px solid var(--line)">
        <p class="hint just" style="margin:0">El tipo de reporte y el título del formato provienen
          del documento de codificación de reportes y no se editan aquí. Registre el código, la
          versión y la fecha de aprobación que la Dirección SIG haya asignado a cada uno.</p>
      </div></div>
  </div>`;
}


/* =====================================================================
   ESTRUCTURA ORGANIZACIONAL EDITABLE
   Macroproceso, proceso y dependencia. Al guardar, los riesgos, usuarios
   y reportes que apuntan a cada dependencia quedan con el nombre y el
   proceso nuevos, sin perder su histórico.
   ===================================================================== */
let ORG = null;   /* copia de trabajo mientras se edita */

function orgTrabajo(){
  if (!ORG) ORG = organigramaActual().map(r => ({...r}));
  return ORG;
}

function tarjetaOrganigrama(){
  const org = orgTrabajo();
  const procs = [...new Set(org.map(r => r.proceso).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "es"));
  const porProceso = {};
  org.forEach(r => { porProceso[r.proceso] = (porProceso[r.proceso] || 0) + 1; });

  return `<div class="card">
    <header><h2>Estructura organizacional</h2>
      <div style="display:flex;gap:7px;align-items:center">
        <span class="tag">${org.length} dependencias · ${procs.length} procesos</span>
        <button class="btn ghost sm" id="orgAgregar">Agregar</button>
        <button class="btn sm" id="orgGuardar">Guardar estructura</button>
        <button class="btn ghost sm" id="orgRestaurar">Restaurar</button>
      </div></header>
    <div class="body" style="padding-bottom:0">
      <p class="hint just" style="margin-top:0">Al guardar, las dependencias renombradas
        conservan sus riesgos, y las que cambien de proceso los arrastran consigo. Una
        dependencia con riesgos registrados no se puede eliminar: primero hay que reubicarlos.</p>
    </div>
    <div class="scroll-x" style="max-height:520px;overflow-y:auto">
      <table class="fija" style="min-width:1000px">
        <colgroup><col style="width:160px"><col style="width:300px"><col style="width:400px">
          <col style="width:70px"><col style="width:70px"></colgroup>
        <thead><tr><th>Macroproceso</th><th>Proceso</th><th>Dependencia</th>
          <th class="ctr">Riesgos</th><th class="ctr"></th></tr></thead>
        <tbody>${org.map((r, i) => {
          const nr = S.riesgos.filter(x => x.unidad === r.c && x.estado !== "OBSOLETO").length;
          return `<tr>
            <td><select data-org="${i}" data-oc="macro" autocomplete="off">
              ${CAT.macroprocesos.map(m =>
                `<option value="${m.c}" ${r.macro === m.c ? "selected" : ""}>${esc(m.n)}</option>`).join("")}
            </select></td>
            <td><input type="text" data-org="${i}" data-oc="proceso" value="${esc(r.proceso)}"
              list="orgProcesos"></td>
            <td><input type="text" data-org="${i}" data-oc="dependencia" value="${esc(r.dependencia)}"></td>
            <td class="ctr mono">${nr || ""}</td>
            <td class="ctr">${nr
              ? `<span class="hint" title="Tiene riesgos asociados">—</span>`
              : `<button class="btn ghost sm" data-orgdel="${i}">Quitar</button>`}</td>
          </tr>`;
        }).join("")}</tbody></table>
      <datalist id="orgProcesos">${procs.map(p =>
        `<option value="${esc(p)}">`).join("")}</datalist>
    </div>
    <div class="body" style="border-top:1px solid var(--line)">
      <div class="scroll-x"><table style="font-size:12px"><thead><tr>
        <th>Macroproceso</th><th>Proceso</th><th class="num">Dependencias</th>
        <th class="num">Riesgos</th></tr></thead><tbody>
        ${CAT.macroprocesos.flatMap(m => {
          const ps = [...new Set(org.filter(r => r.macro === m.c).map(r => r.proceso))];
          return ps.map((p, i) => {
            const deps = org.filter(r => r.proceso === p);
            const nr = S.riesgos.filter(x => deps.some(d => d.c === x.unidad)
              && x.estado !== "OBSOLETO").length;
            return `<tr><td>${i === 0 ? esc(m.n) : ""}</td><td>${esc(p)}</td>
              <td class="num">${deps.length}</td><td class="num">${nr}</td></tr>`;
          });
        }).join("")}
      </tbody></table></div>
    </div>
  </div>`;
}

/* Aplica la estructura editada y arrastra lo que depende de ella */
async function guardarEstructura(){
  const org = orgTrabajo().filter(r =>
    (r.proceso || "").trim() && (r.dependencia || "").trim());

  if (!org.length)
    return aviso("Estructura vacía", "Debe quedar al menos una dependencia.");

  /* Cada nombre de proceso recibe un código estable */
  const codigos = {};
  organigramaActual().forEach(r => { codigos[r.proceso] = codigos[r.proceso] || r.pc; });
  const usados = new Set(Object.values(codigos));
  const codigoDe = nombre => {
    if (codigos[nombre]) return codigos[nombre];
    let base = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/).filter(w => w.length > 2).map(w => w[0].toUpperCase())
      .join("").slice(0, 4) || "PR";
    let c = base, k = 2;
    while (usados.has(c)) c = base + k++;
    usados.add(c); codigos[nombre] = c; return c;
  };

  /* Se registra a dónde se mueve cada dependencia antes de aplicar */
  const antes = new Map(CAT.unidades.map(u => [u.c, u.p]));
  let nuevos = 0, movidos = 0, renombrados = 0;
  const nombresAntes = new Map(CAT.unidades.map(u => [u.c, u.n]));

  org.forEach(r => {
    r.proceso = r.proceso.trim();
    r.dependencia = r.dependencia.trim();
    r.pc = codigoDe(r.proceso);
    if (!r.c){
      let k = 1, c;
      const existentes = new Set(org.map(x => x.c).filter(Boolean));
      do { c = `${r.pc}-${String(k++).padStart(2, "0")}`; } while (existentes.has(c));
      r.c = c; nuevos++;
    } else {
      if (antes.get(r.c) && antes.get(r.c) !== r.pc) movidos++;
      if (nombresAntes.get(r.c) && nombresAntes.get(r.c) !== r.dependencia) renombrados++;
    }
  });

  guardarOrganigrama(org);
  aplicarOrganigrama(org);
  reconstruirIndices();

  /* Los riesgos siguen a su dependencia: si cambió de proceso, se mueven */
  let riesgosMovidos = 0;
  for (const r of S.riesgos){
    const u = uni(r.unidad);
    if (!u) continue;
    const m = proc(u.p)?.m;
    if (r.proceso !== u.p || r.macroproceso !== m){
      r.proceso = u.p;
      r.macroproceso = m;
      await Store.set("riesgos", r.id, r);
      riesgosMovidos++;
    }
  }

  /* Los usuarios pierden los procesos que dejaron de existir */
  const vigentes = new Set(CAT.procesos.map(p => p.c));
  for (const u of S.usuarios){
    const ps = (u.procesos || []).filter(p => vigentes.has(p));
    if (ps.length !== (u.procesos || []).length){
      u.procesos = ps;
      await Store.set("usuarios", u.id, u);
    }
  }

  ORG = null;
  S.filtros = {macroproceso:"", proceso:"", unidad:"", tipo:"", zona:""};
  render();
  aviso("Estructura actualizada", `Quedaron ${org.length} dependencias en `
    + `${CAT.procesos.length} procesos. `
    + `${renombrados} renombradas, ${movidos} movidas de proceso, ${nuevos} nuevas. `
    + `${riesgosMovidos} riesgos siguieron a su dependencia.`);
}
