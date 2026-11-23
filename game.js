import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas=document.querySelector('#game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x82958c);
scene.fog=new THREE.FogExp2(0x819087,.012);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const camera=new THREE.OrthographicCamera(-12,12,7,-7,.1,120);camera.position.set(0,5.3,25);camera.lookAt(0,3,0);
scene.add(new THREE.HemisphereLight(0xd9e6d4,0x263628,2));
const sun=new THREE.DirectionalLight(0xffdfad,3.2);sun.position.set(-7,15,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-12;scene.add(sun);
const fill=new THREE.DirectionalLight(0x8dd3d0,1.3);fill.position.set(8,7,-10);scene.add(fill);
const mats={ground:new THREE.MeshStandardMaterial({color:0x454b42,roughness:.96}),road:new THREE.MeshStandardMaterial({color:0x343b37,roughness:.95}),concrete:new THREE.MeshStandardMaterial({color:0x77796c,roughness:.94}),dark:new THREE.MeshStandardMaterial({color:0x202c2b,roughness:.8}),leaf:new THREE.MeshStandardMaterial({color:0x405e3e,roughness:.92}),leaf2:new THREE.MeshStandardMaterial({color:0x78914d,roughness:.9}),rust:new THREE.MeshStandardMaterial({color:0x9a5941,roughness:.84}),glass:new THREE.MeshStandardMaterial({color:0x739290,roughness:.25,metalness:.5}),yellow:new THREE.MeshStandardMaterial({color:0xd6c66a,roughness:.68}),metal:new THREE.MeshStandardMaterial({color:0x737a70,metalness:.65,roughness:.5}),skin:new THREE.MeshStandardMaterial({color:0xc2b897,roughness:.78}),cloth:new THREE.MeshStandardMaterial({color:0x44584b,roughness:.88}),pants:new THREE.MeshStandardMaterial({color:0x343b37,roughness:.9}),black:new THREE.MeshStandardMaterial({color:0x18201e,roughness:.65}),glow:new THREE.MeshStandardMaterial({color:0xe9d185,emissive:0xc77b35,emissiveIntensity:1.5}),blood:new THREE.MeshStandardMaterial({color:0x8d3e35})};
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,12,8),cylGeo=new THREE.CylinderGeometry(.5,.5,1,10);
function box(parent,mat,x,y,z,sx,sy,sz){const m=new THREE.Mesh(boxGeo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(parent,mat,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphereGeo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m}
function cyl(parent,mat,x,y,z,r,h,r2=r){const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r,h,10),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
function mat(color,roughness=.85,metalness=0,emissive=0){return new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:emissive?1:0})}

// Layered, endlessly recycled city blocks make the side-on world feel deep.
const world=group(scene),farLayer=group(scene),midLayer=group(scene),frontLayer=group(scene);
const ground=box(world,mats.ground,0,-.45,0,180,.9,28);ground.receiveShadow=true;
box(world,mats.road,0,-.05,3,180,.14,13);
for(let i=-38;i<42;i+=4){box(world,mat(0xb6b295),i,.035,3,.12,.025,1.1);}
// sidewalk slabs and weed tufts
for(let i=-40;i<44;i+=2){box(world,mat(i%4?0x686b5c:0x77786a),i,.03,-1,1.9,.12,3);if(i%6===0){const weed=group(world,i,.1,-.8);for(let n=0;n<3;n++){const leaf=ball(weed,mats.leaf2,(n-1)*.12,.35+Math.random()*.16,0,.07,.35,.08);leaf.rotation.z=(n-1)*-.28}}}
// distant skyline
const buildings=[];for(let i=-50;i<58;i+=7){const h=5+Math.random()*11,w=4+Math.random()*4;const b=box(farLayer,mat([0x586761,0x65746c,0x53615c][Math.floor(Math.random()*3)]),i,h/2-1,-14,w,h,3);buildings.push({mesh:b,x:i,w,h});for(let y=0;y<Math.floor(h/1.5);y++)for(let xx=-1;xx<=1;xx++){if(Math.random()>.43)box(farLayer,mat(0xb3a47a,.35,0,0x4d4024),i+xx*w*.26,-1+y*1.35,-12.35,.17,.38,.04)}}
// blocks, ruined walls, streetlights, cars and vine-covered structures
const props=[];
function makeLamp(x,z=-2){const g=group(world,x,0,z);cyl(g,mats.metal,0,2.1,0,.09,4.2);const arm=box(g,mats.metal,.45,4.1,0,1,.09,.1);box(g,mats.dark,.86,3.98,0,.4,.18,.28);const bulb=ball(g,mats.glow,.86,3.88,0,.13,.08,.13);props.push({x,group:g,type:'lamp'});return g}
function makeCar(x,z=4,color=0x5d665e){const g=group(world,x,0,z);const body=mat(color),wheelmat=mat(0x1e2221,.98),trim=mat(0x9d9d80,.5,.5);box(g,body,0,.76,0,3.4,.85,1.6);box(g,body,-.15,1.3,0,1.8,.65,1.42);box(g,mats.glass,-.15,1.32,.72,.72,.45,.04);box(g,mats.glass,-.15,1.32,-.72,.72,.45,.04);for(const xx of [-1.12,1.12])for(const zz of [-.78,.78]){const wheel=cyl(g,wheelmat,xx,.42,zz,.42,.22);wheel.rotation.z=Math.PI/2;ball(g,trim,xx,.42,zz*1.1,.16,.16,.07)}box(g,mats.yellow,1.73,.8,.42,.06,.22,.28);box(g,mats.rust,-1.73,.8,-.4,.05,.22,.3);const plant=ball(g,mats.leaf,-.4,1.7,-.1,.54,.18,.65);plant.rotation.z=.2;props.push({x,group:g,type:'car'});return g}
function makeRuin(x,z=-.7){const g=group(world,x,0,z),h=2+Math.random()*2.2,w=1.3+Math.random()*1.5;box(g,mats.concrete,0,h/2,w*.0,w,h,.55);box(g,mat(0x4c5049),-.25,.12,.3,w*.55,.2,.08);for(let k=0;k<4;k++){const vine=cyl(g,mats.leaf,x?0:0,h*.4,0,.045,h*.85);vine.position.x=(Math.random()-.5)*w;vine.position.z=.29;vine.rotation.z=(Math.random()-.5)*.24;for(let t=0;t<3;t++){const leaf=ball(g,mats.leaf2,vine.position.x+(Math.random()-.5)*.6,h*(.2+t*.18),.35,.16,.07,.12);leaf.rotation.z=Math.random()}}
// exposed reinforcing bars
for(const xx of [-w*.42,w*.42]){const bar=cyl(g,mats.rust,xx,h+.1,.12,.04,.65);bar.rotation.z=.13}props.push({x,group:g,type:'ruin'});return g}
for(let x=-38;x<44;x+=10){if(Math.random()>.35)makeLamp(x,-2);if(Math.random()>.32)makeCar(x+3,4,[0x485a55,0x6a5246,0x62685d,0x424d53][Math.floor(Math.random()*4)]);if(Math.random()>.3)makeRuin(x+6,-.6)}
// near-plane hanging vines and foliage silhouettes
for(let i=0;i<34;i++){const x=-30+Math.random()*60,y=3+Math.random()*8,z=-5+Math.random()*2;const len=1+Math.random()*3;const vine=cyl(frontLayer,mats.leaf,x,y-len/2,z,.05,len);vine.rotation.z=(Math.random()-.5)*.22;for(let j=0;j<3;j++){const leaf=ball(frontLayer,j%2?mats.leaf:mats.leaf2,x+(Math.random()-.5)*.45,y-len*(j/3),z,.22,.08,.13);leaf.rotation.z=Math.random()*2}}
// distant fog volumes
const fogPlanes=[];for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(15,4),new THREE.MeshBasicMaterial({color:0xc5c9b0,transparent:true,opacity:.07,depthWrite:false}));m.position.set(-16+i*7,3,-8-i*.8);scene.add(m);fogPlanes.push(m)}

