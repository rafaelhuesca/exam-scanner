const SHEET_NAME = "Resultados";

function doGet() {
  return ContentService.createTextOutput("EXAM SCANNER API activa");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Fecha", "Examen", "Materia", "Grupo", "Alumno",
        "Aciertos", "Errores", "Sin contestar", "Calificación",
        "Porcentaje", "Respuestas detectadas", "Clave"
      ]);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(),
      data.exam || "",
      data.subject || "",
      data.group || "",
      data.student || "",
      Number(data.correct || 0),
      Number(data.incorrect || 0),
      Number(data.blank || 0),
      Number(data.grade || 0),
      Number(data.percent || 0),
      (data.answers || []).join(""),
      (data.answerKey || []).join("")
    ]);
    return ContentService.createTextOutput(JSON.stringify({ok:true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
