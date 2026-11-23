(() => {
  'use strict';
  const canvas = document.querySelector('#world'), ctx = canvas.getContext('2d');
  const $ = (s) => document.querySelector(s);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rand = (a,b) => a + Math.random()*(b-a);
  let W=innerWidth,H=innerHeight,DPR=1, started=false, paused=false, panelMode='', last=0, gameTime=8.25, toastTimer=0, lastSave=0;
  const player={x:490,y:470,dir:0,targetDir:0,velX:0,velY:0,moveAnim:0,jump:0,gatherAnim:0,state:'idle',speed:160,health:100,hunger:82,thirst:68,stamina:100,wood:0,stone:0,fiber:0,berries:2,coconut:0,meat:0,water:1,axe:true,level:1};
  const inventory={Driftwood:0,Stone:0,PlantFiber:0,Coconut:0,WildBerries:2,CleanWater:1,RawMeat:0,StoneAxe:1,WoodenSpear:0,Bandage:1};
  const keys={}, world={width:1900,height:1400, camera:{x:0,y:0}, objects:[], animals:[], particles:[]};
  const quests=[
    ['A FRESH START','The tide left a few useful things behind. Gather what you can.','Collect driftwood',3,'Driftwood'],
    ['FIND YOUR BEARINGS','You have enough to make a start. Find stones for a simple tool.','Gather smooth stones',3,'Stone'],
    ['A TOOL FOR THE WILD','A sharp edge changes everything. Craft a stone axe.','Craft a stone axe',1,'StoneAxe'],
    ['SHELTER FROM THE STORM','The jungle is beautiful, but night comes quickly.','Craft a basic shelter',1,'Shelter'],
    ['FIRST FLAME','A small fire means warmth, light, and a hot meal.','Build a campfire',1,'Campfire'],
    ['INTO THE GREEN','Follow the trail inland. Something has been here before.','Explore the forest',1,'Explore']
  ]; let questIndex=0,questProgress=0, shelterPlaced=false, campfirePlaced=false;
  const recipes=[
    {name:'Wooden Spear',icon:'⟋',cost:{Driftwood:3,PlantFiber:2},desc:'A reliable tool for keeping danger at a distance.'},
    {name:'Stone Axe',icon:'🪓',cost:{Driftwood:2,Stone:3,PlantFiber:1},desc:'Harvest branches and gather wood more efficiently.'},
    {name:'Stone Knife',icon:'†',cost:{Stone:2,PlantFiber:1},desc:'A sharp edge for gathering and preparing food.'},
    {name:'Campfire',icon:'♨',cost:{Driftwood:5,Stone:3},desc:'Warmth, light, and a place to cook your catch.'},
    {name:'Basic Shelter',icon:'⌂',cost:{Driftwood:8,PlantFiber:5},desc:'A simple palm shelter. Rest safely through the night.'},
    {name:'Bandage',icon:'＋',cost:{PlantFiber:4},desc:'Stop bleeding and restore a little health.'}
  ];
  const input={x:0,y:0,sprint:false};
  function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0)}
  addEventListener('resize',resize);resize();
  function makeWorld(){
    let seed=8731;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    const add=(type,x,y,extra={})=>world.objects.push({type,x,y,active:true,...extra});
    for(let i=0;i<60;i++){let x=160+random()*1530,y=70+random()*1250;if(y>470&&y<590&&x>260&&x<760)continue;let type=random()<.58?'tree':random()<.65?'bush':'fern';add(type,x,y,{scale:.7+random()*.8,variant:Math.floor(random()*4)})}
    for(let i=0;i<14;i++)add('driftwood',210+random()*900,500+random()*310,{scale:.7+random()*.6});
    for(let i=0;i<23;i++)add('stone',300+random()*1250,350+random()*850,{scale:.65+random()*.55});
    for(let i=0;i<13;i++)add('berry',650+random()*850,320+random()*850,{scale:.8+random()*.4});
    for(let i=0;i<7;i++)add('coconut',260+random()*600,200+random()*450,{scale:.8});
    add('wreck',320,410,{scale:1.15});
    for(let i=0;i<4;i++)world.animals.push({x:900+random()*500,y:380+random()*480,phase:random()*7,alive:true,health:30,hitCooldown:0,fleeX:0,fleeY:0});
  }
  makeWorld();
  function project(x,y){return {x:x-world.camera.x+W/2,y:y-world.camera.y+H/2}}
  function ellipse(x,y,rx,ry,color,alpha=1){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fill()}
  function drawGround(){
    const ox=W/2-world.camera.x,oy=H/2-world.camera.y;
    ctx.fillStyle='#689584';ctx.fillRect(0,0,W,H);
    // Ocean occupies the western and lower shore; layered bands make the coastline feel alive.
    ctx.fillStyle='#3f7777';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(220+ox*.04,0);ctx.lineTo(270+ox*.12,300+oy*.05);ctx.lineTo(360+ox*.16,570+oy*.04);ctx.lineTo(210+ox*.15,850+oy*.05);ctx.lineTo(0,960+oy*.05);ctx.closePath();ctx.fill();
    ctx.fillStyle='#518986';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(190+ox*.04,0);ctx.lineTo(235+ox*.12,300+oy*.05);ctx.lineTo(325+ox*.16,570+oy*.04);ctx.lineTo(175+ox*.15,850+oy*.05);ctx.lineTo(0,960+oy*.05);ctx.closePath();ctx.fill();
    // Warm sandy shelf that curves along the crash beach.
    ctx.fillStyle='#d2bd8c';ctx.beginPath();ctx.moveTo(0,760+oy*.05);ctx.lineTo(175+ox*.15,850+oy*.05);ctx.lineTo(325+ox*.16,570+oy*.04);ctx.lineTo(235+ox*.12,300+oy*.05);ctx.lineTo(190+ox*.04,0);ctx.lineTo(465+ox*.04,0);ctx.lineTo(500+ox*.13,330+oy*.05);ctx.lineTo(540+ox*.18,590+oy*.04);ctx.lineTo(385+ox*.15,910+oy*.05);ctx.lineTo(0,1080+oy*.06);ctx.closePath();ctx.fill();
    ctx.fillStyle='#809b6d';ctx.beginPath();ctx.moveTo(430+ox*.04,0);ctx.lineTo(W+300,0);ctx.lineTo(W+400,H+300);ctx.lineTo(400+ox*.18,1050+oy*.05);ctx.lineTo(540+ox*.18,590+oy*.04);ctx.lineTo(500+ox*.13,330+oy*.05);ctx.closePath();ctx.fill();
    // Distant green ridgeline gives the inland canopy a layered horizon.
    ctx.fillStyle='#66825e';ctx.beginPath();ctx.moveTo(465+ox*.18,0);ctx.lineTo(W+200,0);ctx.lineTo(W+200,155+oy*.1);ctx.lineTo(890+ox*.16,175+oy*.1);ctx.lineTo(800+ox*.16,138+oy*.1);ctx.lineTo(740+ox*.16,170+oy*.1);ctx.lineTo(655+ox*.16,125+oy*.1);ctx.lineTo(590+ox*.16,168+oy*.1);ctx.lineTo(520+ox*.16,129+oy*.1);ctx.closePath();ctx.fill();
    // Gentle grass patches and scattered ground color.
    for(let i=0;i<48;i++){let x=(i*173+80+ox*.12)% (W+160)-80,y=(i*97+65+oy*.09)%(H+140)-70;ellipse(x,y,12+(i*17%37),7+(i*11%16),i%3?'#91a879':'#718f65',.16)}
    // Surf foam and tide strokes.
    ctx.lineWidth=2;for(let i=0;i<15;i++){let yy=(i*64+oy*.22)%(H+70)-30;ctx.strokeStyle=`rgba(224,235,211,${.14+(i%3)*.035})`;ctx.beginPath();ctx.moveTo(0,yy);ctx.bezierCurveTo(100,yy-12,180,yy+18,285,yy+8);ctx.stroke()}
    // beach pebbles
    for(let i=0;i<32;i++){let x=(i*83+ox*.17+70)%(W+60)-30,y=(i*61+oy*.15+90)%(H+100)-50;ellipse(x,y,2+(i%3),1.5,'#786f54',.23)}
  }
  function drawTree(o){let p=project(o.x,o.y),s=o.scale;ellipse(p.x+8*s,p.y+5*s,29*s,10*s,'#1d3c31',.24);ctx.fillStyle='#654d37';ctx.beginPath();ctx.moveTo(p.x-6*s,p.y);ctx.lineTo(p.x-4*s,p.y-52*s);ctx.lineTo(p.x+5*s,p.y-54*s);ctx.lineTo(p.x+9*s,p.y);ctx.fill();
    const leaves=['#315b45','#3b6a4e','#477953','#294f40'][o.variant];ellipse(p.x,p.y-59*s,34*s,37*s,leaves);ellipse(p.x-20*s,p.y-46*s,24*s,29*s,['#3d704d','#456e4e','#4e8055'][o.variant%3]);ellipse(p.x+20*s,p.y-49*s,23*s,30*s,['#315b45','#557b4c','#38684d'][o.variant%3]);ellipse(p.x-8*s,p.y-74*s,20*s,22*s,'rgba(151,177,106,.23)');
    if(o.type==='tree'&&o.variant===0){for(let j=0;j<3;j++){let cx=p.x-24*s+j*21*s;ctx.strokeStyle='#495f3b';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(p.x,p.y-70*s);ctx.quadraticCurveTo(cx,p.y-104*s,cx,p.y-125*s);ctx.stroke();ellipse(cx,p.y-126*s,8*s,17*s,'#395f42')}}
  }
  function drawObject(o){if(!o.active&&o.type!=='site')return;let p=project(o.x,o.y),s=o.scale||1;switch(o.type){
    case'tree':drawTree(o);break;
    case'bush':ellipse(p.x,p.y+5,23*s,9*s,'#294a37',.24);ellipse(p.x,p.y-7*s,18*s,15*s,['#416d46','#517b4d','#3c6846'][o.variant%3]);ellipse(p.x-12*s,p.y-3*s,12*s,11*s,'#58804b');for(let i=0;i<3;i++)ellipse(p.x-8*s+i*10*s,p.y-8*s,2.4,2.4,'#b95d48');break;
    case'fern':ellipse(p.x,p.y,13*s,5*s,'#314b39',.2);for(let i=0;i<5;i++){ctx.strokeStyle='#477550';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo(p.x+(i-2)*11*s,p.y-15*s,p.x+(i-2)*14*s,p.y-31*s);ctx.stroke();ellipse(p.x+(i-2)*14*s,p.y-26*s,5*s,10*s,'#608950')}break;
    case'driftwood':ellipse(p.x,p.y+6,25*s,6*s,'#695843',.22);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.16);ctx.fillStyle='#a8875c';ctx.beginPath();ctx.roundRect(-22*s,-4*s,45*s,9*s,4*s);ctx.fill();ctx.strokeStyle='#ceb484';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-17*s,-1*s);ctx.lineTo(15*s,-1*s);ctx.stroke();ctx.restore();break;
    case'stone':ellipse(p.x,p.y+5,17*s,7*s,'#4c5449',.22);polygon([[p.x-13*s,p.y],[p.x-8*s,p.y-12*s],[p.x+2*s,p.y-17*s],[p.x+13*s,p.y-7*s],[p.x+12*s,p.y+2*s]],'#848a79');polygon([[p.x-8*s,p.y-12*s],[p.x+2*s,p.y-17*s],[p.x+13*s,p.y-7*s],[p.x+2*s,p.y-7*s]],'#a7a48a');break;
    case'berry':ellipse(p.x,p.y+4,18*s,7*s,'#314d38',.22);ellipse(p.x,p.y-4,17*s,11*s,'#52794a');for(let i=0;i<4;i++)ellipse(p.x-9*s+i*6*s,p.y-8*s,2.5*s,2.5*s,'#c45b51');break;
    case'coconut':ellipse(p.x,p.y+3,11*s,4*s,'#465b39',.2);ellipse(p.x,p.y-5,8*s,8*s,'#796344');ellipse(p.x-2*s,p.y-7*s,3*s,3*s,'#9b8052');break;
    case'wreck':drawWreck(p);break;
    case'site':if(o.site==='fire'){ellipse(p.x,p.y+5,18,8,'#283128',.3);ctx.strokeStyle='#66513b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x-10,p.y+3);ctx.lineTo(p.x+10,p.y-2);ctx.moveTo(p.x-8,p.y-3);ctx.lineTo(p.x+9,p.y+4);ctx.stroke();ellipse(p.x,p.y-7,5,9,'#ed984f',.75);ellipse(p.x,p.y-9,2,5,'#ffdc8a',.9)}else{ellipse(p.x,p.y+6,30,7,'#2d3e2d',.25);polygon([[p.x-28,p.y+3],[p.x-20,p.y-21],[p.x+19,p.y-21],[p.x+29,p.y+3]],'#99734d');polygon([[p.x-24,p.y-18],[p.x,p.y-39],[p.x+24,p.y-18]],'#69563f');ctx.fillStyle='#374238';ctx.fillRect(p.x-5,p.y-15,11,17)}break;
  }}
  function drawWreck(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.24);ellipse(0,9,83,15,'#354136',.26);polygon([[-75,-8],[-59,-23],[55,-25],[78,-13],[57,8],[-57,14]],'#c3b9a2');polygon([[-58,-17],[45,-20],[65,-10],[-52,-3]],'#ddd3b9');polygon([[-13,-24],[4,-33],[39,-48],[46,-42],[17,-19]],'#aba58e');polygon([[-23,-24],[-40,-41],[-47,-37],[-35,-21]],'#98937e');ctx.strokeStyle='#817b68';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-53,-8);ctx.lineTo(55,-11);ctx.moveTo(5,-20);ctx.lineTo(10,4);ctx.stroke();polygon([[-62,0],[-45,3],[-38,20],[-60,15]],'#716e60');ctx.restore()}
  function drawAnimal(a,t){if(!a.alive)return;let p=project(a.x+Math.sin(t+a.phase)*12,a.y+Math.cos(t*.7+a.phase)*8);ellipse(p.x,p.y+5,16,6,'#293b2e',.24);ellipse(p.x,p.y-5,11,7,'#8a7959');ellipse(p.x+10,p.y-9,6,6,'#907d5c');ctx.strokeStyle='#544938';ctx.lineWidth=2;for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(p.x+i*7,p.y);ctx.lineTo(p.x+i*8,p.y+9);ctx.stroke()}ctx.beginPath();ctx.moveTo(p.x+8,p.y-14);ctx.lineTo(p.x+12,p.y-22);ctx.lineTo(p.x+15,p.y-14);ctx.stroke()}
  function drawPlayer(){
    let p=project(player.x,player.y), t=performance.now()/1000;
    let moving=Math.hypot(player.velX,player.velY)>8;
    let speedPhase=player.moveAnim;
    let jumpLift=player.jump>0?Math.sin(Math.min(1,player.jump)*Math.PI)*9:0;
    let legSwing=moving?Math.sin(speedPhase)*4:Math.sin(t*1.35)*.7;
    let armSwing=moving?Math.sin(speedPhase+Math.PI)*4:Math.sin(t*1.35+1)*.8;
    let breath=Math.sin(t*2.1)*.8;
    ellipse(p.x,p.y+10+jumpLift*.12,15-jumpLift*.15,6,'#1b2c25',.34);
    ctx.save();ctx.translate(p.x,p.y-jumpLift);ctx.rotate(player.dir);
    ellipse(-2,-1+breath,8,11,'#46513d');
    polygon([[-8,-7],[-2,-10],[5,-8],[9,4],[4,10],[-6,8]],'#647044');
    polygon([[-6,-8],[3,-8],[6,4],[-5,5]],'#b7a16e');
    ctx.strokeStyle='#dec99a';ctx.lineWidth=1;ctx.beginPath();
    ctx.moveTo(-5,-5);ctx.lineTo(-6+armSwing,-6);ctx.moveTo(5,-5);ctx.lineTo(6-armSwing,-6);ctx.stroke();
    ellipse(0,-10+breath*.25,5.5,6,'#b88260');ellipse(1,-12,6,4,'#342c25');ellipse(2,-11,2,1.5,'#201e1a');
    ctx.strokeStyle='#e3c18a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(4,-11);ctx.lineTo(5,-10);ctx.stroke();
    polygon([[-7,6],[-1+legSwing*.25,6],[-2+legSwing,15],[-7+legSwing,15]],'#473b30');
    polygon([[0-legSwing*.25,6],[6,6],[7-legSwing,15],[1-legSwing,15]],'#493b2c');
    ctx.fillStyle='#282921';ctx.fillRect(-8+legSwing,14,7,3);ctx.fillRect(1-legSwing,14,8,3);
    ctx.restore();
  }
  function nearObject(){let best=null,dist=83;for(const o of world.objects){if(!o.active)continue;let d=Math.hypot(o.x-player.x,o.y-player.y);if(d<dist){best=o;dist=d}}return best}
  function render(t){drawGround();for(const o of world.objects)drawObject(o);for(const a of world.animals)drawAnimal(a,t);drawPlayer();
    // soft day-night color grade
    let hour=gameTime%24,night=hour<5.5||hour>19.5;let alpha=night?.42:hour<7?.18:hour>17?.15:0;if(alpha){ctx.fillStyle=`rgba(18,35,57,${alpha})`;ctx.fillRect(0,0,W,H)}
    if(hour>18.3||hour<5.7){ctx.fillStyle='rgba(9,18,28,.26)';ctx.fillRect(0,0,W,H)}
    const target=nearObject(),hint=$('#interaction');if(started&&target&&!paused){let names={driftwood:'COLLECT DRIFTWOOD',stone:'GATHER STONE',berry:'PICK WILD BERRIES',coconut:'COLLECT COCONUT',tree:'CHOP TREE',bush:'GATHER PLANT FIBER',wreck:'SEARCH WRECKAGE',fern:'GATHER PLANT FIBER'};$('#interaction-label').textContent=names[target.type]||'INTERACT';hint.classList.add('show')}else hint.classList.remove('show');
  }
  function toast(text){$('#toast-text').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2100)}
  function objective(){if(questIndex>=quests.length){$('#quest-title').textContent='THE ISLAND AWAITS';$('#quest-description').textContent='Make this island your own. The story is just beginning.';$('#objective-text').textContent='Explore, gather, survive';$('#objective-progress').textContent='∞';return}$('#quest-title').textContent=quests[questIndex][0];$('#quest-description').textContent=quests[questIndex][1];$('#objective-text').textContent=quests[questIndex][2];$('#objective-progress').textContent=`${questProgress} / ${quests[questIndex][3]}`}
  function updateHud(){for(const [key,val] of [['health',player.health],['hunger',player.hunger],['thirst',player.thirst],['stamina',player.stamina]]){$(`#${key}-value`).textContent=`${Math.round(val)}%`;$(`#${key}-meter`).style.width=`${val}%`}
    let h=Math.floor(gameTime)%24,m=Math.floor((gameTime%1)*60);$('#clock').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;$('#day-count').textContent=String(1+Math.floor(gameTime/24)).padStart(2,'0');$('#weather-name').textContent=h>19||h<5?'MOONLIT NIGHT':'CLEAR SKIES';$('#weather-icon').textContent=h>19||h<5?'☾':'☀';objective();
    let slots=document.querySelectorAll('.hotbar-slot');slots[0].querySelector('small').textContent=inventory.StoneAxe?'STONE AXE':'EMPTY';slots[1].querySelector('small').textContent=inventory.WoodenSpear?'WOODEN SPEAR':'EMPTY';slots[2].querySelector('small').textContent=`BERRIES ×${inventory.WildBerries||0}`;slots[3].querySelector('small').textContent=`BANDAGE ×${inventory.Bandage||0}`;
  }
  function advanceQuest(kind){if(questIndex>=quests.length)return;const q=quests[questIndex];if(kind===q[4]){questProgress++;if(questProgress>=q[3]){toast(`Journal updated · ${q[0]}`);questIndex++;questProgress=0;if(questIndex>=quests.length){$('#quest-title').textContent='THE ISLAND AWAITS';$('#quest-description').textContent='Make this island your own. The story is just beginning.';$('#objective-text').textContent='Explore, gather, survive';$('#objective-progress').textContent='∞'}}}}
  function gather(){const o=nearObject();if(!o){toast('Nothing close enough to collect');return}o.active=false;switch(o.type){case'driftwood':inventory.Driftwood++;toast('Driftwood collected');advanceQuest('Driftwood');break;case'stone':inventory.Stone++;toast('Smooth stone collected');advanceQuest('Stone');break;case'berry':inventory.WildBerries+=2;toast('Wild berries ×2');break;case'coconut':inventory.Coconut++;toast('Coconut collected');break;case'tree':inventory.Driftwood+=inventory.StoneAxe?3:1;toast(inventory.StoneAxe?'Chopped wood ×3':'Branch collected');break;case'bush':case'fern':inventory.PlantFiber+=2;toast('Plant fiber ×2');break;case'wreck':inventory.Driftwood+=2;inventory.CleanWater++;inventory.Bandage++;toast('Wreckage searched · useful supplies found');break;}updateHud();save(false)}
  function move(dt){
    if(!started||paused||$('#panel-backdrop').classList.contains('open'))return;
    // Touch input is quantized into four stable axes plus diagonals.  This prevents
    // tiny thumb corrections from continuously spinning the character.
    let x=input.x,y=input.y,mag=Math.hypot(x,y);
    if(mag>0.18){
      x/=mag;y/=mag;
      const sectors=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      let angle=Math.atan2(y,x),octant=Math.round(angle/(Math.PI/4));
      if(octant<0)octant+=8;octant%=8;
      const a=Math.cos(octant*Math.PI/4),b=Math.sin(octant*Math.PI/4);
      x=Math.abs(a)<.5?0:(a>0?1:-1);y=Math.abs(b)<.5?0:(b>0?1:-1);
      if(!x&&!y)return;
      const running=input.sprint;
      const targetSpeed=player.speed*(running?1.52:1);
      player.velX+=(x*targetSpeed-player.velX)*Math.min(1,dt*8);
      player.velY+=(y*targetSpeed-player.velY)*Math.min(1,dt*8);
      player.x=clamp(player.x+player.velX*dt,35,world.width-35);
      player.y=clamp(player.y+player.velY*dt,35,world.height-35);
      player.targetDir=Math.atan2(player.velY,player.velX);
      let diff=((player.targetDir-player.dir+Math.PI*3)%(Math.PI*2))-Math.PI;
      player.dir+=diff*Math.min(1,dt*10);
      player.moveAnim+=dt*(running?12:8);
      player.state=running?'sprint':'walk';
      player.stamina=clamp(player.stamina-(running?22*dt:0)+(!running?11*dt:0),0,100);
    }else{
      player.velX*=Math.pow(.0008,dt);player.velY*=Math.pow(.0008,dt);
      player.state='idle';player.stamina=clamp(player.stamina+14*dt,0,100);
    }
    if(player.jump>0)player.jump=Math.max(0,player.jump-dt*1.8);
    if(player.gatherAnim>0)player.gatherAnim=Math.max(0,player.gatherAnim-dt*2);
    world.camera.x+=(player.x-world.camera.x)*Math.min(1,dt*4.5);world.camera.y+=(player.y-world.camera.y)*Math.min(1,dt*4.5);
  }
  function updateAnimals(dt){for(const a of world.animals){if(!a.alive)continue;a.hitCooldown=Math.max(0,(a.hitCooldown||0)-dt);const dx=a.x-player.x,dy=a.y-player.y,d=Math.hypot(dx,dy)||1;if(d<110){a.fleeX=(dx/d)*52;a.fleeY=(dy/d)*52}else if(d>220){a.fleeX+=(rand(-8,8)-a.fleeX)*dt*.7;a.fleeY+=(rand(-8,8)-a.fleeY)*dt*.7}else{a.fleeX*=.82;a.fleeY*=.82}a.x=clamp(a.x+a.fleeX*dt,220,world.width-35);a.y=clamp(a.y+a.fleeY*dt,120,world.height-35)}}
  function attack(){let best=null,bestDist=70;for(const a of world.animals){if(!a.alive)continue;const d=Math.hypot(a.x-player.x,a.y-player.y);if(d<bestDist){best=a;bestDist=d}}if(!best){toast('Swing — no target in reach');return}const damage=inventory.WoodenSpear?24:inventory.StoneKnife?18:inventory.StoneAxe?14:8;if(best.hitCooldown>0)return;best.hitCooldown=.35;best.health=(best.health||30)-damage;if(best.health<=0){best.alive=false;inventory.RawMeat=(inventory.RawMeat||0)+2;toast('Animal defeated · Raw meat ×2')}else toast('Hit · animal is fleeing');updateHud();save(false)}
  function update(dt){if(started&&!paused){move(dt);gameTime+=dt*.018;player.hunger=clamp(player.hunger-dt*.032,0,100);player.thirst=clamp(player.thirst-dt*.047,0,100);if(player.hunger===0||player.thirst===0)player.health=clamp(player.health-dt*.8,0,100);if(player.health<=0){toast('You are exhausted. Find food and water to recover.');player.health=30;player.hunger=30;player.thirst=30}updateAnimals(dt);updateHud();if(Date.now()-lastSave>45000){save(false);lastSave=Date.now()}}}
  function loop(now){let dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);render(now/1000);requestAnimationFrame(loop)}requestAnimationFrame(loop);
  function save(show=true){try{localStorage.setItem('wild-survival-save',JSON.stringify({player,inventory,questIndex,questProgress,gameTime,shelterPlaced,campfirePlaced,x:player.x,y:player.y}));if(show)toast('Journey saved on this device')}catch(e){if(show)toast('Could not save this journey')}}
  function load(){try{const d=JSON.parse(localStorage.getItem('wild-survival-save')||'null');if(!d)return false;Object.assign(player,d.player||{});Object.assign(inventory,d.inventory||{});questIndex=d.questIndex||0;questProgress=d.questProgress||0;gameTime=d.gameTime||8.25;shelterPlaced=!!d.shelterPlaced;campfirePlaced=!!d.campfirePlaced;if(d.x){player.x=d.x;player.y=d.y;world.camera.x=player.x;world.camera.y=player.y}updateHud();return true}catch(e){return false}}
  function begin(){started=true;paused=false;$('#main-menu').classList.add('hidden');if(!load()){gameTime=8.25;toast('You made it to shore. Start by gathering driftwood.')}else toast('Journey resumed');updateHud()}
  function panelOpen(mode){panelMode=mode;const backdrop=$('#panel-backdrop'),body=$('#panel-content');backdrop.classList.add('open');let html='';
    if(mode==='inventory'){
      const items=[['🪵','Driftwood','Driftwood',inventory.Driftwood,'Useful building material'],['◈','Stone','Stone',inventory.Stone,'Gathered from the shore'],['🌿','Plant Fiber','PlantFiber',inventory.PlantFiber,'Flexible natural cordage'],['🥥','Coconut','Coconut',inventory.Coconut,'Food and fresh water'],['🫐','Wild Berries','WildBerries',inventory.WildBerries,'A little nourishment'],['◉','Clean Water','CleanWater',inventory.CleanWater,'Safe drinking water'],['🪓','Stone Axe','StoneAxe',inventory.StoneAxe,'A sturdy gathering tool'],['＋','Bandage','Bandage',inventory.Bandage,'Stops bleeding and heals']];
      html=`<span class="eyebrow">ALEX CARTER · FIELD KIT</span><h2>INVENTORY</h2><p class="panel-sub">Your pack · ${Object.values(inventory).reduce((a,b)=>a+(Number(b)||0),0)} items · 18 kg capacity</p><div class="panel-tabs"><button class="panel-tab active">ALL ITEMS</button><button class="panel-tab">TOOLS</button><button class="panel-tab">FOOD</button><button class="panel-tab">MATERIALS</button></div><div class="item-grid">${items.map(i=>`<div class="item-card" data-item="${i[2]}"><span class="item-emoji">${i[0]}</span><div><strong>${i[1]} <span style="color:#dfbd78">×${i[3]||0}</span></strong><small>${i[4]}</small></div></div>`).join('')}</div><p class="panel-note">Select food or water to use it. Your field kit stays with you wherever you roam.</p>`;
    }else if(mode==='crafting'){
      html=`<span class="eyebrow">FIELD CRAFTING</span><h2>CRAFTING</h2><p class="panel-sub">Make what you need from what the island provides.</p><div class="panel-tabs"><button class="panel-tab active">SURVIVAL</button><button class="panel-tab">TOOLS</button><button class="panel-tab">SHELTER</button><button class="panel-tab">MEDICAL</button></div><div class="recipe-list">${recipes.map((r,i)=>`<div class="recipe"><span class="recipe-icon">${r.icon}</span><div class="recipe-info"><b>${r.name}</b><small>${r.desc}<br>Requires ${Object.entries(r.cost).map(([k,v])=>`${v} ${k}`).join(' · ')}</small></div><button class="craft-button" data-craft="${i}">CRAFT</button></div>`).join('')}</div>`;
    }else if(mode==='build'){
      html=`<span class="eyebrow">MAKE A PLACE OF YOUR OWN</span><h2>BUILD</h2><p class="panel-sub">Choose a structure. Materials are used from your pack.</p><div class="recipe-list"><div class="recipe"><span class="recipe-icon">⌂</span><div class="recipe-info"><b>Basic palm shelter</b><small>Driftwood ×8 · Plant Fiber ×5<br>A safe place to rest and plan.</small></div><button class="craft-button" data-build="shelter" ${shelterPlaced?'disabled':''}>${shelterPlaced?'BUILT':'BUILD'}</button></div><div class="recipe"><span class="recipe-icon">♨</span><div class="recipe-info"><b>Beach campfire</b><small>Driftwood ×5 · Stone ×3<br>Cook food and keep the night at bay.</small></div><button class="craft-button" data-build="fire" ${campfirePlaced?'disabled':''}>${campfirePlaced?'BUILT':'BUILD'}</button></div></div><p class="panel-note">Structures are placed at your current location. Find an open patch of ground first.</p>`;
    }else if(mode==='map'){
      html=`<span class="eyebrow">YOUR EXPEDITION</span><h2>ISLAND MAP</h2><p class="panel-sub">The shoreline is only the beginning. Keep exploring to reveal more.</p><div style="height:270px;position:relative;overflow:hidden;background:linear-gradient(130deg,#397674 0 23%,#d1bd8d 23% 38%,#718c64 38% 100%);border:1px solid rgba(238,231,207,.2)"><div style="position:absolute;left:28%;top:37%;font-size:24px">✈</div><div style="position:absolute;left:34%;top:53%;width:9px;height:9px;border-radius:50%;background:#e8c67d;box-shadow:0 0 13px #e8c67d"></div><span style="position:absolute;left:6%;top:10%;font:10px var(--display);letter-spacing:1px">OPEN OCEAN</span><span style="position:absolute;left:42%;top:60%;font:10px var(--display);letter-spacing:1px">CRASH BEACH</span><span style="position:absolute;right:9%;top:20%;font:10px var(--display);letter-spacing:1px">GREEN FOREST</span><span style="position:absolute;right:7%;bottom:11%;font:10px var(--display);letter-spacing:1px">UNKNOWN</span></div><p class="panel-note">⌖ You are here · ✈ Crash site · Map discoveries are saved automatically.</p>`;
    }else if(mode==='missions'){
      html=`<span class="eyebrow">FIELD NOTES</span><h2>SURVIVAL JOURNAL</h2><p class="panel-sub">One step at a time. Stay alive, and the island will tell its story.</p><div class="recipe-list">${quests.map((q,i)=>`<div class="recipe"><span class="recipe-icon" style="color:${i<questIndex?'#b8c982':i===questIndex?'#e4c27d':'#788577'}">${i<questIndex?'✓':String(i+1).padStart(2,'0')}</span><div class="recipe-info"><b>${q[0]}</b><small>${i<questIndex?'Complete':i===questIndex?`${q[2]} · ${questProgress}/${q[3]}`:'Not yet discovered'}</small></div></div>`).join('')}</div>`;
    }else if(mode==='settings'){
      html=`<span class="eyebrow">MAKE IT YOURS</span><h2>SETTINGS</h2><p class="panel-sub">Adjust your island experience. Changes are saved on this device.</p><div class="stat-line"><label>CAMERA SENSITIVITY</label><input type="range" min="1" max="10" value="5"></div><div class="stat-line"><label>JOYSTICK SIZE</label><input type="range" min="1" max="10" value="6"></div><div class="stat-line"><label>MASTER VOLUME</label><input type="range" min="0" max="10" value="7"></div><div class="stat-line"><label>GRAPHICS QUALITY</label><select style="flex:1;background:#21342b;color:#f0ead8;border:1px solid #536154;padding:8px"><option>Balanced</option><option>Performance</option><option>High quality</option></select></div><p class="panel-note">Wild Survival is a single-player offline experience. Your progress is saved locally.</p>`;
    }
    body.innerHTML=html;body.querySelectorAll('[data-craft]').forEach(b=>{let r=recipes[+b.dataset.craft];b.disabled=!canAfford(r.cost);b.onclick=()=>craft(r)});body.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>build(b.dataset.build));body.querySelectorAll('[data-item]').forEach(el=>el.onclick=()=>useItem(el.dataset.item));body.querySelectorAll('.panel-tab').forEach(tab=>tab.onclick=()=>{body.querySelectorAll('.panel-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active')});
  }
  function canAfford(cost){return Object.entries(cost).every(([k,v])=>(inventory[k]||0)>=v)}
  function spend(cost){for(const [k,v]of Object.entries(cost))inventory[k]-=v}
  function craft(r){if(!canAfford(r.cost)){toast('Not enough materials yet');return}spend(r.cost);if(r.name==='Stone Axe'){inventory.StoneAxe=(inventory.StoneAxe||0)+1;advanceQuest('StoneAxe')}else if(r.name==='Wooden Spear')inventory.WoodenSpear=(inventory.WoodenSpear||0)+1;else if(r.name==='Stone Knife')inventory.StoneKnife=(inventory.StoneKnife||0)+1;else if(r.name==='Campfire'){inventory.Campfire=(inventory.Campfire||0)+1;campfirePlaced=true;advanceQuest('Campfire')}else if(r.name==='Basic Shelter'){inventory.Shelter=(inventory.Shelter||0)+1;shelterPlaced=true;advanceQuest('Shelter')}else if(r.name==='Bandage')inventory.Bandage=(inventory.Bandage||0)+1;toast(`${r.name} crafted`);panelOpen('crafting');updateHud();save(false)}
  function build(what){let cost=what==='fire'?{Driftwood:5,Stone:3}:{Driftwood:8,PlantFiber:5};if(!canAfford(cost)){toast('Not enough materials yet');return}spend(cost);const x=player.x+Math.cos(player.dir)*52,y=player.y+Math.sin(player.dir)*52;world.objects.push({type:'site',site:what,x,y,scale:1,active:true});if(what==='fire'){campfirePlaced=true;advanceQuest('Campfire')}else{shelterPlaced=true;advanceQuest('Shelter')}toast(what==='fire'?'Campfire built':'Shelter built · a safe place to rest');panelOpen('build');updateHud();save(false)}
  function useItem(name){if(name==='WildBerries'&&inventory.WildBerries>0){inventory.WildBerries--;player.hunger=clamp(player.hunger+20,0,100);toast('Berries eaten · nourishment restored')}else if(name==='Coconut'&&inventory.Coconut>0){inventory.Coconut--;player.hunger=clamp(player.hunger+12,0,100);player.thirst=clamp(player.thirst+28,0,100);toast('Fresh coconut · hunger and thirst restored')}else if(name==='CleanWater'&&inventory.CleanWater>0){inventory.CleanWater--;player.thirst=clamp(player.thirst+38,0,100);toast('Clean water · hydration restored')}else if(name==='Bandage'&&inventory.Bandage>0){inventory.Bandage--;player.health=clamp(player.health+35,0,100);toast('Bandage applied · health restored')}else{toast('Nothing to use')}updateHud();panelOpen('inventory');save(false)}

  // Keyboard and mouse movement are intentionally disabled for the mobile-first game.
  document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>panelOpen(b.dataset.panel)));
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',(e)=>{e.preventDefault();const action=b.dataset.action;if(action==='interact'){player.gatherAnim=.8;gather()}if(action==='jump'&&player.jump<=0){player.jump=1;player.state='jump'}if(action==='sprint')input.sprint=true;if(action==='attack'){player.state='attack';player.gatherAnim=.5;const o=nearObject();if(o&&(o.type==='bush'||o.type==='tree'||o.type==='fern'))gather()}}));
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerup',(e)=>{e.preventDefault();if(b.dataset.action==='sprint')input.sprint=false}));
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointercancel',()=>{if(b.dataset.action==='sprint')input.sprint=false}));
  $('#pause-button').addEventListener('click',()=>{if(!started)return;paused=!paused;$('#pause-overlay').classList.toggle('show',paused)});
  $('#resume-game').addEventListener('click',()=>{paused=false;$('#pause-overlay').classList.remove('show')});
  $('#new-game').addEventListener('click',()=>{try{localStorage.removeItem('wild-survival-save')}catch(e){};begin()});
  $('#continue-game').addEventListener('click',()=>begin());
  $('#save-game').addEventListener('click',()=>{save(true);paused=false;$('#pause-overlay').classList.remove('show')});
  $('#panel-close').addEventListener('click',()=>$('#panel-backdrop').classList.remove('open'));
  $('#panel-backdrop').addEventListener('click',(e)=>{if(e.target===e.currentTarget)e.currentTarget.classList.remove('open')});

  const joystick=$('#joystick'),knob=$('#joy-knob');let stick=null;
  function stickMove(e){
    if(!stick)return;
    const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy;
    const len=Math.hypot(dx,dy),limit=r.width*.34;
    if(len>limit){dx=dx/len*limit;dy=dy/len*limit}
    const dead=.14;
    let nx=Math.abs(dx/limit)<dead?0:dx/limit,ny=Math.abs(dy/limit)<dead?0:dy/limit;
    const snap=Math.SQRT1_2;
    if(nx&&ny){nx=Math.abs(nx)>snap?.707:(nx>0?.707:-.707);ny=Math.abs(ny)>snap?.707:(ny>0?.707:-.707)}
    knob.style.transform=`translate(${nx*limit}px,${ny*limit}px)`;
    input.x=nx;input.y=ny;
  }
  joystick.addEventListener('pointerdown',(e)=>{stick=e.pointerId;joystick.setPointerCapture(e.pointerId);stickMove(e)});
  joystick.addEventListener('pointermove',stickMove);
  function stickEnd(e){if(stick!==e.pointerId)return;stick=null;knob.style.transform='translate(0,0)';input.x=0;input.y=0}
  joystick.addEventListener('pointerup',stickEnd);joystick.addEventListener('pointercancel',stickEnd);

  if(localStorage.getItem('wild-survival-save'))$('#continue-game').style.display='block';else $('#continue-game').style.opacity='.55';
})();