// Survivor: layered, handmade low-poly 3D silhouette, locked to the ground plane.
const playerRoot=group(scene,0,0,1.8),playerRig=group(playerRoot);
const skin=mat(0xcbb99a),jacket=mat(0x465b4d),pants=mat(0x303a36),packmat=mat(0x8c704d),bootmat=mat(0x242a28);
ball(playerRig,skin,0,1.67,0,.26,.31,.22); // head
// face / hair / cap
ball(playerRig,mat(0x30302a),0,1.91,-.01,.27,.11,.23);ball(playerRig,skin,.07,1.64,.2,.17,.1,.07);
box(playerRig,mat(0x202725),.05,1.69,.258,.1,.035,.025);
box(playerRig,jacket,0,1.12,0,.58,.82,.34);box(playerRig,packmat,-.3,1.23,-.24,.22,.52,.25);box(playerRig,mat(0x9b8a63),0,1.22,.19,.035,.62,.025);
const armL=group(playerRig,-.35,1.4,0),armR=group(playerRig,.35,1.4,0);for(const arm of [armL,armR]){ball(arm,jacket,0,-.22,0,.13,.32,.14);ball(arm,skin,0,-.49,.05,.11,.11,.11)}
const legL=group(playerRig,-.16,.78,0),legR=group(playerRig,.16,.78,0);for(const leg of [legL,legR]){box(leg,pants,0,-.27,0,.22,.55,.24);box(leg,bootmat,.06,-.55,.09,.28,.16,.38)}
// flashlight cone rendered as a subtle emissive beam when activated
const flashlight=group(playerRoot,.26,1.55,.35);const beam=new THREE.Mesh(new THREE.ConeGeometry(.48,6,16,1,true),new THREE.MeshBasicMaterial({color:0xffe6a3,transparent:true,opacity:.11,side:THREE.DoubleSide,depthWrite:false}));beam.rotation.x=Math.PI/2;beam.rotation.z=-Math.PI/2;beam.position.set(2.7,.0,0);flashlight.add(beam);const flashLamp=new THREE.PointLight(0xffdb94,0,8,2);flashLamp.position.set(.4,1.55,.6);playerRoot.add(flashLamp);

