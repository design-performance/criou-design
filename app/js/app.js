/* ============================================================
   Criou · Estúdio
   Minha marca → escolher formato e estilo → contar o recado →
   prévia ao vivo com o porquê → registrar → baixar.
   ============================================================ */
(function () {
  'use strict';

  /* Download sem marca d'água só depois que o cadastro abrir. */
  var LIBERADO = false;

  var M = window.CriouMarca, F = window.CriouFormatos, MO = window.CriouMotor, MD = window.CriouModelos;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function aviso(t) { var a = el('div', { class: 'toast', role: 'status' }, esc(t)); document.body.appendChild(a); setTimeout(function () { a.remove(); }, 2600); }
  function adiar(fn, ms) { var t; return function () { clearTimeout(t); var a = arguments; t = setTimeout(function () { fn.apply(null, a); }, ms); }; }

  var marca = M.ler();
  var rascunho = JSON.parse(JSON.stringify(marca)); // marca em edição (antes de salvar)
  var est = { formato: 'kit', estilo: marca.estilo || 'simples', dados: { assunto: 'novidade' }, imagem: null, editando: null };
  window.CriouFontesAtivas = [marca.fontes.titulo, marca.fontes.texto];

  /* Chegando da demonstração da página inicial: ?nome=&cor= */
  (function () {
    var q = new URLSearchParams(location.search);
    if (!marca.configurada && (q.get('nome') || q.get('cor'))) {
      if (q.get('nome')) rascunho.nome = marca.nome = q.get('nome').slice(0, 40);
      if (/^#[0-9a-f]{6}$/i.test(q.get('cor') || '')) rascunho.cores.principal = marca.cores.principal = q.get('cor');
    }
  })();

  /* ---------- Fontes da interface (para medir e mostrar as amostras) ---------- */
  var linkFontes = el('link', { rel: 'stylesheet' });
  document.head.appendChild(linkFontes);
  function carregarFontes() { linkFontes.href = M.urlFontes(Object.keys(M.FONTES)); }

  /* ---------- Quadro de prévia (iframe na escala) ---------- */
  function quadro(html, W, H, alvoW, rotulo) {
    var k = alvoW / W, alto = H ? H * k : 600;
    var q = el('div', { class: 'quadro' });
    q.style.width = Math.round(W * k) + 'px'; q.style.height = Math.round(alto) + 'px';
    var f = el('iframe', { title: rotulo || 'Prévia da peça', tabindex: '-1', 'aria-hidden': rotulo ? null : 'true' });
    f.style.width = W + 'px'; f.style.height = (H || 1600) + 'px'; f.style.transform = 'scale(' + k + ')';
    if (!H) f.addEventListener('load', function () {
      try { var h = f.contentDocument.documentElement.scrollHeight; f.style.height = h + 'px'; q.style.height = Math.round(h * k) + 'px'; } catch (e) { }
    });
    f.srcdoc = html;
    q.appendChild(f);
    return q;
  }

  /* ---------- Navegação ---------- */
  function ir(vista) {
    if (['criar', 'marca', 'pecas'].indexOf(vista) < 0) vista = 'criar';
    $$('.vista').forEach(function (v) { v.hidden = v.id !== 'vista-' + vista; });
    $$('.topo nav button').forEach(function (b) { if (b.dataset.ir === vista) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (location.hash !== '#' + vista) history.replaceState(null, '', location.pathname + location.search + '#' + vista);
    if (vista === 'marca') montarMarca();
    if (vista === 'criar') montarEscolha();
    if (vista === 'pecas') montarPecas();
    window.scrollTo(0, 0);
  }
  $$('.topo nav button').forEach(function (b) { b.addEventListener('click', function () { ir(b.dataset.ir); }); });

  /* =========================================================
     MINHA MARCA
     ========================================================= */
  var CORES = [
    { id: 'principal', nome: 'Principal', dica: 'a cor da marca' },
    { id: 'escura', nome: 'Escura', dica: 'títulos e fundos fortes' },
    { id: 'acao', nome: 'Ação', dica: 'só nos botões' },
    { id: 'destaque', nome: 'Destaque', dica: 'detalhes e realces' },
    { id: 'fundo', nome: 'Fundo claro', dica: 'fundos suaves' }
  ];
  var marcaMontada = false;
  function montarMarca() {
    rascunho = JSON.parse(JSON.stringify(marca));
    var opcoes = Object.keys(M.FONTES).map(function (f) { return '<option value="' + f + '">' + f + ' · ' + M.FONTES[f].tipo + '</option>'; }).join('');
    $('#m-ft').innerHTML = opcoes; $('#m-fx').innerHTML = opcoes;
    $('#m-forma').innerHTML = Object.keys(M.FORMAS).map(function (k) { return '<button type="button" class="chip" data-v="' + k + '" aria-pressed="false">' + M.FORMAS[k].nome + '</button>'; }).join('');
    $('#m-estilo').innerHTML = Object.keys(M.ESTILOS).map(function (k) { return '<button type="button" class="chip" data-v="' + k + '" aria-pressed="false">' + M.ESTILOS[k].nome + '</button>'; }).join('');
    preencherMarca();
    if (!marcaMontada) ligarMarca();
    marcaMontada = true;
    atualizarAmostras();
  }
  function preencherMarca() {
    var r = rascunho;
    $('#m-nome').value = r.nome === 'Sua marca' ? '' : r.nome;
    $('#m-ft').value = r.fontes.titulo; $('#m-fx').value = r.fontes.texto;
    $('#m-site').value = r.rodape.site || ''; $('#m-social').value = r.rodape.social || ''; $('#m-frase').value = r.rodape.frase || '';
    $('#m-legal').value = r.legal || '';
    $('#m-proibidas').value = r.linguagem.proibidas || '';
    $('#m-excl').value = String(r.linguagem.maxExclamacoes == null ? 1 : r.linguagem.maxExclamacoes);
    $('#m-estr').value = r.linguagem.estrangeirismos === false ? '0' : '1';
    $('#m-caixa').checked = !!r.linguagem.caixaAltaTitulo;
    $$('#m-forma .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === r.forma)); });
    $$('#m-estilo .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === r.estilo)); });
    mostrarLogo('#m-logo-ver', '#m-logo-tirar', r.logo, 'sem logo');
    mostrarLogo('#m-logo2-ver', '#m-logo2-tirar', r.logoClaro, '');
    desenharCores();
  }
  function desenharCores() {
    var P = M.paleta(rascunho);
    $('#m-cores').innerHTML = CORES.map(function (c) {
      var auto = c.id !== 'principal' && !rascunho.cores[c.id];
      var v = c.id === 'principal' ? rascunho.cores.principal : (rascunho.cores[c.id] || P[c.id]);
      return '<label class="cor"><input type="color" data-cor="' + c.id + '" value="' + v + '" aria-label="Cor ' + c.nome + '"><span><b>' + c.nome + '</b>' + c.dica + (auto ? '<br><small>automática</small>' : '') + '</span></label>';
    }).join('');
  }
  function mostrarLogo(ver, tirar, src, vazio) {
    $(ver).innerHTML = src ? '<img src="' + src + '" alt="">' : vazio;
    $(tirar).hidden = !src;
  }
  function ligarMarca() {
    var f = $('#form-marca');
    var mudou = adiar(atualizarAmostras, 120);
    f.addEventListener('input', function (e) {
      var t = e.target, r = rascunho;
      if (t.dataset.cor) { r.cores[t.dataset.cor] = t.value; if (t.dataset.cor === 'principal') desenharCoresDepois(); }
      if (t.id === 'm-nome') r.nome = t.value.trim() || 'Sua marca';
      if (t.id === 'm-site') r.rodape.site = t.value; if (t.id === 'm-social') r.rodape.social = t.value; if (t.id === 'm-frase') r.rodape.frase = t.value;
      if (t.id === 'm-legal') r.legal = t.value;
      if (t.id === 'm-proibidas') r.linguagem.proibidas = t.value;
      mudou();
    });
    f.addEventListener('change', function (e) {
      var t = e.target, r = rascunho;
      if (t.id === 'm-ft') r.fontes.titulo = t.value; if (t.id === 'm-fx') r.fontes.texto = t.value;
      if (t.id === 'm-excl') r.linguagem.maxExclamacoes = Number(t.value);
      if (t.id === 'm-estr') r.linguagem.estrangeirismos = t.value === '1';
      if (t.id === 'm-caixa') r.linguagem.caixaAltaTitulo = t.checked;
      if (t.dataset.cor) desenharCores();
      mudou();
    });
    var desenharCoresDepois = adiar(desenharCores, 300);
    $('#m-forma').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; rascunho.forma = b.dataset.v; preencherChips('#m-forma', b.dataset.v); mudou(); });
    $('#m-estilo').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; rascunho.estilo = b.dataset.v; preencherChips('#m-estilo', b.dataset.v); mudou(); });
    $('#m-cores-auto').addEventListener('click', function () { ['escura', 'acao', 'destaque', 'fundo'].forEach(function (k) { rascunho.cores[k] = ''; }); desenharCores(); mudou(); });
    $('#m-logo').addEventListener('change', function () { lerLogo(this.files[0], function (d) { rascunho.logo = d; mostrarLogo('#m-logo-ver', '#m-logo-tirar', d, 'sem logo'); mudou(); }); });
    $('#m-logo2').addEventListener('change', function () { lerLogo(this.files[0], function (d) { rascunho.logoClaro = d; mostrarLogo('#m-logo2-ver', '#m-logo2-tirar', d, ''); mudou(); }); });
    $('#m-logo-tirar').addEventListener('click', function () { rascunho.logo = ''; $('#m-logo').value = ''; mostrarLogo('#m-logo-ver', '#m-logo-tirar', '', 'sem logo'); mudou(); });
    $('#m-logo2-tirar').addEventListener('click', function () { rascunho.logoClaro = ''; $('#m-logo2').value = ''; mostrarLogo('#m-logo2-ver', '#m-logo2-tirar', '', ''); mudou(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      rascunho.configurada = true;
      if (!M.salvar(rascunho)) { $('#m-salvo').textContent = 'O logotipo é grande demais para guardar neste aparelho. Use um arquivo menor (até uns 300 KB).'; return; }
      marca = JSON.parse(JSON.stringify(rascunho));
      est.estilo = marca.estilo;
      window.CriouFontesAtivas = [marca.fontes.titulo, marca.fontes.texto];
      $('#m-salvo').textContent = 'Marca salva. As próximas peças já saem assim.';
      aviso('Marca salva');
      setTimeout(function () { ir('criar'); }, 700);
    });
  }
  function preencherChips(sel, v) { $$(sel + ' .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === v)); }); }

  var AMOSTRA = { assunto: 'novidade', titulo: 'Seu recado ganha ==a cara da marca==', apoio: 'Mesmo conteúdo, três estilos.', chamada: 'Quero ver' };
  function atualizarAmostras() {
    var fo = F.porId('post-retrato'), caixa = $('#m-amostras');
    caixa.innerHTML = '';
    Object.keys(M.ESTILOS).forEach(function (k) {
      var dec = MO.decidir(fo, AMOSTRA, rascunho, k);
      var b = el('div', { class: 'estilo', role: 'img', 'aria-label': 'Amostra no estilo ' + M.ESTILOS[k].nome });
      var mini = el('div', { class: 'mini' });
      b.appendChild(mini);
      b.appendChild(el('b', null, M.ESTILOS[k].nome));
      caixa.appendChild(b);
      var alvo = mini.clientWidth || 180;
      mini.appendChild(quadro(MD.html(fo, AMOSTRA, rascunho, dec), fo.largura, fo.altura, alvo).firstChild);
      var fr = mini.querySelector('iframe'); fr.style.transform = 'scale(' + (alvo / fo.largura) + ')';
    });
    var P = M.paleta(rascunho), C = M.cor;
    var pares = [['Texto escuro no fundo claro', P.escura, P.fundo], ['Branco na cor escura', '#ffffff', P.escura], ['Texto do botão', P.sobreAcao, P.acao], ['Texto sobre a principal', P.sobrePrincipal, P.principal]];
    $('#m-contraste').innerHTML = pares.map(function (p) {
      var r = C.contraste(p[1], p[2]);
      return '<li><b>' + (r >= 4.5 ? '✓' : '!') + '</b> ' + p[0] + ': ' + r.toFixed(1).replace('.', ',') + ':1 ' + (r >= 4.5 ? '(passa)' : '(o sistema ajusta sozinho)') + '</li>';
    }).join('');
  }

  /* Logo: rasteriza (SVG também) para sair igual na prévia, no PNG, no PDF e no PowerPoint. */
  function lerLogo(arquivo, ok) {
    if (!arquivo) return;
    var leitor = new FileReader();
    leitor.onload = function () {
      var im = new Image();
      im.onload = function () {
        var iw = im.naturalWidth || 600, ih = im.naturalHeight || 200;
        var k = Math.min(1, 900 / Math.max(iw, ih)); if (/svg/.test(arquivo.type)) k = 600 / Math.max(iw, ih);
        var cv = document.createElement('canvas'); cv.width = Math.round(iw * k); cv.height = Math.round(ih * k);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        ok(cv.toDataURL('image/png'));
      };
      im.onerror = function () { aviso('Não consegui abrir esse arquivo. Tente PNG.'); };
      im.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }

  /* =========================================================
     CRIAR · escolha de formato e estilo
     ========================================================= */
  function montarEscolha() {
    $('#escolha').hidden = !!est.emEdicao; $('#editor').hidden = !est.emEdicao;
    if (est.emEdicao) { atualizarPrevia(); return; }
    $('#formatos').innerHTML = F.lista.map(function (f) {
      var medida = f.kit ? '4 peças' : f.email ? '600 px de largura' : f.largura + ' × ' + f.altura + ' px';
      return '<button type="button" class="fmt" data-f="' + f.id + '" aria-pressed="' + (f.id === est.formato) + '">' + (f.recomendado ? '<span class="rec">Recomendado</span>' : '') + '<span class="g">' + f.grupo + '</span><b>' + f.nome + '</b><small>' + (f.descricao || medida) + '</small></button>';
    }).join('');
    desenharEstilos();
  }
  function desenharEstilos() {
    var caixa = $('#estilos'); caixa.innerHTML = '';
    var fo = F.porId('post-retrato');
    var d = Object.assign({}, est.dados.titulo ? est.dados : { assunto: 'novidade', titulo: 'Seu recado aqui', apoio: 'Frase de apoio' });
    Object.keys(M.ESTILOS).forEach(function (k) {
      var b = el('button', { type: 'button', class: 'estilo', 'data-e': k, 'aria-pressed': String(k === est.estilo) });
      var mini = el('div', { class: 'mini' });
      b.appendChild(mini);
      b.insertAdjacentHTML('beforeend', '<b>' + M.ESTILOS[k].nome + '</b><small>' + M.ESTILOS[k].frase + '</small>');
      caixa.appendChild(b);
      var alvo = mini.clientWidth || 200;
      mini.appendChild(quadro(MD.html(fo, d, marca, MO.decidir(fo, d, marca, k)), fo.largura, fo.altura, alvo).firstChild);
      mini.querySelector('iframe').style.transform = 'scale(' + (alvo / fo.largura) + ')';
    });
  }
  $('#formatos').addEventListener('click', function (e) {
    var b = e.target.closest('.fmt'); if (!b) return;
    est.formato = b.dataset.f;
    $$('#formatos .fmt').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });
  $('#estilos').addEventListener('click', function (e) {
    var b = e.target.closest('.estilo'); if (!b) return;
    est.estilo = b.dataset.e;
    $$('#estilos .estilo').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });
  $('#seguir').addEventListener('click', function () { abrirEditor(); });
  $('#voltar').addEventListener('click', function () { est.emEdicao = false; montarEscolha(); window.scrollTo(0, 0); });

  /* =========================================================
     CRIAR · editor
     ========================================================= */
  function formatoAtual() { return F.porId(est.formato); }
  function abrirEditor() {
    var fo = formatoAtual();
    est.emEdicao = true;
    if (fo.assuntoPadrao && !est.dados.titulo) est.dados.assunto = fo.assuntoPadrao;
    $('#escolha').hidden = true; $('#editor').hidden = false; $('#feito').hidden = true; $('#form-peca').hidden = false;
    $('#ed-titulo').textContent = fo.nome;
    $('#ed-resumo').textContent = 'Estilo ' + M.ESTILOS[est.estilo].nome + (fo.kit ? ' · ' + fo.kit.length + ' peças' : '');
    montarCampos(fo);
    atualizarPrevia();
    window.scrollTo(0, 0);
  }

  function montarCampos(fo) {
    var caixa = $('#campos'); caixa.innerHTML = '';
    fo.campos.forEach(function (id) {
      var c = F.CAMPOS[id], v = est.dados[id] == null ? '' : est.dados[id];
      var w = el('div', { class: 'campo', 'data-campo': id });
      var rot = c.rotulo + (c.opcional ? ' <span class="opc">· opcional</span>' : '');
      if (c.tipo === 'escolha') {
        w.innerHTML = '<span class="rot" id="r-' + id + '">' + rot + '</span><div class="chips" role="group" aria-labelledby="r-' + id + '">' +
          Object.keys(F.ASSUNTOS).map(function (k) { return '<button type="button" class="chip" data-v="' + k + '" aria-pressed="' + (k === (v || 'novidade')) + '">' + F.ASSUNTOS[k].nome + '</button>'; }).join('') + '</div>';
        w.querySelector('.chips').addEventListener('click', function (e) {
          var b = e.target.closest('.chip'); if (!b) return;
          est.dados[id] = b.dataset.v; $$('.chip', w).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); mudou();
        });
      } else if (c.tipo === 'imagem') {
        w.innerHTML = '<label for="f-' + id + '">' + rot + '</label><input id="f-' + id + '" type="file" accept="image/jpeg,image/png,image/webp"><div id="recorte-caixa"></div>';
        w.querySelector('input').addEventListener('change', function () { lerFoto(this.files[0]); });
      } else {
        var tipo = c.tipo === 'data' ? 'date' : c.tipo === 'hora' ? 'time' : 'text';
        var campo = c.tipo === 'area' ? '<textarea id="f-' + id + '" maxlength="' + c.max + '" placeholder="' + esc(c.placeholder || '') + '"></textarea>'
          : '<input id="f-' + id + '" type="' + (id === 'link' ? 'url' : tipo) + '"' + (c.max ? ' maxlength="' + (c.max + 30) + '"' : '') + ' placeholder="' + esc(c.placeholder || '') + '" autocomplete="off">';
        w.innerHTML = '<label for="f-' + id + '">' + rot + (c.max && c.tipo !== 'data' ? '<span class="conta" id="c-' + id + '"></span>' : '') + '</label>' + campo + (c.ajuda ? '<p class="ajuda" id="a-' + id + '">' + c.ajuda + '</p>' : '');
        var inp = w.querySelector('input,textarea');
        inp.value = v;
        if (c.ajuda) inp.setAttribute('aria-describedby', 'a-' + id);
        if (c.formato) w.insertBefore(window.CriouFormatacao.barra(inp, M.realces(marca), c.formato), inp);
        inp.addEventListener('input', function () { est.dados[id] = inp.value; contar(id); mudou(); });
      }
      caixa.appendChild(w);
      contar(id);
    });
    desenharRecorte();
  }
  function contar(id) {
    var c = F.CAMPOS[id], s = $('#c-' + id); if (!s || !c.max) return;
    var n = MO.semMarcas(est.dados[id] || '').length;
    s.textContent = n + ' / ' + c.max;
    s.style.color = n > c.max ? 'var(--erro)' : '';
  }

  function lerFoto(arquivo) {
    if (!arquivo) return;
    var leitor = new FileReader();
    leitor.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 2200 / Math.max(im.naturalWidth, im.naturalHeight));
        var cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        est.imagem = { src: cv.toDataURL('image/jpeg', 0.9), ajuste: { x: 0.5, y: 0.5, zoom: 1 } };
        desenharRecorte(); mudou();
      };
      im.onerror = function () { aviso('Não consegui abrir essa foto.'); };
      im.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }
  function formatoDoRecorte() { var fo = formatoAtual(); return fo.kit ? F.porId(fo.kit[0]) : fo; }
  function desenharRecorte() {
    var caixa = $('#recorte-caixa'); if (!caixa) return;
    caixa.innerHTML = '';
    if (!est.imagem) return;
    var fo = formatoDoRecorte(), dec = MO.decidir(fo, Object.assign({}, est.dados, { imagem: est.imagem }), marca, est.estilo), s = MD.slot(fo, dec);
    caixa.appendChild(window.CriouRecorte.editor({ id: 'foto', numero: 'Enquadramento', rotulo: 'Foto', w: s.w, h: s.h, src: est.imagem.src, ajuste: est.imagem.ajuste, aoMudar: function (aj) { est.imagem.ajuste = aj; mudou(); } }));
    var tirar = el('button', { type: 'button', class: 'btn-mini' }, 'Tirar a foto');
    tirar.style.marginTop = '8px';
    tirar.addEventListener('click', function () { est.imagem = null; var i = $('#f-imagem'); if (i) i.value = ''; desenharRecorte(); mudou(); });
    caixa.appendChild(tirar);
  }

  /* Dados prontos para o desenho de um formato: foto recortada no quadro do estilo. */
  async function dadosPara(fo) {
    var d = Object.assign({}, est.dados, { imagem: est.imagem });
    var dec = MO.decidir(fo, d, marca, est.estilo);
    if (est.imagem) {
      var s = MD.slot(fo, dec);
      d._foto = await window.CriouRecorte.cortar(est.imagem.src, s.w, s.h, est.imagem.ajuste, fo.email ? 2 : 1);
    }
    return { d: d, dec: dec };
  }

  var geracao = 0;
  async function atualizarPrevia() {
    var fo = formatoAtual(), minha = ++geracao;
    var palco = $('#palco'), largura = Math.min(palco.clientWidth - 36, 560) || 320;
    var lista = fo.kit ? fo.kit.map(F.porId) : [fo];
    var feitos = [];
    for (var i = 0; i < lista.length; i++) feitos.push(await dadosPara(lista[i]));
    if (minha !== geracao) return;
    palco.innerHTML = '';
    if (fo.kit) {
      var g = el('div', { class: 'kit' });
      lista.forEach(function (f, i) {
        var fig = el('figure');
        var alvo = (largura - 14) / 2;
        fig.appendChild(quadro(MD.html(f, feitos[i].d, marca, feitos[i].dec, { previa: !LIBERADO }), f.largura, f.altura, alvo, f.nome));
        fig.appendChild(el('figcaption', null, f.nome + ' · ' + f.largura + '×' + f.altura));
        g.appendChild(fig);
      });
      palco.appendChild(g);
    } else {
      var alvoW = fo.altura && fo.altura / fo.largura > 1.4 ? Math.min(largura, 330) : largura;
      palco.appendChild(quadro(MD.html(fo, feitos[0].d, marca, feitos[0].dec, { previa: !LIBERADO }), fo.largura, fo.altura, alvoW, fo.nome));
    }
    $('#legenda').textContent = fo.kit ? 'Prévia ao vivo das quatro peças.' : fo.nome + (fo.email ? ' · 600 px de largura' : ' · ' + fo.largura + ' × ' + fo.altura + ' px') + (fo.nota ? ' · ' + fo.nota : '');
    $('#porque').innerHTML = feitos[0].dec.porque.map(function (p) { return '<li><b>' + p.tema + ':</b> ' + esc(p.texto) + '</li>'; }).join('');
    mensagens(false);
  }
  var mudou = adiar(function () { $('#feito').hidden = true; atualizarPrevia(); }, 160);

  function mensagens(mostrarErros) {
    var fo = formatoAtual();
    var v = MO.validar(fo.kit ? Object.assign({}, fo, { campos: fo.campos }) : fo, est.dados, marca);
    var html = '';
    $$('#campos .campo').forEach(function (c) { c.classList.remove('tem-erro'); });
    if (mostrarErros) v.erros.forEach(function (e) {
      html += '<div class="msg erro">' + esc(e.texto) + '</div>';
      var c = $('#campos [data-campo="' + e.campo + '"]'); if (c) c.classList.add('tem-erro');
    });
    else v.erros.filter(function (e) { return e.campo !== 'titulo' || MO.limpar(est.dados.titulo); }).forEach(function (e) { html += '<div class="msg erro">' + esc(e.texto) + '</div>'; });
    v.avisos.forEach(function (a) { html += '<div class="msg aviso">' + esc(a.texto) + '</div>'; });
    $('#msgs').innerHTML = html;
    $('#pendencia').textContent = v.ok ? '' : (MO.limpar(est.dados.titulo) ? 'Resolva o que está em vermelho para registrar.' : 'Escreva o recado para registrar.');
    return v;
  }

  /* ---------- Registro (neste aparelho) ---------- */
  var CHAVE_PECAS = 'criou.pecas.v1';
  function lerPecas() { try { return JSON.parse(localStorage.getItem(CHAVE_PECAS)) || []; } catch (e) { return []; } }
  function codigoNovo() { return 'CR-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 4).toUpperCase(); }

  $('#form-peca').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = mensagens(true);
    if (!v.ok) { var p = $('#campos .tem-erro input, #campos .tem-erro textarea'); if (p) p.focus(); return; }
    var fo = formatoAtual(), lista = lerPecas();
    var codigo = est.editando || codigoNovo();
    var reg = { codigo: codigo, formato: fo.id, estilo: est.estilo, dados: est.dados, quando: new Date().toISOString(), comFoto: !!est.imagem };
    lista = lista.filter(function (x) { return x.codigo !== codigo; });
    lista.unshift(reg);
    try { localStorage.setItem(CHAVE_PECAS, JSON.stringify(lista.slice(0, 200))); } catch (err) { }
    est.editando = codigo;
    $('#codigo').textContent = codigo;
    $('#feito-sub').textContent = fo.kit ? 'Campanha registrada.' : 'Peça registrada.';
    montarDownloads(fo, codigo);
    $('#feito').hidden = false; $('#feito').focus();
    $('#feito').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#editar').addEventListener('click', function () { $('#feito').hidden = true; var t = $('#f-titulo'); if (t) t.focus(); });
  $('#nova').addEventListener('click', function () { est.dados = { assunto: 'novidade' }; est.imagem = null; est.editando = null; est.emEdicao = false; montarEscolha(); window.scrollTo(0, 0); });

  /* ---------- Downloads ---------- */
  function nomeArquivo(fo, codigo) {
    var base = (marca.nome + '-' + fo.nome + '-' + codigo).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    return base;
  }
  function montarDownloads(fo, codigo) {
    var caixa = $('#baixar'); caixa.innerHTML = '';
    var lista = fo.kit ? fo.kit.map(F.porId) : [fo];
    if (!LIBERADO) caixa.insertAdjacentHTML('beforeend', '<p class="ajuda">Nesta versão de teste, o download sai em PNG com marca d\'água. PNG, JPG, PDF e PowerPoint sem marca d\'água abrem com o cadastro.</p>');
    lista.forEach(function (f) {
      var linha = el('div', { class: 'exportar', role: 'group', 'aria-label': 'Baixar ' + f.nome });
      linha.insertAdjacentHTML('beforeend', '<span class="rot" style="width:100%;margin:6px 0 0">' + f.nome + '</span>');
      var tipos = LIBERADO ? f.exportar : ['png'];
      tipos.forEach(function (t) {
        var b = el('button', { type: 'button', class: 'btn-mini' }, (LIBERADO ? '' : 'Prévia ') + t.toUpperCase() + ' ↓');
        b.addEventListener('click', function () { baixar(f, t, codigo, b); });
        linha.appendChild(b);
      });
      caixa.appendChild(linha);
    });
  }
  async function baixar(fo, tipo, codigo, botao) {
    var X = window.CriouExportar, rotulo = botao.textContent;
    botao.disabled = true; botao.textContent = 'Preparando…';
    try {
      var r = await dadosPara(fo);
      var html = MD.html(fo, r.d, marca, r.dec, { previa: !LIBERADO });
      var nome = nomeArquivo(fo, codigo) + (LIBERADO ? '' : '-previa');
      var info = { largura: fo.largura, escala: fo.email ? 2 : 1, dpi: fo.dpi, codigo: codigo, fonte: marca.fontes.texto, empresa: marca.nome, autor: marca.nome };
      if (tipo === 'html') { await X.arquivo(new Blob([html], { type: 'text/html' }), nome + '.html'); }
      else await X[tipo](html, nome, info);
      aviso('Download pronto');
    } catch (e) { aviso('Não consegui gerar o arquivo. Tente de novo.'); if (window.console) console.error(e); }
    botao.disabled = false; botao.textContent = rotulo;
  }

  /* =========================================================
     MINHAS PEÇAS
     ========================================================= */
  function montarPecas() {
    var lista = lerPecas(), caixa = $('#lista-pecas');
    if (!lista.length) { caixa.innerHTML = '<div class="cartao vazio">Nenhuma peça registrada ainda.<div class="acoes" style="justify-content:center"><button class="btn" type="button" data-ir2="criar">Criar a primeira</button></div></div>'; return; }
    caixa.innerHTML = lista.map(function (p) {
      var f = F.porId(p.formato) || { nome: p.formato };
      var dt = new Date(p.quando);
      return '<div class="cartao peca-item"><div><b>' + esc(MO.semMarcas(p.dados.titulo || '')) + '</b><small>' + p.codigo + ' · ' + f.nome + ' · ' + (M.ESTILOS[p.estilo] || {}).nome + ' · ' + dt.toLocaleDateString('pt-BR') + (p.comFoto ? ' · tinha foto' : '') + '</small></div><button class="btn sec" type="button" data-abrir="' + p.codigo + '">Abrir</button></div>';
    }).join('');
  }
  $('#lista-pecas').addEventListener('click', function (e) {
    if (e.target.closest('[data-ir2]')) { ir('criar'); return; }
    var b = e.target.closest('[data-abrir]'); if (!b) return;
    var p = lerPecas().filter(function (x) { return x.codigo === b.dataset.abrir; })[0]; if (!p) return;
    est.formato = p.formato; est.estilo = p.estilo; est.dados = JSON.parse(JSON.stringify(p.dados)); est.imagem = null; est.editando = p.codigo;
    ir('criar'); abrirEditor();
  });

  /* No celular: atalho para a prévia, só enquanto o editor está aberto e a prévia fora da tela. */
  var atalho = $('#ir-previa');
  atalho.addEventListener('click', function (e) { e.preventDefault(); $('#palco').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $$('.ir-form').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); $('#form-peca').scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
  if (window.IntersectionObserver) {
    var visivel = false;
    new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; atalho.hidden = visivel || $('#editor').hidden; }).observe($('#palco'));
    setInterval(function () { atalho.hidden = visivel || $('#editor').hidden || $('#vista-criar').hidden; }, 500);
  }

  /* ---------- Início ---------- */
  carregarFontes();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!$('#vista-criar').hidden && !est.emEdicao) desenharEstilos(); });
  var inicial = (location.hash || '').slice(1);
  ir(inicial || (marca.configurada ? 'criar' : 'marca'));
  window.addEventListener('resize', adiar(function () { if (est.emEdicao) atualizarPrevia(); }, 250));
})();
