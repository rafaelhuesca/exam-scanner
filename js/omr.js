/*
 * OMR inicial para la plantilla incluida.
 * La hoja tiene un marco rectangular negro que se detecta como cuadrilátero.
 * Tras rectificar a 850x1100 px, se miden los píxeles oscuros dentro de cada círculo.
 */
(function(){
  const W=850,H=1100;
  const X=[330,440,550,660];
  const Y0=285, DY=35;
  const R=10;

  function waitForCv(){
    if(window.cv && window.cv.Mat){
      window.cv.onRuntimeInitialized=()=>window.onOpenCvReady && window.onOpenCvReady();
      if(window.cv.Mat)window.onOpenCvReady && window.onOpenCvReady();
    }else setTimeout(waitForCv,250);
  }
  waitForCv();

  function findSheetQuad(src){
    const cv=window.cv, gray=new cv.Mat(), blur=new cv.Mat(), bw=new cv.Mat();
    cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);
    cv.threshold(blur,bw,0,255,cv.THRESH_BINARY_INV+cv.THRESH_OTSU);
    const contours=new cv.MatVector(), hierarchy=new cv.Mat();
    cv.findContours(bw,contours,hierarchy,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
    let best=null,bestArea=0;
    for(let i=0;i<contours.size();i++){
      const c=contours.get(i), peri=cv.arcLength(c,true), approx=new cv.Mat();
      cv.approxPolyDP(c,approx,0.02*peri,true);
      const area=cv.contourArea(approx);
      if(approx.rows===4 && area>bestArea && area>src.cols*src.rows*0.15){
        const pts=[];
        for(let j=0;j<4;j++)pts.push({x:approx.intAt(j,0),y:approx.intAt(j,1)});
        best=orderPoints(pts);bestArea=area;
      }
      c.delete();approx.delete();
    }
    gray.delete();blur.delete();bw.delete();contours.delete();hierarchy.delete();
    if(!best)throw new Error("No se encontró el marco de la hoja. Usa la plantilla oficial, fotografía la hoja completa y evita fondos oscuros.");
    return best;
  }
  function orderPoints(p){
    const sum=p.map(v=>v.x+v.y),diff=p.map(v=>v.x-v.y);
    return [p[sum.indexOf(Math.min(...sum))],p[diff.indexOf(Math.max(...diff))],
            p[sum.indexOf(Math.max(...sum))],p[diff.indexOf(Math.min(...diff))]];
  }
  function readAnswerSheet(canvas){
    const cv=window.cv;
    const src=cv.imread(canvas);
    const corners=findSheetQuad(src);
    const srcPts=cv.matFromArray(4,1,cv.CV_32FC2,corners.flatMap(p=>[p.x,p.y]));
    const dstPts=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,W,0,W,H,0,H]);
    const M=cv.getPerspectiveTransform(srcPts,dstPts);
    const warped=new cv.Mat();
    cv.warpPerspective(src,warped,M,new cv.Size(W,H),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
    const gray=new cv.Mat(),binary=new cv.Mat();
    cv.cvtColor(warped,gray,cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray,gray,new cv.Size(3,3),0);
    cv.threshold(gray,binary,0,255,cv.THRESH_BINARY_INV+cv.THRESH_OTSU);
    const answers=[];
    for(let q=0;q<20;q++){
      const ratios=[];
      for(let k=0;k<4;k++){
        const cx=X[k],cy=Y0+q*DY;
        let dark=0,total=0;
        for(let yy=cy-R;yy<=cy+R;yy++)for(let xx=cx-R;xx<=cx+R;xx++){
          const dx=xx-cx,dy=yy-cy;
          if(dx*dx+dy*dy<=R*R){total++;if(binary.ucharAt(yy,xx)>0)dark++;}
        }
        ratios.push(dark/total);
      }
      const sorted=ratios.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v);
      // Un círculo vacío conserva solo el contorno; uno relleno debe superar claramente el umbral.
      if(sorted[0].v<0.22){answers.push("");continue;}
      if(sorted[0].v<0.38 || sorted[0].v-sorted[1].v<0.10){answers.push(null);continue;}
      answers.push(["A","B","C","D"][sorted[0].i]);
    }
    src.delete();srcPts.delete();dstPts.delete();M.delete();warped.delete();gray.delete();binary.delete();
    return answers;
  }
  window.readAnswerSheet=readAnswerSheet;
})();
