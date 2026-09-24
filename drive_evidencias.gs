/**
 * RECEPTOR DE EVIDENCIAS DEL MAPA DE RIESGOS
 * Gobernación de Santander — Guía de Gestión Integral del Riesgo v7
 *
 * Recibe los archivos que cargan los enlaces SIG desde el aplicativo y los
 * guarda en el Drive institucional, en la carpeta del año y el trimestre que
 * corresponda, con el nombre PROCESO-DEPENDENCIA-CODIGORIESGO.extension
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CÓMO PUBLICARLO  (una sola vez)
 *
 *  1. Entra a https://script.google.com con la cuenta institucional.
 *  2. Nuevo proyecto. Borra lo que traiga y pega este archivo completo.
 *  3. Ejecuta la función crearEstructura. Google pedirá autorización para
 *     acceder a TU Drive: acéptala. El aplicativo nunca recibe tus claves.
 *  4. Botón Implementar → Nueva implementación.
 *       Tipo:               Aplicación web
 *       Ejecutar como:      Yo
 *       Quién tiene acceso: Cualquier persona
 *  5. Copia la dirección que termina en /exec
 *  6. En el aplicativo, entra como administrador a Metodología y pégala en
 *     «Carpeta de evidencias en Drive». Usa «Probar conexión» para verificar.
 *
 * SOBRE LA OPCIÓN «Cualquier persona»
 *   Es necesaria porque el aplicativo es una página estática sin sesión de
 *   Google. El script solo escribe dentro de la carpeta Riesgos y nunca lee
 *   ni lista otros archivos del Drive. Aun así, quien conozca la dirección
 *   podría subir archivos: por eso conviene definir el TOKEN de abajo cuando
 *   el sistema pase a producción.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------- ajustes
var RAIZ = 'Riesgos';
var ANIO_INICIAL = new Date().getFullYear();
var ANIOS = 3;
var TRIMESTRES = ['T1', 'T2', 'T3', 'T4'];
var MAX_MB = 20;

// Deje '' para no exigir token durante las pruebas.
var TOKEN = '';

var EXT_PERMITIDAS = ['pdf','doc','docx','xls','xlsx','ppt','pptx',
                      'jpg','jpeg','png','gif','zip','txt','csv'];


/** Recibe las cargas del aplicativo. */
function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);

    if (datos.ping) {
      var raiz = carpeta_(DriveApp.getRootFolder(), RAIZ);
      return json_({ ok: true, carpeta: RAIZ, id: raiz.getId() });
    }

    if (TOKEN && datos.token !== TOKEN) {
      return json_({ error: 'Token inválido' });
    }

    var faltan = ['periodo','proceso','codigoRiesgo','nombreOriginal','contenido']
      .filter(function (k) { return !datos[k]; });
    if (faltan.length) {
      return json_({ error: 'Faltan datos: ' + faltan.join(', ') });
    }

    var ext = String(datos.nombreOriginal).split('.').pop().toLowerCase();
    if (EXT_PERMITIDAS.indexOf(ext) === -1) {
      return json_({ error: 'Tipo de archivo no permitido: .' + ext });
    }

    var bytes = Utilities.base64Decode(datos.contenido);
    if (bytes.length > MAX_MB * 1024 * 1024) {
      return json_({ error: 'El archivo supera los ' + MAX_MB + ' MB' });
    }

    var p = String(datos.periodo).split('-');   // AAAA-Tn
    if (p.length !== 2 || TRIMESTRES.indexOf(p[1]) === -1) {
      return json_({ error: 'Periodo inválido: se espera AAAA-Tn' });
    }

    var destino = carpeta_(carpeta_(carpeta_(DriveApp.getRootFolder(), RAIZ), p[0]), p[1]);
    var nombre = sinColision_(destino,
      nombreArchivo(datos.proceso, datos.dependencia, datos.codigoRiesgo, ext), ext);

    var blob = Utilities.newBlob(bytes, datos.mime || 'application/octet-stream', nombre);
    var archivo = destino.createFile(blob);
    archivo.setDescription(
      'Riesgo: ' + datos.codigoRiesgo +
      ' | Periodo: ' + datos.periodo +
      ' | Tipo: ' + (datos.tipo || 'SOPORTE') +
      ' | Original: ' + datos.nombreOriginal +
      ' | Cargado: ' + new Date().toISOString());

    return json_({
      ok: true,
      id: archivo.getId(),
      nombre: archivo.getName(),
      enlace: archivo.getUrl(),
      carpeta: RAIZ + '/' + p[0] + '/' + p[1]
    });

  } catch (err) {
    return json_({ error: String(err && err.message ? err.message : err) });
  }
}


/** Permite comprobar desde el navegador que el script está publicado. */
function doGet() {
  return json_({ ok: true, servicio: 'Evidencias mapa de riesgos', raiz: RAIZ });
}


/** Crea la estructura de carpetas por año y trimestre. Ejecútela una vez. */
function crearEstructura() {
  var raiz = carpeta_(DriveApp.getRootFolder(), RAIZ);
  Logger.log('Carpeta raíz: %s', raiz.getId());
  Logger.log('Enlace: %s', raiz.getUrl());
  for (var i = 0; i < ANIOS; i++) {
    var anio = carpeta_(raiz, String(ANIO_INICIAL + i));
    for (var t = 0; t < TRIMESTRES.length; t++) carpeta_(anio, TRIMESTRES[t]);
    Logger.log('  %s con sus cuatro trimestres', anio.getName());
  }
  return raiz.getId();
}


/** PROCESO-DEPENDENCIA-CODIGORIESGO.extension */
function nombreArchivo(proceso, dependencia, codigoRiesgo, extension) {
  return [proceso, dependencia, codigoRiesgo]
    .filter(function (x) { return x; })
    .map(function (x) { return String(x).replace(/\s+/g, ''); })
    .join('-') + '.' + String(extension).toLowerCase();
}


/** Inventario de lo guardado, para auditoría y control de cuota. */
function inventario() {
  var raiz = carpeta_(DriveApp.getRootFolder(), RAIZ);
  var total = 0, bytes = 0, anios = raiz.getFolders();
  while (anios.hasNext()) {
    var anio = anios.next(), tris = anio.getFolders();
    while (tris.hasNext()) {
      var tri = tris.next(), n = 0, b = 0, fs = tri.getFiles();
      while (fs.hasNext()) { var f = fs.next(); n++; b += f.getSize(); }
      if (n) Logger.log('%s/%s: %s archivos, %s MB',
        anio.getName(), tri.getName(), n, (b / 1048576).toFixed(2));
      total += n; bytes += b;
    }
  }
  Logger.log('TOTAL: %s archivos, %s MB', total, (bytes / 1048576).toFixed(2));
}


// ------------------------------------------------- utilidades internas
function carpeta_(padre, nombre) {
  var it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}

/** Si el nombre ya existe, versiona en lugar de sobrescribir. */
function sinColision_(carpeta, nombre, ext) {
  if (!carpeta.getFilesByName(nombre).hasNext()) return nombre;
  var base = nombre.replace(/\.[^.]+$/, ''), v = 2;
  while (carpeta.getFilesByName(base + '-v' + v + '.' + ext).hasNext()) v++;
  return base + '-v' + v + '.' + ext;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
