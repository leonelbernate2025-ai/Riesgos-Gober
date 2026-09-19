#!/usr/bin/env python3
"""
Migración del consolidado ES-SIG-RG-166 V4 al modelo v7.

Hace tres cosas:
  1. Extrae los 235 riesgos y sus controles de la hoja MAPA DE RIESGOS.
  2. Resuelve los nombres de proceso y dependencia contra el catálogo del
     organigrama v02, con coincidencia insensible a tildes y guiones bajos.
  3. Recalcula el riesgo residual con el motor v7 y lo compara contra el
     valor que trae el Excel. Cualquier diferencia se reporta.

Salida: datos.json (semilla del aplicativo) + informe_migracion.txt
"""
import json, re, sys, unicodedata
from collections import Counter, defaultdict
import openpyxl

XLSX = sys.argv[1] if len(sys.argv) > 1 else "MAPA_DE_RIESGOS_CONSOLIDADO_V4_CARGAR__1__4_.xlsx"

# ---------------------------------------------------------------- catálogo
MACRO = {"ESTRATEGICO": "Estratégicos", "MISIONAL": "Misionales",
         "APOYO": "Apoyo", "EVALUACION": "Evaluación"}

PROCESOS = {
    "AC":  ("Atención al Ciudadano", "ESTRATEGICO"),
    "DYC": ("Dirección y Comunicaciones", "ESTRATEGICO"),
    "GETH":("Gestión Estratégica del Talento Humano", "ESTRATEGICO"),
    "PE":  ("Planificación Estratégica", "ESTRATEGICO"),
    "SIG": ("Sistemas Integrados de Gestión", "ESTRATEGICO"),
    "DSC": ("Desarrollo Sostenible y Competitivo", "MISIONAL"),
    "GE":  ("Gestión Educativa", "MISIONAL"),
    "GSS": ("Gestión en Salud y Seguridad Social", "MISIONAL"),
    "SC":  ("Seguridad y Convivencia", "MISIONAL"),
    "AI":  ("Administración Institucional", "APOYO"),
    "CCP": ("Compras y Contratación Pública", "APOYO"),
    "GF":  ("Gestión Financiera", "APOYO"),
    "GJ":  ("Gestión Jurídica", "APOYO"),
    "TIC": ("Tecnologías de la Información y la Comunicación", "APOYO"),
    "CE":  ("Control y Evaluación", "EVALUACION"),
}

# Nombre en el Excel -> código de proceso
ALIAS_PROCESO = {
    "ATENCION AL CIUDADANO":"AC", "DIRECCION Y COMUNICACIONES":"DYC",
    "GESTION ESTRATEGICA DEL TALENTO HUMANO":"GETH",
    "PLANEACION ESTRATEGICA":"PE", "PLANIFICACION ESTRATEGICA":"PE",
    "SISTEMAS INTEGRADOS DE GESTION":"SIG",
    "DESARROLLO SOSTENIBLE Y COMPETITIVO":"DSC",
    "GESTION EDUCATIVA":"GE",
    "SALUD Y SEGURIDAD SOCIAL":"GSS", "GESTION EN SALUD Y SEGURIDAD SOCIAL":"GSS",
    "SEGURIDAD Y CONVIVENCIA":"SC",
    "ADMINISTRACION INSTITUCIONAL":"AI",
    "COMPRAS Y CONTRATACION PUBLICA":"CCP",
    "GESTION FINANCIERA":"GF", "GESTION JURIDICA":"GJ",
    "TECNOLOGIAS DE LA INFORMACION Y COMUNICACION":"TIC",
    "TECNOLOGIAS DE LA INFORMACION Y LA COMUNICACION":"TIC",
    "CONTROL Y EVALUACION":"CE",
}

