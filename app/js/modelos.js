/* ============================================================
   Criou · Modelos
   Um desenho por estilo (Simples, Sofisticado, Robusto) que se adapta
   à proporção do formato: horizontal, quadrado ou vertical.
   Cada peça é um HTML do tamanho exato, com as partes marcadas para a
   exportação (data-x="peca|caixa|img|texto"): a mesma marcação vira
   PNG, PDF e PowerPoint com texto editável.
   ============================================================ */
(function (raiz) {
  'use strict';

  var M = raiz.CriouMarca, C = M.cor;
  var MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  var DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function limpar(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  function px(n) { return Math.round(n) + 'px'; }

  /* Texto com marcas → HTML. realce: como o ==destaque== aparece neste estilo. */
  /* Destaque escolhido no editor (cor-, box- ou faixa- + cor): vale em qualquer layout.
     Sem estilo explícito, cada layout desenha o destaque do seu jeito. */
  var RP = null;
  var RAIOS = { reta: '0', suave: '.16em', pilula: '.55em', folha: '.34em 0 .34em 0' };
  function realceRico(x, id, realce) {
    var m = /^(cor|box|faixa)-([a-z]+)$/.exec(id);
    if (!m || !RP) return realce(x, id);
    var k = RP.cores[m[2]] || RP.cores.destaque, quebra = 'box-decoration-break:clone;-webkit-box-decoration-break:clone;';
    if (m[1] === 'cor') return '<span style="color:' + k.fundo + '">' + x + '</span>';
    if (m[1] === 'box') return '<span style="background:' + k.fundo + ';color:' + k.texto + ';border-radius:' + (RAIOS[RP.forma] || '.16em') + ';padding:0 .14em;' + quebra + '">' + x + '</span>';
    return '<span style="background-image:linear-gradient(transparent 56%,' + k.fundo + ' 56%,' + k.fundo + ' 94%,transparent 94%);padding:0 .06em;' + quebra + '">' + x + '</span>';
  }
  function prepararRealces(marca) { var c = {}; M.realces(marca).forEach(function (r) { c[r.id] = r; }); RP = { cores: c, forma: marca.forma }; }
  function rico(t, realce) {
    var s = esc(t);
    s = s.replace(/==\(([a-z0-9-]+)\)([\s\S]+?)==/gi, function (_, id, x) { return realceRico(x, id, realce); })
      .replace(/==([\s\S]+?)==/g, function (_, x) { return realce(x, 'destaque'); })
      .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
    return s;
  }

  function dataTexto(d, hora, local) {
    if (!d) return limpar([hora, local].filter(Boolean).join(' · '));
    var p = String(d).split('-'); if (p.length !== 3) return '';
    var dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    var partes = [Number(p[2]) + ' ' + MESES[dt.getMonth()], DIAS[dt.getDay()]];
    if (hora) partes.push(hora.replace(/^(\d\d):00$/, '$1h').replace(':', 'h'));
    if (local) partes.push(local);
    return partes.join(' · ');
  }

  /* ---------- Peças: primitivas ---------- */
  function caixa(st, extra) { return '<div data-x="caixa" style="' + st + '"' + (extra || '') + '></div>'; }
  function abs(x, y, w, h) { return 'position:absolute;left:' + px(x) + ';top:' + px(y) + ';width:' + px(w) + ';' + (h != null ? 'height:' + px(h) + ';' : ''); }

  /* Logotipo: imagem cadastrada ou o nome escrito na fonte de título.
     Sobre fundo escuro, sem versão clara, o logo entra numa plaquinha branca. */
  function logo(marca, P, h, fundo, maxW) {
    if (fundo === 'foto') {
      // Sobre foto: sempre numa plaquinha branca, para ler em qualquer imagem.
      var dentro = marca.logo ? '<img data-x="img" src="' + marca.logo + '" alt="' + esc(marca.nome) + '" style="height:' + px(h * 0.8) + ';max-width:' + px(maxW) + ';object-fit:contain;display:block">'
        : '<span data-x="texto" style="font-family:' + M.pilha(marca.fontes.titulo) + ';font-weight:800;font-size:' + px(h * 0.5) + ';line-height:1;color:' + P.escura + ';white-space:nowrap">' + esc(marca.nome) + '</span>';
      var pd = Math.round(h * 0.3);
      return '<div data-x="caixa" style="background:#fff;border-radius:' + px(h * 0.25) + ';padding:' + px(pd) + ' ' + px(pd * 1.3) + ';display:inline-flex;align-items:center">' + dentro + '</div>';
    }
    var escuro = C.lum(fundo) < 0.4;
    if (marca.logoClaro && escuro) return '<img data-x="img" src="' + marca.logoClaro + '" alt="' + esc(marca.nome) + '" style="height:' + px(h) + ';max-width:' + px(maxW) + ';object-fit:contain;display:block">';
    if (marca.logo) {
      var img = '<img data-x="img" src="' + marca.logo + '" alt="' + esc(marca.nome) + '" style="height:' + px(h) + ';max-width:' + px(maxW) + ';object-fit:contain;display:block">';
      if (!escuro) return img;
      var pad = Math.round(h * 0.32);
      return '<div data-x="caixa" style="background:#fff;border-radius:' + px(h * 0.25) + ';padding:' + px(pad) + ' ' + px(pad * 1.3) + ';display:inline-flex">' + img.replace('height:' + px(h), 'height:' + px(h * 0.8)) + '</div>';
    }
    var cor = escuro ? '#ffffff' : P.escura;
    return '<div data-x="texto" style="font-family:' + M.pilha(marca.fontes.titulo) + ';font-weight:800;font-size:' + px(h * 0.62) + ';line-height:1;color:' + cor + ';letter-spacing:-0.01em;white-space:nowrap">' + esc(marca.nome) + '</div>';
  }

  /* Botão na cor de ação; se ela some no fundo, cai para uma cor que aparece. */
  function corBotao(P, fundo) {
    var bg = P.acao;
    if (C.contraste(bg, fundo) < 1.8) bg = C.lum(fundo) < 0.4 ? P.destaque : P.escura;
    if (C.contraste(bg, fundo) < 1.8) bg = C.lum(fundo) < 0.4 ? '#ffffff' : '#111111';
    return { bg: bg, tx: C.sobre(bg, P.escura) };
  }
  function botao(texto, marca, P, fundo, tam, alinhar) {
    if (!limpar(texto)) return '';
    var b = corBotao(P, fundo), alt = tam * 2.6, raio = M.FORMAS[marca.forma] ? M.FORMAS[marca.forma].raio(alt) : [8, 8, 8, 8];
    var al = POS.a || alinhar;
    return '<div style="display:flex;justify-content:' + (al === 'center' ? 'center' : al === 'right' ? 'flex-end' : 'flex-start') + ';margin-top:' + px(tam * 1.1) + '"><div data-x="caixa" style="background:' + b.bg + ';border-radius:' + M.raioCss(raio) + ';min-height:' + px(alt) + ';max-width:100%;padding:' + px(tam * 0.5) + ' ' + px(tam * 1.3) + ';display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box">' +
      '<span data-x="texto" data-forma="botao" style="font-family:' + M.pilha(marca.fontes.texto) + ';font-weight:700;font-size:' + px(tam) + ';line-height:1.1;color:' + b.tx + ';text-align:center">' + esc(texto) + '</span></div></div>';
  }
  function foto(src, x, y, w, h) {
    if (!src) return caixa(abs(x, y, w, h) + 'background:#d9d9de');
    return '<img data-x="img" src="' + src + '" alt="" style="' + abs(x, y, w, h) + 'display:block;object-fit:cover">';
  }

  /* Script que encaixa o título: reduz até a pilha de texto caber na área. */
  /* Se mudar este script, rode node testes/seguranca/conferir.mjs: o hash dele está na CSP. */
  var CSP_PECA = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'sha256-9AM6paihtnwQApjrUzBjeLBjvSbLAgLLjI2O3hOPSOw=\'; style-src \'unsafe-inline\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob: https:">';
  var ENCAIXE = '<script>(function(){function fit(){document.querySelectorAll("[data-pilha]").forEach(function(p){var mi=p.firstElementChild,t=p.querySelector("[data-fit]");if(!mi||!t)return;var base=parseFloat(t.getAttribute("data-fit")),k=1;t.style.fontSize=base+"px";mi.style.zoom="";function L(){return Math.max(t.offsetWidth,mi.scrollWidth)}while((mi.offsetHeight>p.clientHeight+1||L()>p.clientWidth+1)&&k>0.46){k-=0.03;t.style.fontSize=(base*k)+"px";}if(mi.offsetHeight>p.clientHeight+1||L()>p.clientWidth+1){var z=Math.min(p.clientHeight/mi.offsetHeight,p.clientWidth/Math.max(L(),1),1);var jc=p.style.justifyContent;mi.style.transformOrigin=jc==="flex-start"?"0 0":jc==="center"?"0 50%":"0 100%";mi.style.transform="scale("+z+")";mi.style.width=(100/z)+"%";}});document.body.setAttribute("data-pronto","1");}if(document.fonts&&document.fonts.ready){document.fonts.ready.then(fit);}fit();})();<\/script>';

  function documento(marca, W, H, fundo, corpo, opts) {
    opts = opts || {};
    var fontes = M.urlFontes([marca.fontes.titulo, marca.fontes.texto]);
    var marcaDagua = '';
    if (opts.previa) {
      // Discreta: selo pequeno no canto e um padrão bem leve. Some no plano pago.
      var u = Math.min(W, H), tm = Math.max(12, Math.round(u * 0.019)), linhas = '', tl = Math.round(u * 0.05);
      for (var i = -2; i < Math.ceil(H / (tl * 4)) + 2; i++) linhas += '<div style="white-space:nowrap;margin-left:' + px((i % 2) * tl * 3 - tl * 4) + '">' + new Array(12).join('criou &nbsp;&nbsp;&nbsp;&nbsp; ') + '</div>';
      marcaDagua = '<div aria-hidden="true" style="position:absolute;inset:-20%;transform:rotate(-24deg);font:700 ' + px(tl) + '/' + px(tl * 4) + ' Arial,sans-serif;color:rgba(128,128,128,.045);pointer-events:none;z-index:50">' + linhas + '</div>' +
        '<div aria-hidden="true" style="position:absolute;right:' + px(u * 0.025) + ';bottom:' + px(u * 0.025) + ';z-index:51;background:rgba(255,255,255,.88);color:#111;font:700 ' + px(tm) + '/1 Arial,sans-serif;padding:' + px(tm * 0.55) + ' ' + px(tm * 0.9) + ';border-radius:999px">feito no Criou</div>';
    }
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' + CSP_PECA + '<link rel="stylesheet" href="' + fontes + '">' +
      '<style>html,body{margin:0;padding:0;background:#fff}*{box-sizing:border-box}strong{font-weight:800}em{font-style:italic}</style></head><body>' +
      '<div data-x="peca" style="position:relative;width:' + px(W) + ';height:' + px(H) + ';overflow:hidden;background:' + fundo + '">' + corpo + marcaDagua + '</div>' + ENCAIXE + '</body></html>';
  }

  /* ---------- Contexto comum ---------- */
  function contexto(formato, dados, marca, dec) {
    var W = formato.largura, H = formato.altura, m = formato.margem;
    var mg = formato.margens || {}, mt = mg.topo != null ? mg.topo : m, mb = mg.base != null ? mg.base : m;
    var tipo = dec.tipo, U = tipo === 'largo' ? H * (W / H >= 2.6 ? 1.9 : 1.55) : W;
    if (tipo === 'alto' && H / W < 1.5) U = W * 1.04;
    return {
      W: W, H: H, m: m, mt: mt, mb: mb, tipo: tipo, U: U, P: dec.paleta, marca: marca, dados: dados, dec: dec,
      foto: dados._foto || '', temFoto: dec.temFoto,
      titulo: limpar(dados.titulo) || 'Seu recado aqui', vazio: !limpar(dados.titulo),
      apoio: limpar(dados.apoio), data: dataTexto(dados.data, dados.hora, dados.local),
      chamada: limpar(dados.chamada), selo: dec.assunto.selo,
      rodape: [limpar(marca.rodape.site), limpar(marca.rodape.social)].filter(Boolean).join('   ·   '),
      legal: limpar(marca.legal),
      fT: M.pilha(marca.fontes.titulo), fX: M.pilha(marca.fontes.texto)
    };
  }

  function rodapeHtml(c, cor, alinhar, y) {
    var t = c.U * 0.02, partes = '';
    if (c.rodape) partes += '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:600;font-size:' + px(t) + ';line-height:1.3;color:' + cor + ';text-align:' + alinhar + '">' + esc(c.rodape) + '</div>';
    if (c.legal) partes += '<div data-x="texto" style="font-family:' + c.fX + ';font-size:' + px(t * 0.78) + ';line-height:1.3;color:' + cor + ';opacity:1;text-align:' + alinhar + ';margin-top:' + px(t * 0.35) + '">' + esc(c.legal) + '</div>';
    if (!partes) return { html: '', h: 0 };
    var h = (c.rodape ? t * 1.3 : 0) + (c.legal ? t * 0.78 * 1.3 * (c.legal.length > 90 ? 2 : 1) + t * 0.35 : 0);
    return { html: '<div style="' + abs(c.m, c.H - c.mb - h, c.W - 2 * c.m) + '">' + partes + '</div>', h: h };
  }

  /* Posição e alinhamento escolhidos na tela (quando o layout permite). */
  var POS = {};
  function pilha(x, y, w, h, conteudo, alinhar, justificar) {
    if (POS.j) justificar = POS.j;
    if (POS.a) alinhar = POS.a;
    var ai = alinhar === 'center' ? 'center' : alinhar === 'right' ? 'flex-end' : 'flex-start';
    return '<div data-pilha style="' + abs(x, y, w, h) + 'display:flex;flex-direction:column;justify-content:' + (justificar || 'flex-end') + ';overflow:hidden">' +
      '<div style="display:flex;flex-direction:column;align-items:' + ai + ';text-align:' + (alinhar || 'left') + ';flex:none">' + conteudo + '</div></div>';
  }
  /* Bloco girado: ocupa x, y, w, h na peça (estreito e alto) e o conteúdo corre na vertical.
     sentido -90: de baixo para cima; 90: de cima para baixo. */
  function girarBloco(x, y, w, h, sentido, conteudo, alinhar, justificar) {
    var salvo = POS; POS = {};
    var dentro = pilha(0, 0, h, w, conteudo, alinhar || 'left', justificar || 'flex-end');
    POS = salvo;
    return '<div data-girar="' + sentido + '" style="position:absolute;left:' + px(x + (w - h) / 2) + ';top:' + px(y + (h - w) / 2) + ';width:' + px(h) + ';height:' + px(w) + ';transform:rotate(' + sentido + 'deg)">' + dentro + '</div>';
  }
  /* Data e botão: empilhados; lado a lado nos formatos horizontais (economiza altura). */
  function acoes(dataHtml, botHtml, largo, gap) {
    if (!largo || !dataHtml || !botHtml) return dataHtml + botHtml;
    return '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:' + px(gap) + ';margin-top:' + px(gap) + ';flex:none">' +
      dataHtml.replace(/margin-top:[0-9.]+px;/, '') + botHtml.replace(/margin-top:[0-9.]+px/, 'margin-top:0') + '</div>';
  }

  /* =========================================================
     SIMPLES · fundo claro, respiro, uma cor de destaque
     ========================================================= */
  function simples(c) {
    var P = c.P, fundo = P.fundo, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U;
    var logoH = U * 0.055, topo = c.mt;
    var realce = function (x) { return '<span style="color:' + P.principalLegivel + '">' + x + '</span>'; };
    corpo += '<div style="' + abs(m, topo, W * 0.5) + '">' + logo(c.marca, P, logoH, fundo, W * 0.4) + '</div>';
    if (c.selo) corpo += '<div style="position:absolute;right:' + px(m) + ';top:' + px(topo + logoH / 2 - U * 0.024) + ';display:flex;align-items:center;gap:' + px(U * 0.012) + '">' + caixa('width:' + px(U * 0.014) + ';height:' + px(U * 0.014) + ';border-radius:50%;background:' + P.principal) + '<span data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(U * 0.024) + ';line-height:2;color:' + P.escura + ';text-transform:uppercase;letter-spacing:.12em">' + esc(c.selo) + '</span></div>';
    var rod = rodapeHtml(c, P.suave, 'left');
    var fimTexto = H - c.mb - (rod.h ? rod.h + U * 0.03 : 0);
    var tam = U * (c.tipo === 'largo' ? 0.1 : 0.098) * c.dec.escala * (c.temFoto ? 1 : 1.18);

    var px0 = m, pw = W - 2 * m, py, ph, alinhar = 'left';
    if (c.tipo === 'largo') {
      var cortaX = c.temFoto ? Math.round(W * 0.6) : Math.round(W * 0.72);
      if (c.temFoto) {
        var r = M.FORMAS[c.marca.forma].raio(H * 0.6);
        corpo += '<div style="' + abs(cortaX, 0, W - cortaX, H) + 'overflow:hidden;border-radius:' + px(r[0]) + ' 0 0 ' + px(r[3]) + '"><img data-x="img" src="' + (c.foto || '') + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>';
      } else {
        var d = H * 1.15;
        corpo += caixa(abs(W - d * 0.62, H * 0.5 - d / 2, d, d) + 'border-radius:50%;background:' + P.apoio);
        corpo += caixa(abs(W - d * 0.62 + d * 0.32, H * 0.5 - d * 0.18, d * 0.36, d * 0.36) + 'border-radius:50%;background:' + P.principal);
      }
      py = topo + logoH + U * 0.03; ph = fimTexto - py; pw = cortaX - m - m * 0.9;
    } else if (c.temFoto) {
      var fy = topo + logoH + U * 0.05, fh = fotoAltura('simples', c.tipo, W, H, c.mt, c.mb, c.dec.extras);
      var rr = M.FORMAS[c.marca.forma].raio(Math.min(fh, W) * 0.5);
      corpo += '<div style="' + abs(m, fy, W - 2 * m, fh) + 'overflow:hidden;border-radius:' + M.raioCss(rr) + '">' + '<img data-x="img" src="' + (c.foto || '') + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">' + '</div>';
      py = fy + fh + U * 0.05; ph = fimTexto - py;
    } else {
      var dd = W * 0.62;
      corpo += caixa(abs(W - dd * 0.58, -dd * 0.38, dd, dd) + 'border-radius:50%;background:' + P.apoio);
      py = topo + logoH + U * 0.12; ph = fimTexto - py;
    }
    var bloco = caixa('width:' + px(U * 0.07) + ';height:' + px(U * 0.012) + ';background:' + P.principal + ';margin-bottom:' + px(U * 0.028) + ';flex:none') +
      '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:800;font-size:' + px(tam) + ';line-height:1.06;letter-spacing:-0.015em;color:' + (c.vazio ? P.suave : P.escura) + ';flex:none">' + rico(c.titulo, realce) + '</div>' +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-size:' + px(U * 0.034) + ';line-height:1.35;color:' + P.texto + ';margin-top:' + px(U * 0.024) + ';flex:none">' + rico(c.apoio, realce) + '</div>' : '') +
      acoes((c.data ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(U * 0.03) + ';line-height:1.3;color:' + P.principalLegivel + ';margin-top:' + px(U * 0.026) + ';text-transform:uppercase;letter-spacing:.04em;flex:none">' + esc(c.data) + '</div>' : ''), botao(c.chamada, c.marca, P, fundo, U * 0.03, alinhar), c.tipo === 'largo', U * 0.022);
    corpo += pilha(px0, py, pw, ph, bloco, alinhar, c.tipo === 'largo' || (c.tipo === 'alto' && c.temFoto) ? 'center' : 'flex-end');
    corpo += rod.html;
    return { fundo: fundo, corpo: corpo };
  }

  /* =========================================================
     SOFISTICADO · fundo profundo, linhas finas, editorial
     ========================================================= */
  function sofisticado(c) {
    var P = c.P, fundo = P.escura, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U;
    var ac = C.garantir(P.destaque, fundo, 4.5), claro = C.mix('#ffffff', fundo, 0.16);
    var realce = function (x) { return '<em style="color:' + ac + ';font-style:italic">' + x + '</em>'; };
    var logoH = U * 0.05, topo = c.mt, centro = c.tipo !== 'largo' && !(c.tipo === 'quadrado' && c.temFoto);
    var serif = M.serifada(c.marca.fontes.titulo);
    // Moldura fina
    var ins = m * 0.45;
    if (c.tipo !== 'largo') corpo += '<div style="' + abs(ins, ins, W - 2 * ins, H - 2 * ins) + 'border:' + px(Math.max(1.5, U * 0.0022)) + ' solid ' + C.mix(ac, fundo, 0.5) + '"></div>';
    var rod = rodapeHtml(c, C.mix('#ffffff', fundo, 0.4), centro ? 'center' : 'left');
    var fimTexto = H - c.mb - (rod.h ? rod.h + U * 0.03 : 0);
    var tam = U * (c.tipo === 'largo' ? 0.092 : 0.09) * c.dec.escala * (c.temFoto ? 1 : 1.2);
    var chapeu = c.selo ? '<div style="display:flex;align-items:center;gap:' + px(U * 0.018) + ';margin-bottom:' + px(U * 0.03) + ';flex:none">' + caixa('width:' + px(U * 0.05) + ';height:' + px(Math.max(1.5, U * 0.0025)) + ';background:' + ac) +
      '<span data-x="texto" style="font-family:' + c.fX + ';font-weight:600;font-size:' + px(U * 0.022) + ';line-height:1.4;color:' + ac + ';text-transform:uppercase;letter-spacing:.32em">' + esc(c.selo) + '</span>' + (centro ? caixa('width:' + px(U * 0.05) + ';height:' + px(Math.max(1.5, U * 0.0025)) + ';background:' + ac) : '') + '</div>' : '';
    var bloco = chapeu +
      '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:' + (serif ? 600 : 500) + ';font-size:' + px(tam) + ';line-height:1.1;letter-spacing:' + (serif ? '0' : '-0.02em') + ';color:' + (c.vazio ? C.mix('#ffffff', fundo, 0.45) : '#ffffff') + ';flex:none">' + rico(c.titulo, realce) + '</div>' +
      caixa('width:' + px(U * 0.08) + ';height:' + px(Math.max(1.5, U * 0.0025)) + ';background:' + ac + ';margin:' + px(U * 0.032) + ' 0 0;flex:none') +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:300;font-size:' + px(U * 0.032) + ';line-height:1.45;color:' + claro + ';margin-top:' + px(U * 0.026) + ';flex:none">' + rico(c.apoio, realce) + '</div>' : '') +
      acoes((c.data ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:600;font-size:' + px(U * 0.024) + ';line-height:1.4;color:' + ac + ';margin-top:' + px(U * 0.026) + ';text-transform:uppercase;letter-spacing:.2em;flex:none">' + esc(c.data) + '</div>' : ''), botao(c.chamada, c.marca, P, fundo, U * 0.028, centro ? 'center' : 'left'), c.tipo === 'largo', U * 0.022);

    if (c.tipo === 'largo') {
      var fw = c.temFoto ? Math.round(W * 0.38) : 0;
      if (c.temFoto) corpo += foto(c.foto, 0, 0, fw, H);
      else corpo += '<div style="' + abs(W - H * 0.78, H * 0.15, H * 0.7, H * 0.7) + 'border-radius:50%;border:' + px(Math.max(1.5, U * 0.0025)) + ' solid ' + C.mix(ac, fundo, 0.4) + '"></div>';
      var tx = fw ? fw + m * 1.1 : m;
      corpo += '<div style="' + abs(tx, topo, W * 0.4) + '">' + logo(c.marca, P, logoH, fundo, W * 0.3) + '</div>';
      corpo += pilha(tx, topo + logoH + U * 0.02, W - tx - m - (fw ? 0 : H * 0.95), fimTexto - topo - logoH - U * 0.02, bloco, 'left', 'center');
      corpo += rod.html.replace('left:' + px(m), 'left:' + px(tx));
    } else if (c.tipo === 'quadrado' && c.temFoto) {
      var aw = Math.round(W * 0.4), ax = m, ay = topo + logoH + U * 0.06, ah = fimTexto - ay;
      corpo += '<div style="' + abs(m, topo, W * 0.5) + '">' + logo(c.marca, P, logoH, fundo, W * 0.35) + '</div>';
      corpo += '<div style="' + abs(ax, ay, aw, ah) + 'overflow:hidden;border-radius:' + px(aw / 2) + ' ' + px(aw / 2) + ' 0 0"><img data-x="img" src="' + (c.foto || '') + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>';
      var tx2 = ax + aw + m * 0.7;
      corpo += pilha(tx2, ay, W - tx2 - m, ah, bloco, 'left', 'flex-end');
      corpo += rod.html;
    } else {
      corpo += '<div style="position:absolute;left:0;right:0;top:' + px(topo) + ';display:flex;justify-content:center">' + logo(c.marca, P, logoH, fundo, W * 0.4) + '</div>';
      var y0 = topo + logoH + U * 0.06;
      if (c.temFoto) {
        var aw2 = Math.round(W * 0.58), ah2 = Math.round((fimTexto - y0) * (0.56 - 0.04 * c.dec.extras));
        corpo += '<div style="' + abs((W - aw2) / 2, y0, aw2, ah2) + 'overflow:hidden;border-radius:' + px(aw2 / 2) + ' ' + px(aw2 / 2) + ' 0 0"><img data-x="img" src="' + (c.foto || '') + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>';
        y0 += ah2 + U * 0.05;
      }
      corpo += pilha(m * 1.4, y0, W - m * 2.8, fimTexto - y0, bloco, 'center', 'center');
      corpo += rod.html;
    }
    return { fundo: fundo, corpo: corpo };
  }

  /* =========================================================
     ROBUSTO · cor chapada, título grande, formas fortes
     ========================================================= */
  function robusto(c) {
    var P = c.P, fundo = P.principal, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U;
    var tx = P.sobrePrincipal, hl = P.destaque;
    if (C.contraste(hl, fundo) < 1.6) hl = C.lum(fundo) < 0.4 ? '#ffffff' : P.escura;
    var hlTx = C.sobre(hl, P.escura);
    var realce = function (x) { return '<span style="background:' + hl + ';color:' + hlTx + ';padding:0 .12em;box-decoration-break:clone;-webkit-box-decoration-break:clone">' + x + '</span>'; };
    var logoH = U * 0.055, topo = c.mt;
    var rod = rodapeHtml(c, tx, 'left');
    var fimTexto = H - c.mb - (rod.h ? rod.h + U * 0.03 : 0);
    var tam = U * (c.tipo === 'largo' ? 0.112 : 0.118) * c.dec.escala * (c.temFoto ? 1 : 1.2);
    var seloH = U * 0.05;
    var seloBg = hl === P.escura ? '#ffffff' : P.escura;
    var selo = c.selo ? '<div data-x="caixa" style="background:' + seloBg + ';border-radius:' + M.raioCss(M.FORMAS[c.marca.forma].raio(seloH)) + ';height:' + px(seloH) + ';padding:0 ' + px(U * 0.022) + ';display:inline-flex;align-items:center"><span data-x="texto" style="font-family:' + c.fX + ';font-weight:800;font-size:' + px(U * 0.022) + ';line-height:1;color:' + C.sobre(seloBg, P.escura) + ';text-transform:uppercase;letter-spacing:.1em;white-space:nowrap">' + esc(c.selo) + '</span></div>' : '';

    var bloco = '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:900;font-size:' + px(tam) + ';line-height:.98;letter-spacing:-0.02em;text-transform:uppercase;color:' + tx + ';flex:none' + (c.vazio ? ';opacity:.55' : '') + '">' + rico(c.titulo, realce) + '</div>' +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:600;font-size:' + px(U * 0.034) + ';line-height:1.3;color:' + tx + ';margin-top:' + px(U * 0.026) + ';flex:none">' + rico(c.apoio, realce) + '</div>' : '') +
      acoes((c.data ? '<div style="margin-top:' + px(U * 0.026) + ';flex:none;display:flex"><div data-x="caixa" style="background:' + hl + ';display:inline-flex;align-items:center;min-height:' + px(U * 0.054) + ';max-width:100%;box-sizing:border-box;padding:' + px(U * 0.008) + ' ' + px(U * 0.018) + '"><span data-x="texto" style="font-family:' + c.fX + ';font-weight:800;font-size:' + px(U * 0.028) + ';line-height:1.2;color:' + hlTx + ';text-transform:uppercase;letter-spacing:.03em">' + esc(c.data) + '</span></div></div>' : ''), botao(c.chamada, c.marca, P, fundo, U * 0.032, 'left'), c.tipo === 'largo', U * 0.022);

    if (c.tipo === 'largo') {
      var fx = Math.round(W * (c.temFoto ? 0.62 : 0.74));
      if (c.temFoto) { corpo += foto(c.foto, fx, 0, W - fx, H); corpo += caixa(abs(fx - U * 0.018, 0, U * 0.018, H) + 'background:' + hl); }
      else { var d = H * 1.3; corpo += caixa(abs(fx, H - d * 0.62, d, d) + 'border-radius:50%;background:' + hl); corpo += caixa(abs(fx + d * 0.42, -d * 0.35, d * 0.55, d * 0.55) + 'border-radius:50%;background:' + P.escura); }
      corpo += '<div style="' + abs(m, topo, fx - 2 * m) + 'display:flex;align-items:center;justify-content:space-between">' + logo(c.marca, P, logoH, fundo, W * 0.3) + selo + '</div>';
      corpo += pilha(m, topo + logoH + U * 0.025, fx - m * 1.8, fimTexto - topo - logoH - U * 0.025, bloco, 'left', 'center');
      corpo += rod.html;
    } else {
      var yTexto;
      if (c.temFoto) {
        var fh = fotoAltura('robusto', c.tipo, W, H, c.mt, c.mb, c.dec.extras);
        corpo += foto(c.foto, 0, 0, W, fh);
        corpo += caixa(abs(0, fh, W, U * 0.018) + 'background:' + hl);
        corpo += '<div style="' + abs(m, topo, W - 2 * m) + 'display:flex;align-items:center;justify-content:space-between">' + logo(c.marca, P, logoH, 'foto', W * 0.4) + selo + '</div>';
        yTexto = fh + U * 0.06;
      } else {
        var d2 = W * 0.86;
        corpo += caixa(abs(W - d2 * 0.62, -d2 * 0.36, d2, d2) + 'border-radius:50%;background:' + hl);
        corpo += caixa(abs(W * 0.8, H - W * 0.13, W * 0.34, W * 0.34) + 'border-radius:50%;background:' + P.escura + ';opacity:1');
        corpo += '<div style="' + abs(m, topo, W - 2 * m) + 'display:flex;align-items:center;justify-content:space-between">' + logo(c.marca, P, logoH, fundo, W * 0.4) + selo + '</div>';
        yTexto = topo + logoH + U * 0.2;
      }
      corpo += pilha(m, yTexto, W - 2 * m, fimTexto - yTexto, bloco, 'left', c.temFoto ? (c.tipo === 'alto' ? 'center' : 'flex-start') : 'flex-end');
      corpo += rod.html;
    }
    return { fundo: fundo, corpo: corpo };
  }


  /* ---------- Imagens geradas (degradês e texturas), para sair iguais no PNG, PDF e PowerPoint ---------- */
  var cacheGerado = {};
  function rgba(h, a) { var x = String(h).replace('#', ''); return 'rgba(' + parseInt(x.substr(0, 2), 16) + ',' + parseInt(x.substr(2, 2), 16) + ',' + parseInt(x.substr(4, 2), 16) + ',' + a + ')'; }
  function tela(w, h) { if (typeof document === 'undefined') return null; var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  /* Sombra em degradê para texto sobre foto: escuro onde o texto fica. */
  function sombra(W, H, cor, lado) {
    var k = ['s', W, H, cor, lado].join('|'); if (cacheGerado[k]) return cacheGerado[k];
    var w = Math.round(W / 2), h = Math.round(H / 2), c = tela(w, h); if (!c) return '';
    var x = c.getContext('2d'), g;
    if (lado === 'esquerda') { g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, rgba(cor, 0.94)); g.addColorStop(0.45, rgba(cor, 0.75)); g.addColorStop(0.8, rgba(cor, 0.05)); g.addColorStop(1, rgba(cor, 0)); }
    else { g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgba(cor, 0.55)); g.addColorStop(0.2, rgba(cor, 0)); g.addColorStop(0.42, rgba(cor, 0.05)); g.addColorStop(0.72, rgba(cor, 0.82)); g.addColorStop(1, rgba(cor, 0.96)); }
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    return (cacheGerado[k] = c.toDataURL('image/png'));
  }
  /* Luzes em degradê com textura de grão (layout Gradiente e fundo sem foto). */
  function luzes(W, H, P, semente, suave) {
    var k = ['l', W, H, P.principal, P.destaque, P.escura, semente, suave].join('|'); if (cacheGerado[k]) return cacheGerado[k];
    var w = Math.round(W / 2), h = Math.round(H / 2), c = tela(w, h); if (!c) return '';
    var x = c.getContext('2d'), U = Math.max(w, h);
    x.fillStyle = P.escura; x.fillRect(0, 0, w, h);
    function bolha(cx, cy, r, cor, a) { var g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba(cor, a)); g.addColorStop(1, rgba(cor, 0)); x.fillStyle = g; x.fillRect(0, 0, w, h); }
    if (suave) { var g2 = x.createLinearGradient(0, 0, w * 0.4, h); g2.addColorStop(0, P.principal); g2.addColorStop(1, P.escura); x.fillStyle = g2; x.fillRect(0, 0, w, h); bolha(w * 0.85, h * 0.1, U * 0.6, P.destaque, 0.35); }
    else {
      bolha(w * 0.9, h * 0.05, U * 0.75, P.principal, 0.95);
      bolha(w * 0.05, h * 0.55, U * 0.6, P.destaque, 0.55);
      bolha(w * 0.7, h * 0.95, U * 0.55, P.principal, 0.6);
    }
    // grão
    var img = x.getImageData(0, 0, w, h), d = img.data, s = 1234 + (semente || 0);
    for (var i = 0; i < d.length; i += 4) { s = (s * 16807) % 2147483647; var n = (s / 2147483647 - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(img, 0, 0);
    return (cacheGerado[k] = c.toDataURL('image/jpeg', 0.9));
  }

  /* =========================================================
     SÓ TEXTO · básico, o recado é a imagem
     ========================================================= */
  function texto(c) {
    var P = c.P, fundo = P.fundo, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U;
    var logoH = U * 0.055, topo = c.mt;
    var realce = function (x) { return '<span style="background:' + P.apoio + ';color:' + P.escura + ';padding:0 .1em;box-decoration-break:clone;-webkit-box-decoration-break:clone">' + x + '</span>'; };
    corpo += caixa(abs(0, 0, W, Math.max(6, U * 0.014)) + 'background:' + P.principal);
    corpo += '<div style="' + abs(m, topo, W * 0.5) + '">' + logo(c.marca, P, logoH, fundo, W * 0.4) + '</div>';
    var rod = rodapeHtml(c, P.suave, 'left');
    var fimTexto = H - c.mb - (rod.h ? rod.h + U * 0.03 : 0);
    var tam = U * (c.tipo === 'largo' ? 0.13 : 0.135) * c.dec.escala;
    var selo = c.selo ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(U * 0.026) + ';line-height:1.3;color:' + P.principalLegivel + ';text-transform:uppercase;letter-spacing:.14em;margin-bottom:' + px(U * 0.03) + ';flex:none">' + esc(c.selo) + '</div>' : '';
    var bloco = selo +
      '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:800;font-size:' + px(tam) + ';line-height:1.02;letter-spacing:-0.025em;color:' + (c.vazio ? P.suave : P.escura) + ';flex:none">' + rico(c.titulo, realce) + '</div>' +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-size:' + px(U * 0.036) + ';line-height:1.35;color:' + P.texto + ';margin-top:' + px(U * 0.03) + ';flex:none">' + rico(c.apoio, realce) + '</div>' : '') +
      acoes(c.data ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(U * 0.03) + ';line-height:1.3;color:' + P.principalLegivel + ';margin-top:' + px(U * 0.03) + ';text-transform:uppercase;letter-spacing:.04em;flex:none">' + esc(c.data) + '</div>' : '', botao(c.chamada, c.marca, P, fundo, U * 0.03, 'left'), c.tipo === 'largo', U * 0.022);
    var py = topo + logoH + U * 0.06;
    if (c.girado && c.tipo !== 'largo') {
      var colW = Math.round(W * 0.44), tamV = Math.min(tam * 1.15, colW * 0.42);
      corpo += girarBloco(m, py, colW, fimTexto - py, -90, '<div data-x="texto" data-fit="' + tamV.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:800;font-size:' + px(tamV) + ';line-height:1;letter-spacing:-0.025em;color:' + (c.vazio ? P.suave : P.escura) + ';flex:none">' + rico(c.titulo, realce) + '</div>', 'left', 'flex-end');
      var resto = selo + (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-size:' + px(U * 0.036) + ';line-height:1.35;color:' + P.texto + ';flex:none">' + rico(c.apoio, realce) + '</div>' : '') +
        acoes(c.data ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(U * 0.03) + ';line-height:1.3;color:' + P.principalLegivel + ';margin-top:' + px(U * 0.03) + ';text-transform:uppercase;letter-spacing:.04em;flex:none">' + esc(c.data) + '</div>' : '', botao(c.chamada, c.marca, P, fundo, U * 0.03, 'left'), false, U * 0.022);
      corpo += pilha(m + colW + m * 0.6, py, W - colW - m * 2.6, fimTexto - py, resto, 'left', 'flex-end');
    } else corpo += pilha(m, py, W - 2 * m, fimTexto - py, bloco, 'left', 'center');
    corpo += rod.html;
    return { fundo: fundo, corpo: corpo };
  }

  /* =========================================================
     FOTO DE FUNDO · elaborado, foto na peça inteira
     ========================================================= */
  function fundoFoto(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U;
    var escuro = C.mix(P.escura, '#000000', 0.35), tx = '#ffffff';
    var ac = C.garantir(P.destaque, escuro, 4.5);
    var realce = function (x) { return '<span style="color:' + ac + '">' + x + '</span>'; };
    var largo = c.tipo === 'largo';
    if (c.temFoto) {
      corpo += foto(c.foto, 0, 0, W, H);
      corpo += '<img data-x="img" src="' + sombra(W, H, escuro, largo ? 'esquerda' : 'base') + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    } else {
      corpo += '<img data-x="img" src="' + luzes(W, H, P, 3, true) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    }
    var logoH = U * 0.055, topo = c.mt;
    var seloH = U * 0.048;
    var selo = c.selo ? '<div data-x="caixa" style="background:' + ac + ';border-radius:' + M.raioCss(M.FORMAS[c.marca.forma].raio(seloH)) + ';height:' + px(seloH) + ';padding:0 ' + px(U * 0.02) + ';display:inline-flex;align-items:center"><span data-x="texto" style="font-family:' + c.fX + ';font-weight:800;font-size:' + px(U * 0.021) + ';line-height:1;color:' + C.sobre(ac, P.escura) + ';text-transform:uppercase;letter-spacing:.1em;white-space:nowrap">' + esc(c.selo) + '</span></div>' : '';
    corpo += '<div style="' + abs(m, topo, (largo ? W * 0.55 : W - 2 * m)) + 'display:flex;align-items:center;justify-content:space-between">' + logo(c.marca, P, logoH, escuro, W * 0.4) + (largo ? '' : selo) + '</div>';
    var rod = rodapeHtml(c, C.mix('#ffffff', escuro, 0.18), 'left');
    var fimTexto = H - c.mb - (rod.h ? rod.h + U * 0.03 : 0);
    var tam = U * (largo ? 0.1 : 0.105) * c.dec.escala;
    var bloco = (largo && selo ? '<div style="margin-bottom:' + px(U * 0.025) + ';flex:none">' + selo + '</div>' : '') +
      '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:800;font-size:' + px(tam) + ';line-height:1.04;letter-spacing:-0.02em;color:' + tx + ';flex:none' + (c.vazio ? ';opacity:.7' : '') + '">' + rico(c.titulo, realce) + '</div>' +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:500;font-size:' + px(U * 0.034) + ';line-height:1.35;color:' + C.mix('#ffffff', escuro, 0.1) + ';margin-top:' + px(U * 0.024) + ';flex:none">' + rico(c.apoio, realce) + '</div>' : '') +
      acoes(c.data ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(U * 0.028) + ';line-height:1.3;color:' + ac + ';margin-top:' + px(U * 0.024) + ';text-transform:uppercase;letter-spacing:.06em;flex:none">' + esc(c.data) + '</div>' : '', botao(c.chamada, c.marca, P, escuro, U * 0.03, 'left'), largo, U * 0.022);
    var py = topo + logoH + U * 0.06;
    corpo += pilha(m, py, (largo ? W * 0.55 : W - 2 * m), fimTexto - py, bloco, 'left', largo ? 'center' : 'flex-end');
    corpo += rod.html;
    return { fundo: escuro, corpo: corpo };
  }

  /* =========================================================
     GRADIENTE · premium, luzes, grão e foto em cartão
     ========================================================= */
  function efeito(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U;
    var base = P.escura, tx = '#ffffff', ac = C.garantir(C.mix(P.destaque, '#ffffff', 0.15), base, 4.5);
    var realce = function (x) { return '<span style="color:' + ac + ';font-style:italic">' + x + '</span>'; };
    corpo += '<img data-x="img" src="' + luzes(W, H, P, 7, false) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    var logoH = U * 0.05, topo = c.mt, largo = c.tipo === 'largo';
    corpo += '<div style="' + abs(m, topo, W * 0.5) + '">' + logo(c.marca, P, logoH, base, W * 0.4) + '</div>';
    var rod = rodapeHtml(c, C.mix('#ffffff', base, 0.25), 'left');
    var fimTexto = H - c.mb - (rod.h ? rod.h + U * 0.03 : 0);
    var s = slotEfeito(c.tipo, W, H, m, c.mt), borda = Math.max(4, U * 0.008);
    if (c.temFoto) {
      var r = M.FORMAS[c.marca.forma].raio(Math.min(s.w, s.h) * 0.3);
      corpo += '<div data-x="caixa" style="' + abs(s.x - borda, s.y - borda, s.w + 2 * borda, s.h + 2 * borda) + 'background:#ffffff;border-radius:' + M.raioCss(r.map(function (v) { return v + borda; })) + ';box-shadow:0 ' + px(U * 0.03) + ' ' + px(U * 0.07) + ' rgba(0,0,0,.35);transform:rotate(' + (largo ? 0 : 3) + 'deg)">' +
        '<img data-x="img" src="' + c.foto + '" alt="" style="position:absolute;left:' + px(borda) + ';top:' + px(borda) + ';width:' + px(s.w) + ';height:' + px(s.h) + ';object-fit:cover;display:block;border-radius:' + M.raioCss(r) + '"></div>';
    }
    var tam = U * (largo ? 0.1 : 0.11) * c.dec.escala * (c.temFoto ? (c.tipo === 'quadrado' ? 0.85 : 0.92) : 1.15);
    var selo = c.selo ? '<div style="display:flex;margin-bottom:' + px(U * 0.026) + ';flex:none"><div data-x="caixa" style="background:' + C.mix('#ffffff', base, 0.85) + ';border:' + px(Math.max(1.5, U * 0.002)) + ' solid ' + C.mix('#ffffff', base, 0.6) + ';border-radius:999px;height:' + px(U * 0.046) + ';padding:0 ' + px(U * 0.02) + ';display:inline-flex;align-items:center"><span data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(U * 0.02) + ';line-height:1;color:#fff;text-transform:uppercase;letter-spacing:.16em;white-space:nowrap">' + esc(c.selo) + '</span></div></div>' : '';
    var bloco = selo +
      '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:700;font-size:' + px(tam) + ';line-height:1.03;letter-spacing:-0.025em;color:' + tx + ';flex:none' + (c.vazio ? ';opacity:.7' : '') + '">' + rico(c.titulo, realce) + '</div>' +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:400;font-size:' + px(U * 0.032) + ';line-height:1.4;color:' + C.mix('#ffffff', base, 0.15) + ';margin-top:' + px(U * 0.024) + ';flex:none">' + rico(c.apoio, realce) + '</div>' : '') +
      acoes(c.data ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:600;font-size:' + px(U * 0.026) + ';line-height:1.3;color:' + ac + ';margin-top:' + px(U * 0.024) + ';text-transform:uppercase;letter-spacing:.14em;flex:none">' + esc(c.data) + '</div>' : '', botao(c.chamada, c.marca, Object.assign({}, P, { acao: ac }), base, U * 0.03, 'left'), largo, U * 0.022);
    var px0 = m, py, pw = W - 2 * m;
    var lado = largo || c.tipo === 'quadrado';
    if (lado) { pw = (c.temFoto ? s.x : W) - m * (c.temFoto ? 1.5 : 2); py = topo + logoH + U * 0.03; }
    else py = c.temFoto ? s.y + s.h + U * 0.07 : topo + logoH + U * 0.1;
    corpo += pilha(px0, py, pw, fimTexto - py, bloco, 'left', largo ? 'center' : 'flex-end');
    corpo += rod.html;
    return { fundo: base, corpo: corpo };
  }
  function slotEfeito(tipo, W, H, m, mt) {
    if (tipo === 'largo') { var h = Math.round(H * 0.68), w = Math.round(h * 0.82); return { x: W - m - w - m * 0.3, y: Math.round((H - h) / 2), w: w, h: h }; }
    if (tipo === 'alto') { var w2 = Math.round(W * 0.62), h2 = Math.round(w2 * 1.05); return { x: W - m - w2, y: mt + Math.round(W * 0.12), w: w2, h: h2 }; }
    var w3 = Math.round(W * 0.4), h3 = Math.round(W * 0.5); return { x: W - m - w3, y: Math.round((H - h3) / 2) + Math.round(W * 0.03), w: w3, h: h3 };
  }


  /* Grão de filme por cima (transparente) e linhas de grade. */
  function grao(W, H, forca) {
    var k = ['g', W, H, forca].join('|'); if (cacheGerado[k]) return cacheGerado[k];
    var w = Math.round(W / 2), h = Math.round(H / 2), c = tela(w, h); if (!c) return '';
    var x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data, sd = 777;
    for (var i = 0; i < d.length; i += 4) { sd = (sd * 16807) % 2147483647; var v = sd / 2147483647 > 0.5 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.round((forca || 0.08) * 255 * (sd % 7) / 6); }
    x.putImageData(img, 0, 0);
    return (cacheGerado[k] = c.toDataURL('image/png'));
  }
  function linhasGrade(W, H, cel, cor) {
    var k = ['lg', W, H, cel, cor].join('|'); if (cacheGerado[k]) return cacheGerado[k];
    var c = tela(W, H); if (!c) return '';
    var x = c.getContext('2d'); x.strokeStyle = cor; x.lineWidth = Math.max(1, W / 900);
    for (var gx = cel; gx < W; gx += cel) { x.beginPath(); x.moveTo(gx + 0.5, 0); x.lineTo(gx + 0.5, H); x.stroke(); }
    for (var gy = cel; gy < H; gy += cel) { x.beginPath(); x.moveTo(0, gy + 0.5); x.lineTo(W, gy + 0.5); x.stroke(); }
    return (cacheGerado[k] = c.toDataURL('image/png'));
  }
  function img(src, x, y, w, h, extra) { return src ? '<img data-x="img" src="' + src + '" alt="" style="' + abs(x, y, w, h) + 'display:block;object-fit:cover;' + (extra || '') + '">' : ''; }
  function etiqueta(texto, c, cor, tam, extra) { return texto ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(tam) + ';line-height:1.25;color:' + cor + ';text-transform:uppercase;letter-spacing:.06em;white-space:pre-line;' + (extra || '') + '">' + esc(texto) + '</div>' : ''; }
  function marcaOuLogo(c, cor, h, fundo) {
    if (c.marca.logo || c.marca.logoClaro) return logo(c.marca, c.P, h, fundo, c.W * 0.3);
    return etiqueta(c.marca.nome, c, cor, h * 0.46);
  }

  /* =========================================================
     MANCHETE · elaborado, título enorme e legendas nos cantos
     ========================================================= */
  function manchete(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var escuro = c.temFoto, fundo = escuro ? '#111111' : C.mix(P.escura, '#F7F3EC', 0.93);
    var tx = escuro ? '#ffffff' : P.escura, ac = escuro ? C.garantir(P.destaque, '#1a1a1a', 4.5) : P.principalLegivel;
    var realce = function (x) { return '<em style="font-style:italic;color:' + ac + ';font-weight:800">' + x + '</em>'; };
    if (escuro) corpo += img(c.foto, 0, 0, W, H);
    var et = U * 0.022, topo = c.mt;
    corpo += '<div style="' + abs(m, topo, W - 2 * m) + 'display:flex;justify-content:space-between;align-items:flex-start;gap:' + px(m) + '">' + marcaOuLogo(c, tx, U * 0.05, fundo) +
      etiqueta([c.selo, c.data].filter(Boolean).join('\n'), c, tx, et, 'text-align:right') + '</div>';
    var baseH = U * (largo ? 0.085 : 0.12), fim = H - c.mb - baseH;
    var tam = U * (largo ? 0.1 : 0.2) * c.dec.escala;
    var titulo = '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:900;font-size:' + px(tam) + ';line-height:.9;letter-spacing:-0.045em;color:' + tx + ';flex:none' + (c.vazio ? ';opacity:.55' : '') + '">' + rico(c.titulo, realce) + '</div>';
    var py = topo + U * (largo ? 0.065 : 0.1);
    if (c.girado && !largo) corpo += girarBloco(m, py, W * 0.62, fim - py, -90, titulo, 'left', 'flex-start');
    else corpo += pilha(m, py, W - 2 * m, fim - py, titulo, 'left', 'flex-start');
    var rodBase = c.rodape ? etiqueta(c.rodape, c, tx, et * 0.85, 'opacity:.75;margin-top:' + px(et)) : '';
    corpo += '<div style="position:absolute;left:' + px(m) + ';right:' + px(m) + ';bottom:' + px(c.mb) + ';display:flex;justify-content:space-between;align-items:flex-end;gap:' + px(m) + '">' +
      '<div style="max-width:55%">' + etiqueta(c.apoio, c, tx, et) + rodBase + '</div>' +
      '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:700;font-size:' + px(c.chamada ? et * 1.1 : U * 0.06) + ';line-height:1;color:' + tx + ';text-transform:uppercase;letter-spacing:.06em;white-space:nowrap">' + (c.chamada ? esc(c.chamada) + ' &nbsp;→' : '→') + '</div></div>';
    return { fundo: fundo, corpo: corpo };
  }

  /* =========================================================
     FOCO · premium, foto desfocada na cor da marca + janela nítida
     ========================================================= */
  function janelaFoco(tipo, W, H, U) {
    if (tipo === 'largo') { var w = Math.round(W * 0.3), h = Math.round(H * 0.22); return { x: Math.round((W - w) / 2), y: Math.round(H * 0.16), w: w, h: h }; }
    var w2 = Math.round(W * 0.5), h2 = Math.round(W * 0.13); return { x: Math.round((W - w2) / 2), y: Math.round(H * (tipo === 'alto' ? 0.3 : 0.27)), w: w2, h: h2 };
  }
  function foco(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var base = C.mix(P.escura, '#000000', 0.45);
    if (c.temFoto && c.dados._fotoFundo) corpo += img(c.dados._fotoFundo, 0, 0, W, H);
    else corpo += '<img data-x="img" src="' + luzes(W, H, P, 5, true) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    corpo += '<img data-x="img" src="' + grao(W, H, 0.1) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    var j = janelaFoco(c.tipo, W, H, U), b = Math.max(2, Math.round(U * 0.003));
    if (c.temFoto && c.foto) corpo += '<div data-x="caixa" style="' + abs(j.x - b, j.y - b, j.w + 2 * b, j.h + 2 * b) + 'background:#ffffff"></div>' + img(c.foto, j.x, j.y, j.w, j.h);
    else corpo += '<div data-x="caixa" style="' + abs(j.x, j.y, j.w, j.h) + 'border:' + px(b) + ' solid #ffffff;background:' + C.mix(P.principal, '#ffffff', 0.35) + '"></div>' +
      '<img data-x="img" src="' + luzes(Math.round(j.w), Math.round(j.h), P, 3, true) + '" alt="" style="' + abs(j.x + b, j.y + b, j.w - 2 * b, j.h - 2 * b) + 'display:block;opacity:.85">';
    var et = U * 0.021;
    corpo += '<div style="' + abs(m, c.mt, W - 2 * m) + 'display:flex;justify-content:space-between;align-items:center">' + marcaOuLogo(c, '#ffffff', U * 0.05, base) + etiqueta(c.selo, c, '#ffffff', et) + '</div>';
    var temRealce = /==/.test(c.titulo);
    var realce = function (x) { return '<span style="font-weight:800">' + x + '</span>'; };
    var tam = U * (largo ? 0.14 : 0.2) * c.dec.escala;
    var just = c.apoio && c.apoio.length > 40 ? 'text-align:justify;text-align-last:justify;' : 'text-align:center;';
    var bloco = '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:' + (temRealce ? 300 : 700) + ';font-size:' + px(tam) + ';line-height:.95;letter-spacing:-0.035em;color:#ffffff;flex:none' + (c.vazio ? ';opacity:.7' : '') + '">' + rico(c.titulo, realce) + '</div>' +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-size:' + px(U * 0.024) + ';line-height:1.45;color:' + C.mix('#ffffff', base, 0.12) + ';margin-top:' + px(U * 0.03) + ';max-width:' + px(W * 0.74) + ';width:100%;' + just + 'flex:none">' + esc(c.apoio) + '</div>' : '') +
      acoes(c.data ? etiqueta(c.data, c, C.garantir(P.destaque, base, 4.5), et, 'margin-top:' + px(U * 0.03) + ';letter-spacing:.16em;flex:none') : '', botao(c.chamada, c.marca, P, base, U * 0.028, 'center'), largo, U * 0.022);
    var rod = rodapeHtml(c, C.mix('#ffffff', base, 0.3), 'center');
    var py = j.y + j.h + U * 0.04, fim = H - c.mb - (rod.h ? rod.h + U * 0.03 : 0);
    corpo += pilha(m, py, W - 2 * m, fim - py, bloco, 'center', 'flex-start');
    corpo += rod.html;
    return { fundo: base, corpo: corpo };
  }

  /* =========================================================
     GRADE · premium, pôster com grade e quadrados de cor
     ========================================================= */
  function grade(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var base = C.mix(P.escura, '#05060a', 0.55), cel = Math.round(largo ? H / 4 : W / 6);
    var cor = C.contraste(P.acao, base) >= 2.2 ? P.acao : C.garantir(P.destaque, base, 3);
    var claro = C.mix('#F3E6D3', base, 0.04), ac = C.garantir(P.destaque, base, 4.5);
    if (c.temFoto && c.dados._fotoFundo) corpo += img(c.dados._fotoFundo, 0, 0, W, H);
    corpo += '<img data-x="img" src="' + sombra(W, H, base, largo ? 'esquerda' : 'base') + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    corpo += '<img data-x="img" src="' + linhasGrade(W, H, cel, 'rgba(255,255,255,0.16)') + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    var cols = Math.round(W / cel), lin = Math.floor(H / cel);
    corpo += caixa(abs(cel * (cols - 2), cel * 1, cel, cel) + 'background:' + cor);
    corpo += caixa(abs(largo ? cel * 1 : cel * (cols - 1), largo ? cel * (lin - 2) : cel * (lin - 3), cel, cel) + 'background:' + cor);
    var bb = Math.max(2, Math.round(U * 0.0035));
    corpo += '<div style="' + abs(cel * (cols - 3), 0, cel, cel) + 'border:' + px(bb) + ' solid ' + cor + ';display:flex;align-items:center;justify-content:center"><span data-x="texto" style="font:300 ' + px(cel * 0.62) + '/1 ' + c.fX + ';color:#ffffff">↙</span></div>';
    var livreNome = cel * (cols - 3) - m - U * 0.025;
    var nomeT = Math.min(U * (largo ? 0.06 : 0.055), livreNome / (Math.max(4, c.marca.nome.length) * 0.56));
    if (c.marca.logo || c.marca.logoClaro) corpo += '<div style="' + abs(m, c.mt, Math.min(W * 0.4, livreNome)) + '">' + logo(c.marca, P, U * 0.05, base, Math.min(W * 0.3, livreNome)) + '</div>';
    else corpo += '<div style="' + abs(m, Math.max(m * 0.4, c.mt - nomeT * 1.3), livreNome) + 'white-space:nowrap;font-family:' + c.fT + ';font-weight:600;font-size:' + px(nomeT) + ';line-height:.86;letter-spacing:-0.02em">' +
      '<div style="color:' + C.mix(claro, base, 0.7) + '">' + esc(c.marca.nome) + '</div><div style="color:' + C.mix(claro, base, 0.45) + '">' + esc(c.marca.nome) + '</div><div data-x="texto" style="color:' + claro + '">' + esc(c.marca.nome) + '</div></div>';
    /* Título em degraus: 1 a 4 linhas, alternando a margem e o recuo; cada linha cabe na sua largura. */
    var sem = MO_sem(c.titulo), palavras = sem.split(/\s+/).filter(Boolean);
    var nl = Math.max(1, Math.min(4, palavras.length, sem.length <= 22 ? 2 : Math.ceil(sem.length / (largo ? 22 : 15))));
    var linhas = [], alvo = sem.length / nl, atual = '';
    palavras.forEach(function (w) { if (atual && (atual + ' ' + w).length > alvo * 1.15 && linhas.length < nl - 1) { linhas.push(atual); atual = w; } else atual = atual ? atual + ' ' + w : w; });
    if (atual) linhas.push(atual);
    var fimMarca = (c.marca.logo || c.marca.logoClaro) ? c.mt + U * 0.05 : Math.max(m * 0.4, c.mt - nomeT * 1.3) + nomeT * 2.6;
    var y1 = Math.max(largo ? H * (linhas.length > 2 ? 0.24 : 0.34) : H * (linhas.length > 2 ? 0.34 : 0.42), fimMarca + U * 0.04), x2 = Math.round(W * (largo ? 0.3 : 0.36));
    var yLim = H - c.mb - cel * 0.8 - (c.apoio ? U * 0.07 : 0);
    var tam = U * (largo ? 0.12 : 0.2) * c.dec.escala;
    var degrau = linhas.length <= 2; // com 3 ou 4 linhas, o degrau embaralha a leitura: alinha tudo à esquerda
    linhas.forEach(function (l, i) { var x = degrau && i % 2 ? x2 : m; tam = Math.min(tam, (W - x - m) / (Math.max(1, l.length) * 0.6)); });
    tam = Math.min(tam, (yLim - y1) / (linhas.length * 1.04 + 0.3), largo ? H * 0.2 : 9999);
    var estilo = 'font-family:' + c.fT + ';font-weight:400;font-size:' + px(tam) + ';line-height:1;letter-spacing:-0.01em;text-transform:uppercase;white-space:nowrap;position:absolute;';
    var realceG = function (t) { return /==/.test(c.titulo) && palavrasRealce(c.titulo).indexOf(t) >= 0 ? ac : null; };
    linhas.forEach(function (l, i) {
      corpo += '<div data-x="texto" style="' + estilo + 'left:' + px(degrau && i % 2 ? x2 : m) + ';top:' + px(y1 + tam * (degrau ? 1.02 : 1.08) * i) + ';color:' + (realceG(l) || (i % 2 ? claro : '#ffffff')) + '">' + esc(l) + '</div>';
    });
    var l2 = linhas.length > 1;
    var et = U * 0.024, yb = y1 + tam * (linhas.length * 1.04 + 0.2);
    if (c.apoio) corpo += '<div data-x="texto" style="' + abs(x2, yb, W - x2 - m) + 'font-family:' + c.fX + ';font-size:' + px(et * 1.15) + ';line-height:1.4;color:' + C.mix('#ffffff', base, 0.2) + '">' + esc(c.apoio) + '</div>';
    var yRod = H - c.mb - cel * 0.6;
    var xBotao = cel * (largo ? cols - 3 : 2.5), largData = c.chamada ? xBotao - m - U * 0.02 : W * 0.6;
    if (c.data) corpo += '<div data-x="texto" style="' + abs(m, yRod, largData) + 'font-family:' + c.fT + ';font-size:' + px(Math.min(et * 1.6, largData / (c.data.length * 0.5))) + ';line-height:1.1;color:#ffffff">' + esc(c.data) + '</div>';
    if (c.chamada) corpo += '<div style="' + abs(cel * (largo ? cols - 3 : 2.5), yRod - cel * 0.2, cel * (largo ? 2 : 1.6), cel * 0.62) + 'border:' + px(bb) + ' solid ' + cor + ';display:flex;align-items:center;justify-content:center"><span data-x="texto" style="font:700 ' + px(et) + '/1.1 ' + c.fX + ';color:#ffffff;text-align:center">' + esc(c.chamada) + '</span></div>';
    corpo += '<div data-x="texto" style="position:absolute;right:' + px(m) + ';bottom:' + px(c.mb) + ';font:300 ' + px(cel * 0.5) + '/1 ' + c.fX + ';color:#ffffff">✕</div>';
    var yRodape = Math.max(yRod + et * 2.4, c.chamada && !largo ? yRod + cel * 0.42 + et * 0.8 : 0);
    if (c.rodape || c.selo) corpo += '<div data-x="texto" style="' + abs(m, yRodape, W * 0.6) + 'font-family:' + c.fX + ';font-size:' + px(et * 0.8) + ';color:' + C.mix('#ffffff', base, 0.4) + ';text-transform:uppercase;letter-spacing:.1em">' + esc([c.selo, c.rodape].filter(Boolean).join(' · ')) + '</div>';
    return { fundo: base, corpo: corpo };
  }
  function MO_sem(t) { return String(t || '').replace(/==\([a-z0-9-]+\)([\s\S]+?)==/gi, '$1').replace(/==([\s\S]+?)==/g, '$1').replace(/\*\*([\s\S]+?)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').trim(); }
  function palavrasRealce(t) { var r = []; String(t).replace(/==(?:\([a-z0-9-]+\))?([\s\S]+?)==/gi, function (_, x) { r.push(x); }); return r.join(' '); }

  /* =========================================================
     MEIO-TOM · premium, recorte em retícula e título vertical
     ========================================================= */
  function janelasMeiotom(tipo, W, H, m) {
    if (tipo === 'largo') return { a: { x: m, y: m, w: Math.round(W * 0.22), h: H - 2 * m } };
    if (tipo === 'quadrado') return { a: { x: Math.round(W * 0.2), y: Math.round(H * 0.1), w: Math.round(W * 0.3), h: Math.round(H * 0.56) }, b: { x: Math.round(W * 0.56), y: Math.round(H * 0.5), w: Math.round(W * 0.22), h: Math.round(H * 0.16) } };
    return { a: { x: Math.round(W * 0.26), y: Math.round(H * 0.09), w: Math.round(W * 0.28), h: Math.round(H * 0.6) }, b: { x: Math.round(W * 0.62), y: Math.round(H * 0.53), w: Math.round(W * 0.26), h: Math.round(H * 0.16) } };
  }
  function meiotom(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var base = '#7a7a7a', tx = '#ffffff';
    if (c.temFoto && c.dados._fotoFundo) corpo += img(c.dados._fotoFundo, 0, 0, W, H);
    else corpo += '<img data-x="img" src="' + luzes(W, H, P, 9, true) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    var J = janelasMeiotom(c.tipo, W, H, m), b = Math.max(2, Math.round(U * 0.003));
    function janela(r, src) {
      if (src) return '<div data-x="caixa" style="' + abs(r.x - b, r.y - b, r.w + 2 * b, r.h + 2 * b) + 'background:#ffffff"></div>' + img(src, r.x, r.y, r.w, r.h);
      return '<div data-x="caixa" style="' + abs(r.x, r.y, r.w, r.h) + 'background:' + P.principal + ';border:' + px(b) + ' solid #ffffff"></div>';
    }
    corpo += janela(J.a, c.temFoto ? c.foto : '');
    if (J.b) corpo += janela(J.b, c.temFoto ? c.dados._fotoB : '');
    var et = U * 0.02;
    // meta na lateral esquerda, girada
    var nSelo = [c.selo, c.rodape].filter(Boolean).length;
    var meta = [c.marca.nome, c.data || c.selo].filter(Boolean).join(' — ');
    var altMeta = largo ? H - m - c.mb * 0.6 - nSelo * et * 1.3 - U * 0.06 : H * 0.5;
    var etM = Math.min(et, altMeta / (Math.max(8, meta.length) * 0.62));
    corpo += girarBloco(Math.round(m * 0.35), m, etM * 2.6, altMeta, -90, etiqueta(meta, c, tx, etM, 'white-space:nowrap'), 'right', 'center');
    var realce = function (x) { return '<span style="color:' + C.garantir(P.destaque, '#555555', 3) + '">' + x + '</span>'; };
    var n = MO_sem(c.titulo).length || 1;
    if (c.girado && !largo && n <= 34) {
      var col = { x: J.a.x + J.a.w + Math.round(W * 0.06), y: J.a.y, w: Math.round(W * 0.24), h: (J.b ? J.b.y - J.a.y - U * 0.03 : J.a.h) };
      var tamV = Math.min(col.w * 0.9, col.h / (n * 0.82)) * (n > 16 ? 1.7 : 1);
      corpo += girarBloco(col.x, col.y, col.w, col.h, 90, '<div data-x="texto" data-fit="' + tamV.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:500;font-size:' + px(tamV) + ';line-height:.95;letter-spacing:.02em;text-transform:uppercase;color:' + tx + ';flex:none">' + rico(c.titulo, realce) + '</div>', 'left', 'flex-start');
      var yA = J.a.y + J.a.h + U * 0.03;
      corpo += pilha(J.a.x, yA, W - J.a.x - m, H - c.mb - yA, (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:500;font-size:' + px(U * 0.026) + ';line-height:1.3;color:' + tx + ';max-width:' + px(W * 0.5) + ';flex:none">' + esc(c.apoio) + '</div>' : '') +
        acoes('', botao(c.chamada, c.marca, P, '#555555', U * 0.026, 'left'), false, U * 0.02), 'left', 'flex-start');
    } else {
      var tx0 = largo ? J.a.x + J.a.w + m : m, yT = largo ? m : J.a.y + J.a.h + U * 0.03;
      var tamH = U * (largo ? 0.12 : 0.13) * c.dec.escala;
      corpo += pilha(tx0, yT, W - tx0 - m, H - c.mb - yT, '<div data-x="texto" data-fit="' + tamH.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:500;font-size:' + px(tamH) + ';line-height:.95;text-transform:uppercase;color:' + tx + ';flex:none">' + rico(c.titulo, realce) + '</div>' +
        (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-size:' + px(U * 0.026) + ';line-height:1.3;color:' + tx + ';margin-top:' + px(U * 0.02) + ';flex:none">' + esc(c.apoio) + '</div>' : '') +
        acoes('', botao(c.chamada, c.marca, P, '#555555', U * 0.026, 'left'), largo, U * 0.02), 'left', largo ? 'center' : 'flex-start');
    }
    corpo += '<div data-x="texto" style="position:absolute;left:' + px(m * 0.35) + ';bottom:' + px(c.mb * 0.6) + ';font-family:' + c.fX + ';font-weight:700;font-size:' + px(et * 1.1) + ';line-height:1.15;color:' + tx + ';white-space:pre-line">' + esc([c.selo, c.rodape].filter(Boolean).join('\n')) + '</div>';
    return { fundo: base, corpo: corpo };
  }

  function fotoAltura(estilo, tipo, W, H, mt, mb, extras) {
    extras = extras || 0;
    if (estilo === 'simples') return Math.round(tipo === 'alto' ? (H - mt - mb) * (0.5 - 0.035 * extras) : H * (0.42 - 0.04 * extras));
    return Math.round(H * (tipo === 'alto' ? 0.48 - 0.03 * extras : 0.46 - 0.04 * extras));
  }

  /* =========================================================
     NOVOS LAYOUTS · regras de design aplicadas
     Pôster (básico) · Dividido e Fita (elaborados) · Corte, Mosaico e Revista (premium)
     ========================================================= */
  function pesoT(c, w) { return M.peso(c.marca.fontes.titulo, w); }
  function quebrarLinhas(texto, maxLinhas, largo) {
    var sem = MO_sem(texto), palavras = sem.split(/\s+/).filter(Boolean);
    var nl = Math.max(1, Math.min(maxLinhas, palavras.length, Math.ceil(sem.length / (largo ? 18 : 11))));
    var linhas = [], alvo = sem.length / nl, atual = '';
    palavras.forEach(function (w) { if (atual && (atual + ' ' + w).length > alvo * 1.12 && linhas.length < nl - 1) { linhas.push(atual); atual = w; } else atual = atual ? atual + ' ' + w : w; });
    if (atual) linhas.push(atual);
    return linhas;
  }
  function tituloCondensado(c, tam, cor, realce, extra) {
    return '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:' + pesoT(c, 800) + ';font-size:' + px(tam) + ';line-height:1;letter-spacing:-0.005em;text-transform:uppercase;color:' + cor + ';flex:none' + (c.vazio ? ';opacity:.6' : '') + ';' + (extra || '') + '">' + rico(c.titulo, realce) + '</div>';
  }

  /* PÔSTER · cor chapada, título condensado gigante, metadados nos cantos (grade suíça) */
  function slotPoster(tipo, W, H, m, mt, mb) {
    if (tipo === 'largo') return { x: Math.round(W * 0.6), y: m, w: Math.round(W * 0.4) - m, h: H - 2 * m };
    var h = Math.round(H * (tipo === 'alto' ? 0.34 : 0.36));
    return { x: m, y: H - mb - h, w: W - 2 * m, h: h };
  }
  function poster(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var base = P.principal, tx = C.sobre(base, P.escura), ac = C.garantir(P.destaque, base, 3);
    var realce = function (x) { return '<span style="color:' + ac + '">' + x + '</span>'; };
    var et = U * 0.019, topo = c.mt;
    corpo += '<div style="' + abs(m, topo, W - 2 * m) + 'display:flex;justify-content:space-between;align-items:flex-start;gap:' + px(m) + '">' +
      '<div>' + marcaOuLogo(c, tx, U * 0.045, base) + '</div>' + etiqueta([c.selo, c.data].filter(Boolean).join('\n'), c, tx, et, 'text-align:right;max-width:45%') + '</div>';
    var sf = c.temFoto ? slotPoster(c.tipo, W, H, m, c.mt, c.mb) : null;
    if (sf) corpo += img(c.foto, sf.x, sf.y, sf.w, sf.h) + caixa(abs(sf.x, sf.y, sf.w, sf.h) + 'background:' + rgba(base, 0.18));
    var py = topo + U * 0.08, fim = sf && !largo ? sf.y - U * 0.03 : H - c.mb - U * 0.07;
    var largura = sf && largo ? sf.x - m - U * 0.03 : W - 2 * m;
    var tam = U * (largo ? 0.16 : (sf ? 0.17 : 0.24)) * c.dec.escala;
    var bloco = tituloCondensado(c, tam, tx, realce) +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:600;font-size:' + px(U * 0.028) + ';line-height:1.35;color:' + tx + ';margin-top:' + px(U * 0.022) + ';max-width:' + px(largura * 0.8) + ';flex:none">' + rico(c.apoio, realce) + '</div>' : '') +
      botao(c.chamada, c.marca, P, base, U * 0.026, 'left');
    corpo += pilha(m, py, largura, fim - py, bloco, 'left', 'flex-start');
    if (c.rodape) corpo += '<div style="position:absolute;right:' + px(m) + ';bottom:' + px(c.mb * 0.6) + ';max-width:60%">' + etiqueta(c.rodape, c, tx, et * 0.9, 'text-align:right;opacity:.85') + '</div>';
    return { fundo: base, corpo: corpo };
  }

  /* DIVIDIDO · metade texto, metade foto; dados em etiquetas brancas sobre a foto */
  function slotDividido(tipo, W, H) {
    if (tipo === 'alto') { var h = Math.round(H * 0.46); return { x: 0, y: H - h, w: W, h: h }; }
    var w = Math.round(W * (tipo === 'largo' ? 0.42 : 0.47)); return { x: W - w, y: 0, w: w, h: H };
  }
  function dividido(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, alto = c.tipo === 'alto';
    var base = '#ffffff', tx = P.escura, ac = P.principalLegivel;
    var realce = function (x) { return '<span style="color:' + ac + '">' + x + '</span>'; };
    var sf = slotDividido(c.tipo, W, H);
    if (c.temFoto && c.foto) corpo += img(c.foto, sf.x, sf.y, sf.w, sf.h);
    else corpo += '<img data-x="img" src="' + luzes(sf.w, sf.h, P, 7, true) + '" alt="" style="' + abs(sf.x, sf.y, sf.w, sf.h) + 'display:block">';
    corpo += caixa(abs(sf.x, sf.y, sf.w, sf.h) + 'background:' + rgba(P.principal, 0.28));
    var areaW = alto ? W - 2 * m : sf.x - 2 * m, fim = alto ? sf.y - U * 0.04 : H - c.mb - U * 0.11;
    var py = c.mt + U * (alto ? 0.1 : 0.03), tam = U * (alto ? 0.2 : 0.15) * c.dec.escala;
    var linha = '<div data-x="caixa" style="width:100%;height:' + px(Math.max(3, U * 0.006)) + ';background:' + tx + ';margin-top:' + px(U * 0.022) + ';flex:none"></div>';
    var bloco = tituloCondensado(c, tam, tx, realce, 'text-align:right') + linha +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-size:' + px(U * 0.026) + ';line-height:1.4;color:' + P.texto + ';margin-top:' + px(U * 0.02) + ';text-align:right;flex:none">' + rico(c.apoio, realce) + '</div>' : '');
    corpo += pilha(m, py, areaW, fim - py, bloco, 'right', alto ? 'flex-end' : 'center');
    corpo += '<div style="position:absolute;left:' + px(m) + ';' + (alto ? 'top:' + px(c.mt) : 'bottom:' + px(c.mb)) + ';max-width:' + px(areaW * (alto ? 0.5 : 1)) + '">' + marcaOuLogo(c, tx, U * 0.045, base) + '</div>';
    var tags = [c.selo, c.data, c.chamada].filter(Boolean), tt = U * 0.026;
    if (tags.length) corpo += '<div style="position:absolute;left:' + px(sf.x + U * 0.03) + ';bottom:' + px(c.mb) + ';max-width:' + px(sf.w - U * 0.06) + ';display:flex;flex-direction:column;align-items:flex-start;gap:' + px(tt * 0.5) + '">' +
      tags.map(function (t, i) { return '<div data-x="caixa" style="background:#ffffff;padding:' + px(tt * 0.3) + ' ' + px(tt * 0.5) + ';max-width:100%"><span data-x="texto" style="font-family:' + c.fX + ';font-weight:' + (i === tags.length - 1 && c.chamada ? 800 : 600) + ';font-size:' + px(tt) + ';line-height:1.15;color:' + P.escura + '">' + esc(t) + (i === tags.length - 1 && c.chamada ? ' →' : '') + '</span></div>'; }).join('') + '</div>';
    if (c.rodape) corpo += '<div style="position:absolute;right:' + px(W - sf.x + m) + ';top:' + px(c.mt) + ';max-width:' + px(areaW * 0.6) + '">' + etiqueta(c.rodape, c, P.suave, U * 0.017, 'text-align:right') + '</div>';
    return { fundo: base, corpo: corpo };
  }

  /* FITA · título enorme e fitas atravessando com as informações */
  function fita(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var base = C.mix(P.escura, '#0b0b0b', 0.7), tx = '#F2F2F2';
    var amarelo = C.contraste(P.destaque, base) >= 6 ? P.destaque : '#F7D417', txF = C.sobre(amarelo, '#1b1b1b');
    corpo += '<img data-x="img" src="' + luzes(W, H, { principal: C.mix(P.principal, base, 0.75), destaque: C.mix(P.escura, base, 0.5), escura: base }, 2, true) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block;opacity:.55">';
    corpo += '<img data-x="img" src="' + grao(W, H, 0.08) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    var realce = function (x) { return '<span style="color:' + amarelo + '">' + x + '</span>'; };
    var tam = U * (largo ? 0.16 : 0.24) * c.dec.escala, py = c.mt + U * 0.1, fim = H - c.mb - U * (c.apoio ? 0.16 : 0.1);
    var bloco = tituloCondensado(c, tam, tx, realce, 'text-align:center;text-shadow:0 ' + px(U * 0.012) + ' ' + px(U * 0.03) + ' rgba(0,0,0,.55)');
    corpo += pilha(m, py, W - 2 * m, fim - py, bloco, 'center', 'center');
    if (c.apoio) corpo += '<div data-x="texto" style="' + abs(m, fim + U * 0.03, W - 2 * m) + 'font-family:' + c.fT + ';font-weight:' + pesoT(c, 700) + ';font-size:' + px(U * 0.034) + ';line-height:1.15;color:' + tx + ';text-align:center;text-transform:uppercase">' + esc(c.apoio) + '</div>';
    var fitas = [c.marca.nome, c.selo, c.data, c.chamada].filter(Boolean).slice(0, 4);
    var pos = largo ? [[0.04, 0.1, -6], [0.68, 0.12, 7], [0.03, 0.5, 5], [0.7, 0.54, -5]] : [[0.1, 0.16, -4], [0.46, 0.36, -14], [0.08, 0.55, 22], [0.5, 0.7, -9]];
    var ft = U * (largo ? 0.032 : 0.036);
    fitas.forEach(function (t, i) {
      var p = pos[i], larg = Math.min(W * 0.62, (t.length * 0.56 + 1.6) * ft);
      corpo += '<div data-x="caixa" data-intencional="fita" data-girar="' + p[2] + '" style="' + abs(W * p[0], H * p[1], larg) + 'transform:rotate(' + p[2] + 'deg);transform-origin:0 50%;background:' + amarelo + ';padding:' + px(ft * 0.32) + ' ' + px(ft * 0.6) + ';box-shadow:0 ' + px(U * 0.01) + ' ' + px(U * 0.022) + ' rgba(0,0,0,.45);z-index:5"><div data-x="texto" style="font-family:' + c.fT + ';font-weight:' + pesoT(c, 800) + ';font-size:' + px(ft) + ';line-height:1.1;color:' + txF + ';text-transform:uppercase;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:clip">' + esc(t) + '</div></div>';
    });
    if (c.rodape) corpo += '<div style="position:absolute;left:' + px(m) + ';right:' + px(m) + ';bottom:' + px(c.mb * 0.55) + '">' + etiqueta(c.rodape, c, C.mix(tx, base, 0.4), U * 0.017, 'text-align:center') + '</div>';
    return { fundo: base, corpo: corpo };
  }

  /* CORTE · título gigante que vaza da peça (corte proposital e grande, nunca um "quase") */
  function corte(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var base = C.mix(P.escura, '#000000', 0.55), tx = C.garantir(P.destaque, base, 4.5);
    if (c.temFoto && c.foto) corpo += img(c.foto, 0, 0, W, H);
    else corpo += '<img data-x="img" src="' + luzes(W, H, P, 4, true) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    corpo += '<img data-x="img" src="' + sombra(W, H, base, 'base') + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    var linhas = quebrarLinhas(c.titulo, largo ? 2 : 3, largo);
    var maior = Math.max.apply(null, linhas.map(function (l) { return l.length; }));
    var tam = Math.min(W * 1.14 / (maior * 0.5), largo ? H * 0.56 / (linhas.length * 0.95) : H * 0.3), y0 = largo ? c.mt + U * 0.07 : H * 0.2;
    var realceC = /==/.test(c.titulo) ? palavrasRealce(c.titulo) : '';
    linhas.forEach(function (l, i) {
      var lado = i % 2 ? 'right' : 'left', cor = realceC && realceC.indexOf(l.split(' ')[0]) >= 0 ? '#ffffff' : tx;
      corpo += '<div data-x="texto" data-intencional="corte" style="position:absolute;' + lado + ':' + px(-W * 0.045) + ';top:' + px(y0 + tam * 0.95 * i) + ';font-family:' + c.fT + ';font-weight:' + pesoT(c, 800) + ';font-size:' + px(tam) + ';line-height:.95;letter-spacing:-0.01em;text-transform:uppercase;white-space:nowrap;color:' + cor + (c.vazio ? ';opacity:.6' : '') + '">' + esc(l) + '</div>';
    });
    var et = U * 0.021;
    corpo += '<div style="' + abs(m, c.mt, W - 2 * m) + 'display:flex;justify-content:space-between;align-items:flex-start">' + marcaOuLogo(c, '#ffffff', U * 0.045, base) + etiqueta([c.selo, c.data].filter(Boolean).join('\n'), c, '#ffffff', et, 'text-align:right') + '</div>';
    var yT = y0 + tam * 0.95 * linhas.length + U * 0.03, fim = H - c.mb;
    var bloco = (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-weight:600;font-size:' + px(U * 0.03) + ';line-height:1.35;color:#ffffff;flex:none">' + esc(c.apoio) + '</div>' : '') + botao(c.chamada, c.marca, P, base, U * 0.026, 'left');
    if (bloco) corpo += pilha(m, Math.min(yT, fim - U * 0.2), largo ? W * 0.5 : W - 2 * m, fim - Math.min(yT, fim - U * 0.2), bloco, 'left', 'flex-end');
    return { fundo: base, corpo: corpo };
  }

  /* MOSAICO · foto fatiada em grade, partes em P&B, células vazias com texto */
  function gradeMosaico(tipo, W, H, m, mt, mb, U) {
    if (tipo === 'largo') { var gx = Math.round(W * 0.42); return { x: gx, y: m, w: W - gx - m, h: H - 2 * m, cols: 3, lins: 2 }; }
    var top = Math.round(mt + U * (tipo === 'alto' ? 0.3 : 0.24)), bot = Math.round(H - mb - U * (tipo === 'alto' ? 0.12 : 0.1));
    return { x: m, y: top, w: W - 2 * m, h: bot - top, cols: 3, lins: 3 };
  }
  function mosaico(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var base = C.mix(P.principal, '#1a0505', 0.25), tx = C.sobre(base, P.escura);
    corpo += '<img data-x="img" src="' + grao(W, H, 0.07) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    var G = gradeMosaico(c.tipo, W, H, m, c.mt, c.mb, U), g = Math.max(3, Math.round(U * 0.006));
    var cw = (G.w - g * (G.cols - 1)) / G.cols, ch = (G.h - g * (G.lins - 1)) / G.lins;
    var vazias = largo ? { '1,0': 1 } : { '1,0': 1, '2,2': 1 }, pb = { '0,0': 1, '1,1': 1, '0,2': 1 };
    var cel = function (r, k) { return { x: G.x + k * (cw + g), y: G.y + r * (ch + g), w: cw, h: ch }; };
    for (var r = 0; r < G.lins; r++) for (var k = 0; k < G.cols; k++) {
      var q = cel(r, k), chave = r + ',' + k;
      if (vazias[chave]) continue;
      var src = pb[chave] ? (c.dados._fotoPB || c.foto) : c.foto;
      if (c.temFoto && src) corpo += '<div data-x="caixa" style="' + abs(q.x, q.y, q.w, q.h) + 'overflow:hidden">' + img(src, G.x - q.x, G.y - q.y, G.w, G.h) + '</div>';
      else corpo += caixa(abs(q.x, q.y, q.w, q.h) + 'background:' + (pb[chave] ? C.mix(base, '#ffffff', 0.25) : C.mix(P.destaque, base, 0.35)));
    }
    var et = U * 0.02, a = cel(1, 0), b = cel(2, 2);
    if (c.apoio) corpo += '<div data-x="texto" style="' + abs(a.x + U * 0.012, a.y + U * 0.012, a.w - U * 0.024) + 'font-family:' + c.fX + ';font-size:' + px(Math.min(et * 1.15, a.w / 12)) + ';line-height:1.4;color:' + tx + '">' + esc(c.apoio) + '</div>';
    var fimTxt = [c.data, c.chamada].filter(Boolean);
    if (fimTxt.length && !largo) corpo += '<div style="' + abs(b.x + U * 0.012, b.y + U * 0.012, b.w - U * 0.024, b.h - U * 0.024) + 'display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end;gap:' + px(et * 0.6) + '">' + fimTxt.map(function (t, i) { return etiqueta(t + (i === fimTxt.length - 1 && c.chamada ? ' →' : ''), c, tx, Math.min(et, b.w / 14), 'text-align:right'); }).join('') + '</div>';
    var realce = function (x) { return '<span style="color:' + C.garantir(P.destaque, base, 4.5) + '">' + x + '</span>'; };
    var tam = U * (largo ? 0.13 : 0.15) * c.dec.escala;
    var tw = largo ? G.x - 2 * m : W - 2 * m, ty = c.mt + U * 0.07, th = largo ? H - c.mb - U * 0.12 - ty : G.y - U * 0.025 - ty;
    var bloco = '<div data-x="texto" data-fit="' + tam.toFixed(1) + '" style="font-family:' + c.fT + ';font-weight:' + pesoT(c, 800) + ';font-size:' + px(tam) + ';line-height:.95;letter-spacing:-0.03em;color:' + tx + ';flex:none' + (c.vazio ? ';opacity:.6' : '') + '">' + rico(c.titulo, realce) + '</div>' +
      (largo ? (c.apoio ? '' : '') + (fimTxt.length ? etiqueta(fimTxt.join('  ·  '), c, tx, et, 'margin-top:' + px(U * 0.02) + ';flex:none') : '') : '');
    corpo += pilha(m, ty, tw, th, bloco, largo ? 'left' : 'right', largo ? 'center' : 'flex-end');
    corpo += '<div style="' + abs(m, c.mt, W * 0.5) + '">' + marcaOuLogo(c, tx, U * 0.042, base) + '</div>';
    var rodape = [c.selo, c.rodape].filter(Boolean).join('  ——  ');
    if (rodape) corpo += '<div style="position:absolute;left:' + px(m) + ';right:' + px(m) + ';bottom:' + px(c.mb * 0.6) + '">' + etiqueta(rodape, c, tx, et * 0.95, largo ? '' : 'text-align:center') + '</div>';
    return { fundo: base, corpo: corpo };
  }

  /* REVISTA · capa: nome da marca no topo, manchete grande, chamadas e código de barras */
  function revista(c) {
    var P = c.P, corpo = '', W = c.W, H = c.H, m = c.m, U = c.U, largo = c.tipo === 'largo';
    var base = '#1d1d1f', tx = '#ffffff', ac = C.garantir(P.destaque, base, 4.5);
    if (c.temFoto && c.foto) corpo += img(c.foto, 0, 0, W, H);
    else corpo += '<img data-x="img" src="' + luzes(W, H, P, 8, true) + '" alt="" style="' + abs(0, 0, W, H) + 'display:block">';
    corpo += '<img data-x="img" src="' + sombra(W, H, base, 'base') + '" alt="" style="' + abs(0, 0, W, H) + 'display:block;opacity:.85">';
    var et = U * 0.02, nome = c.marca.nome.toUpperCase();
    var tamM = Math.min(U * (largo ? 0.14 : 0.2), (W - 2 * m) / (Math.max(4, nome.length) * 0.64));
    var meta = [c.data, c.selo].filter(Boolean).join('  /  ');
    var etMeta = Math.min(et * 1.2, (W - 2 * m) / (Math.max(10, meta.length) * 0.7));
    if (meta) corpo += '<div data-x="texto" style="' + abs(m, c.mt * 0.7, W - 2 * m) + 'font-family:' + c.fX + ';font-weight:600;font-size:' + px(etMeta) + ';line-height:1.2;white-space:nowrap;color:' + tx + ';text-align:center;letter-spacing:.06em;text-transform:uppercase">' + esc(meta) + '</div>';
    var yM = c.mt * 0.7 + (meta ? etMeta * 1.2 + et : 0);
    corpo += '<div data-x="texto" style="' + abs(m, yM, W - 2 * m) + 'font-family:' + c.fT + ';font-weight:' + pesoT(c, 700) + ';font-size:' + px(tamM) + ';line-height:.9;color:' + tx + ';text-align:center;white-space:nowrap;letter-spacing:-0.01em">' + esc(nome) + '</div>';
    var yL = yM + tamM * 0.95;
    corpo += caixa(abs(m * 1.6, yL, W - m * 3.2, Math.max(3, U * 0.004)) + 'background:' + tx);
    var realce = function (x) { return '<span style="color:' + ac + '">' + x + '</span>'; };
    var tam = U * (largo ? 0.08 : 0.1) * c.dec.escala, bx = largo ? W * 0.5 : W * 0.62;
    var bloco = tituloCondensado(c, tam, tx, realce) +
      (c.apoio ? '<div data-x="texto" style="font-family:' + c.fX + ';font-size:' + px(U * 0.024) + ';line-height:1.4;color:' + C.mix(tx, base, 0.15) + ';margin-top:' + px(U * 0.016) + ';flex:none">' + esc(c.apoio) + '</div>' : '');
    var py = yL + U * (largo ? 0.06 : 0.25), fim = H - c.mb - U * 0.1;
    corpo += pilha(m, py, bx - m, fim - py, bloco, 'left', 'flex-end');
    if (c.chamada) corpo += '<div style="position:absolute;right:' + px(m) + ';bottom:' + px(c.mb + U * 0.11) + ';max-width:' + px(W - bx - m) + '">' + '<div data-x="caixa" style="border:' + px(Math.max(2, U * 0.003)) + ' solid ' + ac + ';padding:' + px(et * 0.6) + ' ' + px(et) + '"><span data-x="texto" style="font-family:' + c.fT + ';font-weight:' + pesoT(c, 700) + ';font-size:' + px(et * 1.5) + ';line-height:1.1;color:' + ac + ';text-transform:uppercase;text-align:right">' + esc(c.chamada) + '</span></div></div>';
    var bw = U * 0.17, bh = U * 0.06, barras = '', x = 0, semente = (nome.length * 7) % 5;
    while (x < bw) { var w = 1 + ((x * 13 + semente) % 4); barras += '<div style="position:absolute;left:' + px(x) + ';top:0;width:' + px(w * U * 0.0016) + ';height:100%;background:#111"></div>'; x += (w + 1 + ((x * 7) % 3)) * U * 0.0016; }
    corpo += '<div data-x="caixa" style="position:absolute;left:' + px(m) + ';bottom:' + px(c.mb * 0.55) + ';width:' + px(bw + U * 0.02) + ';height:' + px(bh + U * 0.02) + ';background:#fff;padding:' + px(U * 0.01) + '"><div style="position:relative;width:' + px(bw) + ';height:' + px(bh) + '">' + barras + '</div></div>';
    if (c.rodape) corpo += '<div style="position:absolute;right:' + px(m) + ';bottom:' + px(c.mb * 0.55) + ';max-width:55%">' + etiqueta(c.rodape, c, tx, et * 0.85, 'text-align:right') + '</div>';
    if (c.marca.logo || c.marca.logoClaro) corpo += '<div style="position:absolute;right:' + px(m) + ';top:' + px(yL + U * 0.025) + '">' + logo(c.marca, P, U * 0.04, 'foto', W * 0.2) + '</div>';
    return { fundo: base, corpo: corpo };
  }

  var ESTILOS = { poster: poster, dividido: dividido, fita: fita, corte: corte, mosaico: mosaico, revista: revista, simples: simples, sofisticado: sofisticado, robusto: robusto, texto: texto, fundo: fundoFoto, efeito: efeito, manchete: manchete, foco: foco, grade: grade, meiotom: meiotom };

  /* Tamanho do quadro da foto em cada estilo (para o recorte). */
  function jfW(W) { return W; }
  function slot(formato, dec) {
    var W = formato.largura, H = formato.altura, m = formato.margem, mg = formato.margens || {};
    var mt = mg.topo != null ? mg.topo : m, mb = mg.base != null ? mg.base : m;
    if (formato.email) return { w: 600, h: 320 };
    var D = dec.desenho || 'simples';
    if (D === 'texto') return null;
    if (D === 'fundo') return { w: W, h: H };
    if (D === 'efeito') { var se = slotEfeito(dec.tipo, W, H, m, mt); return { w: se.w, h: se.h }; }
    var P = dec.paleta;
    if (D === 'manchete') return { w: W, h: H, forma: { escurecer: 0.42 } };
    if (D === 'foco') {
      var jf = janelaFoco(dec.tipo, W, H);
      return { w: jf.w, h: jf.h, forma: { janela: { W: W, H: H, x: jf.x, y: jf.y }, efeito: 'pb', contraste: 1.1 },
        extras: [{ chave: '_fotoFundo', w: W, h: H, forma: { efeito: 'duotone', forca: 22, cores: [M.cor.mix(P.escura, '#000000', 0.55), P.principal] } }] };
    }
    if (D === 'grade') return { w: jfW(W), h: H, chave: '_fotoFundo', forma: { efeito: 'duotone', forca: 3, cores: ['#05060a', M.cor.mix(P.principal, '#ffffff', 0.55)] } };
    if (D === 'meiotom') {
      var jm = janelasMeiotom(dec.tipo, W, H, m), tinta = M.cor.mix(P.escura, '#000000', 0.5), papel = '#F4ECD8';
      var mt2 = { efeito: 'meiotom', passo: Math.round(W / 120), cores: [papel, tinta, P.principal] };
      var out = { w: jm.a.w, h: jm.a.h, forma: Object.assign({ janela: { W: W, H: H, x: jm.a.x, y: jm.a.y } }, mt2),
        extras: [{ chave: '_fotoFundo', w: W, h: H, forma: { efeito: 'duotone', forca: 10, cores: ['#3a3a3a', '#e9e9e9'] } }] };
      if (jm.b) out.extras.push({ chave: '_fotoB', w: jm.b.w, h: jm.b.h, forma: Object.assign({ janela: { W: W, H: H, x: jm.b.x, y: jm.b.y } }, mt2) });
      return out;
    }
    var U = dec.tipo === 'largo' ? H * (W / H >= 2.6 ? 1.9 : 1.55) : W; if (dec.tipo === 'alto' && H / W < 1.5) U = W * 1.04;
    if (D === 'poster') { var sp = slotPoster(dec.tipo, W, H, m, mt, mb); return { w: sp.w, h: sp.h, forma: { efeito: 'pb', contraste: 1.1 } }; }
    if (D === 'dividido') { var sd = slotDividido(dec.tipo, W, H); return { w: sd.w, h: sd.h }; }
    if (D === 'fita') return null;
    if (D === 'corte') return { w: W, h: H, forma: { efeito: 'pb', contraste: 1.15, escurecer: 0.25 } };
    if (D === 'revista') return { w: W, h: H, forma: { efeito: 'pb', contraste: 1.1 } };
    if (D === 'mosaico') { var gm = gradeMosaico(dec.tipo, W, H, m, mt, mb, U); return { w: gm.w, h: gm.h, extras: [{ chave: '_fotoPB', w: gm.w, h: gm.h, forma: { efeito: 'pb', contraste: 1.1 } }] }; }
    if (D === 'simples') {
      if (dec.tipo === 'largo') return { w: W - Math.round(W * 0.6), h: H };
      return { w: W - 2 * m, h: fotoAltura('simples', dec.tipo, W, H, mt, mb, dec.extras) };
    }
    if (D === 'sofisticado') {
      if (dec.tipo === 'largo') return { w: Math.round(W * 0.38), h: H };
      var logoH = U * 0.05, y0 = mt + logoH + U * 0.06, fim = H - mb - U * 0.08;
      if (dec.tipo === 'quadrado') return { w: Math.round(W * 0.4), h: Math.round(fim - y0) };
      return { w: Math.round(W * 0.58), h: Math.round((fim - y0) * (0.56 - 0.04 * dec.extras)) };
    }
    if (dec.tipo === 'largo') return { w: W - Math.round(W * 0.62), h: H };
    return { w: W, h: fotoAltura('robusto', dec.tipo, W, H, mt, mb, dec.extras) };
  }

  /* Ícone escolhido no catálogo: selo redondo logo acima do título, na cor de destaque.
     Segue o alinhamento do título; layouts sem título encaixado (Corte) levam o selo no canto. */
  function comIcone(c, corpo, fundo, desenho) {
    var I = raiz.CriouIcones, id = c.dados.icone;
    if (!I || !id || !I.existe(id) || desenho === 'grade') return corpo;
    var P = c.P, bg = C.contraste(P.destaque, fundo) >= 2 ? P.destaque : (C.lum(fundo) < 0.4 ? '#ffffff' : P.principal);
    var tam = Math.round(c.U * 0.085), selo = '<div data-x="caixa" style="width:' + px(tam) + ';height:' + px(tam) + ';border-radius:50%;background:' + bg + ';display:flex;align-items:center;justify-content:center;flex:none;margin-bottom:' + px(c.U * 0.022) + '">' +
      '<img data-x="img" src="' + I.url(id, C.sobre(bg, P.escura), 1.9) + '" alt="" style="width:' + px(tam * 0.58) + ';height:' + px(tam * 0.58) + ';display:block"></div>';
    var alvo = '<div data-x="texto" data-fit="', i = corpo.indexOf(alvo);
    if (i >= 0 && !c.girado) return corpo.slice(0, i) + selo + corpo.slice(i);
    return corpo + '<div style="position:absolute;right:' + px(c.m) + ';bottom:' + px(c.mb) + '">' + selo.replace('margin-bottom:' + px(c.U * 0.022), 'margin:0') + '</div>';
  }
  function peca(formato, dados, marca, dec, opts) {
    var c = contexto(formato, dados, marca, dec);
    var L = M.LAYOUTS[dec.estilo] || {};
    POS = L.posicao ? { j: { topo: 'flex-start', centro: 'center', base: 'flex-end' }[dados.posicao], a: { esquerda: 'left', centro: 'center', direita: 'right' }[dados.alinhamento] } : {};
    c.girado = L.girar ? (dados.girar == null ? !!L.giradoPadrao && MO_sem(c.titulo).length <= 28 : !!dados.girar) : false;
    prepararRealces(marca);
    var r = ESTILOS[dec.desenho || 'simples'](c);
    r.corpo = comIcone(c, r.corpo, r.fundo, dec.desenho);
    POS = {}; RP = null;
    return documento(marca, c.W, c.H, r.fundo, r.corpo, opts);
  }

  /* =========================================================
     E-MAIL · HTML em tabelas (Gmail e Outlook), 600 px
     ========================================================= */
  function paragrafos(texto, P, fX, realce) {
    var blocos = String(texto || '').replace(/\r/g, '').split(/\n\s*\n/).filter(function (p) { return p.trim(); });
    return blocos.map(function (b) {
      var box = /^>>\(([a-z0-9-]+)\)\s?/i.exec(b.trim());
      if (box) b = b.trim().slice(box[0].length);
      var linhas = b.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      var html;
      if (linhas.every(function (l) { return /^- /.test(l); })) {
        html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">' + linhas.map(function (l) {
          return '<tr><td valign="top" style="padding:0 10px 8px 0;color:' + P.principalLegivel + ';font:700 16px/24px ' + fX + '">•</td><td data-x="texto" style="padding:0 0 8px;font:400 16px/24px ' + fX + ';color:' + P.texto + '">' + rico(l.slice(2), realce) + '</td></tr>';
        }).join('') + '</table>';
      } else if (linhas.length === 1 && linhas[0].length <= 60 && !/[.!?:]$/.test(linhas[0]) && blocos.length > 2) {
        html = '<h2 data-x="texto" style="margin:8px 0 10px;font:700 20px/28px ' + fX + ';color:' + P.escura + '">' + rico(linhas[0], realce) + '</h2>';
      } else {
        html = '<p data-x="texto" style="margin:0 0 16px;font:400 16px/26px ' + fX + ';color:' + P.texto + '">' + rico(linhas.join(' '), realce) + '</p>';
      }
      if (box) html = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px"><tr><td data-x="caixa" style="background:' + P.fundo + ';border-radius:12px;padding:18px 20px 2px">' + html + '</td></tr></table>';
      return html;
    }).join('');
  }

  function email(formato, dados, marca, dec, opts) {
    prepararRealces(marca);
    var P = dec.paleta, est = ({ simples: 'simples', texto: 'simples', robusto: 'robusto', fundo: 'robusto', sofisticado: 'sofisticado', efeito: 'sofisticado' })[dec.desenho] || 'simples', fT = M.pilha(marca.fontes.titulo), fX = M.pilha(marca.fontes.texto);
    var titulo = limpar(dados.titulo) || 'Seu recado aqui', apoio = limpar(dados.apoio), data = dataTexto(dados.data, dados.hora, dados.local);
    var cab = est === 'simples' ? '#ffffff' : est === 'sofisticado' ? P.escura : P.principal;
    var ac = C.garantir(P.destaque, P.escura, 4.5);
    var realce = est === 'sofisticado' ? function (x) { return '<em style="color:' + P.principalLegivel + '">' + x + '</em>'; }
      : est === 'robusto' ? function (x) { return '<span style="background:' + P.destaque + ';color:' + P.sobreDestaque + ';padding:0 4px">' + x + '</span>'; }
        : function (x) { return '<span style="color:' + P.principalLegivel + '">' + x + '</span>'; };
    var tamT = Math.round((dec.extensao === 'curto' ? 40 : 32) * (titulo.length > 60 ? 0.8 : 1));
    var b = corBotao(P, '#ffffff'), raio = M.FORMAS[marca.forma].raio(50);
    var selo = dec.assunto.selo;
    var linhaSelo = selo ? '<p data-x="texto" style="margin:0 0 12px;font:700 13px/18px ' + fX + ';letter-spacing:' + (est === 'sofisticado' ? '.3em' : '.12em') + ';text-transform:uppercase;color:' + P.principalLegivel + '">' + esc(selo) + '</p>' : '';
    var html = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + P.fundo + '"><tr><td align="center" style="padding:24px 12px">' +
      '<table data-x="email" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff">' +
      '<tr><td data-x="caixa" align="' + (est === 'sofisticado' ? 'center' : 'left') + '" style="background:' + cab + ';padding:' + (est === 'simples' ? '28px 40px 8px' : '26px 40px') + '">' + logo(marca, P, 40, cab, 260).replace(/display:block/, 'display:inline-block') + '</td></tr>' +
      (est === 'simples' ? '<tr><td style="padding:0 40px"><div data-x="caixa" style="height:4px;width:56px;background:' + P.principal + '"></div></td></tr>' : '') +
      (dados._foto ? '<tr><td style="padding:' + (est === 'simples' ? '24px 40px 0' : '0') + '"><img data-x="img" src="' + dados._foto + '" alt="" width="' + (est === 'simples' ? 520 : 600) + '" style="display:block;width:100%;height:auto;' + (est === 'simples' ? 'border-radius:' + M.raioCss(M.FORMAS[marca.forma].raio(60)) : '') + '"></td></tr>' : '') +
      '<tr><td align="' + (est === 'sofisticado' ? 'center' : 'left') + '" style="padding:32px 40px 8px">' + linhaSelo +
      '<h1 data-x="texto" style="margin:0 0 14px;font:' + (est === 'robusto' ? 900 : est === 'sofisticado' ? 500 : 800) + ' ' + tamT + 'px/1.12 ' + fT + ';color:' + P.escura + ';' + (est === 'robusto' ? 'text-transform:uppercase;' : '') + 'letter-spacing:-0.01em">' + rico(titulo, realce) + '</h1>' +
      (apoio ? '<p data-x="texto" style="margin:0 0 18px;font:400 18px/27px ' + fX + ';color:' + P.suave + '">' + rico(apoio, realce) + '</p>' : '') +
      (data ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px ' + (est === 'sofisticado' ? 'auto' : '0') + ' 22px"><tr><td data-x="caixa" style="background:' + (est === 'robusto' ? P.destaque : P.fundo) + ';border-radius:10px;padding:12px 18px"><span data-x="texto" style="font:800 15px/20px ' + fX + ';letter-spacing:.04em;text-transform:uppercase;color:' + (est === 'robusto' ? P.sobreDestaque : P.escura) + '">' + esc(data) + '</span></td></tr></table>' : '') +
      '</td></tr>' +
      (limpar(dados.texto) ? '<tr><td align="left" style="padding:0 40px 8px">' + paragrafos(dados.texto, P, fX, realce) + '</td></tr>' : '') +
      (limpar(dados.chamada) ? '<tr><td align="' + (est === 'sofisticado' ? 'center' : 'left') + '" style="padding:8px 40px 36px"><a href="' + esc(/^https:\/\/[^\s"'<>]+$/i.test(limpar(dados.link)) ? limpar(dados.link) : '#') + '" style="text-decoration:none;display:inline-block"><span data-x="caixa" style="display:inline-block;background:' + b.bg + ';border-radius:' + M.raioCss(raio) + ';padding:15px 30px"><span data-x="texto" data-forma="botao" style="font:700 16px/20px ' + fX + ';color:' + b.tx + '">' + esc(dados.chamada) + '</span></span></a></td></tr>' : '<tr><td style="height:20px"></td></tr>') +
      '<tr><td data-x="caixa" align="' + (est === 'sofisticado' ? 'center' : 'left') + '" style="background:' + (est === 'simples' ? P.fundo : P.escura) + ';padding:24px 40px">' +
      (marca.rodape.frase ? '<p data-x="texto" style="margin:0 0 6px;font:700 15px/22px ' + fT + ';color:' + (est === 'simples' ? P.escura : ac) + '">' + esc(marca.rodape.frase) + '</p>' : '') +
      '<p data-x="texto" style="margin:0;font:400 13px/20px ' + fX + ';color:' + (est === 'simples' ? P.suave : C.mix('#ffffff', P.escura, 0.3)) + '">' + esc([marca.nome, marca.rodape.site, marca.rodape.social].filter(function (x) { return limpar(x); }).join(' · ')) + '</p>' +
      (marca.legal ? '<p data-x="texto" style="margin:8px 0 0;font:400 11px/16px ' + fX + ';color:' + (est === 'simples' ? P.suave : C.mix('#ffffff', P.escura, 0.4)) + '">' + esc(marca.legal) + '</p>' : '') +
      '</td></tr></table></td></tr></table>';
    var fontes = M.urlFontes([marca.fontes.titulo, marca.fontes.texto]);
    var agua = opts && opts.previa ? '<div aria-hidden="true" style="position:fixed;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;font:900 72px Arial,sans-serif;color:rgba(128,128,128,.22);transform:rotate(-24deg)">PRÉVIA · CRIOU</div>' : '';
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titulo) + '</title><link rel="stylesheet" href="' + fontes + '"><style>body{margin:0;padding:0}strong{font-weight:800}</style></head><body data-pronto="1">' + html + agua + '</body></html>';
  }

  function html(formato, dados, marca, dec, opts) {
    return formato.email ? email(formato, dados, marca, dec, opts) : peca(formato, dados, marca, dec, opts);
  }

  /* Prepara as fotos que o desenho pede (recortes, janelas e efeitos). Devolve { _foto, _fotoFundo, ... }. */
  async function fotos(formato, dec, src, aj, escala) {
    var s = slot(formato, dec), out = {};
    if (!s || !src || !raiz.CriouRecorte) return out;
    var R = raiz.CriouRecorte;
    out[s.chave || '_foto'] = await R.cortar(src, s.w, s.h, aj || {}, escala || 1, s.forma || null);
    for (var i = 0; s.extras && i < s.extras.length; i++) { var e = s.extras[i]; out[e.chave] = await R.cortar(src, e.w, e.h, aj || {}, escala || 1, e.forma); }
    return out;
  }
  /* Quadro em que a pessoa enquadra a foto (para janelas, a peça inteira). */
  function quadroFoto(formato, dec) {
    var s = slot(formato, dec); if (!s) return null;
    if (s.forma && s.forma.janela) return { w: s.forma.janela.W, h: s.forma.janela.H };
    return { w: s.w, h: s.h };
  }

  raiz.CriouModelos = { html: html, slot: slot, fotos: fotos, quadroFoto: quadroFoto, dataTexto: dataTexto };
})(window);
