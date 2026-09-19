# Mapa de Riesgos Institucional — prototipo de pruebas

Prototipo del sistema de gestión del riesgo bajo la Guía para la Gestión
Integral del Riesgo versión 7, cargado con los 235 riesgos y 570 controles
del consolidado ES-SIG-RG-166 V4.

## Contenido

| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación completa. Un solo archivo, sin dependencias. |
| `datos.json` | Los 235 riesgos migrados. Se carga en el primer arranque. |
| `migrar.py` | Script que generó `datos.json` a partir del Excel. |
| `informe_migracion.txt` | Resultado de la validación del motor de cálculo. |

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub. Puede ser privado al principio;
   GitHub Pages en repositorios privados requiere cuenta de pago, así que
   para las pruebas conviene público, sin datos sensibles.

2. Sube los cuatro archivos a la raíz del repositorio. Desde la web:
   **Add file → Upload files**, arrastra todo y confirma.

3. Ve a **Settings → Pages**. En *Source* elige **Deploy from a branch**,
   rama `main` y carpeta `/ (root)`. Guarda.

4. Espera un minuto. La dirección queda en
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`

Con eso ya tienes una URL que puedes pasarle a SIG para que prueben.

## Cómo funciona el almacenamiento

El prototipo no tiene servidor. Guarda todo en el `localStorage` del
navegador de cada persona. Eso significa:

- Cada quien ve su propia copia. Si un enlace crea un riesgo, nadie más lo ve.
- Borrar los datos del navegador borra todo.
- Es suficiente para **probar el flujo**, no para operar.

Para reiniciar y volver a cargar los 235 riesgos originales, abre la consola
del navegador (F12) y ejecuta:

```js
localStorage.removeItem("mriesgos"); location.reload();
```

Cuando se conecte el backend, la capa `Store` del código es lo único que
cambia: hoy resuelve contra `localStorage`, mañana contra la base de datos.

## Qué probar

**El cálculo.** Abre cualquier riesgo migrado y revisa la sección «Cálculo del
residual». Debe coincidir con lo que muestra el Excel. La validación completa
está en `informe_migracion.txt`.

**Los campos condicionales.** Registra un riesgo y cambia el tipo entre
Gestión, Seguridad Digital y Fiscal. Los campos se activan y desactivan, y la
descripción se rearma con la plantilla de cada tipo.

**Las reglas de negocio.** Intenta poner tratamiento «Aceptar» a un riesgo de
corrupción. El sistema lo bloquea, porque la regla vive en la tabla de
tratamientos, no en el código.

**Las ventanas.** Programa una ventana de actualización con fechas pasadas,
cambia la sesión a un Enlace SIG y verifica que no puede editar.

**El histórico.** Edita un riesgo y mira el registro de cambios: campo por
campo, con el valor anterior y el nuevo.

## Pendientes conocidos de los datos migrados

| Situación | Riesgos |
|---|---|
| Tratamiento «Evitar» con controles activos, sin subestrategia | 62 |
| Impacto de corrupción calculado con el cuestionario v6 | 50 |
| Topados en 4 controles por el límite del formato anterior | 44 |
| Riesgo de corrupción con tratamiento «Aceptar» | 1 |

Los 50 riesgos de corrupción son el pendiente de fondo: la versión 7 eliminó
el cuestionario de 19 preguntas y exige revalorarlos con la tabla de impacto
general. Hasta que eso ocurra, sus valores son los de la metodología anterior.

## Lo que este prototipo no es

- **No tiene autenticación.** El selector de sesión sirve para ver qué puede
  hacer cada rol, no para controlar el acceso.
- **Los permisos se validan en el navegador.** En producción esa validación
  tiene que estar en el servidor.
- **No sube archivos.** La carga de evidencias necesita el backend.

## Siguiente paso

Conectar la base de datos. El esquema completo está en los archivos SQL:
modelo base más las adendas de reportería, seguimiento y monitoreo, procesos,
roles y ventanas, evidencias e histórico.