const state={mode:'menu',health:100,stamina:100,light:72,medkits:1,packs:1,scrap:0,lures:3,score:0,distance:0,elapsed:0,worldSpeed:0,velocityY:0,onGround:true,crouched:false,hiding:false,flashOn:false,invuln:0,shake:0,alert:0,threat:0,day:0,hitFlash:0};
const keys={};let last=performance.now(),toastTimer=0,heavyTimer=22,spawnTimer=1.5,enemyId=0,collectibles=[],dinosaurs=[],lures=[],particles=[];
const ui={health:document.querySelector('#health-bar'),stamina:document.querySelector('#stamina-bar'),light:document.querySelector('#light-bar'),hv:document.querySelector('#health-value'),sv:document.querySelector('#stamina-value'),lv:document.querySelector('#light-value'),med:document.querySelector('#med-count'),pack:document.querySelector('#pack-count'),scrap:document.querySelector('#scrap-count'),lure:document.querySelector('#lure-count'),distance:document.querySelector('#distance'),clock:document.querySelector('#clock'),time:document.querySelector('#time-label'),toast:document.querySelector('#toast'),banner:document.querySelector('#threat-banner'),start:document.querySelector('#start-overlay'),end:document.querySelector('#end-overlay'),hud:document.querySelector('#hud')};
function showToast(text){ui.toast.textContent=text;ui.toast.classList.add('show');toastTimer=2.1}
function updateHud(){for(const [bar,val] of [[ui.health,state.health],[ui.stamina,state.stamina],[ui.light,state.light]])bar.style.width=Math.max(0,val)+'%';ui.hv.textContent=Math.ceil(state.health);ui.sv.textContent=Math.ceil(state.stamina);ui.lv.textContent=Math.ceil(state.light);ui.med.textContent=state.medkits;ui.pack.textContent=state.packs;ui.scrap.textContent=String(state.scrap).padStart(2,'0');ui.lure.textContent=state.lures;ui.distance.textContent=String(Math.floor(state.distance)).padStart(4,'0')+' m';}
function makePickup(type,x){const g=group(scene,x,.45,Math.random()*2.2-1.6);const halo=new THREE.Mesh(new THREE.TorusGeometry(.35,.035,6,18),new THREE.MeshBasicMaterial({color:type==='med'?0xeca08b:type==='pack'?0xf0d36e:0xd9dfb1,transparent:true,opacity:.78}));halo.rotation.x=Math.PI/2;g.add(halo);let core;if(type==='med'){core=box(g,mat(0xe9e3ce),0,0,0,.42,.3,.28);box(g,mat(0xc55349),0,0,0,.12,.34,.3);box(g,mat(0xc55349),0,0,0,.38,.12,.3)}else if(type==='pack'){core=box(g,mat(0x756b46),0,0,0,.42,.35,.3);ball(g,mat(0xead276,.4,0,.5),0,.05,.17,.12,.12,.08)}else{core=box(g,mat(0xa6a486,.55,.3),0,0,0,.34,.27,.28);box(g,mat(0x555d52),0,.17,0,.28,.08,.23)}g.userData={type,halo,core,baseY:.45,phase:Math.random()*6};collectibles.push(g);return g}
function spawnPickup(){const t=Math.random();makePickup(t<.25?'med':t<.53?'pack':'scrap',playerRoot.position.x+20+Math.random()*8)}

