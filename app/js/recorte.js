/* ============================================================
   Recorte de imagens · tamanho fixo com ajuste de enquadramento
   Toda imagem é recortada no navegador para o tamanho exato do
   quadro (mesmo se a foto for vertical). A pessoa arrasta a foto
   dentro do quadro e ajusta o zoom; o resultado é um JPEG nítido
   (2x) que vai para o e-mail.
   ============================================================ */
(function (raiz) {
  'use strict';

  var cacheImg = {};
  var cacheCorte = {};

  function carregar(src) {
    if (cacheImg[src]) return cacheImg[src];
    cacheImg[src] = new Promise(function (ok, falha) {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () { ok(im); };
      im.onerror = function () { delete cacheImg[src]; falha(new Error('Não consegui abrir a imagem.')); };
      im.src = src;
    });
    return cacheImg[src];
  }

  function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* Geometria comum ao recorte e ao editor: a foto cobre o quadro (cover) × zoom,
     centrada no ponto (x, y) da foto, sem deixar sobra. */
  function geometria(iw, ih, W, H, aj) {
    var zoom = limitar(aj.zoom || 1, 1, 3);
    var esc = Math.max(W / iw, H / ih) * zoom;
    var dw = iw * esc, dh = ih * esc;
    var x = limitar(aj.x == null ? 0.5 : aj.x, (W / 2) / dw, 1 - (W / 2) / dw);
    var y = limitar(aj.y == null ? 0.5 : aj.y, (H / 2) / dh, 1 - (H / 2) / dh);
    return { dw: dw, dh: dh, ox: W / 2 - x * dw, oy: H / 2 - y * dh, x: x, y: y, zoom: zoom };
  }

  /* Caminho com cantos individuais [sup.esq, sup.dir, inf.dir, inf.esq]. */
  function caminho(ctx, W, H, r) {
    var a = Math.min(r[0] || 0, W / 2, H / 2), b = Math.min(r[1] || 0, W / 2, H / 2), c = Math.min(r[2] || 0, W / 2, H / 2), d = Math.min(r[3] || 0, W / 2, H / 2);
    ctx.beginPath();
    ctx.moveTo(a, 0); ctx.lineTo(W - b, 0); if (b) ctx.arcTo(W, 0, W, b, b); else ctx.lineTo(W, 0);
    ctx.lineTo(W, H - c); if (c) ctx.arcTo(W, H, W - c, H, c); else ctx.lineTo(W, H);
    ctx.lineTo(d, H); if (d) ctx.arcTo(0, H, 0, H - d, d); else ctx.lineTo(0, H);
    ctx.lineTo(0, a); if (a) ctx.arcTo(0, 0, a, 0, a); else ctx.lineTo(0, 0);
    ctx.closePath();
  }

  /* forma (opcional): { raio: [se, sd, id, ie] em px do tamanho final, fundo: '#cor' do que fica atrás }.
     Os cantos ficam gravados na própria imagem: saem iguais no e-mail, no PDF e no PowerPoint. */
  /* forma.janela = { W, H, x, y }: recorta só um pedaço (x, y, w, h) da foto como ela ficaria
     cobrindo um quadro W × H. Serve para "janelas" nítidas alinhadas com a foto do fundo.
     forma.efeito: 'pb' (preto e branco), 'desfoque' (forma.forca em px), 'duotone' (forma.cores [escura, clara]),
     'meiotom' (forma.cores [papel, tinta, tinta2], forma.passo em px). */
  async function cortar(src, w, h, aj, escala, forma) {
    escala = escala || 2;
    aj = aj || {};
    forma = forma || null;
    var chave = [src, w, h, (aj.x || 0.5).toFixed(3), (aj.y || 0.5).toFixed(3), (aj.zoom || 1).toFixed(2), escala, forma ? JSON.stringify(forma) : ''].join('|');
    if (cacheCorte[chave]) return cacheCorte[chave];
    var im = await carregar(src);
    var W = Math.round(w * escala), H = Math.round(h * escala);
    var tela = document.createElement('canvas');
    tela.width = W; tela.height = H;
    var ctx = tela.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    var ef = forma && forma.efeito;
    var filtros = [];
    if (ef === 'pb' || ef === 'duotone' || ef === 'meiotom' || (ef === 'desfoque' && forma.pb)) filtros.push('grayscale(1)');
    var borra = ef === 'desfoque' || (forma && forma.forca && ef !== 'meiotom');
    if (borra) filtros.push('blur(' + Math.round((forma.forca || 24) * escala) + 'px)');
    if (forma && forma.contraste) filtros.push('contrast(' + forma.contraste + ')');
    if (filtros.length && 'filter' in ctx) ctx.filter = filtros.join(' ');
    if (forma && forma.janela) {
      var J = forma.janela, gj = geometria(im.naturalWidth, im.naturalHeight, J.W * escala, J.H * escala, aj);
      ctx.drawImage(im, gj.ox - J.x * escala, gj.oy - J.y * escala, gj.dw, gj.dh);
    } else {
      var g = geometria(im.naturalWidth, im.naturalHeight, W, H, aj);
      if (borra) { var sobra = (forma.forca || 24) * escala * 2; ctx.drawImage(im, g.ox - sobra, g.oy - sobra, g.dw + sobra * 2, g.dh + sobra * 2); }
      else ctx.drawImage(im, g.ox, g.oy, g.dw, g.dh);
    }
    ctx.filter = 'none';
    if (ef === 'duotone' || ef === 'meiotom') {
      var d = ctx.getImageData(0, 0, W, H), px = d.data;
      if (ef === 'duotone') {
        var a = rgb(forma.cores[0]), b = rgb(forma.cores[1]);
        for (var i = 0; i < px.length; i += 4) { var t = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255; px[i] = a[0] + (b[0] - a[0]) * t; px[i + 1] = a[1] + (b[1] - a[1]) * t; px[i + 2] = a[2] + (b[2] - a[2]) * t; }
        ctx.putImageData(d, 0, 0);
      } else {
        var passo = Math.max(4, Math.round((forma.passo || 9) * escala)), cores = forma.cores || ['#f4ecd8', '#111111', '#c8102e'];
        ctx.fillStyle = cores[0]; ctx.fillRect(0, 0, W, H);
        for (var y = 0; y < H; y += passo) for (var x = 0; x < W; x += passo) {
          var k = ((Math.min(H - 1, y + (passo >> 1)) * W) + Math.min(W - 1, x + (passo >> 1))) * 4;
          var esc = 1 - (px[k] * 0.299 + px[k + 1] * 0.587 + px[k + 2] * 0.114) / 255;
          if (esc < 0.04) continue;
          var r = Math.sqrt(esc) * passo * 0.62;
          ctx.fillStyle = cores[2] && esc < 0.45 ? cores[2] : cores[1];
          ctx.beginPath(); ctx.arc(x + passo / 2, y + passo / 2, r, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (forma && forma.escurecer) { ctx.fillStyle = 'rgba(0,0,0,' + forma.escurecer + ')'; ctx.fillRect(0, 0, W, H); }
    if (forma && forma.raio && forma.raio.some(function (r) { return r > 0; })) {
      var rr = forma.raio.map(function (v) { return (v || 0) * escala; });
      ctx.globalCompositeOperation = 'destination-in';
      caminho(ctx, W, H, rr); ctx.fill();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = forma.fundo || '#ffffff'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    var dado = tela.toDataURL('image/jpeg', ef === 'meiotom' ? 0.92 : 0.86);
    cacheCorte[chave] = dado;
    return dado;
  }
  function rgb(h) { h = String(h).replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }

  /* Editor de enquadramento: quadro com a proporção final; arrastar move a foto,
     setas do teclado também; controle de zoom e botão para centralizar. */
  function editor(opcoes) {
    var aj = { x: opcoes.ajuste.x == null ? 0.5 : opcoes.ajuste.x, y: opcoes.ajuste.y == null ? 0.5 : opcoes.ajuste.y, zoom: opcoes.ajuste.zoom || 1 };
    var caixa = document.createElement('div');
    caixa.className = 'recorte';
    var quadro = document.createElement('div');
    quadro.className = 'recorte-quadro';
    quadro.style.aspectRatio = opcoes.w + ' / ' + opcoes.h;
    quadro.tabIndex = 0;
    quadro.setAttribute('role', 'group');
    quadro.setAttribute('aria-label', opcoes.rotulo + '. Arraste a foto ou use as setas para mudar o enquadramento.');
    var foto = document.createElement('img');
    foto.alt = '';
    foto.draggable = false;
    foto.src = opcoes.src;
    quadro.appendChild(foto);
    var etiqueta = document.createElement('span');
    etiqueta.className = 'recorte-etiqueta';
    etiqueta.textContent = opcoes.numero + ' · ' + opcoes.w + ' × ' + opcoes.h;
    quadro.appendChild(etiqueta);

    var controles = document.createElement('div');
    controles.className = 'recorte-controles';
    var idZoom = 'zoom-' + opcoes.id + '-' + opcoes.numero;
    var rot = document.createElement('label');
    rot.setAttribute('for', idZoom);
    rot.textContent = 'Zoom';
    var zoom = document.createElement('input');
    zoom.type = 'range'; zoom.min = '1'; zoom.max = '2.5'; zoom.step = '0.05'; zoom.value = String(aj.zoom); zoom.id = idZoom;
    var centro = document.createElement('button');
    centro.type = 'button'; centro.className = 'btn-mini'; centro.textContent = 'Centralizar';
    controles.appendChild(rot); controles.appendChild(zoom); controles.appendChild(centro);
    caixa.appendChild(quadro); caixa.appendChild(controles);

    var geo = null;
    function desenhar() {
      if (!foto.naturalWidth) return;
      var W = quadro.clientWidth, H = quadro.clientHeight;
      geo = geometria(foto.naturalWidth, foto.naturalHeight, W, H, aj);
      aj.x = geo.x; aj.y = geo.y;
      foto.style.width = geo.dw + 'px';
      foto.style.height = geo.dh + 'px';
      foto.style.transform = 'translate(' + geo.ox + 'px,' + geo.oy + 'px)';
    }
    var aviso = null;
    function avisar() { clearTimeout(aviso); aviso = setTimeout(function () { opcoes.aoMudar({ x: aj.x, y: aj.y, zoom: aj.zoom }); }, 140); }
    foto.addEventListener('load', desenhar);
    if (raiz.ResizeObserver) new ResizeObserver(desenhar).observe(quadro);

    var arrasto = null;
    quadro.addEventListener('pointerdown', function (e) {
      if (!geo) return;
      arrasto = { px: e.clientX, py: e.clientY, x: aj.x, y: aj.y };
      quadro.setPointerCapture(e.pointerId);
      quadro.classList.add('arrastando');
    });
    quadro.addEventListener('pointermove', function (e) {
      if (!arrasto || !geo) return;
      aj.x = arrasto.x - (e.clientX - arrasto.px) / geo.dw;
      aj.y = arrasto.y - (e.clientY - arrasto.py) / geo.dh;
      desenhar();
    });
    function soltar() { if (arrasto) { arrasto = null; quadro.classList.remove('arrastando'); avisar(); } }
    quadro.addEventListener('pointerup', soltar);
    quadro.addEventListener('pointercancel', soltar);
    quadro.addEventListener('keydown', function (e) {
      var passo = e.shiftKey ? 0.08 : 0.02;
      var mov = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[e.key];
      if (!mov) return;
      e.preventDefault();
      aj.x += mov[0]; aj.y += mov[1];
      desenhar(); avisar();
    });
    zoom.addEventListener('input', function () { aj.zoom = Number(zoom.value); desenhar(); avisar(); });
    centro.addEventListener('click', function () { aj.x = 0.5; aj.y = 0.5; aj.zoom = 1; zoom.value = '1'; desenhar(); avisar(); });
    return caixa;
  }

  function paraBlob(dataUrl) {
    var partes = dataUrl.split(',');
    var bin = atob(partes[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: (/data:([^;]+)/.exec(partes[0]) || [])[1] || 'image/jpeg' });
  }

  raiz.CriouRecorte = { cortar: cortar, editor: editor, paraBlob: paraBlob, geometria: geometria };
})(window);
