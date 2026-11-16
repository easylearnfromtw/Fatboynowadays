(function mochi3D() {
  'use strict';
  const canvas=document.getElementById('stage');
  const shadow=document.getElementById('shadow3d');
  const elasticity=document.getElementById('spring');
  const viscosity=document.getElementById('viscosity');
  const status=document.getElementById('active');
  const statusText=document.getElementById('active-text');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,premultipliedAlpha:true,preserveDrawingBuffer:false});
  if(!gl){
    const c=canvas.getContext('2d');
    function unsupported(){
      const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);c.setTransform(dpr,0,0,dpr,0,0);
      const r=Math.min(w*.34,h*.24,260),x=w/2,y=h*.52;
      const g=c.createRadialGradient(x-r*.3,y-r*.4,3,x,y,r*1.15);
      g.addColorStop(0,'#fff4ef');g.addColorStop(.48,'#f5bfc3');g.addColorStop(1,'#bb748d');
      c.fillStyle=g;c.beginPath();c.ellipse(x,y,r,r*.84,0,0,Math.PI*2);c.fill();
      c.fillStyle='#725764';c.textAlign='center';c.font='13px sans-serif';
      c.fillText('你的瀏覽器不支援 WebGL 3D',x,y+r+40);
    }
    window.addEventListener('resize',unsupported);unsupported();return;
  }
  const VERT=`
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform vec2 uResolution;
    uniform vec2 uCenter;
    uniform float uScale;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec2 pixel=uCenter+vec2(aPosition.x,-aPosition.y)*uScale;
      vec2 clip=pixel/uResolution*2.0-1.0;
      gl_Position=vec4(clip.x,-clip.y,-aPosition.z*.055,1.0);
      vNormal=aNormal;
      vPosition=aPosition;
    }`;
  const FRAG=`
    precision highp float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 uLightColor;
    uniform vec3 uBaseColor;
    uniform vec3 uShadeColor;
    uniform vec4 uPress[8];
    void main() {
      vec3 n=normalize(vNormal);
      vec3 view=vec3(0.0,0.0,1.0);
      vec3 mainLight=normalize(vec3(-0.58,0.85,1.15));
      vec3 fillLight=normalize(vec3(0.76,0.20,0.63));
      float lambert=max(dot(n,mainLight),0.0);
      float fill=max(dot(n,fillLight),0.0);
      float facing=max(dot(n,view),0.0);
      float occlusion=0.0;
      float innerRim=0.0;
      for(int i=0;i<8;i++) {
        vec4 p=uPress[i];
        float dist=length(vPosition.xy-p.xy)/max(p.w,0.005);
        occlusion+=p.z*exp(-dist*dist*1.8);
        innerRim+=p.z*exp(-pow((dist-1.45)*2.6,2.0));
      }
      occlusion=clamp(occlusion,0.0,1.45);
      innerRim=clamp(innerRim,0.0,1.0);
      float lightness=clamp(0.12+lambert*0.67+fill*0.12,0.0,1.0);
      vec3 color=mix(uShadeColor,uBaseColor,lightness);
      color=mix(color,uLightColor,clamp(0.10+lambert*0.36+vPosition.y*0.08,0.0,0.57));
      float lowerShadow=(1.0-smoothstep(-1.02,0.20,vPosition.y))*0.12;
      color*=1.0-lowerShadow;
      // Contact occlusion follows each depressed fingertip in 3D.
      color*=1.0-occlusion*0.40;
      color+=uLightColor*innerRim*0.12;
      vec3 halfway=normalize(mainLight+view);
      float glint=pow(max(dot(n,halfway),0.0),35.0)*0.40;
      float broad=pow(max(dot(n,normalize(vec3(-0.47,0.68,1.30))),0.0),7.0)*0.105;
      float sideSpec=pow(max(dot(n,normalize(fillLight+view)),0.0),75.0)*0.19;
      color+=vec3(1.0,0.974,0.962)*(glint+broad+sideSpec)*(1.0-occlusion*0.22);
      float rim=pow(1.0-facing,2.6);
      color+=uLightColor*rim*0.19;
      color=mix(color,uShadeColor,rim*0.12);
      gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
    }`;
  function makeShader(type,source){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('MOCHI 3D shader: '+gl.getShaderInfoLog(shader));
    return shader;
  }
  const program=gl.createProgram();
  gl.attachShader(program,makeShader(gl.VERTEX_SHADER,VERT));
  gl.attachShader(program,makeShader(gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('MOCHI 3D program: '+gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const uni={
    resolution:gl.getUniformLocation(program,'uResolution'),
    center:gl.getUniformLocation(program,'uCenter'),
    scale:gl.getUniformLocation(program,'uScale'),
    light:gl.getUniformLocation(program,'uLightColor'),
    base:gl.getUniformLocation(program,'uBaseColor'),
    shade:gl.getUniformLocation(program,'uShadeColor'),
    press:gl.getUniformLocation(program,'uPress[0]')
  };
  const LAT=48,LON=80,ROW=LON+1,COUNT=(LAT+1)*ROW;
  const original=new Float32Array(COUNT*3);
  const positions=new Float32Array(COUNT*3);
  const normals=new Float32Array(COUNT*3);
  const indices=[],TAU=Math.PI*2;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(let j=0;j<=LAT;j++){
    const polar=Math.PI*j/LAT,sinP=Math.sin(polar),cosP=Math.cos(polar);
    for(let i=0;i<=LON;i++){
      const angle=i*TAU/LON;
      const irregular=1+.024*Math.cos(3*angle)*sinP*sinP+.013*Math.sin(5*angle+polar);
      const k=(j*ROW+i)*3;
      original[k]=1.08*sinP*Math.cos(angle)*irregular;
      let y=.88*cosP*(1+.012*Math.cos(4*angle));if(y<0)y*=.93;
      original[k+1]=y;
      original[k+2]=.79*sinP*Math.sin(angle)*irregular;
    }
  }
  for(let j=0;j<LAT;j++)for(let i=0;i<LON;i++){
    const a=j*ROW+i,b=a+1,c=a+ROW,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  const indexData=new Uint16Array(indices);
  const posBuffer=gl.createBuffer(),normalBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,positions.byteLength,gl.DYNAMIC_DRAW);
  const positionLoc=gl.getAttribLocation(program,'aPosition');
  gl.vertexAttribPointer(positionLoc,3,gl.FLOAT,false,0,0);
  gl.enableVertexAttribArray(positionLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,normals.byteLength,gl.DYNAMIC_DRAW);
  const normalLoc=gl.getAttribLocation(program,'aNormal');
  gl.vertexAttribPointer(normalLoc,3,gl.FLOAT,false,0,0);
  gl.enableVertexAttribArray(normalLoc);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indexData,gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  // Physical fan-deck-inspired numbered swatches; ML numbers are original.
  const paletteData=[
    ['ML-101','Blush Veil','薄霧玫瑰','#EFB0BB','pink'],
    ['ML-102','Peach Cloud','蜜桃雲','#F6B69B','pink'],
    ['ML-103','Coral Silk','珊瑚絲緞','#F18F8B','pink'],
    ['ML-104','Berry Sorbet','莓果雪酪','#D97AA6','pink'],
    ['ML-201','Taro Milk','芋泥牛奶','#C7B3EC','violet'],
    ['ML-202','Lilac Mist','丁香薄霧','#AEADE7','violet'],
    ['ML-203','Lavender Dust','薰衣草灰','#B99ACB','violet'],
    ['ML-204','Orchid Haze','蘭花暮色','#9982C3','violet'],
    ['ML-301','Matcha Milk','抹茶歐蕾','#B9D9B7','green'],
    ['ML-302','Sage Powder','鼠尾草粉','#A3C0A8','green'],
    ['ML-303','Mint Foam','薄荷泡沫','#96D5C9','green'],
    ['ML-304','Olive Tea','橄欖茶','#ADB98C','green'],
    ['ML-401','Vanilla Cream','香草奶油','#F0D9BB','neutral'],
    ['ML-402','Oat Silk','燕麥絲絨','#CBB9AB','neutral'],
    ['ML-403','Rice Paper','米白和紙','#E9DED2','neutral'],
    ['ML-404','Cocoa Cloud','可可雲','#BCA29A','neutral'],
    ['ML-501','Blue Haze','霧海藍','#A6CDE4','blue'],
    ['ML-502','Porcelain','青瓷藍','#BACDDE','blue'],
    ['ML-503','Sea Glass','海玻璃','#86C2CB','blue'],
    ['ML-504','Misty Sky','淡空藍','#C5DDEA','blue']
  ];
  function rgb(s){return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);}
  function mixRgb(a,b,t){const A=rgb(a),B=rgb(b);return A.map((v,i)=>v*(1-t)+B[i]*t);}
  let chosenCode='ML-101';
  const library=document.getElementById('palette-library');
  const paletteTrigger=document.getElementById('palette-trigger');
  const paletteGrid=document.getElementById('palette-grid');
  const paletteSelected=document.getElementById('selected-code');
  const paletteSelectedName=document.getElementById('selected-name');
  const paletteCurrent=document.getElementById('palette-current');
  let family='all';
  function setPalette(code){
    const c=paletteData.find(p=>p[0]===code)||paletteData[0];
    chosenCode=c[0];
    gl.uniform3fv(uni.light,mixRgb(c[3],'#FFFFFF',.64));
    gl.uniform3fv(uni.base,rgb(c[3]));
    gl.uniform3fv(uni.shade,mixRgb(c[3],'#40303F',.43));
    paletteSelected.textContent=c[0];
    paletteSelectedName.textContent=c[1]+' / '+c[2];
    paletteCurrent.style.background=c[3];
    document.documentElement.style.setProperty('--chosen-color',c[3]);
    document.querySelectorAll('.palette-chip').forEach(btn=>{
      btn.setAttribute('aria-pressed',String(btn.dataset.code===c[0]));
    });
  }
  function renderPalette(){
    paletteGrid.replaceChildren();
    for(const c of paletteData){
      if(family!=='all'&&c[4]!==family)continue;
      const b=document.createElement('button');
      b.type='button';b.className='palette-chip';b.dataset.code=c[0];
      b.setAttribute('aria-pressed',String(c[0]===chosenCode));
      b.setAttribute('aria-label',c[0]+' '+c[2]+' '+c[3]);
      const face=document.createElement('span');face.className='chip-face';face.style.background=c[3];
      const detail=document.createElement('span');detail.className='chip-detail';
      const number=document.createElement('strong');number.textContent=c[0];
      const name=document.createElement('small');name.textContent=c[1];
      detail.append(number,name);b.append(face,detail);
      b.addEventListener('click',()=>setPalette(c[0]));
      paletteGrid.append(b);
    }
  }
  document.querySelectorAll('[data-family]').forEach(b=>b.addEventListener('click',()=>{
    family=b.dataset.family;
    document.querySelectorAll('[data-family]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    renderPalette();
  }));
  function showLibrary(open){
    library.classList.toggle('is-open',open);
    library.setAttribute('aria-hidden',String(!open));
    paletteTrigger.setAttribute('aria-expanded',String(open));
    if(open)library.querySelector('.palette-close').focus();
    else paletteTrigger.focus();
  }
  paletteTrigger.addEventListener('click',()=>showLibrary(!library.classList.contains('is-open')));
  library.querySelector('.palette-close').addEventListener('click',()=>showLibrary(false));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&library.classList.contains('is-open'))showLibrary(false);
  });
  renderPalette();setPalette(chosenCode);
  const contacts=new Map(),deformations=[],pressUniform=new Float32Array(8*4);
  let viewW=0,viewH=0,centerX=0,centerY=0,scale=1,dpr=1,time=0,lastTime=0;
  // An intact, lit mesh can tear into two independently movable closed meshes.
  // Edges are re-bonded when the pieces touch or return under viscous attraction.
  let tear=null;
  let rejoinPulse=0;
  const tearHint=document.getElementById('tear-hint');
  function splitGesture(){
    if(tear||contacts.size===0)return;
    const arr=Array.from(contacts.values());
    const E=Number(elasticity.value);
    let ax=1,ay=0,excess=0,cx=0,cy=0;
    const limit=.76+E*.082;
    if(arr.length>=2){
      let first=null,second=null,largest=0;
      for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
        const a=arr[i],b=arr[j];
        const nowDist=Math.hypot(a.x-b.x,a.y-b.y);
        const startDist=Math.hypot(a.startX-b.startX,a.startY-b.startY);
        const growth=nowDist-startDist;
        if(growth>largest){largest=growth;first=a;second=b;}
      }
      if(!first||largest<limit)return;
      const dx=second.x-first.x,dy=second.y-first.y;
      const dist=Math.hypot(dx,dy)||1;
      ax=dx/dist;ay=dy/dist;
      cx=clamp((first.x+second.x)*.5,-.4,.4);
      cy=clamp((first.y+second.y)*.5,-.38,.38);
      excess=largest;
    }else{
      const t=arr[0],dx=t.x-t.startX,dy=t.y-t.startY;
      const len=Math.hypot(dx,dy);
      if(len<limit*1.54)return;
      ax=dx/len;ay=dy/len;excess=len;
    }
    const opening=clamp(1.42+(excess-limit)*.32,1.44,2.10);
    tear={
      axisX:ax,axisY:ay,
      pieces:[
        {index:0,x:cx-ax*opening*.5,y:cy-ay*opening*.5,vx:-ax*.02,vy:-ay*.02},
        {index:1,x:cx+ax*opening*.5,y:cy+ay*opening*.5,vx:ax*.02,vy:ay*.02}
      ],
      cooldown:18
    };
    for(const t of arr){
      const projection=(t.x-cx)*ax+(t.y-cy)*ay;
      const piece=projection<0?tear.pieces[0]:tear.pieces[1];
      t.piece=piece.index;
      t.holdX=t.x-piece.x;t.holdY=t.y-piece.y;
      t.dx=0;t.dy=0;t.vx=0;t.vy=0;
    }
    tearHint.textContent='MATERIAL SEPARATED · 靠近會重新黏合';
    tearHint.classList.add('torn');
    updateStatus();
  }
  function advancePieces(frame){
    if(!tear)return;
    const pieces=tear.pieces;
    const midX=(pieces[0].x+pieces[1].x)*.5;
    const midY=(pieces[0].y+pieces[1].y)*.5;
    for(const p of pieces){
      const gripping=Array.from(contacts.values()).filter(t=>t.piece===p.index);
      let goalX,goalY;
      if(gripping.length){
        goalX=gripping.reduce((a,t)=>a+t.x-t.holdX,0)/gripping.length;
        goalY=gripping.reduce((a,t)=>a+t.y-t.holdY,0)/gripping.length;
      }else{
        const sign=p.index===0?-1:1;
        const other=pieces[1-p.index];
        // Released portions retain inertia, then approach each other like
        // tacky rice dough until they contact and permanently fuse.
        const attract=contacts.size?1:.2;
        const bondX=other.x+tear.axisX*sign*.85;
        const bondY=other.y+tear.axisY*sign*.85;
        goalX=bondX*attract+(midX+tear.axisX*sign*.41)*(1-attract);
        goalY=bondY*attract+(midY+tear.axisY*sign*.41)*(1-attract);
      }
      const V=Number(viscosity.value);
      const stiffness=gripping.length?.14:.032+Number(elasticity.value)*.004;
      const damp=gripping.length?.75:.90-V*.01;
      p.vx=(p.vx+(goalX-p.x)*stiffness*frame)*Math.pow(damp,frame);
      p.vy=(p.vy+(goalY-p.y)*stiffness*frame)*Math.pow(damp,frame);
      p.x=clamp(p.x+p.vx*frame,-3.5,3.5);
      p.y=clamp(p.y+p.vy*frame,-3.0,3.0);
    }
    tear.cooldown=Math.max(0,tear.cooldown-frame);
    const d=Math.hypot(pieces[1].x-pieces[0].x,pieces[1].y-pieces[0].y);
    if(tear.cooldown===0&&d<1.18){
      tear=null;rejoinPulse=1;
      contacts.clear();deformations.length=0;
      tearHint.classList.remove('torn');
      tearHint.textContent='BONDED AGAIN · 再拉長就能撕開';
      updateStatus();
    }
  }

  function resize(){
    viewW=window.innerWidth;viewH=window.innerHeight;
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.floor(viewW*dpr);canvas.height=Math.floor(viewH*dpr);
    canvas.style.width=viewW+'px';canvas.style.height=viewH+'px';
    gl.viewport(0,0,canvas.width,canvas.height);
    const radius=Math.min(viewW*(viewW<650?.355:.26),viewH*(viewW<650?.24:.29),286);
    scale=radius/1.08;
    centerX=viewW*.5;centerY=viewH*(viewH<620?.52:(viewW<650?.495:.525));
    gl.uniform2f(uni.resolution,viewW,viewH);
    gl.uniform2f(uni.center,centerX,centerY);
    gl.uniform1f(uni.scale,scale);
    shadow.style.left=centerX+'px';
    shadow.style.top=(centerY+radius*.74)+'px';
    shadow.style.width=(radius*1.86)+'px';
    shadow.style.height=(radius*.43)+'px';
    contacts.clear();deformations.length=0;tear=null;rejoinPulse=0;updateStatus();
  }
  function world(e){
    const rect=canvas.getBoundingClientRect();
    return {x:(e.clientX-rect.left-centerX)/scale,y:(centerY-(e.clientY-rect.top))/scale};
  }
  function updateStatus(){
    const n=contacts.size;
    status.classList.toggle('engaged',n>0);
    statusText.textContent=tear?'SPLIT / SELF-HEALING':n?String(n).padStart(2,'0')+' POINT'+(n===1?'':'S')+' ACTIVE':'READY TO SQUISH';
    canvas.classList.toggle('grabbing',n>0);
  }
  function grab(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    const p=world(e);
    // Both detached parts have their own hit-test and pressure dimple.
    if(tear){
      let chosen=null,best=Infinity;
      for(const piece of tear.pieces){
        const dx=p.x-piece.x,dy=p.y-piece.y;
        const dist=Math.hypot(dx,dy);
        if(dist<best&&dist<.74){chosen=piece;best=dist;}
      }
      if(!chosen)return;
      e.preventDefault();
      try{canvas.setPointerCapture(e.pointerId);}catch(_){}
      const t={pointerId:e.pointerId,piece:chosen.index,
        anchorX:p.x,anchorY:p.y,startX:p.x,startY:p.y,x:p.x,y:p.y,
        holdX:p.x-chosen.x,holdY:p.y-chosen.y,
        dx:0,dy:0,vx:0,vy:0,depth:.05,depthVelocity:.07,
        pressure:Math.max(.5,e.pressure||0),active:true};
      deformations.push(t);contacts.set(e.pointerId,t);
      updateStatus();return;
    }
    let closest=-1,best=.22*.22;
    // Hit-test rendered surface, not the undeformed silhouette.
    for(let i=0;i<COUNT;i++){
      const k=i*3;
      if(positions[k+2]<-.02)continue;
      const dx=positions[k]-p.x,dy=positions[k+1]-p.y,d=dx*dx+dy*dy;
      if(d<best){best=d;closest=i;}
    }
    if(closest<0)return;
    e.preventDefault();
    try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    const k=closest*3;
    const t={
      pointerId:e.pointerId,anchorX:original[k],anchorY:original[k+1],
      startX:p.x,startY:p.y,x:p.x,y:p.y,
      dx:0,dy:0,vx:0,vy:0,depth:.07,depthVelocity:.08,
      pressure:Math.max(.5,e.pressure||0),active:true
    };
    deformations.push(t);contacts.set(e.pointerId,t);
    while(deformations.length>8){
      let dead=deformations.findIndex(v=>!v.active);
      if(dead<0)dead=0;
      deformations.splice(dead,1);
    }
    updateStatus();
  }
  function drag(e){
    const t=contacts.get(e.pointerId);if(!t)return;
    e.preventDefault();const p=world(e);t.x=p.x;t.y=p.y;
    if(e.pressure>0)t.pressure=e.pressure;
  }
  function release(e){
    const t=contacts.get(e.pointerId);if(!t)return;
    t.active=false;contacts.delete(e.pointerId);
    try{canvas.releasePointerCapture(e.pointerId);}catch(_){}
    updateStatus();
  }
  canvas.addEventListener('pointerdown',grab,{passive:false});
  canvas.addEventListener('pointermove',drag,{passive:false});
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  document.getElementById('reset').addEventListener('click',()=>{contacts.clear();deformations.length=0;tear=null;rejoinPulse=0;tearHint.classList.remove('torn');tearHint.textContent='STRETCH TO TEAR · 拉至極限可撕裂';updateStatus();});
  [elasticity,viscosity].forEach(el=>el.addEventListener('input',()=>{
    document.getElementById(el===elasticity?'spring-value':'viscosity-value').textContent=String(el.value).padStart(2,'0');
  }));
  function step(factor){
    splitGesture();
    advancePieces(factor);
    rejoinPulse*=Math.pow(.93,factor);
    if(rejoinPulse<.001)rejoinPulse=0;
    const E=Number(elasticity.value),V=Number(viscosity.value);
    const returning=.025+E*.006,resistance=clamp(.94-V*.024,.66,.94);
    for(let i=deformations.length-1;i>=0;i--){
      const t=deformations[i];
      const xGoal=t.active?clamp(t.x-t.startX,-1.65,1.65):0;
      const yGoal=t.active?clamp(t.y-t.startY,-1.55,1.55):0;
      const depthGoal=t.active?clamp(.74+t.pressure*.30,0,1):0;
      const pull=t.active?.23:returning,damp=t.active?.69:resistance;
      t.vx=(t.vx+(xGoal-t.dx)*pull*factor)*Math.pow(damp,factor);
      t.vy=(t.vy+(yGoal-t.dy)*pull*factor)*Math.pow(damp,factor);
      t.dx+=t.vx*factor;t.dy+=t.vy*factor;
      const pressK=t.active?.20:returning*1.3;
      t.depthVelocity=(t.depthVelocity+(depthGoal-t.depth)*pressK*factor)*Math.pow(damp,factor);
      t.depth=clamp(t.depth+t.depthVelocity*factor,-.25,1.4);
      if(!t.active&&Math.abs(t.dx)+Math.abs(t.dy)+Math.abs(t.depth)+
         Math.abs(t.vx)+Math.abs(t.vy)+Math.abs(t.depthVelocity)<.008){
        deformations.splice(i,1);
      }
    }
  }
  function deform(piece){
    const idle=reduceMotion?0:Math.sin(time*.0014)*.006;
    for(let i=0;i<COUNT;i++){
      const k=i*3,x0=original[k],y0=original[k+1],z0=original[k+2];
      let x=x0,y=y0,z=z0;
      if(piece){
        // Actual separate closed mesh with independent position and orientation.
        const X=x0*.60,Y=y0*.88;
        x=piece.x+X*tear.axisX-Y*tear.axisY;
        y=piece.y+X*tear.axisY+Y*tear.axisX;
        z=z0*.84;
        const front=clamp((z0+.08)/.43,0,1);
        for(const t of deformations){
          if(t.piece!==piece.index)continue;
          const dx=x-t.x,dy=y-t.y,d2=dx*dx+dy*dy;
          const press=Math.exp(-d2/(2*.22*.22));
          const lip=Math.exp(-Math.pow((Math.sqrt(d2)-.31)/.10,2));
          z+=front*clamp(t.depth,0,1)*(-.30*press+.035*lip);
        }
        positions[k]=x;positions[k+1]=y;positions[k+2]=z;
        continue;
      }
      if(rejoinPulse>0){
        x*=1+rejoinPulse*.15;
        y*=1-rejoinPulse*.12;
      }
      const front=clamp((z0+.08)/.43,0,1);
      for(let j=0;j<deformations.length;j++){
        const t=deformations[j],ox=x0-t.anchorX,oy=y0-t.anchorY,d2=ox*ox+oy*oy;
        const grip=Math.exp(-d2/(2*.50*.50)),volumeGrip=.28+.72*front;
        x+=t.dx*grip*volumeGrip;y+=t.dy*grip*volumeGrip;
        // Concave pressure dent with a slightly raised ring (not a fake circle overlay).
        const dist=Math.sqrt(d2),contact=Math.exp(-d2/(2*.265*.265));
        const lip=Math.exp(-Math.pow((dist-.38)/.135,2));
        const depth=clamp(t.depth,0,1.25),cap=clamp(z0*.78+.07,.10,.49);
        z+=front*depth*(-cap*contact+.067*lip);
        x+=ox*front*depth*.050*Math.exp(-d2/(2*.43*.43));
        y+=oy*front*depth*.050*Math.exp(-d2/(2*.43*.43));
      }
      if(deformations.length===0){x+=x0*idle;y+=y0*idle*.6;}
      positions[k]=x;positions[k+1]=y;positions[k+2]=z;
    }
    normals.fill(0);
    for(let i=0;i<indices.length;i+=3){
      const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
      const abx=positions[b]-positions[a],aby=positions[b+1]-positions[a+1],abz=positions[b+2]-positions[a+2];
      const acx=positions[c]-positions[a],acy=positions[c+1]-positions[a+1],acz=positions[c+2]-positions[a+2];
      const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx;
      normals[a]+=nx;normals[a+1]+=ny;normals[a+2]+=nz;
      normals[b]+=nx;normals[b+1]+=ny;normals[b+2]+=nz;
      normals[c]+=nx;normals[c+1]+=ny;normals[c+2]+=nz;
    }
    for(let i=0;i<normals.length;i+=3){
      const len=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;
      normals[i]/=len;normals[i+1]/=len;normals[i+2]/=len;
    }
  }
  function uploadDraw(piece){
    deform(piece);
    pressUniform.fill(0);
    let n=0;
    for(const t of deformations){
      if(n>=8)break;
      if(piece&&t.piece!==piece.index)continue;
      if(!piece&&t.piece!==undefined)continue;
      const d=Math.max(0,t.depth);if(d<.01)continue;
      pressUniform[n*4]=piece?t.x:t.anchorX+t.dx*.85;
      pressUniform[n*4+1]=piece?t.y:t.anchorY+t.dy*.85;
      pressUniform[n*4+2]=d;
      pressUniform[n*4+3]=piece?.22:.285;n++;
    }
    gl.uniform4fv(uni.press,pressUniform);
    gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,positions);
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,normals);
    gl.drawElements(gl.TRIANGLES,indexData.length,gl.UNSIGNED_SHORT,0);
  }
  function render(now){
    const frame=lastTime?clamp((now-lastTime)/16.667,.5,2):1;
    lastTime=now;time=now;step(frame);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    if(tear){
      uploadDraw(tear.pieces[0]);
      uploadDraw(tear.pieces[1]);
    }else{
      uploadDraw(null);
    }
    let width=1;
    if(tear){
      const a=tear.pieces;
      width=1+Math.min(.6,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)*.13);
    }else if(deformations.length){
      width=1+Math.min(.35,deformations.reduce((m,t)=>m+Math.abs(t.dx),0)*.11);
    }
    shadow.style.transform='translate(-50%,-50%) scaleX('+width+')';
    requestAnimationFrame(render);
  }
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{lastTime=0;});
  resize();deform();requestAnimationFrame(render);
})();