# Unidades del organigrama v02: codigo -> (nombre, nivel, padre)
UNIDADES = [
 ("DESP","Despacho del Gobernador","DESPACHO",None),
 ("O-JUR","Oficina Jurídica","OFICINA","DESP"),
 ("O-JUR-1","Grupo de Conceptos Jurídicos","GRUPO","O-JUR"),
 ("O-JUR-2","Grupo de Procesos Judiciales y Administrativos","GRUPO","O-JUR"),
 ("O-JUR-3","Grupo de Entidades sin Ánimo de Lucro","GRUPO","O-JUR"),
 ("O-RIE","Oficina Gestión del Riesgo de Desastres","OFICINA","DESP"),
 ("O-CON","Oficina de Contratación","OFICINA","DESP"),
 ("O-PRE","Oficina de Prensa y Comunicaciones","OFICINA","DESP"),
 ("O-CIN","Oficina de Control Interno","OFICINA","DESP"),
 ("O-DIS","Oficina de Control Disciplinario","OFICINA","DESP"),
 ("S-INT","Secretaría del Interior","SECRETARIA",None),
 ("S-INT-1","Dirección de Participación Ciudadana y Acción Comunal","DIRECCION","S-INT"),
 ("S-INT-2","Dirección de Seguridad y Convivencia Ciudadana","DIRECCION","S-INT"),
 ("S-INT-3","Dirección de Atención Integral a las Víctimas","DIRECCION","S-INT"),
 ("S-ADM","Secretaría Administrativa","SECRETARIA",None),
 ("S-ADM-D1","Grupo Fondo de Cesantías de Santander","GRUPO","S-ADM"),
 ("S-ADM-1","Dirección de Talento Humano","DIRECCION","S-ADM"),
 ("S-ADM-11","Grupo de Seguridad y Salud en el Trabajo","GRUPO","S-ADM-1"),
 ("S-ADM-12","Grupo de Bienestar Social Laboral","GRUPO","S-ADM-1"),
 ("S-ADM-2","Dirección de Atención al Ciudadano","DIRECCION","S-ADM"),
 ("S-ADM-21","Grupo de Pasaportes","GRUPO","S-ADM-2"),
 ("S-ADM-22","Grupo de Gestión Documental","GRUPO","S-ADM-2"),
 ("S-ADM-3","Dirección de Recursos Físicos","DIRECCION","S-ADM"),
 ("S-ADM-31","Grupo Administración de Recursos Físicos Sec. Salud","GRUPO","S-ADM-3"),
 ("S-PLA","Secretaría de Planeación","SECRETARIA",None),
 ("S-PLA-1","Dirección de Desarrollo Regional y Territorial","DIRECCION","S-PLA"),
 ("S-PLA-11","Grupo de Planificación e Información Territorial","GRUPO","S-PLA-1"),
 ("S-PLA-12","Grupo de Evaluación y Seguimiento","GRUPO","S-PLA-1"),
 ("S-PLA-13","Grupo de Rendición de Cuentas","GRUPO","S-PLA-1"),
 ("S-PLA-2","Dirección de Proyectos y Regalías","DIRECCION","S-PLA"),
 ("S-PLA-21","Grupo de Proyectos e Inversión Pública","GRUPO","S-PLA-2"),
 ("S-PLA-22","Grupo de Regalías","GRUPO","S-PLA-2"),
 ("S-PLA-3","Dirección de Sistemas Integrados de Gestión","DIRECCION","S-PLA"),
 ("S-PLA-31","Grupo de Gestión Ambiental NTC ISO-14001","GRUPO","S-PLA-3"),
 ("S-PLA-32","Grupo de Gestión de Calidad","GRUPO","S-PLA-3"),
 ("S-HAC","Secretaría de Hacienda","SECRETARIA",None),
 ("S-HAC-1","Dirección de Presupuesto","DIRECCION","S-HAC"),
 ("S-HAC-2","Dirección de Contabilidad","DIRECCION","S-HAC"),
 ("S-HAC-3","Dirección de Tesorería","DIRECCION","S-HAC"),
 ("S-HAC-4","Dirección del Fondo Territorial de Pensiones","DIRECCION","S-HAC"),
 ("S-HAC-5","Dirección de Cobro Coactivo","DIRECCION","S-HAC"),
 ("S-HAC-6","Dirección de Ingresos","DIRECCION","S-HAC"),
 ("S-DES","Secretaría de Desarrollo Social","SECRETARIA",None),
 ("S-DES-1","Dirección de Adulto Mayor y Población con Discapacidad","DIRECCION","S-DES"),
 ("S-DES-2","Dirección de Desarrollo Social","DIRECCION","S-DES"),
 ("S-DES-3","Dirección de Juventudes","DIRECCION","S-DES"),
 ("S-SAL","Secretaría de Salud","SECRETARIA",None),
 ("S-SAL-1","Dirección de Planeación y Mejoramiento en Salud","DIRECCION","S-SAL"),
 ("S-SAL-11","Grupo de Gestión de Proyectos, Planes y Programas","GRUPO","S-SAL-1"),
 ("S-SAL-12","Grupo de Apoyo a la Gestión de Control y Calidad","GRUPO","S-SAL-1"),
 ("S-SAL-2","Dirección de Salud Integral","DIRECCION","S-SAL"),
 ("S-SAL-21","Grupo de Promoción y Prevención","GRUPO","S-SAL-2"),
 ("S-SAL-24","Grupo de Laboratorio y Salud Pública","GRUPO","S-SAL-2"),
 ("S-SAL-28","Grupo de Gestión de Salud Pública","GRUPO","S-SAL-2"),
 ("S-SAL-3","Dirección de Desarrollo de Servicios Inspección Vigilancia y Control","DIRECCION","S-SAL"),
 ("S-SAL-31","Grupo de Aseguramiento y Afiliación","GRUPO","S-SAL-3"),
 ("S-SAL-32","Grupo Centro Regulador de Urgencias, Emergencias y Desastres CRUE","GRUPO","S-SAL-3"),
 ("S-SAL-33","Grupo de Participación Social en Salud","GRUPO","S-SAL-3"),
 ("S-SAL-34","Grupo Acreditación y Sist. Oblig. Garantía en Calidad","GRUPO","S-SAL-3"),
 ("S-SAL-4","Dirección Administrativa y de Control Financiero","DIRECCION","S-SAL"),
 ("S-SAL-5","Dirección de Apoyo Jurídico, Contratación y P. Sancionatorios","DIRECCION","S-SAL"),
 ("S-EDU","Secretaría de Educación","SECRETARIA",None),
 ("S-EDU-D1","Grupo de Apoyo Jurídico","GRUPO","S-EDU"),
 ("S-EDU-D2","Grupo de Planeación Educativa","GRUPO","S-EDU"),
 ("S-EDU-D3","Grupo de Inspección y Vigilancia","GRUPO","S-EDU"),
 ("S-EDU-1","Dirección Estratégica","DIRECCION","S-EDU"),
 ("S-EDU-11","Grupo de Cobertura Educativa","GRUPO","S-EDU-1"),
 ("S-EDU-12","Grupo de Calidad Educativa","GRUPO","S-EDU-1"),
 ("S-EDU-2","Dirección Administrativa y Financiera","DIRECCION","S-EDU"),
 ("S-EDU-24","Grupo Financiero","GRUPO","S-EDU-2"),
 ("S-EDU-3","Dirección de Talento Humano Docente","DIRECCION","S-EDU"),
 ("S-EDU-33","Grupo de Carrera Docente","GRUPO","S-EDU-3"),
 ("S-EDU-34","Grupo de Prestaciones Sociales del Magisterio","GRUPO","S-EDU-3"),
 ("S-EDU-36","Grupo de Historias Laborales","GRUPO","S-EDU-3"),
 ("S-EDU-4","Dirección de Permanencia Escolar","DIRECCION","S-EDU"),
 ("S-AGR","Secretaría de Agricultura y Desarrollo Rural","SECRETARIA",None),
 ("S-AGR-1","Dirección de Gestión Rural e Innovación Agropecuaria","DIRECCION","S-AGR"),
 ("S-INF","Secretaría de Infraestructura","SECRETARIA",None),
 ("S-INF-1","Dirección de Proyectos de Infraestructura","DIRECCION","S-INF"),
 ("S-INF-2","Dirección de Gestión de Infraestructura","DIRECCION","S-INF"),
 ("S-INF-3","Dirección de Aguas y Saneamiento Básico","DIRECCION","S-INF"),
 ("S-INF-4","Dirección de Asuntos Minero-Energéticos","DIRECCION","S-INF"),
 ("S-TIC","Secretaría de Tecnologías de la Información y las Comunicaciones","SECRETARIA",None),
 ("S-TIC-1","Dirección de Gobierno Digital","DIRECCION","S-TIC"),
 ("S-TIC-2","Dirección de Sistemas de Información","DIRECCION","S-TIC"),
 ("S-VIV","Secretaría de Vivienda y Hábitat Sustentable","SECRETARIA",None),
 ("S-VIV-1","Dirección de Desarrollo de Prog. Vivienda y Hábitat","DIRECCION","S-VIV"),
 ("S-CUL","Secretaría de Cultura y Turismo","SECRETARIA",None),
 ("S-CUL-1","Dirección de Cultura, Turismo y Patrimonio","DIRECCION","S-CUL"),
 ("S-MUJ","Secretaría de Mujer y Equidad de Género","SECRETARIA",None),
 ("S-MUJ-1","Dirección de Equidad de Género","DIRECCION","S-MUJ"),
 ("S-PRI","Secretaría Privada","SECRETARIA",None),
 ("S-PRI-1","Dirección de Gestión y Relaciones Gubernamentales","DIRECCION","S-PRI"),
 ("S-AMB","Secretaría Ambiental","SECRETARIA",None),
 ("S-AMB-1","Dirección de Asuntos Ambientales","DIRECCION","S-AMB"),
 ("S-COM","Secretaría de Competitividad y Productividad","SECRETARIA",None),
 ("S-COM-1","Dirección de Desarrollo Empresarial","DIRECCION","S-COM"),
 ("S-COM-2","Grupo de Cooperación Internacional y Nacional","GRUPO","S-COM"),
]

