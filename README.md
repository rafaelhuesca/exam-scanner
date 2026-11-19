# EXAM SCANNER v1 — 20 preguntas

Aplicación web inicial para fotografiar una hoja de respuestas de 20 preguntas (A/B/C/D), leer burbujas mediante OpenCV.js, comparar contra una clave y guardar el resultado en Google Sheets.

## Qué incluye

- Interfaz adaptable a celular.
- Captura con cámara trasera y carga desde galería.
- Clave de 20 respuestas.
- Plantilla imprimible con marco de referencia.
- Rectificación de perspectiva con OpenCV.js.
- Detección inicial de círculos rellenados.
- Calificación sobre 10.
- Descarga individual en CSV.
- Conector de Google Apps Script para agregar filas a Sheets.
- Nombre, grupo, materia y nombre del examen.

## Requisitos

- Navegador moderno (Chrome recomendado).
- Cámara y permiso de acceso.
- Conexión a Internet para cargar OpenCV.js desde CDN.
- Para cámara: publicar el sitio mediante HTTPS (localhost también es seguro para pruebas).
- Cuenta de Google para usar Sheets y Apps Script.

## 1. Probar localmente

No abras `index.html` directamente como archivo. Desde la carpeta `exam-scanner-v1`, inicia un servidor local, por ejemplo:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000` en Chrome. `localhost` permite probar la cámara como contexto seguro. Para usar el teléfono, publica primero la web con HTTPS.

## 2. Imprimir la plantilla

En la aplicación pulsa **Imprimir hoja de respuestas**. Imprime `plantilla/hoja-respuestas.html` en tamaño carta, escala 100% o tamaño real. No uses “ajustar a página” si cambia las proporciones. Mantén visible el marco negro completo.

La plantilla está diseñada para esta versión del lector. No uses una hoja dibujada de forma distinta.

## 3. Crear Google Sheets

1. Crea una hoja de cálculo nueva en Google Sheets.
2. Abre **Extensiones → Apps Script**.
3. Copia el contenido de `apps-script/Code.gs` en el editor.
4. Guarda el proyecto.
5. Pulsa **Implementar → Nueva implementación**.
6. Selecciona tipo **Aplicación web**.
7. Ejecutar como: **Yo**.
8. Quién tiene acceso: **Cualquier persona** (si la política de tu cuenta lo permite).
9. Implementa, autoriza los permisos y copia la URL terminada en `/exec`.
10. En EXAM SCANNER pega esa URL en “Conectar Google Sheets”.

La primera ejecución crea automáticamente la pestaña `Resultados`.

### Seguridad del conector

La configuración “Cualquier persona” permite que quien tenga la URL envíe datos a tu hoja. No publiques esa URL. Para un uso escolar real, restringe el acceso cuando sea posible o añade autenticación/token y validación del lado del servidor. No uses datos sensibles innecesarios.

## 4. Publicar gratis con GitHub Pages

1. Crea una cuenta en GitHub si no tienes una.
2. Crea un repositorio público, por ejemplo `exam-scanner`.
3. Sube todos los archivos y carpetas de este proyecto (index.html debe quedar en la raíz).
4. En el repositorio abre **Settings → Pages**.
5. En “Build and deployment”, elige **Deploy from a branch**.
6. Selecciona `main` y `/ (root)`, guarda.
7. Espera la publicación y abre la URL que GitHub Pages muestra.
8. Abre la URL en Chrome del celular y permite el acceso a la cámara.

GitHub Pages sirve archivos estáticos por HTTPS. No contiene ni ejecuta el backend de Google Sheets: ese backend es Apps Script.

## 5. Uso en el salón

1. Entra a la web publicada.
2. Escribe nombre del examen, materia, grupo y alumno.
3. Selecciona la clave correcta para las 20 preguntas.
4. Pulsa “Guardar configuración” si quieres conservar esos datos en el navegador.
5. Imprime la plantilla oficial y entrega una a cada alumno.
6. Fotografía la hoja completa con buena iluminación, sin sombras y con el marco visible.
7. Revisa las respuestas detectadas y la calificación.
8. Pulsa “Guardar resultado en Google Sheets”.
9. Comprueba que la fila se haya agregado en la pestaña `Resultados`.

## 6. Cómo funciona el reconocimiento

El lector busca el contorno cuadrilateral del marco negro de la hoja, transforma la fotografía a un plano de 850 × 1100 píxeles y mide la proporción de píxeles oscuros en el centro de cada círculo. Los umbrales iniciales están en `js/omr.js`.

Si la lectura es dudosa, el sistema se detiene y pide repetir la fotografía. Esto evita aceptar automáticamente algunas marcas ambiguas.

## 7. Limitaciones importantes de esta versión

Esta es una primera versión funcional/prototipo, no un sistema OMR certificado. Antes de usarla para calificaciones oficiales:

- Prueba con diferentes celulares, impresoras, lápices y condiciones de luz.
- Comprueba que el marco se detecte correctamente y que las posiciones de las burbujas coincidan.
- Ajusta los umbrales de tinta en `js/omr.js` con hojas reales.
- Haz que el docente confirme cada lectura antes de registrar calificaciones.
- Evita hojas arrugadas, sombras, reflejos, recortes o perspectiva extrema.
- El campo de nombre se captura en la aplicación; no se reconoce automáticamente de la hoja en esta versión.
- El lector está calibrado para la plantilla incluida y 20 preguntas.

## 8. Solución de problemas

**No abre la cámara:** usa HTTPS, abre desde Chrome, concede permisos y revisa que otra aplicación no esté usando la cámara.

**OpenCV no carga:** verifica Internet, espera unos segundos y recarga la página. El script se descarga desde `https://docs.opencv.org/4.x/opencv.js`.

**No detecta el marco:** asegúrate de fotografiar la hoja completa, impresa al 100%, con el borde negro visible sobre un fondo que contraste.

**Detecta marcas incorrectamente:** mejora la luz, evita sombras, rellena los círculos de manera sólida y calibra los umbrales con hojas de prueba.

**No llega a Sheets:** confirma que la URL termine en `/exec`, que la implementación de Apps Script esté activa y que los permisos permitan el envío.

## 9. Próximas mejoras recomendadas

- Código QR para identificar examen y alumno.
- Detección automática del nombre o matrícula.
- Calibración guiada de umbrales.
- Pantalla de confirmación pregunta por pregunta.
- Procesamiento por lotes de un grupo completo.
- Reportes por pregunta y análisis de reactivos.
- Autenticación y control de acceso.
- Exportación de concentrados XLSX.

## Licencias y servicios

OpenCV.js es un proyecto de código abierto. GitHub Pages, Google Apps Script y Google Sheets tienen condiciones, límites y cuotas que pueden cambiar. Revisa sus políticas vigentes antes de un despliegue institucional.
