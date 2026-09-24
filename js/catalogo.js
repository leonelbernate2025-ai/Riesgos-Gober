/* =====================================================================
   Catálogo metodológico y estructura organizacional.
   Guía para la Gestión Integral del Riesgo v7 · Función Pública.
   Todo lo que puede cambiar con una nueva versión de la guía vive aquí.
   ===================================================================== */

/* =====================================================================
   CATÁLOGO METODOLÓGICO — Guía v7
   Espejo de las tablas de la base de datos. Ningún valor está quemado
   en la lógica: el motor de cálculo solo lee de aquí.
   ===================================================================== */
const CAT = {
  version: "GUIA_V7",

  /* Estructura organizacional SIG: macroproceso → proceso → dependencia */
  macroprocesos:[
    {c:"ESTRATEGICO", n:"Estratégicos"},
    {c:"MISIONAL", n:"Misionales"},
    {c:"APOYO", n:"Apoyo"},
    {c:"EVALUACION", n:"Evaluación"}
  ],

  procesos:[
    {c:"AC", n:"Atención al Ciudadano", m:"ESTRATEGICO"},
    {c:"DYC", n:"Dirección y Comunicaciones", m:"ESTRATEGICO"},
    {c:"GETH", n:"Gestión Estratégica del Talento Humano", m:"ESTRATEGICO"},
    {c:"PE", n:"Planificación Estratégica", m:"ESTRATEGICO"},
    {c:"SIG", n:"Sistemas Integrados de Gestión", m:"ESTRATEGICO"},
    {c:"DSC", n:"Desarrollo Sostenible y Competitivo", m:"MISIONAL"},
    {c:"GE", n:"Gestión Educativa", m:"MISIONAL"},
    {c:"GSS", n:"Gestión en Salud y Seguridad Social", m:"MISIONAL"},
    {c:"SC", n:"Seguridad y Convivencia", m:"MISIONAL"},
    {c:"AI", n:"Administración Institucional", m:"APOYO"},
    {c:"CCP", n:"Compras y Contratación Pública", m:"APOYO"},
    {c:"GF", n:"Gestión Financiera", m:"APOYO"},
    {c:"GJ", n:"Gestión Jurídica", m:"APOYO"},
    {c:"TIC", n:"Tecnologías de la Información y la Comunicación", m:"APOYO"},
    {c:"CE", n:"Control y Evaluación", m:"EVALUACION"}
  ],

  unidades:[
    {c:"AC-01", n:"Oficina de Atencion al Ciudadano", p:"AC"},
    {c:"AC-02", n:"Oficina de Pasaportes", p:"AC"},
    {c:"DYC-01", n:"Despacho del Gobernador y Secretaria Privada", p:"DYC"},
    {c:"DYC-02", n:"Direccion de Gestion y Relaciones Gubernamentales", p:"DYC"},
    {c:"DYC-03", n:"Oficina de Prensa y Comunicaciones", p:"DYC"},
    {c:"GETH-01", n:"Direccion de Talento Humano", p:"GETH"},
    {c:"GETH-02", n:"Fondo de Vivienda", p:"GETH"},
    {c:"PE-01", n:"Despacho Secretaria de Planeación", p:"PE"},
    {c:"PE-02", n:"Dirección de Desarrollo Regional y Territorial", p:"PE"},
    {c:"PE-03", n:"Dirección de Proyectos y Regalías", p:"PE"},
    {c:"PE-04", n:"Grupo de Evaluación y Seguimiento", p:"PE"},
    {c:"PE-05", n:"Grupo de Planificación e Información Territorial", p:"PE"},
    {c:"PE-06", n:"Grupo de Proyectos", p:"PE"},
    {c:"PE-07", n:"Grupo de Regalías", p:"PE"},
    {c:"PE-08", n:"Grupo de Rendición de Cuentas", p:"PE"},
    {c:"PE-09", n:"Secretaria de Planeacion", p:"PE"},
    {c:"SIG-01", n:"Grupo de Gestion Ambiental", p:"SIG"},
    {c:"SIG-02", n:"Grupo de Gestion de Calidad", p:"SIG"},
    {c:"SIG-03", n:"Grupo de Seguridad y Salud en El Trabajo", p:"SIG"},
    {c:"DSC-01", n:"Despacho Secretaria Agricultura y Desarrollo Rural", p:"DSC"},
    {c:"DSC-02", n:"Despacho Secretaria Cultura y Turismo", p:"DSC"},
    {c:"DSC-03", n:"Despacho Secretaria de Ambiente", p:"DSC"},
    {c:"DSC-04", n:"Despacho Secretaria de Competitividad y Productividad", p:"DSC"},
    {c:"DSC-05", n:"Despacho Secretaria de Desarrollo", p:"DSC"},
    {c:"DSC-06", n:"Despacho Secretaria de Infraestructura", p:"DSC"},
    {c:"DSC-07", n:"Despacho Secretaria de Mujer y Equidad de Genero", p:"DSC"},
    {c:"DSC-08", n:"Despacho Secretaria de Vivienda y Hábitat Sustentable", p:"DSC"},
    {c:"DSC-09", n:"Dirección de Adulto Mayor y Población con Discapacidad", p:"DSC"},
    {c:"DSC-10", n:"Dirección de Aguas y Saneamiento Básico", p:"DSC"},
    {c:"DSC-11", n:"Dirección de Asuntos Ambientales", p:"DSC"},
    {c:"DSC-12", n:"Dirección de Asuntos Minero Energéticos", p:"DSC"},
    {c:"DSC-13", n:"Dirección de Cultura, Turismo y Patrimonio", p:"DSC"},
    {c:"DSC-14", n:"Dirección de Desarrollo de Programas de Vivienda y Hábitat", p:"DSC"},
    {c:"DSC-15", n:"Dirección de Desarrollo Empresarial", p:"DSC"},
    {c:"DSC-16", n:"Dirección de Desarrollo Social", p:"DSC"},
    {c:"DSC-17", n:"Dirección de Equidad de Genero", p:"DSC"},
    {c:"DSC-18", n:"Dirección de Gestión de Infraestructuras", p:"DSC"},
    {c:"DSC-19", n:"Dirección de Gestión Rural e Innovación Agropecuaria", p:"DSC"},
    {c:"DSC-20", n:"Dirección de Juventudes", p:"DSC"},
    {c:"DSC-21", n:"Dirección de Proyectos de Infraestructura", p:"DSC"},
    {c:"DSC-22", n:"Grupo Comunidad LGTBIQ", p:"DSC"},
    {c:"DSC-23", n:"Grupo Consejo Departamental de Política Social", p:"DSC"},
    {c:"DSC-24", n:"Grupo de Infancia y Adolescencia", p:"DSC"},
    {c:"DSC-25", n:"Secretaria de Agricultura", p:"DSC"},
    {c:"DSC-26", n:"Secretaria de Ambiente", p:"DSC"},
    {c:"DSC-27", n:"Secretaria de Competitividad y Productividad", p:"DSC"},
    {c:"DSC-28", n:"Secretaria de Cultura y Turismo", p:"DSC"},
    {c:"DSC-29", n:"Secretaria de Desarrollo Social", p:"DSC"},
    {c:"DSC-30", n:"Secretaria de Infraestructura", p:"DSC"},
    {c:"DSC-31", n:"Secretaria de Mujer y Equidad de Genero", p:"DSC"},
    {c:"DSC-32", n:"Secretaria de Vivienda", p:"DSC"},
    {c:"GE-01", n:"Despacho Secretaria de Educación", p:"GE"},
    {c:"GE-02", n:"Dirección de Permanencia Escolar", p:"GE"},
    {c:"GE-03", n:"Dirección de Talento Humano Docente", p:"GE"},
    {c:"GE-04", n:"Dirección Estratégica", p:"GE"},
    {c:"GE-05", n:"Grupo Calidad Educativa", p:"GE"},
    {c:"GE-06", n:"Grupo Cobertura Educativa", p:"GE"},
    {c:"GE-07", n:"Grupo Inspección y Vigilancia", p:"GE"},
    {c:"GE-08", n:"Grupo Planeación Educativa", p:"GE"},
    {c:"GE-09", n:"Secretaria de Educación", p:"GE"},
    {c:"GSS-01", n:"Dirección de Administración y Control Financiero - Salud", p:"GSS"},
    {c:"GSS-02", n:"Dirección de Apoyo Jurídico de Contratación y Procesos Sancionatorio", p:"GSS"},
    {c:"GSS-03", n:"Dirección de Desarrollo de Servicios Inspección Vigilancia y Control", p:"GSS"},
    {c:"GSS-04", n:"Dirección de Planeación y Mejoramiento en Salud", p:"GSS"},
    {c:"GSS-05", n:"Dirección de Salud Integral", p:"GSS"},
    {c:"GSS-06", n:"Laboratorio Departamental de Salud", p:"GSS"},
    {c:"GSS-07", n:"Secretaria de Salud", p:"GSS"},
    {c:"SC-01", n:"Despacho Secretaria del Interior", p:"SC"},
    {c:"SC-02", n:"Dirección de Atención Integral a las Víctimas del Departamento de Santander", p:"SC"},
    {c:"SC-03", n:"Dirección de Participación Ciudadana y Acción Comunal", p:"SC"},
    {c:"SC-04", n:"Dirección de Seguridad y Convivencia Ciudadana", p:"SC"},
    {c:"SC-05", n:"Grupo Asuntos Religiosos", p:"SC"},
    {c:"SC-06", n:"Grupo de Derechos de Autor", p:"SC"},
    {c:"SC-07", n:"Grupo de Paz y Derechos Humanos", p:"SC"},
    {c:"SC-08", n:"Grupo de Seguridad y Fortalecimiento Municipal", p:"SC"},
    {c:"SC-09", n:"Oficina para la Gestión del Riesgo de Desastres", p:"SC"},
    {c:"SC-10", n:"Secretaria del Interior", p:"SC"},
    {c:"AI-01", n:"Control Disciplinario", p:"AI"},
    {c:"AI-02", n:"Dirección de Recursos Físicos", p:"AI"},
    {c:"AI-03", n:"Fondo de Cesantías - FONCESAN", p:"AI"},
    {c:"AI-04", n:"Gestión Documental", p:"AI"},
    {c:"AI-05", n:"Secretaria Administrativa", p:"AI"},
    {c:"CCP-01", n:"Oficina de Contratación", p:"CCP"},
    {c:"GF-01", n:"Despacho de Hacienda", p:"GF"},
    {c:"GF-02", n:"Dirección Administrativa y Financiera - Secretaria de Educación", p:"GF"},
    {c:"GF-03", n:"Dirección Administrativa y Financiera - Secretaria de Salud", p:"GF"},
    {c:"GF-04", n:"Dirección de Cobro Coactivo", p:"GF"},
    {c:"GF-05", n:"Dirección de Contabilidad", p:"GF"},
    {c:"GF-06", n:"Dirección de Fondo Territorial de Pensiones", p:"GF"},
    {c:"GF-07", n:"Dirección de Ingresos", p:"GF"},
    {c:"GF-08", n:"Dirección de Presupuesto", p:"GF"},
    {c:"GF-09", n:"Dirección de Tesorería", p:"GF"},
    {c:"GF-10", n:"Secretaria de Hacienda", p:"GF"},
    {c:"GJ-01", n:"Oficina Juridica", p:"GJ"},
    {c:"GJ-02", n:"Grupo de Conceptos Juridicos", p:"GJ"},
    {c:"GJ-03", n:"Grupo de Procesos Judiciales y Administrativos", p:"GJ"},
    {c:"GJ-04", n:"Grupo de Entidades Sin Animo de Lucro", p:"GJ"},
    {c:"TIC-01", n:"Despacho Secretaria TIC", p:"TIC"},
    {c:"TIC-02", n:"Dirección de Gobierno Digital", p:"TIC"},
    {c:"TIC-03", n:"Dirección de Sistemas de Información", p:"TIC"},
    {c:"TIC-04", n:"Secretaria de Tecnología de la Información y Comunicación", p:"TIC"},
    {c:"CE-01", n:"Control Interno", p:"CE"},
    {c:"GE-10", n:"Grupo Financiero", p:"GE"},
    {c:"GSS-08", n:"Grupo de Apoyo a la Gestión de Control y Calidad", p:"GSS"},
    {c:"GSS-09", n:"Grupo de Gestión de Proyectos, Planes y Programas", p:"GSS"},
    {c:"GSS-10", n:"Grupo de Laboratorio y Salud Pública", p:"GSS"},
    {c:"GSS-11", n:"Grupo de Gestión de Salud Pública", p:"GSS"},
    {c:"GSS-12", n:"Grupo Centro Reg. de Urgencias, Emergencias y Desastres CRUE", p:"GSS"},
    {c:"GSS-13", n:"Grupo de Aseguramiento y Afiliación", p:"GSS"},
    {c:"GSS-14", n:"Grupo Acreditación y Sist. Oblig. Garantía en Calidad", p:"GSS"},
    {c:"GSS-15", n:"Grupo de Participación Social en Salud", p:"GSS"},
    {c:"GSS-16", n:"Dirección de Apoyo Jurídico, Contratación y P. Sancionatorios", p:"GSS"},
    {c:"GE-11", n:"Grupo de Calidad Educativa", p:"GE"},
    {c:"GE-12", n:"Grupo de Cobertura Educativa", p:"GE"},
    {c:"GE-13", n:"Grupo de Historias Laborales", p:"GE"},
    {c:"GE-14", n:"Grupo de Carrera Docente", p:"GE"},
    {c:"GE-15", n:"Grupo de Planeación Educativa", p:"GE"},
    {c:"GE-16", n:"Grupo de Prestaciones Sociales del Magisterio", p:"GE"},
    {c:"GSS-17", n:"Grupo de Promoción y Prevención", p:"GSS"}
  ],

  /* Tipos de riesgo: campos que se activan y plantilla de redacción.
     Cambiar una plantilla aquí no requiere tocar el motor. */
  tiposRiesgo:[
    {c:"GES", n:"Riesgo de Gestión", impacto:"TABLA",
     campos:["causaRaiz","efectoInmediato","areaImpacto","factores"],
     plantilla:"Posibilidad de pérdida {areaImpacto} por {efectoInmediato} debido a {causaRaiz}"},
    {c:"SED", n:"Riesgo de Seguridad Digital", impacto:"TABLA",
     campos:["tipoActivo","activo","propiedadSD","vulnerabilidad","amenaza","factores"],
     plantilla:"{propiedadSD} de {activo} por {amenaza} debido a {vulnerabilidad}"},
    {c:"RFI", n:"Riesgo Fiscal", impacto:"TABLA",
     campos:["causaRaiz","efectoInmediato","areaFiscal","factores"],
     plantilla:"Posibilidad de efecto dañoso sobre {areaFiscal} por {efectoInmediato} debido a {causaRaiz}"},
    {c:"INT", n:"Riesgo de Integridad", impacto:"TABLA",
     campos:["causaInmediata","causaRaiz","areaIntegridad","factorLAFT","puntoRiesgo","accion"],
     plantilla:"__INTEGRIDAD__"},
    /* Tipos anteriores: se conservan para que los riesgos ya registrados
       sigan siendo legibles, pero no se ofrecen al crear uno nuevo. */
    {c:"COR", n:"Riesgo de Corrupción (anterior)", impacto:"TABLA", oculto:true,
     campos:["areaImpacto","accion","causaRaiz","factores"],
     plantilla:"Posibilidad de afectación {areaImpacto} por {accion} a causa de {causaRaiz}"},
    {c:"CI",  n:"Conflicto de Intereses (anterior)", impacto:"TABLA", oculto:true,
     campos:["areaImpacto","accion","causaRaiz","factores"],
     plantilla:"Posibilidad de afectación {areaImpacto} por conflicto de intereses en {accion} a causa de {causaRaiz}"}
  ],

  etiquetas:{
    causaRaiz:"Causa raíz", efectoInmediato:"Efecto inmediato",
    areaImpacto:"Área de impacto", areaFiscal:"Área de impacto fiscal",
    areaIntegridad:"Área de impacto", tipoActivo:"Tipo de activo",
    activo:"Nombre del activo de información", propiedadSD:"Propiedad afectada",
    vulnerabilidad:"Vulnerabilidad", amenaza:"Amenaza",
    causaInmediata:"Causa inmediata", factorLAFT:"Factor de riesgo",
    puntoRiesgo:"Punto de riesgo", accion:"Acción", factores:"Factores de riesgo"
  },

  areaImpacto:["Económica","Reputacional","Económica y reputacional"],

  /* --- Integridad pública (Guía v7, capítulo VI) --- */
  causaInmediata:[
    "Soborno Entrante","Soborno Saliente","Fraude","Corrupción",
    "Inadecuada gestión del conflicto de intereses","LA/FT/FP"],
  areaIntegridad:[
    "afectación Reputacional","afectación Económica",
    "afectación Económica y Reputacional","afectación Legal","Contagio"],
  factorLAFT:["Contrapartes","Productos","Canales","Jurisdicciones"],
  puntoRiesgo:[
    "Contratación de bienes","Contratación de servicios","Pago a contratistas",
    "Pago a proveedores","Recepción de bienes","Recepción de servicios",
    "Recaudo de ingresos","Cobro de tasas, contribuciones o derechos",
    "Administración de recursos financieros","Transferencia de recursos",
    "Otorgamiento de subsidios o incentivos","Convenios interadministrativos",
    "Convenios con entidades privadas","Administración de caja menor",
    "Manejo de anticipos","Administración de activos","Enajenación de bienes",
    "Donaciones recibidas","Donaciones entregadas","Gestión de cuentas por cobrar",
    "Gestión de cuentas por pagar","Trámites que impliquen pagos por parte de la ciudadanía",
    "Trámites que impliquen devolución de recursos","Operaciones de tesorería"],
  /* Definición que se concatena al final de la descripción, según la causa */
  definicionCausa:{
    "Fraude":"errores, omisiones, informes inexactos o descripciones incorrectas realizados con culpa o dolo para beneficio personal o de terceros",
    "Soborno Entrante":"aceptar o solicitar una ventaja indebida de cualquier valor, directa o indirectamente, e independientemente de la ubicación, en violación de la ley aplicable",
    "Soborno Saliente":"ofrecer, prometer o dar una ventaja indebida de cualquier valor, directa o indirectamente, e independientemente de la ubicación, en violación de la ley aplicable",
    "Corrupción":"desviar la gestión administrativa o los recursos públicos y privados para obtener un beneficio propio o para un tercero"
  },

  /* --- Seguridad digital: NTC-ISO/IEC 27005 --- */
  inventarioActivos:"https://santander.gov.co/publicaciones/7287/registro-de-activos-de-informacion/",
  vulnerabilidad:[
    "Almacenamiento sin protección","Áreas susceptibles a inundación",
    "Asignación errada de los derechos de acceso",
    "Ausencia de acuerdos de nivel de servicio (ANS o SLA)",
    "Ausencia de control de los activos que se encuentran fuera de las instalaciones",
    "Ausencia de documentación","Ausencia de esquemas de reemplazo periódico",
    "Ausencia de mecanismos de identificación y autenticación de usuarios",
    "Ausencia de mecanismos de monitoreo para brechas en la seguridad",
    "Ausencia de políticas de uso aceptable",
    "Ausencia de procedimiento de registro/retiro de usuarios",
    "Ausencia de procedimientos y/o de políticas en general",
    "Ausencia de proceso para supervisión de derechos de acceso",
    "Ausencia de protección en puertas o ventanas",
    "Ausencia de pruebas de envío o recepción de mensajes",
    "Ausencia de registros de auditoría","Ausencia de terminación de sesión",
    "Ausencia del personal","Ausencia o insuficiencia de pruebas de software",
    "Conexión deficiente de cableado","Contraseñas sin protección",
    "Copia no controlada","Entrenamiento insuficiente",
    "Falta de conciencia en seguridad","Falta de cuidado en la disposición final",
    "Fechas incorrectas","Interfaz de usuario compleja",
    "Líneas de comunicación sin protección","Mantenimiento insuficiente",
    "Punto único de falla","Red eléctrica inestable",
    "Sensibilidad a la radiación electromagnética","Software nuevo o inmaduro",
    "Susceptibilidad a las variaciones de temperatura (o al polvo y suciedad)",
    "Trabajo no supervisado de personal externo o de limpieza",
    "Tráfico sensible sin protección",
    "Uso inadecuado de los controles de acceso al edificio"],
  amenaza:[
    "Abuso de derechos","Agua","Congelamiento","Contaminación",
    "Copia fraudulenta del software","Corrosión","Corrupción de los datos",
    "Datos provenientes de fuentes no confiables","Destrucción de los equipos o medios",
    "Detección de la posición","Divulgación","Error en el uso","Escucha encubierta",
    "Espionaje remoto","Falla del equipo","Falla en el equipo de telecomunicaciones",
    "Falla en el sistema de suministro de agua o de aire acondicionado",
    "Falsificación de derechos","Fenómenos climáticos","Fenómenos meteorológicos",
    "Fenómenos sísmicos","Fenómenos volcánicos","Fuego","Hurto de equipo",
    "Hurto de medios o documentos","Incumplimiento de la disponibilidad de personal",
    "Incumplimiento en el mantenimiento del sistema de información",
    "Interceptación de señales de interferencia comprometida","Inundación",
    "Mal funcionamiento del equipo","Mal funcionamiento del software",
    "Manipulación con hardware","Manipulación con software","Negación de acciones",
    "Pérdida de suministro de energía","Polvo","Procesamiento ilegal de los datos",
    "Radiación electromagnética, radiación térmica, impulsos electromagnéticos",
    "Recuperación de medios reciclados o desechados",
    "Saturación del sistema de información","Uso de software falso o copiado",
    "Uso no autorizado del equipo"],
  areaFiscal:["Bienes públicos","Recursos públicos","Intereses patrimoniales de naturaleza pública"],
  propiedadSD:["Pérdida de la confidencialidad","Pérdida de la integridad","Pérdida de la disponibilidad"],
  tipoActivo:["Información","Software","Hardware","Servicios","Intangibles","Componentes de red","Personas","Instalaciones"],

  claseRiesgo:["Ejecución y administración de procesos","Fraude externo","Fraude interno",
    "Fallas tecnológicas","Relaciones laborales","Usuarios, productos y prácticas",
    "Daños a activos fijos / Eventos externos"],

  factores:["Ejecución y administración de procesos","Transacción u Operación","Talento humano",
    "Tecnología","Infraestructura","Evento externo"],

  /* Tabla 4 — probabilidad por frecuencia de la actividad */
  probabilidad:[
    {n:"Muy Baja", pct:0.2, min:0,    max:2,    d:"Máximo 2 veces por año"},
    {n:"Baja",     pct:0.4, min:3,    max:24,   d:"De 3 a 24 veces por año"},
    {n:"Media",    pct:0.6, min:25,   max:500,  d:"De 25 a 500 veces por año"},
    {n:"Alta",     pct:0.8, min:501,  max:5000, d:"Más de 500 y hasta 5.000 veces por año"},
    {n:"Muy Alta", pct:1.0, min:5001, max:null, d:"Más de 5.000 veces por año"}
  ],

  /* Tabla 5 — impacto económico y reputacional */
  impacto:[
    {n:"Leve",        pct:0.2, eco:"Menor a 10 SMLMV",        rep:"Afecta la imagen de algún área"},
    {n:"Menor",       pct:0.4, eco:"Entre 10 y 50 SMLMV",     rep:"Afecta la imagen a nivel interno"},
    {n:"Moderado",    pct:0.6, eco:"Entre 50 y 100 SMLMV",    rep:"Afecta la imagen ante usuarios de relevancia"},
    {n:"Mayor",       pct:0.8, eco:"Entre 100 y 500 SMLMV",   rep:"Efecto publicitario a nivel sectorial o departamental"},
    {n:"Catastrófico",pct:1.0, eco:"Mayor a 500 SMLMV",       rep:"Efecto publicitario sostenido a nivel país"}
  ],

  /* Figura 18 — matriz de severidad inherente. Clave "prob|imp" */
  matrizInherente:{
    "0.2|1":"Extremo","0.4|1":"Extremo","0.6|1":"Extremo","0.8|1":"Extremo","1|1":"Extremo",
    "0.2|0.8":"Alto","0.4|0.8":"Alto","0.6|0.8":"Alto","0.8|0.8":"Alto","1|0.8":"Alto",
    "0.2|0.6":"Moderado","0.4|0.6":"Moderado","0.6|0.6":"Moderado","0.8|0.6":"Alto","1|0.6":"Alto",
    "0.2|0.4":"Bajo","0.4|0.4":"Moderado","0.6|0.4":"Moderado","0.8|0.4":"Moderado","1|0.4":"Alto",
    "0.2|0.2":"Bajo","0.4|0.2":"Bajo","0.6|0.2":"Moderado","0.8|0.2":"Moderado","1|0.2":"Alto"
  },

  /* Matriz residual: rangos continuos, evaluados por prioridad */
  matrizResidual:[
    {iMin:.80,iMax:1.00,pMin:0,  pMax:1.00,z:"Extremo"},
    {iMin:.60,iMax:.80, pMin:0,  pMax:1.00,z:"Alto"},
    {iMin:0,  iMax:.80, pMin:.80,pMax:1.00,z:"Alto"},
    {iMin:.40,iMax:.60, pMin:.60,pMax:.80, z:"Alto"},
    {iMin:.40,iMax:.60, pMin:0,  pMax:.60, z:"Moderado"},
    {iMin:.20,iMax:.40, pMin:.20,pMax:.80, z:"Moderado"},
    {iMin:0,  iMax:.20, pMin:.40,pMax:.80, z:"Moderado"},
    {iMin:.20,iMax:.40, pMin:0,  pMax:.20, z:"Bajo"},
    {iMin:0,  iMax:.20, pMin:0,  pMax:.40, z:"Bajo"}
  ],

  /* Tabla 6 — pesos de control */
  pesoControl:{
    tipo:{Preventivo:.25, Detectivo:.15, Correctivo:.10},
    implementacion:{"Automático":.25, Manual:.15}
  },
  formalizacion:{
    documentacion:["Procedimientos","Sistemas de información","Otros esquemas"],
    frecuencia:["Siempre que se ejecuta la actividad","Periódicamente"],
    evidencia:["Con registro manual","Con registro electrónico"],
    ejecucion:["Interna","Externa","Mixta"]
  },

  /* Opciones de tratamiento con sus reglas declarativas */
  tratamiento:[
    {c:"Reducir",  exigePlan:true,  exigeSub:false, zonas:null, excluye:[]},
    {c:"Compartir",exigePlan:false, exigeSub:false, zonas:null, excluye:[]},
    {c:"Aceptar",  exigePlan:false, exigeSub:false, zonas:["Bajo","Moderado"], excluye:["INT","COR","CI"]},
    {c:"Evitar",   exigePlan:false, exigeSub:true,  zonas:null, excluye:[]}
  ],
  subestrategia:["Transferir","Mitigar","Cesar la actividad"],

  /* Evaluación del diseño del control (7 criterios que suman 100%) */
  evaluacionControl:[
    {c:"asignacion", n:"Asignación del responsable", op:[
      ["Asignado", .15], ["No asignado", 0]]},
    {c:"segregacion", n:"Segregación y autoridad del responsable", op:[
      ["Adecuado", .15], ["Inadecuado", 0]]},
    {c:"periodicidad", n:"Periodicidad", op:[
      ["Oportuna", .15], ["Inoportuna", 0]]},
    {c:"proposito", n:"Propósito", op:[
      ["Prevenir", .15], ["Detectar", .10], ["No es un control", 0]]},
    {c:"efecto", n:"Efecto en el nivel de riesgo", op:[
      ["Confiable", .15], ["No es un control", 0]]},
    {c:"desviaciones", n:"¿Las desviaciones se investigan y resuelven oportunamente?", op:[
      ["Se investigan y resuelven oportunamente", .15],
      ["No se investigan y resuelven oportunamente", 0]]},
    {c:"evidencia", n:"Evidencia de la ejecución del control", op:[
      ["Completa", .10], ["Incompleta", .05], ["No existe", 0]]}
  ],
  rangoDiseno:[
    {min:.96, max:1.00, n:"Fuerte"},
    {min:.86, max:.95,  n:"Moderado"},
    {min:0,   max:.85,  n:"Débil"}
  ],

  estadoAccion:["Cerrada","En Curso","Vencida"],
  siNo:["Si","No"],
  instancias:["SIG","Hacienda","TICS","Control Interno"],

  /* Ayudas didácticas: ejemplo y guía por campo del formulario */
  ayuda:{
    causaRaiz:{
      q:"¿Por qué puede ocurrir? Es la falla de fondo que los controles deben atacar.",
      ej:"la inexistencia de un procedimiento documentado para la verificación de soportes"},
    efectoInmediato:{
      q:"¿Qué pasa justo antes de que se materialice? Es el hecho concreto que desencadena.",
      ej:"la aprobación de pagos sin verificación previa de los soportes contractuales"},
    areaImpacto:{
      q:"Sobre qué recae el daño: el patrimonio, la imagen institucional, o ambos.",
      ej:""},
    accion:{
      q:"La conducta concreta que haría un servidor para materializar el riesgo.",
      ej:"favorecer a un proponente entregándole información privilegiada del proceso"},
    activo:{
      q:"Nombre exacto del activo como aparece en el inventario de información.",
      ej:"Base de datos del Sistema de Información de Hacienda"},
    frecuencia:{
      q:"Cuántas veces al año se pasa por el punto de riesgo. No es cuántas veces ha ocurrido: es la exposición.",
      ej:"Si se tramitan 40 contratos al año, escriba 40"},
    controlResponsable:{
      q:"Quién ejecuta el control. Siempre un cargo, nunca un nombre propio.",
      ej:"El profesional universitario de la Dirección de Contabilidad"},
    controlAccion:{
      q:"Qué hace. Verbo en presente, tercera persona.",
      ej:"verifica y aprueba"},
    controlComplemento:{
      q:"Sobre qué y con qué periodicidad, más qué pasa con las desviaciones.",
      ej:"mensualmente las conciliaciones bancarias contra el extracto; las diferencias se documentan en acta"},
    planAccion:{
      q:"Actividades concretas y verificables, no intenciones.",
      ej:"Documentar el procedimiento de verificación de soportes y socializarlo con los seis profesionales del área"},
    causaInmediata:{
      q:"Amenaza concreta contra la integridad pública que daría origen al riesgo.", ej:""},
    areaIntegridad:{
      q:"Sobre qué recae la afectación. Todas deben poder traducirse a un efecto económico para aplicar la tabla de impacto.", ej:""},
    factorLAFT:{
      q:"Factor generador propio de LA/FT/FP. Obliga a segmentar y definir señales de alerta.", ej:""},
    puntoRiesgo:{
      q:"Operación de la entidad donde se intercambian recursos y podría materializarse el riesgo.", ej:""},
    vulnerabilidad:{
      q:"Debilidad del activo que una amenaza podría aprovechar.", ej:""},
    amenaza:{
      q:"Causa potencial de un incidente que puede afectar al activo.", ej:""},
    controlPeriodicidad:{q:"Cada cuánto se ejecuta el control.", ej:""},
    kriNombre:{q:"El nombre debe describir lo que se mide.",
      ej:"Oportunidad en la verificación de soportes de pago"},
    kriDescripcion:{q:"Describir lo que se va a medir.", ej:""},
    kriObjetivo:{q:"Describir para qué se mide el indicador.", ej:""},
    kriNumerador:{q:"", ej:"Número de pagos con soporte verificado"},
    kriDenominador:{q:"", ej:"Número total de pagos del periodo"},
    kriUbicacion:{q:"Incorpore la serie y subserie o el enlace de acceso al documento.", ej:""},
    planActividad:{q:"Describir las actividades a desarrollar para implementar un nuevo control, iniciando por un verbo en infinitivo.",
      ej:"Documentar el procedimiento de verificación de soportes"},
    planResponsable:{q:"Debe corresponder a un cargo perteneciente al área.", ej:""},
    kri:{
      q:"Una fórmula que se pueda medir cada trimestre.",
      ej:"(Nº de pagos con soporte verificado / Nº total de pagos del periodo) × 100"}
  },

  /* Periodicidad de ejecución del control */
  periodicidad:["Diariamente","Semanalmente","Quincenalmente","Mensualmente",
    "Bimensualmente","Trimestralmente","Cuatrimestralmente","Semestralmente",
    "Anualmente","Cuando se materialice el riesgo"],

  /* Frecuencia de medición del indicador (sin la última opción) */
  frecuenciaMedicion:["Diariamente","Semanalmente","Quincenalmente","Mensualmente",
    "Bimensualmente","Trimestralmente","Cuatrimestralmente","Semestralmente","Anualmente"],

  unidadMedida:["Número","Porcentaje"],
  disponibilidadFuente:["Físico","Digital"],
  tendenciaKRI:["Creciente","Decreciente"],

  /* Apetito de riesgo institucional: qué tratamiento procede según la
     zona residual. Parametrizado: si cambia la política, se edita aquí. */
  apetito:[
    {zonas:["Alto","Extremo"], nivel:"Muy Bajo",
     descripcion:"La entidad no está dispuesta a aceptar este nivel de riesgo.",
     accion:"Evitar o reducir inmediatamente.",
     aceptable:false, requiereTratamiento:true,
     opciones:["Reducir","Compartir","Evitar"]},
    {zonas:["Moderado"], nivel:"Bajo",
     descripcion:"Se acepta únicamente con controles efectivos y seguimiento permanente.",
     accion:"Reducir y monitorear.",
     aceptable:false, requiereTratamiento:true,
     opciones:["Aceptar","Reducir","Compartir","Evitar"]},
    {zonas:["Bajo"], nivel:"Moderado",
     descripcion:"Puede aceptarse cuando el beneficio institucional lo justifique y existan controles adecuados.",
     accion:"Monitorear periódicamente.",
     aceptable:true, requiereTratamiento:false,
     opciones:["Aceptar"]}
  ],

  /* Carpetas de evidencia en SharePoint institucional.
     El archivo de origen trae la misma dirección para las 102 dependencias,
     así que aquí queda una general. Cuando SIG cree una carpeta por
     dependencia, se agregan en porDependencia y el sistema las prefiere. */
  evidencias:{
    general:{
      control:"https://santandergov-my.sharepoint.com/:f:/g/personal/sig_santander_gov_co/IgCShXDHBUw5TLMevqlCCdqVAVeQ6KNlhL70ARLuPnfY-nQ?e=KRis5r",
      plan:"https://santandergov-my.sharepoint.com/:f:/g/personal/sig_santander_gov_co/IgDp06gfiCpETKysPwd96x7gAY1Wy0Ju5T2mQ74sAI33Z7Q?e=z7wmlF"
    },
    porDependencia:{}
  },

  /* Autodiagnóstico de madurez del Sistema Integral de Administración del
     Riesgo. Estructura COSO ERM adaptada por Función Pública: cinco
     componentes, veinte principios y setenta y siete puntos de reflexión. */
  madurezGrados:[
    {v:1, n:"Nunca"}, {v:2, n:"Raramente"}, {v:3, n:"A veces"},
    {v:4, n:"Frecuentemente"}, {v:5, n:"Siempre"}
  ],
  madurezNiveles:[
    {hasta:2, n:"Inicial",     z:"Extremo",  d:"La gestión del riesgo es informal y reactiva."},
    {hasta:3, n:"Repetible",   z:"Alto",     d:"Existen prácticas, pero dependen de las personas."},
    {hasta:4, n:"Definido",    z:"Moderado", d:"Los procesos están documentados y se aplican."},
    {hasta:5, n:"Administrado",z:"Bajo",     d:"Se mide, se monitorea y se toman decisiones con la información."},
    {hasta:99,n:"Optimizado",  z:"Bajo",     d:"La gestión del riesgo se mejora de forma continua."}
  ],
  madurez:[
  {
    "c": "1",
    "n": "1. Gobierno y Cultura",
    "peso": 0.35,
    "principios": [
      {
        "n": "1. Supervisión de Riesgos a través del Comité Institucional de Coordinación de Control Interno",
        "puntos": [
          "1.1. El Reglamento del Comité Institucional de Coordinación de Control Interno o instancia equivalente establece sus competencias en materia de supervisión de gestión de riesgos, de acuerdo al esquema de líneas?",
          "1.2. Los miembros del Comité Institucional de Coordinación de Control Interno o instancia equivalente realizan por lo menos dos veces al año supervisión sobre la efectividad de la gestión de riesgos?",
          "1.3. Existe una Política de Administración de Riesgos aprobada por el Comité Institucional de Coordinación de Control Interno, donde se establecen los principales roles, responsabilidades y competencias?",
          "1.4. La Política de Administración de Riesgos es consistente con otros marcos relacionados (v.g.; seguridad, calidad, financiero, seguridad pacviente, asistenciales, etc.) ?"
        ]
      },
      {
        "n": "2. Establece Estructuras Operativas",
        "puntos": [
          "2.1. El marco de gestión de riesgos definido a traves de la Politica de Administración de Riesgos ha sido ampliamente comunicado a través de la organización",
          "2.2. Están claramente establecidos los flujos de aprobación y reporte en la gestión de riesgos?",
          "2.3. Están claramente identificados las instancias de 1a., 2a y 3a Línea de Defensa en las principales áreas de la entidad?",
          "2.4. Están claramente identificados los aspectos claves de exitos de 2a Línea, sus funciones de aseguramiento y su nivel de confianza?",
          "2.5. Los responsables de riesgos de los procesos/planes/programas/proyectos rinden informes al Comité Institucional de Coordinación de Control Interno o instancia equivalente sobre el cumplimiento de los objetivos basados en los niveles de exposición a riesgos?"
        ]
      },
      {
        "n": "3. Define la Cultura Deseada",
        "puntos": [
          "3.1. ¿Se evidencia una cultura orientada a la gestión preventiva del riesgo, promovida desde la Alta Dirección?",
          "3.2. ¿El riesgo se analiza antes de haber establecido las estrategias o realizado la planificación institucional?",
          "3.3. ¿Los objetivos de las procesos o de los planes, programas proyectos generan incentivos o presiones que favorecen un comportamiento contrario a los valores del Código de Integridad?",
          "3.4. La Política de Administración de Riesgos refleja los principios de comportamiento esperados, conforme a lo previsto en el Código de Integridad de la organización?"
        ]
      },
      {
        "n": "4. Demuestra Compromiso con los Valores del Servicio Público",
        "puntos": [
          "4.1. Se ponen a disposición de los grupos de valor, tanto interno como externo, los valores de la entidad y los diferentes mecanismos utilizados para garantizar su apropiación por parte de los servidores y contratistas?",
          "4.2. Demuestra la Alta Dirección con su comportamiento su compromiso con los valores del servicio público (tone at the top)?",
          "4.3. Demuestra la Alta Dirección con su comportamiento su compromiso con la gestión del riesgo institucional (tone at the top)?",
          "4.4. Los miembros del Comité Institucional de Coordinación de Control Interno o instancia equivalente promueven activamente la cultura de gestión de riesgos entre el personal operativo?",
          "4.5. El proceso de inducción de nuevos servidores incorpora contenidos orientadores sobre la gestión preventiva de riesgos?",
          "4.6. Se realizan mediciones / evaluaciones sobre el nivel de cultura de riesgos entre los empleados de forma regular?"
        ]
      },
      {
        "n": "5. Atrae, Desarrolla, y Retiene a Profesionales Capacitados",
        "puntos": [
          "5.1. El personal de segunda línea respecto de la gestión de riesgos dispone de las competencias, habilidades y conocimiento necesario para realizar sus tareas?",
          "5.2. Los objetivos del proceso encargado de liderar la gestión de riesgos en la entidad están alineados con los de la Guía para la Administración del Riesgo y el diseño de controles en entidades públicas?",
          "5.3. Existe un plan de gestión del conocimiento para los puestos clave de gestión de riesgos?"
        ]
      }
    ]
  },
  {
    "c": "2",
    "n": "2. Estrategia y Definición de Objetivos",
    "peso": 0.2,
    "principios": [
      {
        "n": "6. Analiza el Contexto Sectorial/Territorial e Institucional",
        "puntos": [
          "6.1. ¿La entidad ha identificado y definido su contexto externo y la alineación con el plan estrategico sectorial (nación)/plan de desarrollo municipal, distrital o departamenmtal (territorio)?",
          "6.2. ¿La entidad ha formulado un Plan estratégico institucional aprobado por la Alta Dirección?",
          "6.3. La Politica de Administración de Riesgos incorpora el análisis de los factores internos y externos que puedan repercutir sobre los objetivos institucionales (estratégicos, de operaciones, etc.)?",
          "6.4. Se analiza de forma sistemática la información externa para identificar los cambios relevantes en el contexto de la entidad e identificar riesgos emergentes?",
          "6.5. Se analiza de forma sistemática la información interna para identificar los cambios relevantes en el contexto de la entidad e identificar riesgos emergentes?"
        ]
      },
      {
        "n": "7. Define el Apetito al Riesgo",
        "puntos": [
          "7.1. Existe una \"declaración del apetito al riesgo” adecuadamente formalizada?",
          "7.2. Es competencia exclusiva del Comité Institucional de Coordinación de Control Interno o instancia equivalente para la gestión integral del riesgo la definición del apetito al riesgo?",
          "7.3. Se promueve activamente que la Alta Dirección y las instancias clave de 2a línea conozcan el apetito al riesgo de la organización?",
          "7.4. El apetito al riesgo es considerado en los procesos de toma de decisiones?",
          "7.5. Se involucra al Comité Institucional de Coordinación de Control Interno o instancia equivalente en la toma de decisiones que pudieran implicar incumplir con el apetito al riesgo establecido?",
          "7.6. Se monitoriza activamente el cumplimiento con el apetito al riesgo en todos los procesos?"
        ]
      },
      {
        "n": "8. Evalúa Estrategias Alternativas",
        "puntos": [
          "7.1. La estrategia de la entidad está alineada con su misión, visión y valores?",
          "7.2. En el proceso de planeación estratégica, se analizan los riesgos y oportunidades aplicando metodologías que permitan contar con datos e información para su mejora?",
          "7.3. Participan sistemáticamente las instancias clave en la gestión del riesgo en el proceso de planeación estratégica (instancias de 2a línea identificados y la 3a línea?"
        ]
      },
      {
        "n": "9. Formula Objetivos Estrategicos y Operacionales",
        "puntos": [
          "8.2. La entidad ha definido objetivos estrategicos?",
          "8.2. Los objetivos estratégicos son desarrollados en objetivos de procesos/planes/programas/proyectos, etc.?",
          "8.2. Los objetivos tanto estratégicos como operacionales son especificos, medibles, observables, alcanzables y relevantes?"
        ]
      }
    ]
  },
  {
    "c": "3",
    "n": "3. Desempeño",
    "peso": 0.15,
    "principios": [
      {
        "n": "9. Identifica y describe el Riesgo",
        "puntos": [
          "9.1. Existen procesos para identificar sistemáticamente los riesgos (en todas sus tipologías) que repercuten en la consecución de los objetivos estratégicos y de procesos/planes/programas/proyectos?",
          "9.2. Se evalúa la identificación de los riesgos (en todas sus tipologías) al menos con carácter anual a fin de identificar posible sub o sobre identificación?",
          "9.3. Se utiliza la taxonomía de riesgos de la Guía para la Administración del Riesgo y el diseño de controles en entidades públicas para catalogar los riesgos por tipología?",
          "9.4. Para la identificación y descripción de los riesgos (en todas sus tipologías) se realiza el análisis de los factores de riesgo?",
          "9.5. Para la identificación y decsripción de los riesgos (en todas sus tipologías) se realiza el análisis de los puntos de riesgo?",
          "9.6. La descripción de los riesgos (en todas sus tipologías) se realiza conforme las estructuras definidas en la Guía para la Administración del Riesgo y el diseño de controles en entidades públicas para cada de estas."
        ]
      },
      {
        "n": "10. Evalúa el Riesgo Inherente",
        "puntos": [
          "10.1. Se evalúa la probabilidad e impacto de los riesgos identificados (en todas sus tipologías) con base a las escalas y niveles definidos en la Guía para la Administración del Riesgo y el diseño de controles en entidades públicas para cada una de las tipologías?",
          "10.2. Se cuantifica el impacto económico de los riesgos sobre los que se ha identificado un potencial de afectación economica?",
          "10.3. Se considera el impacto reputacional de los riesgos sobre los que se ha identificado un potencial de afectación reputacional?",
          "Se realiza el análisis de severidad del inherente en el mapa de calor?"
        ]
      },
      {
        "n": "11. Diseña Controles efectivos",
        "puntos": [
          "11.1. En la descripción de los controles se muestra el cargo del servidor que ejecuta el control, en caso se ser controles automáticos se muestra el sistema que realiza la actividad?",
          "11.2. En la descripción de los controles se muestra el verbo en el cual se identifica la acción de control a realizar como parte del control (verificar, validar, cotejar, comparar)?",
          "11.3. En la descripción de los controles se muestra la frecuencia (semanal, mensual, bimestral, trimetsral, semestral o a demanda) de ejecución del control?",
          "11.4. En la descripción de los controles se muestra el objetivo de la ejecución de este?",
          "11.5. En la descripción de los controles se definen las fuentes de información (confiables) para la ejecución de este?",
          "11.6. En la descripción de los controles se muestra la evidencia que permita realizar la trazabilidad a la ejecución de este?",
          "11.7. Los controles se encuentran documentados en un procedimiento, manual, guía o instructivo que garantice su operativización?"
        ]
      },
      {
        "n": "12. Prioriza Riesgos",
        "puntos": [
          "12.1. Los riesgos se priorizan con base a su probabilidad e impacto residual?",
          "12.2. Los riesgos se representan en un mapa de riesgos y de matriz de calor que facilita su priorización?",
          "12.3. Se asigna un área, personal responsable y fechas de ejecución para monitorear los riesgos críticos identificados?"
        ]
      },
      {
        "n": "13. Desarrolla una visión integral",
        "puntos": [
          "13.1. Existe un registro/inventario de riesgos centralizado a nivel de proceso, plan, programa, proyecto?",
          "13.2. Se analizan las posibles interdependencias entre los riesgos identificados en cada proceso, plan, programa, proyectos para obtener una visión integral de la operación y la gestión del riesgo?",
          "13.3. Existe un registro/ inventario de riesgos centralizado para un análisis integral sobre la efectividad de la gestión del riesgo?"
        ]
      }
    ]
  },
  {
    "c": "4",
    "n": "4. Análisis y Monitorización",
    "peso": 0.15,
    "principios": [
      {
        "n": "14. Evalúa los Cambios Significativos",
        "puntos": [
          "14.1. Existe un proceso o esquema que permita monitorear periódicamente los cambios del contexto institucional (i.e.; los factores internos y externos) con posible impacto en la consecución de los objetivos?",
          "14.2. Se actualiza periódicamente el registro/inventario de riesgos de la organización, incorporando temas emergentes o cambios en el contexto institucional?",
          "14.3. El Comité Institucional de Coordinación de Control Interno evalúa por lo menos una (1) vez al año la Politica de Administración de Riesgos respecto de: 1. La adecuación de esta con los requerimientos técnicos, 2. la adecuada operativización de esta a través de las primeras líneas de defensa considerando las disposiciones de esta."
        ]
      },
      {
        "n": "15. Revisa el Riesgo y el Desempeño",
        "puntos": [
          "15.1. La organización realiza un seguimiento periódico del grado de desempeño para los principales objetivos establecidos",
          "15.2. Se utilizan métricas de monitorización del riesgo (Key Risk Indicators o KRIs) para alertar respecto de riesgos crecientes o emergentes ?"
        ]
      },
      {
        "n": "16. Persigue la Mejora de la Gestión del Riesgo",
        "puntos": [
          "16.1. La organización revisa la idoneidad y actualiza su Politica de Administración de Riesgos periódicamente ?",
          "16.2. Se han implantado mejoras significativas en el proceso de gestión de riesgos en el último año?"
        ]
      }
    ]
  },
  {
    "c": "5",
    "n": "5. Información, comunicación y reporte",
    "peso": 0.15,
    "principios": [
      {
        "n": "17. Aprovecha la Información y la Tecnología",
        "puntos": [
          "17.1. Los miembros del Comité Institucional de Coordinación de Control Interno o instancia esquivalente tienen acceso directo a la Información de riesgos que necesitan para cumplir con sus responsabilidades de supervisión",
          "17.2. Se dispone de una herramienta informática o algún otro mecanismo que centralice la gestión del riesgo?",
          "17.3. Las instancias de 1a. y 2a. Línea de Defensa tienen acceso directo a la herramienta para la carga, análisis y reporte de los riesgos bajo su responsabilidad?"
        ]
      },
      {
        "n": "18. Comunica Información sobre Riesgos",
        "puntos": [
          "18.1. Están claramente establecidos los flujos de aprobación y reporte de la información en materia de riesgos?"
        ]
      },
      {
        "n": "19. Informa sobre el Riesgo, la Cultura y el Desempeño",
        "puntos": [
          "19.1. Existen procesos de reporte estandarizado a los diferentes niveles organizacionales?",
          "19.2. Se generan reportes cualitativos (tendencia histórica, perspectiva futura, nivel de aseguramiento, etc.) como cuantitativos (nivel de exposición, nivel máximo, etc.) de los principales riesgos?",
          "19.3. Se reportan los riesgos materializados y su impacto real sobre los objetivos de la entidad?",
          "19.4. Se reporta sobre la cultura de riesgos?"
        ]
      }
    ]
  }
],

  roles:[
    {c:"ADMIN",       n:"Administrador",     d:"Acceso total, sin restricción de ventana"},
    {c:"ENLACE_SIG",  n:"Enlace SIG",        d:"Crea, edita y elimina riesgos de los procesos a su cargo, solo dentro de ventana"},
    {c:"MONITOREO",   n:"Monitoreo calidad", d:"Registra el monitoreo trimestral de los procesos a su cargo"},
    {c:"SEGUIMIENTO", n:"Control Interno",   d:"Consulta el mapa de riesgos y descarga los informes en PDF y Excel"},
    {c:"PUBLICO",     n:"Consulta pública",  d:"Consulta sin autenticación y descarga en PDF"}
  ]
};
