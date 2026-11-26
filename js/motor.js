/* Criou (design por perguntas) — motor de decisões e desenho.
   Recebe: marca (pacote de marca) + formato + respostas.
   Devolve: as decisões (com o porquê) e a peça desenhada num canvas.
   O motor não sabe nada de nenhuma marca específica: tudo vem do pacote. */
(function(){
const FORMATOS={
  post:{nome:'Post',dim:'1080 × 1350',w:1080,h:1350,m:90,top:90,bot:90,tipo:'v'},
  story:{nome:'Story',dim:'1080 × 1920',w:1080,h:1920,m:96,top:220,bot:280,tipo:'v'},
  banner:{nome:'Banner',dim:'1500 × 500',w:1500,h:500,m:60,top:60,bot:60,tipo:'h'}
};
const PUBLICOS={clientes:'Clientes',equipe:'Equipe',geral:'Público geral'};
const ASSUNTOS={novidade:'Novidade',evento:'Evento',aviso:'Aviso',dica:'Dica',promocao:'Promoção'};
const PREF={novidade:'escuro',evento:'destaque',aviso:'claro',dica:'claro',promocao:'destaque'};

/* ---------- cor e contraste ---------- */
const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const rgb2hex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>rgb2hex(hex2rgb(a).map((v,i)=>v+(hex2rgb(b)[i]-v)*t));
const lum=h=>{const c=hex2rgb(h).map(v=>v/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const melhor=(bg,ops)=>ops.reduce((a,b)=>cr(bg,b)>cr(bg,a)?b:a);
function paletas(m){
  return [{id:'claro',nome:'Clara',bg:m.fundo,ink:m.escuro,acc:m.destaque},{id:'escuro',nome:'Escura',bg:m.escuro,ink:m.fundo,acc:m.destaque},{id:'destaque',nome:'Destaque',bg:m.destaque,ink:m.escuro,acc:m.fundo},{id:'destaqueClaro',nome:'Destaque com texto claro',bg:m.destaque,ink:m.fundo,acc:m.escuro}]
   .map(p=>({...p,ratio:cr(p.bg,p.ink),ok:cr(p.bg,p.ink)>=4.5}));
}
/* Marca mínima a partir do nome e da cor principal (demonstração sem cadastro). */
function marcaDeCor(nome,cor,extra){
  const destaque=/^#[0-9a-f]{6}$/i.test(cor||'')?cor:'#F9541C';
  const escuro=extra&&extra.escuro||mix(destaque,'#0B0A08',.86);
  const fundo=extra&&extra.fundo||mix(destaque,'#FFFFFF',.93);
  const n=(nome||'Sua empresa').trim();
  const base={nome:n,sigla:n.length>14?n.split(/\s+/)[0].slice(0,14):n,site:'',fundo,escuro,destaque,ft:'Bricolage Grotesque',fx:'Figtree',en:'serif',forma:'pilula',graf:'vetor',logo:null};
  const e=extra||{};['site','logo','ft','fx','en','forma','graf'].forEach(k=>{if(e[k]!==undefined&&e[k]!==null&&e[k]!=='')base[k]=e[k];});if(e.logo===null)base.logo=null;
  return base;
}

/* ---------- decisões ---------- */
function decidir(m,f,r){
  const motivos=[],avisos=[];const pals=paletas(m),ok=pals.filter(p=>p.ok);
  let pal;
  if(r.paleta&&r.paleta!=='auto'&&ok.find(p=>p.id===r.paleta)){pal=ok.find(p=>p.id===r.paleta);motivos.push(['Cores',`combinação ${pal.nome.toLowerCase()} escolhida, com contraste de ${pal.ratio.toFixed(1)}:1.`]);}
  const camp=!!(r.campanha||r.publico==='campanha');
  if(pal){}else{const quer=camp?'escuro':PREF[r.assunto]||'claro';pal=ok.find(p=>p.id===quer)||ok[0]||pals[0];
    motivos.push(['Cores',`${ASSUNTOS[r.assunto]||'O assunto'}${camp?' em campanha':''} pede a combinação ${pal.nome.toLowerCase()}${pal.id!==quer?' (a ideal não passou no teste de contraste com estas cores, então entrou a próxima segura)':''}. Contraste do texto: ${pal.ratio.toFixed(1)}:1.`]);}
  const fora=pals.length-ok.length;
  if(fora)motivos.push(['Contraste',`${fora} ${fora>1?'combinações':'combinação'} da marca ${fora>1?'ficaram':'ficou'} de fora porque o texto não seria lido com segurança.`]);
  const accTxt=cr(pal.acc,pal.bg)>=3?pal.acc:pal.ink;
  const btnBg=cr(pal.acc,pal.bg)>=2?pal.acc:pal.ink;const btnInk=melhor(btnBg,[m.fundo,m.escuro,'#FFFFFF']);
  const t=(r.titulo||'').trim(),n=t.length;
  let alvo=f.tipo==='h'?(n<=30?84:n<=50?70:58):(n<=30?150:n<=50?122:98);
  if(f.id==='story')alvo*=1.08;
  motivos.push(['Hierarquia',`título com ${n} caracteres: ${n<=30?'curto, então ganha tamanho grande':n<=50?'médio, tamanho intermediário':'longo, a letra diminui um degrau para caber sem apertar'}.`]);
  if(n>45)avisos.push('Títulos de imagem funcionam melhor com até 45 caracteres.');
  if(n>3&&t===t.toUpperCase()&&/[A-ZÀ-Ú]/.test(t))avisos.push('Evite o título todo em maiúsculas: fica mais difícil de ler.');
  if(/!{2,}/.test(t+(r.apoio||'')))avisos.push('Mais de um ponto de exclamação seguido passa um tom de urgência.');
  if(/clique aqui/i.test(r.chamada||''))avisos.push('"Clique aqui" não diz o que acontece. Prefira algo como "Ver agenda".');
  const destaque=m.en!=='nenhum'&&t.split(/\s+/).length>1;
  if(destaque)motivos.push(['Destaque',`a última palavra ganha ${m.en==='serif'?'uma serifada itálica':'a cor de destaque'}, para o olhar terminar na ideia principal.`]);
  const selo=r.publico==='equipe'?'Para a equipe':(ASSUNTOS[r.assunto]||'');
  if(r.foto)motivos.push(['Composição',f.tipo==='h'?'a foto fica à direita e o texto à esquerda, na ordem de leitura.':'a foto vai em cima, com os cantos da marca; o grafismo sai para não disputar atenção.']);
  else motivos.push(['Composição','sem foto, entra o grafismo da marca para organizar o espaço e a peça não ficar vazia.']);
  if(r.assunto==='aviso')motivos.push(['Aviso','ganha uma faixa de destaque no topo: chama atenção sem gritar.']);
  if(r.data||r.hora||r.local)motivos.push(['Data','vira uma pílula própria, separada do texto, para ser encontrada de relance.']);
  if(r.chamada)motivos.push(['Botão',`na cor de ação, com texto em ${cr(btnBg,btnInk).toFixed(1)}:1 de contraste.`]);
  motivos.push(['Formato',`${f.dim} px, com ${f.m} px de respiro${f.top!==f.m?' e áreas livres no topo e na base, onde o app coloca os próprios botões':''}.`]);
  return {pal,accTxt,btnBg,btnInk,alvo,destaque,selo,motivos,avisos};
}

/* ---------- desenho ---------- */
function Desenho(ctx,m){
  const R=(w,h)=>m.forma==='pilula'?h/2:m.forma==='arredondado'?Math.min(h/2,w*.022):0;
  function rr(x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  const fT=s=>`800 ${s}px "${m.ft}", sans-serif`,fE=s=>m.en==='serif'?`italic 400 ${s*1.06}px "Instrument Serif", serif`:fT(s),fX=(s,w=500)=>`${w} ${s}px "${m.fx}", sans-serif`;
  function quebra(words,size,maxW,dest){const lines=[];let cur=[],w=0;ctx.font=fT(size);const sp=ctx.measureText(' ').width;
    words.forEach((t,i)=>{const e=dest&&i===words.length-1;ctx.font=e?fE(size):fT(size);const ww=ctx.measureText(t).width;if(cur.length&&w+sp+ww>maxW){lines.push(cur);cur=[];w=0;}cur.push({t,ww,e});w+=(cur.length>1?sp:0)+ww;});if(cur.length)lines.push(cur);
    return {lines,fits:lines.every(l=>l.reduce((a,b)=>a+b.ww,0)+sp*(l.length-1)<=maxW)};}
  function ajusta(text,maxW,maxH,size,min,dest){const words=text.split(/\s+/).filter(Boolean);let s=size,q;do{q=quebra(words,s,maxW,dest);if(q.fits&&q.lines.length*s*1.02<=maxH)break;s-=4;}while(s>min);return {...q,size:s};}
  function titulo(q,x,yBase,ink,acc){ctx.textBaseline='alphabetic';ctx.font=fT(q.size);const sp=ctx.measureText(' ').width,lh=q.size*1.02;
    q.lines.forEach((l,i)=>{let xx=x;const y=yBase-(q.lines.length-1-i)*lh;l.forEach(wd=>{ctx.font=wd.e?fE(q.size):fT(q.size);ctx.fillStyle=wd.e?acc:ink;ctx.fillText(wd.t,xx,y);xx+=wd.ww+sp;});});}
  function linhas(text,font,maxW,max){ctx.font=font;const out=[];let cur='';text.split(/\s+/).filter(Boolean).forEach(w=>{const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=w;}else cur=t;});if(cur)out.push(cur);
    if(out.length>max){out.length=max;out[max-1]=out[max-1].replace(/\s*\S*$/,'')+'…';}return out;}
  function logo(x,y,h,pal){
    if(m.logo){const im=m.logo,w=Math.min(h*im.width/im.height,h*5);ctx.drawImage(im,x,y,w,w*im.height/im.width>h?h:w*im.height/im.width);return w;}
    const pill=lum(pal.bg)<.2?m.fundo:m.escuro,txt=pill===m.fundo?m.escuro:m.fundo,label=m.sigla||'Marca';
    ctx.font=`800 ${h*.5}px "${m.ft}", sans-serif`;const tw=ctx.measureText(label).width,d=h*.16,w=tw+h*.62+d*2+h*.14;
    ctx.fillStyle=pill;rr(x,y,w,h,R(h*4,h));ctx.fill();ctx.fillStyle=txt;ctx.textBaseline='middle';ctx.fillText(label,x+h*.31,y+h*.53);
    ctx.fillStyle=m.destaque;ctx.beginPath();ctx.arc(x+h*.31+tw+h*.14+d,y+h*.5,d,0,7);ctx.fill();ctx.textBaseline='alphabetic';return w;}
  function selo(xR,yMid,s,txt,ink,acc){if(!txt)return;ctx.font=fX(s,600);const tw=ctx.measureText(txt).width;ctx.fillStyle=ink;ctx.textBaseline='middle';ctx.fillText(txt,xR-tw,yMid);ctx.fillStyle=acc;ctx.beginPath();ctx.arc(xR-tw-s*.75,yMid,s*.32,0,7);ctx.fill();ctx.textBaseline='alphabetic';}
  function grafismo(x,y,w,h,pal,forte){const ink=pal.ink,acc=cr(pal.acc,pal.bg)>=1.6?pal.acc:pal.ink;
    if(m.graf==='vetor'){const t=forte?h*.22:h*.15,dr=forte?h*.36:h*.26,cy=y+h/2;ctx.strokeStyle=ink;ctx.lineWidth=t;ctx.lineCap=m.forma==='reto'?'butt':'round';ctx.beginPath();ctx.moveTo(x+t/2,cy);ctx.lineTo(x+w-dr*2-t*1.4,cy);ctx.stroke();ctx.fillStyle=acc;ctx.beginPath();ctx.arc(x+w-dr,cy,dr,0,7);ctx.fill();}
    else if(m.graf==='pontos'){const cols=forte?9:7,rows=3,gx=w/cols,r=Math.min(gx,h/rows)*.22;for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){ctx.fillStyle=(i+j)%4===0?acc:ink;ctx.beginPath();ctx.arc(x+gx*(i+.5),y+h/rows*(j+.5),r,0,7);ctx.fill();}}
    else{const bh=h*(forte?.62:.48);ctx.fillStyle=acc;rr(x,y+(h-bh)/2,w,bh,R(w,bh));ctx.fill();ctx.fillStyle=ink;rr(x,y+(h-bh)/2,w*.32,bh,R(w,bh));ctx.fill();}}
  function foto(im,x,y,w,h,r){ctx.save();rr(x,y,w,h,r);ctx.clip();const s=Math.max(w/im.width,h/im.height);ctx.drawImage(im,x+(w-im.width*s)/2,y+(h-im.height*s)/2,im.width*s,im.height*s);ctx.restore();}
  function pilula(x,y,h,txt,bg,ink,borda,size){ctx.font=fX(size,700);const w=ctx.measureText(txt).width+h*.9;if(borda){ctx.strokeStyle=ink;ctx.lineWidth=3;rr(x+1.5,y+1.5,w-3,h-3,R(w,h));ctx.stroke();}else{ctx.fillStyle=bg;rr(x,y,w,h,R(w,h));ctx.fill();}
    ctx.fillStyle=ink;ctx.textBaseline='middle';ctx.fillText(txt,x+h*.45,y+h*.53);ctx.textBaseline='alphabetic';return w;}
  return {rr,fX,ajusta,titulo,linhas,logo,selo,grafismo,foto,pilula};
}
function dataTxt(r){if(!r.data&&!r.hora&&!r.local)return '';const p=[];if(r.data){const d=new Date(r.data+'T12:00');p.push(d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'}).replace('.',''),d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''));}
  if(r.hora)p.push(r.hora.replace(':00','h').replace(':','h'));if(r.local)p.push(r.local);return p.join(' · ');}

/* Desenha a peça em tamanho real num canvas fora da tela e devolve { canvas, decisao }. */
function desenhar(m,formatoId,r){
  const f={...FORMATOS[formatoId],id:formatoId},d=decidir(m,f,r),{pal}=d,W=f.w,H=f.h,mg=f.m;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d'),D=Desenho(ctx,m);
  ctx.fillStyle=pal.bg;ctx.fillRect(0,0,W,H);
  if(r.assunto==='aviso'){ctx.fillStyle=d.btnBg;ctx.fillRect(0,0,W,f.tipo==='h'?14:22);}
  const tit=(r.titulo||'Escreva sua mensagem').trim(),dt=dataTxt(r),ch=(r.chamada||'').trim(),forte=!!(r.campanha||r.publico==='campanha'),ap=(r.apoio||'').trim();
  if(f.tipo==='v'){
    const lh=formatoId==='story'?84:74;D.logo(mg,f.top,lh,pal);D.selo(W-mg,f.top+lh/2,formatoId==='story'?32:29,d.selo,pal.ink,d.accTxt);
    let topo=f.top+lh+56;
    if(r.foto){const fh=Math.round(H*(formatoId==='story'?.36:.38));D.foto(r.foto,mg,topo,W-2*mg,fh,m.forma==='pilula'?72:m.forma==='arredondado'?32:0);topo+=fh+60;}
    else{const gh=forte?220:150;D.grafismo(mg,topo,W-2*mg,gh,pal,forte);topo+=gh+64;}
    let y=H-f.bot;ctx.font=D.fX(26,500);ctx.fillStyle=pal.ink;ctx.globalAlpha=.8;ctx.fillText(m.site||'',mg,y);if(r.publico==='equipe'){const t='Uso interno';ctx.fillText(t,W-mg-ctx.measureText(t).width,y);}ctx.globalAlpha=1;y-=26+50;
    if(ch){const bh=96;D.pilula(mg,y-bh,bh,ch,d.btnBg,d.btnInk,false,38);y-=bh+34;}
    if(dt){const ph=80;D.pilula(mg,y-ph,ph,dt,'',pal.ink,true,32);y-=ph+40;}
    if(ap){const s=formatoId==='story'?44:40,ls=D.linhas(ap,D.fX(s,400),W-2*mg,3);ctx.font=D.fX(s,400);ctx.fillStyle=pal.ink;ls.slice().reverse().forEach((l,i)=>ctx.fillText(l,mg,y-i*s*1.32));y-=(ls.length-1)*s*1.32+s+56;}
    const q=D.ajusta(tit,W-2*mg,Math.max(120,y-topo),d.alvo,54,d.destaque);D.titulo(q,mg,y,pal.ink,d.accTxt);
  }else{
    const colW=W*.56-mg;D.logo(mg,mg,52,pal);const rx=W*.6,rw=W-mg-rx;
    if(r.foto){D.foto(r.foto,rx,mg,rw,H-2*mg,m.forma==='pilula'?56:m.forma==='arredondado'?24:0);D.selo(mg+colW,mg+26,24,d.selo,pal.ink,d.accTxt);}
    else{D.grafismo(rx,mg+40,rw,H-2*mg-80,pal,forte);D.selo(W-mg,mg+26,24,d.selo,pal.ink,d.accTxt);}
    let y=H-mg;
    if(ch||dt){let x=mg;const h=62;if(ch)x+=D.pilula(x,y-h,h,ch,d.btnBg,d.btnInk,false,26)+14;if(dt)D.pilula(x,y-h,h,dt,'',pal.ink,true,22);y-=h+28;}
    if(ap){const s=26,ls=D.linhas(ap,D.fX(s,400),colW,2);ctx.font=D.fX(s,400);ctx.fillStyle=pal.ink;ls.slice().reverse().forEach((l,i)=>ctx.fillText(l,mg,y-i*s*1.3));y-=(ls.length-1)*s*1.3+s+20;}
    const q=D.ajusta(tit,colW,Math.max(60,y-(mg+52+34)),d.alvo,34,d.destaque);D.titulo(q,mg,y,pal.ink,d.accTxt);
  }
  return {canvas:cv,decisao:d,formato:f};
}

/* Prévia: copia a peça para o canvas visível em resolução de tela, com marca d'água. */
function previa(destino,fonte,opts){
  const o=Object.assign({maxW:540,marcaDagua:true},opts||{});
  const s=Math.min(1,o.maxW/fonte.width),w=Math.round(fonte.width*s),h=Math.round(fonte.height*s);
  destino.width=w;destino.height=h;const ctx=destino.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(fonte,0,0,w,h);
  if(o.marcaDagua){
    ctx.save();ctx.globalAlpha=.16;ctx.fillStyle=lum(sample(fonte))<.3?'#FFFFFF':'#000000';
    const fs=Math.max(14,Math.round(Math.min(w,h)*.075));ctx.font=`800 ${fs}px Figtree, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.translate(w/2,h/2);ctx.rotate(-Math.PI/7);
    const gy=fs*3.2,gx=fs*7;for(let yy=-h;yy<=h;yy+=gy)for(let xx=-w;xx<=w;xx+=gx)ctx.fillText('PRÉVIA',xx+((yy/gy)%2?gx/2:0),yy);
    ctx.restore();
  }
}
function sample(cv){try{const p=cv.getContext('2d').getImageData(4,cv.height-4,1,1).data;return rgb2hex([p[0],p[1],p[2]]);}catch(e){return '#FFFFFF';}}

async function fontes(m){
  if(!document.fonts||!document.fonts.load)return;
  try{await Promise.all([`800 40px "${m.ft}"`,`400 40px "${m.fx}"`,`500 40px "${m.fx}"`,`600 40px "${m.fx}"`,`700 40px "${m.fx}"`,'italic 400 40px "Instrument Serif"'].map(f=>document.fonts.load(f)));}catch(e){}
}

/* Personalidade visual: uma pergunta escolhe fonte, forma, grafismo e destaque.
   Se a empresa já tem fonte própria, a personalidade não troca a fonte, só a composição. */
const PERSONALIDADES={
  seria:{nome:'Séria e profissional',direcao:'Clara e confiável',ft:'Inter',fx:'Inter',en:'cor',forma:'reto',graf:'faixa'},
  divertida:{nome:'Divertida e descontraída',direcao:'Colorida e brincalhona',ft:'Fredoka',fx:'Nunito',en:'cor',forma:'pilula',graf:'pontos'},
  elegante:{nome:'Elegante e sofisticada',direcao:'Minimalista e refinada',ft:'Playfair Display',fx:'Inter',en:'serif',forma:'arredondado',graf:'vetor'},
  moderna:{nome:'Moderna e ousada',direcao:'Forte e direta',ft:'Archivo',fx:'Inter',en:'cor',forma:'reto',graf:'vetor'},
  leve:{nome:'Leve e acolhedora',direcao:'Suave e próxima',ft:'Nunito',fx:'Nunito',en:'cor',forma:'pilula',graf:'faixa'}
};
const FONTES_MARCA=['Montserrat','Poppins','Inter','Playfair Display','Archivo','Nunito'];

/* Marcas de exemplo (fictícias) para a página de venda. */
const EXEMPLOS={
  aurora:{nome:'Padaria Aurora',sigla:'Aurora',site:'padariaaurora.com',fundo:'#FFF4E4',escuro:'#3B2A20',destaque:'#E2A62B',ft:'DM Serif Display',fx:'Inter',en:'cor',forma:'arredondado',graf:'pontos',logo:null},
  ventura:{nome:'Clínica Ventura',sigla:'Ventura',site:'clinicaventura.com',fundo:'#EEF6F4',escuro:'#0E3B43',destaque:'#2BB3A3',ft:'Space Grotesk',fx:'Inter',en:'cor',forma:'reto',graf:'faixa',logo:null},
  vento:{nome:'Studio Vento',sigla:'Vento',site:'studiovento.com',fundo:'#FFF4EA',escuro:'#1E1A16',destaque:'#FF7A1A',ft:'Archivo',fx:'Inter',en:'cor',forma:'reto',graf:'vetor',logo:null},
  bento:{nome:'Pet Bento',sigla:'Bento',site:'petbento.com',fundo:'#FFF8E6',escuro:'#2B1D52',destaque:'#7B4BD6',ft:'Fredoka',fx:'Nunito',en:'cor',forma:'pilula',graf:'pontos',logo:null},
  js:{nome:'Joander Santos',sigla:'JS',site:'joandersantos.com.br',fundo:'#F3F0E7',escuro:'#14120F',destaque:'#F9541C',ft:'Bricolage Grotesque',fx:'Figtree',en:'serif',forma:'pilula',graf:'vetor',logo:null}
};

/* Registro de eventos de conversão (Parte 6.3). Por enquanto só no console;
   quando o backend existir, envia para a API sem dados pessoais. */
function evento(nome,dados){try{(window.__eventos=window.__eventos||[]).push({nome,t:Date.now(),...(dados||{})});}catch(e){}}

window.DPP={FORMATOS,PUBLICOS,ASSUNTOS,PERSONALIDADES,FONTES_MARCA,paletas,cr,mix,marcaDeCor,decidir,desenhar,previa,fontes,EXEMPLOS,evento};
})();