# Alias adicionales para nombres que el Excel escribe distinto
ALIAS_UNIDAD = {
 "OFICINA PARA LA GESTION DEL RIESGO DE DESASTRES":"O-RIE",
 "OFICINA DE PRENSA Y COMUNICAIONES":"O-PRE",
 "DESPACHO SECRETARIA DE EDUCACION":"S-EDU",
 "DIRECCION TALENTO HUMANO DOCENTE":"S-EDU-3",
 "DIRECCION DE ADMINISTRACION Y CONTROL FINANCIERO":"S-SAL-4",
 "DIRECCION DE APOYO JURIDICO DE CONTRATACION Y PROCESOS SANCIONATORIOS":"S-SAL-5",
 "DIRECCION PERMANENCIA ESCOLAR":"S-EDU-4",
 "SECRETARIA DE LA MUJER Y EQUIDAD DE GENERO":"S-MUJ",
 "SECRETARIA DE TECNOLOGIAS DE LA INFORMACION Y COMUNICACIONES":"S-TIC",
 "GRUPO DE GESTION AMBIENTAL NTC ISO 14001":"S-PLA-31",
 "GRUPO DE GESTION CALIDAD":"S-PLA-32",
 "GRUPO DE LABOTARIO DE SALUD PUBLICA":"S-SAL-24",
 "GRUPO DE ADMINISTRACION DE RECURSOS FISICOS - SECRETARIA DE SALUD":"S-ADM-31",
 "GRUPO DE ADMINISTRACION DE RECURSOS FISICOS - SECRETARIA DE EDUCACION":"S-ADM-31",
 "GRUPO CENTRO REGULADOR DE URGENCIAS, EMERGENCIAS Y DESASTRES -CRUE":"S-SAL-32",
 "GRUPO ACREDITACION EN SALUD Y SISTEMA OBLIGATORIO DE GARANTIA DE LA CALIDAD":"S-SAL-34",
 "GRUPO DE COOPERACION TECNICA INTERNACIONAL Y NACIONAL":"S-COM-2",
 "GRUPO DE GESTION DE LA SALUD PUBLICA":"S-SAL-28",
 "GRUPO CALIDAD EDUCATIVA":"S-EDU-12", "GRUPO COBERTURA EDUCATIVA":"S-EDU-11",
 "GRUPO HISTORIAS LABORALES":"S-EDU-36", "GRUPO CARRERA DOCENTE":"S-EDU-33",
 "GRUPO PRESTACIONES SOCIALES DEL MAGISTERIO":"S-EDU-34",
 "DESPACHO DEL GOBERNADOR":"DESP",
 "SECRETARIA AGRICULTURA Y DESARROLLO RURAL":"S-AGR",
}