function makeDino(x,heavy=false){const root=group(scene,x,0,heavy?-.2:0);const skinmat=mat(heavy?0x576450:0x718051,.9),belly=mat(heavy?0x9b9878:0xb4a777),darkskin=mat(heavy?0x3f4a40:0x56643e),eyeMat=mat(0xe3bd68,.35,0,0x80601c);const scale=heavy?1.38:1;
 ball(root,skinmat,0,1.18,0,heavy?1.08:.78,heavy?.65:.5,.48);ball(root,belly,.13,.91,.08,heavy?.76:.56,.26,.4);
 const neck=ball(root,skinmat,heavy?-.68:-.55,1.48,0,heavy?.55:.49,.26,.29);neck.rotation.z=-.16;
 ball(root,skinmat,heavy?-1.03:-.93,1.53,.03,heavy?.43:.37,.2,.25);ball(root,belly,heavy?-1.23:-1.12,1.47,.15,.25,.09,.2);
 for(const side of [-1,1]){ball(root,eyeMat,heavy?-1.06:-.96,1.67,side*.21,.065,.07,.045);ball(root,mat(0x191b15),heavy?-1.08:-.98,1.67,side*.25,.025,.04,.02);}
 const tail=group(root,.55,1.25,0);for(let i=0;i<4;i++){const seg=ball(tail,darkskin,.42+i*.36,-.04-i*.07,0,.48-i*.08,.14-i*.025,.17-i*.03);seg.rotation.z=-.1}
 const legs=[];for(const side of [-1,1]){const leg=group(root,side*.39,.91,0);ball(leg,skinmat,0,-.3,0,.19,.45,.2);ball(leg,skinmat,-.02,-.58,.12,.3,.13,.25);for(let c=0;c<3;c++)ball(leg,belly,-.2,-.62,.2+(c-1)*.08,.12,.04,.035);legs.push(leg)}
 const arms=[];for(const side of [-1,1]){const a=ball(root,skinmat,-.55,1.17,side*.27,.13,.25,.12);a.rotation.z=-.4;arms.push(a)}
 const badge=group(root,0,2.1,.1);const halo2=new THREE.Mesh(new THREE.RingGeometry(.19,.25,20),new THREE.MeshBasicMaterial({color:0x9fe0ad,side:THREE.DoubleSide,transparent:true,opacity:.8}));badge.add(halo2);const dot=ball(badge,mat(0xa0e6aa,.3,0,.6),0,0,0,.075,.075,.035);badge.userData={halo:halo2,dot};
 const d={id:++enemyId,root,legs,arms,tail,heavy,mode:heavy?'charge':'patrol',speed:heavy?2.3:1.55,phase:Math.random()*5,alert:0,attack:0,cooldown:0,stun:0,scale,indicator:badge,disturbX:null};dinosaurs.push(d);return d}
