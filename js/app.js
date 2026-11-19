(() => {
  const $ = id => document.getElementById(id);
  const OPTIONS = ["A","B","C","D"];
  let latestResult = null;
  let stream = null;
  let cvReady = false;

  function buildKey() {
    $("answerKey").innerHTML = "";
    for (let i=1;i<=20;i++) {
      const wrap=document.createElement("label");
      wrap.className="key-item";
      wrap.innerHTML=`<b>Pregunta ${i}</b><select id="key${i}">${OPTIONS.map(o=>`<option value="${o}">${o}</option>`).join("")}</select>`;
      $("answerKey").appendChild(wrap);
    }
  }
  function getKey(){return Array.from({length:20},(_,i)=>$("key"+(i+1)).value)}
  function metadata(){return {exam:$("examName").value.trim(),subject:$("subject").value.trim(),group:$("group").value.trim(),student:$("student").value.trim()}}
  function setStatus(msg,kind=""){ $("scanStatus").textContent=msg; $("scanStatus").className="status "+kind; }
  function setResult(result, detected) {
    latestResult={...result,...metadata(),detected};
    $("resultEmpty").hidden=true; $("result").hidden=false;
    $("score").textContent=result.grade.toFixed(2);
    $("hits").textContent=result.correct;
    $("misses").textContent=result.incorrect;
    $("blank").textContent=result.blank;
    $("resultMeta").textContent=`${metadata().student || "Alumno sin nombre"} · ${metadata().group || "Sin grupo"} · ${metadata().subject || "Sin materia"} · ${result.percent.toFixed(1)}% de aciertos`;
    $("answersReview").innerHTML="";
    result.answers.forEach((a,i)=>{
      const span=document.createElement("span");
      span.className=a===""?"empty":(a===getKey()[i]?"ok":"bad");
      span.textContent=`${i+1}: ${a || "—"} (clave ${getKey()[i]})`;
      $("answersReview").appendChild(span);
    });
  }
  function grade(answers) {
    const key=getKey(); let correct=0,incorrect=0,blank=0;
    answers.forEach((a,i)=>{if(!a)blank++;else if(a===key[i])correct++;else incorrect++;});
    return {answers,correct,incorrect,blank,grade:correct/20*10,percent:correct/20*100};
  }
  async function startCamera(){
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      $("video").srcObject=stream; $("video").hidden=false; $("cameraPlaceholder").hidden=true;
      $("takePhoto").disabled=false; setStatus("Cámara activa. Coloca la hoja completa en el encuadre.");
    }catch(e){setStatus("No se pudo abrir la cámara: "+e.message,"error");}
  }
  async function scanSource(sourceCanvas){
    if(!cvReady){setStatus("OpenCV todavía se está cargando. Espera unos segundos.");return;}
    try{
      setStatus("Analizando hoja…");
      const answers=window.readAnswerSheet(sourceCanvas);
      const uncertain=answers.filter(x=>x===null).length;
      if(uncertain) {
        setStatus(`Se detectaron ${uncertain} respuestas dudosas. Revisa la foto, la iluminación y que la hoja esté completa.`, "error");
        return;
      }
      setResult(grade(answers),answers);
      setStatus("Lectura terminada. Verifica las respuestas detectadas antes de guardar.");
    }catch(e){console.error(e);setStatus("No se pudo leer la hoja: "+e.message,"error");}
  }
  function takePhoto(){
    const v=$("video"), c=$("captureCanvas");
    if(!v.videoWidth){setStatus("La cámara aún no está lista.");return;}
    c.width=v.videoWidth;c.height=v.videoHeight;
    c.getContext("2d").drawImage(v,0,0,c.width,c.height);
    scanSource(c);
  }
  function uploadPhoto(file){
    const img=new Image();
    img.onload=()=>{
      const c=$("captureCanvas");c.width=img.naturalWidth;c.height=img.naturalHeight;
      c.getContext("2d").drawImage(img,0,0);scanSource(c);URL.revokeObjectURL(img.src);
    };
    img.onerror=()=>setStatus("No se pudo abrir la imagen.");
    img.src=URL.createObjectURL(file);
  }
  function saveConfig(){
    localStorage.setItem("examScannerConfig",JSON.stringify({meta:metadata(),key:getKey(),scriptUrl:$("scriptUrl").value.trim()}));
    setStatus("Configuración guardada en este dispositivo.");
  }
  function loadConfig(){
    const raw=localStorage.getItem("examScannerConfig");
    if(!raw)return;
    try{const c=JSON.parse(raw);$("examName").value=c.meta.exam||"";$("subject").value=c.meta.subject||"";$("group").value=c.meta.group||"";$("student").value=c.meta.student||"";(c.key||[]).forEach((v,i)=>{if($("key"+(i+1)))$("key"+(i+1)).value=v;});$("scriptUrl").value=c.scriptUrl||"";}catch(e){console.warn(e);}
  }
  function downloadCsv(){
    if(!latestResult)return;
    const r=latestResult;
    const rows=[["Examen","Materia","Grupo","Alumno","Aciertos","Errores","Sin contestar","Calificacion","Porcentaje"],[r.exam,r.subject,r.group,r.student,r.correct,r.incorrect,r.blank,r.grade.toFixed(2),r.percent.toFixed(1)],["Pregunta","Detectada","Correcta"],...r.answers.map((a,i)=>[i+1,a||"Sin respuesta",getKey()[i]])];
    const csv=rows.map(row=>row.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\r\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="resultado-exam-scanner.csv";a.click();URL.revokeObjectURL(a.href);
  }
  async function saveSheets(){
    if(!latestResult){setStatus("Primero procesa un examen.");return;}
    const url=$("scriptUrl").value.trim();
    if(!url){setStatus("Pega primero la URL de Apps Script.");return;}
    const payload={...latestResult,answerKey:getKey(),timestamp:new Date().toISOString()};
    try{
      // text/plain evita la solicitud CORS preflight; no-cors permite enviar a Apps Script.
      await fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
      setStatus("Solicitud enviada a Google Sheets. Abre tu hoja para confirmar que se agregó el registro.");
    }catch(e){setStatus("Error al enviar a Sheets: "+e.message,"error");}
  }
  function downloadTemplate(){
    window.open("plantilla/hoja-respuestas.html","_blank");
  }

  buildKey();loadConfig();
  $("startCamera").addEventListener("click",startCamera);
  $("takePhoto").addEventListener("click",takePhoto);
  $("fileInput").addEventListener("change",e=>{if(e.target.files[0])uploadPhoto(e.target.files[0]);});
  $("saveConfig").addEventListener("click",saveConfig);
  $("downloadSheet").addEventListener("click",downloadTemplate);
  $("downloadCsv").addEventListener("click",downloadCsv);
  $("saveSheets").addEventListener("click",saveSheets);
  window.addEventListener("beforeunload",()=>{if(stream)stream.getTracks().forEach(t=>t.stop());});
  window.onOpenCvReady=()=>{cvReady=true;$("opencvStatus").textContent="OpenCV.js listo.";};
  if(window.cv && window.cv.Mat)window.onOpenCvReady();
})();