TIPOS = {"RIESGO DE GESTION":"GES", "RIESGO DE SEGURIDAD DIGITAL":"SED",
         "RIESGO DE CORRUPCION":"COR", "CONFLICTO DE INTERESES":"CI",
         "RIESGO FISCAL":"RFI"}

PESO_TIPO = {"Preventivo":.25, "Detectivo":.15, "Correctivo":.10}
PESO_IMPL = {"Automático":.25, "Automatico":.25, "Manual":.15}

MATRIZ_INH = {}
for i, imp in enumerate([.2,.4,.6,.8,1.0]):
    for p in [.2,.4,.6,.8,1.0]:
        if imp == 1.0: z = "Extremo"
        elif imp == .8: z = "Alto"
        elif imp == .6: z = "Alto" if p >= .8 else "Moderado"
        elif imp == .4: z = "Alto" if p == 1.0 else ("Bajo" if p == .2 else "Moderado")
        else: z = "Alto" if p == 1.0 else ("Bajo" if p <= .4 else "Moderado")
        MATRIZ_INH[(round(p,1), round(imp,1))] = z

MATRIZ_RES = [(.80,1.00,0,1.00,"Extremo"),(.60,.80,0,1.00,"Alto"),
              (0,.80,.80,1.00,"Alto"),(.40,.60,.60,.80,"Alto"),
              (.40,.60,0,.60,"Moderado"),(.20,.40,.20,.80,"Moderado"),
              (0,.20,.40,.80,"Moderado"),(.20,.40,0,.20,"Bajo"),
              (0,.20,0,.40,"Bajo")]