makeDino(11,false);makeDino(25,false);

const heldCodes=new Set(['ArrowLeft','ArrowRight','ArrowDown','Space']);
window.addEventListener('keydown',e=>{if(heldCodes.has(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')jump();if(e.code==='KeyF'){state.flashOn=!state.flashOn;showToast(state.flashOn?'FLASHLIGHT ON':'LIGHTS OUT');}if(e.code==='KeyG')throwLure();if(e.code==='Digit1')useMedkit();if(e.code==='Digit2')usePack();if(e.code==='KeyE'||e.code==='KeyC')tryHide();if(e.code==='KeyS'||e.code==='ArrowDown')state.crouched=true;});
window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyS'||e.code==='ArrowDown')state.crouched=false});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
document.querySelector('#start-button').addEventListener('click',startGame);document.querySelector('#restart-button').addEventListener('click',restartGame);
for(const button of document.querySelectorAll('.mobile-controls button')){const action=button.dataset.action;const down=e=>{e.preventDefault();if(action==='jump')jump();else if(action==='crouch')state.crouched=true;else keys[action==='left'?'ArrowLeft':'ArrowRight']=true};const up=()=>{if(action==='crouch')state.crouched=false;else if(action!=='jump')keys[action==='left'?'ArrowLeft':'ArrowRight']=false};button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('pointerleave',up)}
canvas.addEventListener('pointerdown',()=>{if(state.mode==='playing'&&!state.flashOn){state.flashOn=true;showToast('FLASHLIGHT ON')}});
function startGame(){state.mode='playing';ui.start.classList.add('hidden');document.querySelector('#controls-hint').style.opacity='1';setTimeout(()=>{if(state.mode==='playing')document.querySelector('#controls-hint').style.opacity='.35'},9000);showToast('KEEP MOVING. STAY QUIET.')}
function restartGame(){location.reload()}
function jump(){if(state.mode!=='playing'||!state.onGround||state.crouched)return;state.velocityY=8.6;state.onGround=false;state.hiding=false}
function tryHide(){if(state.mode!=='playing')return;if(!state.onGround){showToast('NEED SOLID GROUND');return}if(Math.abs(state.worldSpeed)>.4&&!state.crouched){showToast('STOP MOVING TO HIDE');return}state.hiding=!state.hiding;state.crouched=state.hiding;showToast(state.hiding?'HIDDEN — HOLD STILL':'BACK INTO THE OPEN')}
function useMedkit(){if(state.mode!=='playing')return;if(!state.medkits){showToast('NO MEDKITS');return}if(state.health>=99){showToast('HEALTH ALREADY FULL');return}state.medkits--;state.health=Math.min(100,state.health+42);updateHud();showToast('FIELD DRESSING APPLIED')}
function usePack(){if(state.mode!=='playing')return;if(!state.packs){showToast('NO LIGHT PACKS');return}state.packs--;state.light=Math.min(100,state.light+55);updateHud();showToast('LIGHT ENERGY RESTORED')}
function throwLure(){if(state.mode!=='playing')return;if(!state.lures){showToast('NO DECOYS LEFT');return}state.lures--;const g=group(scene,playerRoot.position.x+1,1.1,1);const orb=ball(g,mat(0xe1b76a,.35,0,1.1),0,0,0,.16,.16,.16);const glow=new THREE.PointLight(0xffa557,2,4);g.add(glow);lures.push({group:g,x:g.position.x,life:8,orb});updateHud();showToast('DECOY AWAY — MOVE!');for(const d of dinosaurs)if(Math.abs(d.root.position.x-playerRoot.position.x)<15){d.disturbX=g.position.x;d.alert=Math.max(d.alert,.8)}}
function damage(amount,knock=4){if(state.invuln>0||state.mode!=='playing')return;state.health=Math.max(0,state.health-amount);state.invuln=1.35;state.shake=.45;state.hitFlash=.28;state.worldSpeed=-knock;state.velocityY=3.1;state.onGround=false;state.hiding=false;state.crouched=false;showToast('HIT — KEEP GOING');if(state.health<=0)endGame(false);updateHud()}
function endGame(escaped){if(state.mode!=='playing')return;state.mode=escaped?'won':'dead';document.querySelector('#end-title').innerHTML=escaped?'YOU FOUND<br><em>THE BEACON.</em>':'YOU DIDN’T<br><em>MAKE IT OUT.</em>';document.querySelector('#end-copy').textContent=escaped?'Against every odds, you made it through the quarantine line.':'The city keeps what it takes.';document.querySelector('#end-kicker').innerHTML=escaped?'<span class="live-dot"></span> EVACUATION CONFIRMED':'<span class="live-dot"></span> SIGNAL LOST';document.querySelector('#end-distance').innerHTML=Math.floor(state.distance)+' <i>m</i>';document.querySelector('#end-score').textContent=state.score+state.scrap*25;document.querySelector('#end-time').textContent=formatTime(state.elapsed);ui.end.classList.remove('hidden')}
function formatTime(seconds){return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(Math.floor(seconds%60)).padStart(2,'0')}
function collect(g){const t=g.userData.type;if(t==='med'){state.medkits++;showToast('MEDKIT RECOVERED')}else if(t==='pack'){state.packs++;showToast('LIGHT PACK RECOVERED')}else{state.scrap++;state.score+=25;showToast('SCRAP +25')}scene.remove(g);collectibles=collectibles.filter(x=>x!==g);updateHud();const f=document.querySelector('#pickup-flash');f.style.opacity='1';setTimeout(()=>f.style.opacity='0',700)}

// Road markings and streaming scenery keep the run endless until the safe zone.
const roadMarks=[];for(let i=0;i<36;i++){const m=box(world,mat(0xb7b59a),-70+i*4,.04,3,.12,.02,1);roadMarks.push(m)}
function streamScenery(dx){ground.position.x=playerRoot.position.x;const r=world.children.find(o=>o.isMesh&&o.geometry===boxGeo&&o.scale.y===.14);if(r)r.position.x=playerRoot.position.x;for(const m of roadMarks){if(m.position.x<playerRoot.position.x-25)m.position.x+=144}for(const p of props){if(p.x<playerRoot.position.x-28){p.x+=80+Math.random()*18;p.group.position.x=p.x;if(p.type==='lamp'){p.group.position.z=-2}else if(p.type==='car'){p.group.position.z=3+Math.random()*2}else p.group.position.z=-.6}}for(const b of buildings){if(b.x<playerRoot.position.x-50){b.x+=112;b.mesh.position.x=b.x;b.mesh.position.y=b.h/2-1;}}}
function spawnHeavy(){const d=makeDino(playerRoot.position.x+23,true);d.mode='charge';d.alert=1;d.speed=6.5;state.threat=3.4;ui.banner.classList.add('show');showToast('HEAVY MOVEMENT — GET LOW');setTimeout(()=>ui.banner.classList.remove('show'),3200)}
function updateDino(d,dt){const x=d.root.position.x-playerRoot.position.x;d.phase+=dt*(d.heavy?7:8);d.cooldown=Math.max(0,d.cooldown-dt);d.stun=Math.max(0,d.stun-dt);
 const lightDetect=state.flashOn&&state.light>0&&x>0&&x<15;const motionDetect=(!state.hiding&&!state.crouched&&(Math.abs(state.worldSpeed)>1.2||state.flashOn))&&Math.abs(x)<10;const nearDetect=Math.abs(x)<(state.crouched||state.hiding?3.5:6.5);
 if(d.disturbX!==null&&d.alert>.12){d.mode='distracted';if(Math.abs(d.root.position.x-d.disturbX)<.5)d.disturbX=null;}else if(lightDetect||motionDetect||nearDetect){d.alert=Math.min(1,d.alert+dt*(lightDetect?1.8:1));if(d.alert>.5)d.mode='chase'}else{d.alert=Math.max(0,d.alert-dt*.3);if(d.alert<.15&&!d.heavy)d.mode='patrol'}
 let speed=0;if(d.stun<=0){if(d.mode==='chase')speed=(d.heavy?5.4:3.1)*(x>0?1:-.35);else if(d.mode==='distracted')speed=(d.disturbX!==null?Math.sign(d.disturbX-d.root.position.x):1)*(d.heavy?1.5:1.9);else if(d.heavy)speed=x>0?d.speed:0;else speed=.48*Math.sin(d.phase*.18)}
 d.root.position.x-=speed*dt;if(d.mode==='patrol')d.root.position.x+=Math.sin(d.phase*.18)*.12*dt;
 d.root.position.y=Math.max(0,Math.sin(d.phase)*.045);d.legs.forEach((l,i)=>{l.rotation.z=Math.sin(d.phase+(i*Math.PI))*(d.mode==='chase'?-.68:-.36)});d.tail.rotation.y=Math.sin(d.phase*.7)*.18;d.root.rotation.y=speed>0?Math.PI:0;
 d.indicator.position.y=2.1+Math.sin(d.phase*1.6)*.04;const color=d.alert>.65?0xff7357:d.alert>.25?0xffd26d:0x9fe0ad;d.indicator.userData.halo.material.color.setHex(color);d.indicator.userData.dot.material.color.setHex(color);d.indicator.userData.halo.material.opacity=.45+d.alert*.5;
 if(d.stun<=0&&Math.abs(x)<1.15&&state.onGround&&d.cooldown<=0){d.cooldown=d.heavy?1.5:1.05;if(d.heavy){if(state.crouched||state.hiding){d.stun=1.2;d.mode='stun';showToast('CHARGE MISSED — MOVE!')}else damage(32,7)}else if(!state.crouched&&!state.hiding){if(state.velocityY>1.3){d.stun=1.4;state.score+=50;showToast('RAPTOR STUNNED +50')}else damage(19,5)}else{d.alert=Math.max(0,d.alert-.3)}}
 if(d.root.position.x<playerRoot.position.x-23){scene.remove(d.root);dinosaurs=dinosaurs.filter(q=>q!==d)}
}
function update(dt){if(state.mode!=='playing')return;state.elapsed+=dt;state.invuln=Math.max(0,state.invuln-dt);state.hitFlash=Math.max(0,state.hitFlash-dt);state.shake=Math.max(0,state.shake-dt);state.threat=Math.max(0,state.threat-dt);state.day=Math.min(1,state.elapsed/180);
 const left=keys.ArrowLeft||keys.KeyA,right=keys.ArrowRight||keys.KeyD,sprinting=!!(keys.ShiftLeft||keys.ShiftRight)&&right&&!state.crouched&&!state.hiding&&state.stamina>0;
 let target=right?(sprinting?8.2:4.2):left?-3.2:0;if(state.crouched)target*=.55;if(state.hiding)target=0;if(sprinting)state.stamina=Math.max(0,state.stamina-27*dt);else state.stamina=Math.min(100,state.stamina+(state.crouched?12:19)*dt);
 if(state.worldSpeed>0||target>0)state.worldSpeed=THREE.MathUtils.damp(state.worldSpeed,target,6,dt);else state.worldSpeed=THREE.MathUtils.damp(state.worldSpeed,target,8,dt);
 playerRoot.position.x+=state.worldSpeed*dt;playerRoot.position.x=Math.max(-4,playerRoot.position.x);state.distance=Math.max(0,playerRoot.position.x*4.2);state.score+=Math.max(0,state.worldSpeed)*dt*.5;
 state.velocityY-=19*dt;playerRoot.position.y+=state.velocityY*dt;if(playerRoot.position.y<=0){playerRoot.position.y=0;state.velocityY=0;state.onGround=true}else state.onGround=false;
 state.crouched=state.crouched||state.hiding;playerRig.scale.y=THREE.MathUtils.damp(playerRig.scale.y,state.crouched?.68:1,12,dt);playerRig.position.y=state.crouched?0:.03*Math.sin(state.elapsed*(sprinting?17:10))*Math.min(1,Math.abs(state.worldSpeed)/3);legL.rotation.x=Math.sin(state.elapsed*(sprinting?13:8))*Math.min(.48,Math.abs(state.worldSpeed)*.08);legR.rotation.x=-legL.rotation.x;armL.rotation.z=-.1+Math.sin(state.elapsed*8)*.04;armR.rotation.z=.14;
 if(state.flashOn&&state.light>0){state.light=Math.max(0,state.light-5.8*dt);flashLamp.intensity=2.4;beam.visible=true}else{flashLamp.intensity=0;beam.visible=false;if(state.light<100)state.light=Math.min(100,state.light+.35*dt)}if(state.light<=0&&state.flashOn){state.flashOn=false;showToast('LIGHT EXHAUSTED')}
 flashlight.rotation.y=0;state.hiding=state.hiding&&Math.abs(state.worldSpeed)<.5;
 for(const d of [...dinosaurs])updateDino(d,dt);
 for(const g of [...collectibles]){g.position.y=g.userData.baseY+Math.sin(state.elapsed*2.7+g.userData.phase)*.1;g.rotation.y+=dt*.8;g.userData.halo.rotation.z+=dt*.9;if(Math.abs(g.position.x-playerRoot.position.x)<1.1&&Math.abs(g.position.y-(playerRoot.position.y+.55))<1.3)collect(g);if(g.position.x<playerRoot.position.x-20){scene.remove(g);collectibles=collectibles.filter(q=>q!==g)}}
 for(const lure of [...lures]){lure.life-=dt;lure.group.position.y=1.1+Math.sin(state.elapsed*6)*.13;if(lure.life<=0){scene.remove(lure.group);lures=lures.filter(q=>q!==lure)}}
 spawnTimer-=dt;if(spawnTimer<=0){spawnPickup();spawnTimer=4.2+Math.random()*4.5}
 heavyTimer-=dt;if(heavyTimer<=0&&state.distance>25){spawnHeavy();heavyTimer=Math.max(18,34-state.day*10)+Math.random()*8}
 if(state.distance>120&&Math.random()<dt*.018&&dinosaurs.filter(d=>!d.heavy).length<3)makeDino(playerRoot.position.x+16+Math.random()*8,false);
 streamScenery(state.worldSpeed*dt);
 const dusk=state.day;const skyDay=new THREE.Color(0x82958c),skyDusk=new THREE.Color(0x342a3a);scene.background=skyDay.clone().lerp(skyDusk,dusk);scene.fog.color.copy(skyDay).lerp(new THREE.Color(0x59404b),dusk);scene.fog.density=.011+dusk*.007;sun.color.copy(new THREE.Color(0xffdfad).lerp(new THREE.Color(0xff805d),dusk));sun.intensity=3.2-dusk*1.35;fill.intensity=1.3-dusk*.3;renderer.toneMappingExposure=1.15-dusk*.12;
 ui.clock.textContent=String(16+Math.floor(state.elapsed/90)).padStart(2,'0')+':'+String(42+Math.floor((state.elapsed%90)*.2)%60).padStart(2,'0');ui.time.textContent=dusk>.68?'DUSK / HIGH THREAT':dusk>.32?'LATE AFTERNOON':'DAYLIGHT';
 const camX=playerRoot.position.x+2.5+(state.worldSpeed>0?1.1:0);const shake=state.shake?state.shake*7:0;camera.position.x=THREE.MathUtils.damp(camera.position.x,camX,3.8,dt)+(Math.random()-.5)*shake;camera.position.y=5.3+(Math.random()-.5)*shake;camera.lookAt(camera.position.x,3,0);
 // subtle visible flashlight beam and invulnerability flicker
 playerRoot.visible=state.invuln<=0||Math.floor(state.elapsed*16)%2===0;
 const enemyNear=dinosaurs.some(d=>Math.abs(d.root.position.x-playerRoot.position.x)<7&&d.alert>.2);document.querySelector('#crosshair').classList.toggle('on',enemyNear&&state.flashOn);
 if(state.distance>=520){endGame(true)}if(state.elapsed%0.25<dt)updateHud();if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show')}
}
function resize(){const w=window.innerWidth,h=window.innerHeight,aspect=w/h;camera.left=-7*aspect;camera.right=7*aspect;camera.top=7;camera.bottom=-7;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
window.addEventListener('resize',resize);resize();updateHud();
function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);renderer.render(scene,camera);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
