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
  const palettes={
    rose:{light:'#fff7ed',base:'#efb0bb',shade:'#b96181'},
    taro:{light:'#fdf6ff',base:'#c7b3ec',shade:'#836ab8'},
    matcha:{light:'#faffef',base:'#b9d9b7',shade:'#669b83'}
  };
  function rgb(s){
    return [parseInt(s.slice(1,3),16)/255,parseInt(s.slice(3,5),16)/255,parseInt(s.slice(5,7),16)/255];
  }
  function setPalette(name){
    const c=palettes[name]||palettes.rose;
    gl.uniform3fv(uni.light,rgb(c.light));
    gl.uniform3fv(uni.base,rgb(c.base));
    gl.uniform3fv(uni.shade,rgb(c.shade));
    document.querySelectorAll('[data-flavour]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.flavour===name)));
  }
  document.querySelectorAll('[data-flavour]').forEach(btn=>btn.addEventListener('click',()=>setPalette(btn.dataset.flavour)));
  setPalette('rose');
  const contacts=new Map(),deformations=[],pressUniform=new Float32Array(8*4);
  let viewW=0,viewH=0,centerX=0,centerY=0,scale=1,dpr=1,time=0,lastTime=0;
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
    contacts.clear();deformations.length=0;updateStatus();
  }
  function world(e){
    const rect=canvas.getBoundingClientRect();
    return {x:(e.clientX-rect.left-centerX)/scale,y:(centerY-(e.clientY-rect.top))/scale};
  }
  function updateStatus(){
    const n=contacts.size;
    status.classList.toggle('engaged',n>0);
    statusText.textContent=n?String(n).padStart(2,'0')+' POINT'+(n===1?'':'S')+' ACTIVE':'READY TO SQUISH';
    canvas.classList.toggle('grabbing',n>0);
  }
  function grab(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    const p=world(e);
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
  document.getElementById('reset').addEventListener('click',()=>{contacts.clear();deformations.length=0;updateStatus();});
  [elasticity,viscosity].forEach(el=>el.addEventListener('input',()=>{
    document.getElementById(el===elasticity?'spring-value':'viscosity-value').textContent=String(el.value).padStart(2,'0');
  }));
  function step(factor){
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
  function deform(){
    const idle=reduceMotion?0:Math.sin(time*.0014)*.006;
    for(let i=0;i<COUNT;i++){
      const k=i*3,x0=original[k],y0=original[k+1],z0=original[k+2];
      let x=x0,y=y0,z=z0;
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
  function render(now){
    const frame=lastTime?clamp((now-lastTime)/16.667,.5,2):1;
    lastTime=now;time=now;step(frame);deform();
    pressUniform.fill(0);
    let n=0;
    for(const t of deformations){
      if(n>=8)break;const d=Math.max(0,t.depth);if(d<.01)continue;
      pressUniform[n*4]=t.anchorX+t.dx*.85;
      pressUniform[n*4+1]=t.anchorY+t.dy*.85;
      pressUniform[n*4+2]=d;
      pressUniform[n*4+3]=.285;n++;
    }
    gl.uniform4fv(uni.press,pressUniform);
    gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,positions);
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,normals);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES,indexData.length,gl.UNSIGNED_SHORT,0);
    let width=1;
    if(deformations.length)width=1+Math.min(.35,deformations.reduce((m,t)=>m+Math.abs(t.dx),0)*.11);
    shadow.style.transform='translate(-50%,-50%) scaleX('+width+')';
    requestAnimationFrame(render);
  }
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{lastTime=0;});
  resize();deform();requestAnimationFrame(render);
})();