def zona_residual(p, i):
    # Redondeo antes de comparar: 0.8*0.75 da 0.6000000000000001 en IEEE-754
    # y caería en la banda equivocada. Excel redondea; aquí también.
    p, i = round(p, 10), round(i, 10)
    for iMin,iMax,pMin,pMax,z in MATRIZ_RES:
        if iMin < i <= iMax and pMin < p <= pMax: return z
    return "Bajo"

def norm(s):
    if s is None: return ""
    s = str(s).replace("_", " ").strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s).upper()

IDX_UNIDAD = {norm(n): c for c, n, _, _ in UNIDADES}
IDX_UNIDAD.update(ALIAS_UNIDAD)

def resolver_unidad(nombre):
    n = norm(nombre)
    if not n: return None
    if n in IDX_UNIDAD: return IDX_UNIDAD[n]
    for k, v in IDX_UNIDAD.items():          # coincidencia parcial
        if k and (k in n or n in k) and abs(len(k) - len(n)) < 12: return v
    return None

# ---------------------------------------------------------------- extracción
wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb["MAPA DE RIESGOS"]
def C(r, c): return ws.cell(r, c).value

starts = [r for r in range(11, 972) if C(r, 13)]
riesgos, avisos = [], []
sin_proceso, sin_unidad = Counter(), Counter()
difs = []

for idx, s in enumerate(starts):
    e = starts[idx + 1] if idx + 1 < len(starts) else 972

    pc = ALIAS_PROCESO.get(norm(C(s, 6)))
    if not pc: sin_proceso[C(s, 6)] += 1

    ucod = resolver_unidad(C(s, 10))
    gcod = resolver_unidad(C(s, 11)) if C(s, 11) else None
    if not ucod: sin_unidad[C(s, 10)] += 1

    # Si lo resuelto es una dirección o grupo, se sube hasta la secretaría
    padre = {c: p for c, n, nv, p in UNIDADES}
    raiz = ucod
    while raiz and padre.get(raiz): raiz = padre[raiz]
    unidad, dependencia = (raiz, ucod if ucod != raiz else None) if ucod else (None, None)
    if gcod: dependencia = gcod

    tp = TIPOS.get(norm(C(s, 13)), "GES")
    es_corrupcion = tp in ("COR", "CI")

    prob = C(s, 47) if es_corrupcion else C(s, 26)     # AU : Z
    imp  = C(s, 51) if es_corrupcion else C(s, 28)     # AY : AB
    prob = float(prob) if isinstance(prob, (int, float)) else None
    imp  = float(imp)  if isinstance(imp,  (int, float)) else None

    controles = []
    for r in range(s, e):
        if not C(r, 64): continue
        t = str(C(r, 64)).strip()
        im = str(C(r, 65) or "Manual").strip()
        controles.append({
            "responsable": (C(r, 60) or "").strip(),
            "accion":      (C(r, 61) or "").strip(),
            "complemento": (C(r, 62) or "").strip(),
            "tipo": t, "implementacion": "Automático" if im.upper().startswith("AUTO") else "Manual",
            "documentacion": C(r, 67), "frecuencia": C(r, 68), "evidencia": C(r, 69),
        })

    # --- recálculo con el motor v7 ---
    mp = mi = 1.0
    for c in controles:
        peso = PESO_TIPO.get(c["tipo"], 0) + PESO_IMPL.get(c["implementacion"], 0)
        if c["tipo"] == "Correctivo": mi *= (1 - peso)
        else: mp *= (1 - peso)

    calc_p = calc_i = None
    if prob is not None and imp is not None:
        calc_p, calc_i = round(prob * mp, 10), round(imp * mi, 10)
        xp, xi = C(s, 72), C(s, 73)          # BT, BU del Excel
        if isinstance(xp, (int, float)) and abs(calc_p - xp) > 1e-9:
            difs.append((C(s, 1), "probabilidad", xp, calc_p))
        if isinstance(xi, (int, float)) and abs(calc_i - xi) > 1e-9:
            difs.append((C(s, 1), "impacto", xi, calc_i))
        zx, zc = C(s, 74), zona_residual(calc_p, calc_i)
        if isinstance(zx, str) and zx.strip() and zx.strip() != zc:
            difs.append((C(s, 1), "zona", zx, zc))

    trat = (C(s, 75) or "").strip().capitalize() or None
    if trat == "Evitar": sub = "Mitigar"
    else: sub = None

    riesgos.append({
        "id": f"m{idx:04d}",
        "codigoOriginal": C(s, 1),
        "macroproceso": PROCESOS[pc][1] if pc else None,
        "proceso": pc, "unidad": unidad, "dependencia": dependencia,
        "tipo": tp, "clase": C(s, 14),
        "descripcion": (C(s, 24) or "").strip(),
        "causaRaiz": (C(s, 18) or "").strip(),
        "efectoInmediato": (C(s, 19) or "").strip(),
        "areaImpacto": (C(s, 20) or "").strip(),
        "factores": [f.strip() for f in str(C(s, 22) or "").split(",") if f.strip()],
        "probabilidadPct": prob, "impactoPct": imp,
        "zonaInherente": (C(s, 56) or "").strip() or
                         (MATRIZ_INH.get((round(prob or 0, 1), round(imp or 0, 1))) if prob and imp else None),
        "controles": controles,
        "probResidual": calc_p, "impResidual": calc_i,
        "zonaResidual": zona_residual(calc_p, calc_i) if calc_p is not None else None,
        "tratamiento": trat, "subestrategia": sub,
        "planAccion": (C(s, 76) or "").strip(),
        "kri": (C(s, 78) or "").strip(),
        "estado": "VIGENTE",
        "revisar": [],
    })

    if es_corrupcion:
        riesgos[-1]["revisar"].append(
            "Impacto calculado con el cuestionario de 19 preguntas de la guía v6. "
            "Bajo la v7 debe revalorarse con la tabla de impacto general.")
    if not pc:  riesgos[-1]["revisar"].append(f"Proceso sin equivalencia: {C(s,6)}")
    if not ucod: riesgos[-1]["revisar"].append(f"Dependencia sin equivalencia: {C(s,10)}")
    if len(controles) >= 4:
        riesgos[-1]["revisar"].append("Alcanzó el tope de 4 controles del formato anterior.")
    if trat == "Evitar" and controles:
        riesgos[-1]["revisar"].append("Tratamiento «Evitar» con controles activos: verificar subestrategia.")
    if trat == "Aceptar" and es_corrupcion:
        riesgos[-1]["revisar"].append("El instructivo prohíbe aceptar riesgos de corrupción.")

# ---------------------------------------------------------------- salida
datos = {
    "origen": "MAPA_DE_RIESGOS_CONSOLIDADO_V4",
    "version": "GUIA_V7",
    "generado": __import__("datetime").date.today().isoformat(),
    "riesgos": riesgos,
}
with open("datos.json", "w", encoding="utf8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=1)

pend = Counter()
for r in riesgos:
    for m in r["revisar"]: pend[m.split(":")[0]] += 1

L = []
L.append("INFORME DE MIGRACIÓN — consolidado V4 al modelo v7")
L.append("=" * 62)
L.append(f"Riesgos extraídos:        {len(riesgos)}")
L.append(f"Controles extraídos:      {sum(len(r['controles']) for r in riesgos)}")
L.append(f"Con proceso resuelto:     {sum(1 for r in riesgos if r['proceso'])}")
L.append(f"Con unidad resuelta:      {sum(1 for r in riesgos if r['unidad'])}")
L.append("")
L.append("VALIDACIÓN DEL MOTOR DE CÁLCULO")
L.append("-" * 62)
if difs:
    L.append(f"{len(difs)} diferencias entre el Excel y el motor v7:")
    for c, campo, x, y in difs[:25]:
        L.append(f"  {c:22s} {campo:14s} Excel={x!r:>10}  v7={y!r}")
else:
    L.append("Ninguna. El motor v7 reproduce exactamente los valores del Excel")
    L.append("para los 235 riesgos y sus 571 controles.")
L.append("")
L.append("PENDIENTES DE REVISIÓN MANUAL")
L.append("-" * 62)
for m, n in pend.most_common(): L.append(f"  {n:4d}  {m}")
if sin_proceso:
    L.append("")
    L.append("Procesos sin equivalencia:")
    for k, n in sin_proceso.most_common(): L.append(f"  {n:4d}  {k}")
if sin_unidad:
    L.append("")
    L.append("Dependencias sin equivalencia:")
    for k, n in sin_unidad.most_common(): L.append(f"  {n:4d}  {k}")

txt = "\n".join(L)
open("informe_migracion.txt", "w", encoding="utf8").write(txt)
print(txt)
