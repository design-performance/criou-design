/* ============================================================
   Criou · Estúdio
   Entrada curta (nome, logo, cor) → tela única de criação
   (formato, recado, foto, layout, fonte, cor) → registrar → baixar.
   Ajustes da marca são opcionais.
   ============================================================ */
(function () {
  'use strict';

  /* Planos. Gratuito: precisa de cadastro para baixar, até LIMITE_DIA peças por dia, PNG com marca d'água
     discreta e só layouts básicos e elaborados. Essencial: tudo, sem marca d'água.
     Enquanto o cadastro não abre, ninguém baixa (?teste=1 simula o cadastro feito, para conferência). */
  var Q0 = new URLSearchParams(location.search);
  var CADASTRO_ABERTO = false;
  /* Segurança: os atalhos de teste (?teste=1 e ?plano=essencial) só existem no pré-lançamento.
     Quando o cadastro abrir, o plano passa a vir do servidor e a URL deixa de valer. */
  var MODO_TESTE = !CADASTRO_ABERTO;
  var CADASTRADO = CADASTRO_ABERTO || (MODO_TESTE && Q0.get('teste') === '1');
  var PLANO = MODO_TESTE && Q0.get('plano') === 'essencial' ? 'essencial' : 'gratuito';
  var LIMITE_DIA = 3, EDICOES_LIVRES = 3;
  var LIBERADO = CADASTRADO && PLANO === 'essencial';

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
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var CORES_PRONTAS = ['#1F3DFF', '#0E7C66', '#2F6B4F', '#E8C21A', '#FF6A00', '#E5243B', '#FF2E88', '#7A1FA2', '#3B2A20', '#111111'];

  var marca = M.ler();
  var est = { formato: 'kit:post-retrato,story', layout: 'limpo', par: 'auto', cor: '', corDest: '', dados: { assunto: 'novidade' }, imagem: null, editando: null };

  /* Chegando da página inicial: ?nome=&cor= */
  var Q = new URLSearchParams(location.search);
  if (!marca.configurada && (Q.get('nome') || Q.get('cor'))) {
    if (Q.get('nome')) marca.nome = Q.get('nome').slice(0, 40);
    if (/^#[0-9a-f]{6}$/i.test(Q.get('cor') || '')) marca.cores.principal = Q.get('cor');
  }

  var linkFontes = el('link', { rel: 'stylesheet' });
  document.head.appendChild(linkFontes);
  linkFontes.href = M.urlFontes(Object.keys(M.FONTES));

  /* ---------- Marca efetiva da peça: cor e fontes escolhidas na tela ---------- */
  function marcaDa(layoutId, par, cor, base, dest) {
    var m = clone(base || marca);
    if (dest == null) dest = cor && cor === est.cor ? est.corDest : '';
    if (cor) m.cores = { principal: cor, escura: '', acao: '', destaque: dest || '', fundo: '' };
    par = par || 'auto';
    if (par === 'marca' && m.fontesMarca) { /* mantém as da marca */ }
    else if (M.PARES[par]) m.fontes = { titulo: M.PARES[par].titulo, texto: M.PARES[par].texto };
    else if (!m.fontesMarca) { var p = M.PARES[M.LAYOUTS[M.layout(layoutId)].par]; m.fontes = { titulo: p.titulo, texto: p.texto }; }
    return m;
  }

  /* ---------- Quadro de prévia (iframe na escala) ---------- */
  /* Prévia leve: a peça é desenhada já no tamanho da miniatura (zoom dentro do documento),
     em vez de desenhar 1080 px e encolher. Assim o navegador pinta pouco e a rolagem não pisca em branco.
     O e-mail mede a própria altura, então continua no jeito antigo. */
  function quadro(html, W, H, alvoW, rotulo) {
    var k = alvoW / W, alto = H ? H * k : 600;
    var q = el('div', { class: 'quadro' });
    q.style.width = Math.round(W * k) + 'px'; q.style.height = Math.round(alto) + 'px';
    var f = el('iframe', { title: rotulo || 'Prévia', tabindex: '-1', 'aria-hidden': rotulo ? null : 'true' });
    if (H) {
      f.setAttribute('sandbox', 'allow-scripts');
      f.style.width = Math.round(W * k) + 'px'; f.style.height = Math.round(H * k) + 'px';
      html = html.replace('<head>', '<head><style>html{zoom:' + k.toFixed(5) + '}html,body{overflow:hidden}</style>');
    } else {
      f.style.width = W + 'px'; f.style.height = '1600px'; f.style.transform = 'scale(' + k + ')';
      f.addEventListener('load', function () {
        try { var h = f.contentDocument.documentElement.scrollHeight; f.style.height = h + 'px'; q.style.height = Math.round(h * k) + 'px'; } catch (e) { }
      });
    }
    f.srcdoc = html;
    q.appendChild(f);
    return q;
  }
  /* Troca sem piscar: o novo quadro carrega por cima e só então o antigo sai. */
  function carregado(raizEl, limite) {
    var fs = Array.prototype.slice.call(raizEl.querySelectorAll('iframe'));
    return Promise.race([Promise.all(fs.map(function (f) { return new Promise(function (ok) { f.addEventListener('load', function () { setTimeout(ok, 60); }, { once: true }); }); })), new Promise(function (ok) { setTimeout(ok, limite || 1500); })]);
  }
  function mini(caixa, fo, d, m, dec) {
    var alvo = caixa.clientWidth || 160;
    var q = quadro(MD.html(fo, d, m, dec), fo.largura, fo.altura, alvo), f = q.firstChild;
    var antigos = Array.prototype.slice.call(caixa.children);
    if (antigos.length) f.classList.add('chegando');
    caixa.appendChild(f);
    carregado({ querySelectorAll: function () { return [f]; } }).then(function () { antigos.forEach(function (a) { a.remove(); }); f.classList.remove('chegando'); });
  }

  /* ---------- Navegação ---------- */
  function ir(vista) {
    if (['criar', 'marca', 'pecas', 'entrada'].indexOf(vista) < 0) vista = 'criar';
    if (vista === 'criar' && !marca.configurada) vista = 'entrada';
    $$('.vista').forEach(function (v) { v.hidden = v.id !== 'vista-' + vista; });
    $$('.topo nav button').forEach(function (b) { if (b.dataset.ir === vista || (vista === 'entrada' && b.dataset.ir === 'criar')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (location.hash !== '#' + vista) history.replaceState(null, '', location.pathname + location.search + '#' + vista);
    if (vista === 'entrada') montarEntrada();
    if (vista === 'marca') montarMarca();
    if (vista === 'criar') montarCriar();
    if (vista === 'pecas') montarPecas();
    window.scrollTo(0, 0);
  }
  $$('.topo nav button').forEach(function (b) { b.addEventListener('click', function () { ir(b.dataset.ir); }); });

  /* ---------- Cores (bolinhas) ---------- */
  function swatches(caixa, atual, aoEscolher, comMarca) {
    var html = '';
    if (comMarca) html += '<button type="button" class="sw sw-marca" role="radio" aria-checked="' + (!atual) + '" data-c=""><i style="background:' + marca.cores.principal + '"></i>Da marca</button>';
    html += CORES_PRONTAS.map(function (c) { return '<button type="button" class="sw" role="radio" aria-checked="' + (!!atual && atual.toLowerCase() === c.toLowerCase()) + '" data-c="' + c + '" style="background:' + c + '" aria-label="Cor ' + c + '"></button>'; }).join('');
    var livre = !!atual && atual !== 'paleta' && CORES_PRONTAS.map(function (c) { return c.toLowerCase(); }).indexOf(atual.toLowerCase()) < 0;
    html += '<label class="sw sw-livre" role="radio" aria-checked="' + livre + '" title="Outra cor"' + (livre ? ' style="background:' + atual + '"' : '') + '><span class="sr">Outra cor</span><input type="color" value="' + (atual || '#1F3DFF') + '"></label>';
    caixa.innerHTML = html;
    caixa.onclick = function (e) {
      var b = e.target.closest('button.sw'); if (!b) return;
      aoEscolher(b.dataset.c); $$('.sw', caixa).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
    };
    var inp = $('input[type=color]', caixa);
    inp.addEventListener('input', function () {
      var lab = inp.parentNode; lab.style.background = inp.value;
      $$('.sw', caixa).forEach(function (x) { x.setAttribute('aria-checked', String(x === lab)); });
      aoEscolher(inp.value);
    });
  }

  /* =========================================================
     ENTRADA · nome, logo, cor
     ========================================================= */
  var entradaLigada = false;
  var DEMO = { assunto: 'novidade', titulo: 'Seu recado aqui, com a ==cara da sua marca==', apoio: 'É só escrever. O design é com a gente.' };
  function montarEntrada() {
    $('#e-nome').value = marca.nome === 'Sua marca' ? '' : marca.nome;
    mostrarLogo('#e-logo-ver', '#e-logo-tirar', marca.logo, 'sem logo');
    swatches($('#e-cores'), marca.cores.principal, function (c) { marca.cores.principal = c; previaEntrada(); }, false);
    if (!entradaLigada) {
      entradaLigada = true;
      $('#e-nome').addEventListener('input', adiar(function () { marca.nome = $('#e-nome').value.trim() || 'Sua marca'; previaEntrada(); }, 150));
      $('#e-logo').addEventListener('change', function () { lerLogo(this.files[0], function (d) { marca.logo = d; mostrarLogo('#e-logo-ver', '#e-logo-tirar', d, 'sem logo'); previaEntrada(); }); });
      $('#e-logo-tirar').addEventListener('click', function () { marca.logo = ''; $('#e-logo').value = ''; mostrarLogo('#e-logo-ver', '#e-logo-tirar', '', 'sem logo'); previaEntrada(); });
      $('#form-entrada').addEventListener('submit', function (e) {
        e.preventDefault();
        if (!$('#e-nome').value.trim()) { $('#e-erro').textContent = 'Escreva o nome da marca para seguir.'; $('#e-nome').focus(); return; }
        marca.nome = $('#e-nome').value.trim();
        marca.configurada = true;
        if (!M.salvar(marca)) { $('#e-erro').textContent = 'O logotipo é grande demais para guardar neste aparelho. Use um arquivo menor.'; return; }
        ir('criar');
        var t = $('#t-criar'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      });
    }
    previaEntrada();
  }
  function previaEntrada() {
    var fo = F.porId('post-retrato'), palco = $('#e-palco');
    var m = marcaDa('bloco', 'auto', '', marca), dec = MO.decidir(fo, DEMO, m, 'bloco');
    palco.innerHTML = '';
    palco.appendChild(quadro(MD.html(fo, DEMO, m, dec), fo.largura, fo.altura, Math.min(palco.clientWidth - 36, 380) || 300, 'Prévia'));
  }

  /* =========================================================
     AJUSTES DA MARCA (opcional)
     ========================================================= */
  var CORES = [
    { id: 'principal', nome: 'Principal', dica: 'a cor da marca' },
    { id: 'escura', nome: 'Escura', dica: 'títulos e fundos fortes' },
    { id: 'acao', nome: 'Ação', dica: 'só nos botões' },
    { id: 'destaque', nome: 'Destaque', dica: 'detalhes e realces' },
    { id: 'fundo', nome: 'Fundo claro', dica: 'fundos suaves' }
  ];
  var rascunho = clone(marca), marcaLigada = false;
  function montarMarca() {
    rascunho = clone(marca);
    var opcoes = '<option value="">Usar as combinações do Criou</option>' + Object.keys(M.FONTES).map(function (f) { return '<option value="' + f + '">' + f + ' · ' + M.FONTES[f].tipo + '</option>'; }).join('');
    $('#m-ft').innerHTML = opcoes; $('#m-fx').innerHTML = opcoes;
    $('#m-forma').innerHTML = Object.keys(M.FORMAS).map(function (k) { return '<button type="button" class="chip" data-v="' + k + '" aria-pressed="false">' + M.FORMAS[k].nome + '</button>'; }).join('');
    preencherMarca();
    if (!marcaLigada) ligarMarca();
    marcaLigada = true;
    atualizarAmostras();
  }
  function preencherMarca() {
    var r = rascunho;
    $('#m-nome').value = r.nome === 'Sua marca' ? '' : r.nome;
    $('#m-ft').value = r.fontesMarca ? r.fontes.titulo : ''; $('#m-fx').value = r.fontesMarca ? r.fontes.texto : '';
    $('#m-site').value = r.rodape.site || ''; $('#m-social').value = r.rodape.social || ''; $('#m-frase').value = r.rodape.frase || '';
    $('#m-legal').value = r.legal || '';
    $('#m-proibidas').value = r.linguagem.proibidas || '';
    $('#m-excl').value = String(r.linguagem.maxExclamacoes == null ? 1 : r.linguagem.maxExclamacoes);
    $('#m-estr').value = r.linguagem.estrangeirismos === false ? '0' : '1';
    $('#m-caixa').checked = !!r.linguagem.caixaAltaTitulo;
    $$('#m-forma .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === r.forma)); });
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
  function mostrarLogo(ver, tirar, src, vazio) { $(ver).innerHTML = src ? '<img src="' + esc(M.imagemValida(src)) + '" alt="">' : vazio; $(tirar).hidden = !src; }
  function ligarMarca() {
    var f = $('#form-marca');
    var mudouM = adiar(atualizarAmostras, 150);
    var redesenhar = adiar(desenharCores, 300);
    f.addEventListener('input', function (e) {
      var t = e.target, r = rascunho;
      if (t.dataset.cor) { r.cores[t.dataset.cor] = t.value; if (t.dataset.cor === 'principal') redesenhar(); }
      if (t.id === 'm-nome') r.nome = t.value.trim() || 'Sua marca';
      if (t.id === 'm-site') r.rodape.site = t.value; if (t.id === 'm-social') r.rodape.social = t.value; if (t.id === 'm-frase') r.rodape.frase = t.value;
      if (t.id === 'm-legal') r.legal = t.value;
      if (t.id === 'm-proibidas') r.linguagem.proibidas = t.value;
      mudouM();
    });
    f.addEventListener('change', function (e) {
      var t = e.target, r = rascunho;
      if (t.id === 'm-ft' || t.id === 'm-fx') {
        var ft = $('#m-ft').value, fx = $('#m-fx').value;
        r.fontesMarca = !!(ft || fx);
        if (r.fontesMarca) r.fontes = { titulo: ft || fx, texto: fx || ft };
      }
      if (t.id === 'm-excl') r.linguagem.maxExclamacoes = Number(t.value);
      if (t.id === 'm-estr') r.linguagem.estrangeirismos = t.value === '1';
      if (t.id === 'm-caixa') r.linguagem.caixaAltaTitulo = t.checked;
      if (t.dataset.cor) desenharCores();
      mudouM();
    });
    $('#m-forma').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; rascunho.forma = b.dataset.v; $$('#m-forma .chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); mudouM(); });
    $('#m-cores-auto').addEventListener('click', function () { ['escura', 'acao', 'destaque', 'fundo'].forEach(function (k) { rascunho.cores[k] = ''; }); desenharCores(); mudouM(); });
    $('#m-logo').addEventListener('change', function () { lerLogo(this.files[0], function (d) { rascunho.logo = d; mostrarLogo('#m-logo-ver', '#m-logo-tirar', d, 'sem logo'); mudouM(); }); });
    $('#m-logo2').addEventListener('change', function () { lerLogo(this.files[0], function (d) { rascunho.logoClaro = d; mostrarLogo('#m-logo2-ver', '#m-logo2-tirar', d, ''); mudouM(); }); });
    $('#m-logo-tirar').addEventListener('click', function () { rascunho.logo = ''; $('#m-logo').value = ''; mostrarLogo('#m-logo-ver', '#m-logo-tirar', '', 'sem logo'); mudouM(); });
    $('#m-logo2-tirar').addEventListener('click', function () { rascunho.logoClaro = ''; $('#m-logo2').value = ''; mostrarLogo('#m-logo2-ver', '#m-logo2-tirar', '', ''); mudouM(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      rascunho.configurada = true;
      if (!M.salvar(rascunho)) { $('#m-salvo').textContent = 'O logotipo é grande demais para guardar neste aparelho. Use um arquivo menor (até uns 300 KB).'; return; }
      marca = clone(rascunho);
      est.par = marca.fontesMarca ? 'marca' : (est.par === 'marca' ? 'auto' : est.par);
      $('#m-salvo').textContent = 'Marca salva. As próximas peças já saem assim.';
      aviso('Marca salva');
      setTimeout(function () { ir('criar'); }, 600);
    });
  }
  var AMOSTRA = { assunto: 'novidade', titulo: 'Seu recado com ==a cara da marca==', apoio: 'Mesmo conteúdo, layouts diferentes.', chamada: 'Quero ver' };
  function atualizarAmostras() {
    var fo = F.porId('post-retrato'), caixa = $('#m-amostras');
    caixa.innerHTML = '';
    ['limpo', 'bloco', 'gradiente'].forEach(function (k) {
      var L = M.LAYOUTS[k], m = marcaDa(k, rascunho.fontesMarca ? 'marca' : 'auto', '', rascunho);
      var b = el('div', { class: 'estilo', role: 'img', 'aria-label': 'Amostra no layout ' + L.nome });
      var cx = el('div', { class: 'mini' });
      b.appendChild(cx); b.appendChild(el('b', null, L.nivel));
      caixa.appendChild(b);
      mini(cx, fo, AMOSTRA, m, MO.decidir(fo, AMOSTRA, m, k));
    });
    var P = M.paleta(rascunho), C = M.cor;
    var pares = [['Texto escuro no fundo claro', P.escura, P.fundo], ['Branco na cor escura', '#ffffff', P.escura], ['Texto do botão', P.sobreAcao, P.acao], ['Texto sobre a principal', P.sobrePrincipal, P.principal]];
    $('#m-contraste').innerHTML = pares.map(function (p) {
      var r = C.contraste(p[1], p[2]);
      return '<li><b>' + (r >= 4.5 ? '✓' : '!') + '</b> ' + p[0] + ': ' + r.toFixed(1).replace('.', ',') + ':1 ' + (r >= 4.5 ? '(passa)' : '(o sistema ajusta sozinho)') + '</li>';
    }).join('');
  }

  function lerLogo(arquivo, ok) {
    if (!arquivo || !arquivoOk(arquivo, 5)) return;
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
     CRIAR · tela única
     ========================================================= */
  function formatoAtual() { return F.porId(est.formato); }
  function formatoDasMinis() { var fo = formatoAtual(); return fo.kit ? F.porId(fo.kit[0]) : (fo.email ? F.porId('post-retrato') : fo); }
  /* Paletas prontas: um toque escolhe as duas cores; dá para sortear e trocar de lugar. */
  function desenharPaletas() {
    var cx = $('#paletas'); if (!cx) return;
    var grupos = {};
    M.PALETAS.forEach(function (p) { (grupos[p.grupo] = grupos[p.grupo] || []).push(p); });
    cx.innerHTML = Object.keys(grupos).map(function (g) {
      return '<div class="pal-grupo"><span>' + g + '</span>' + grupos[g].map(function (p) {
        var on = est.corDest && ((est.cor === p.principal && est.corDest === p.destaque) || (est.cor === p.destaque && est.corDest === p.principal));
        return '<button type="button" class="pal" data-p="' + p.id + '" aria-pressed="' + !!on + '"><i style="background:' + p.principal + '"></i><i style="background:' + p.destaque + '"></i>' + p.nome + '</button>';
      }).join('') + '</div>';
    }).join('');
  }
  function usarPaleta(principal, destaque) {
    est.cor = principal; est.corDest = destaque; mudou(); desenharLayouts(); desenharPaletas();
    $$('#cores-peca .sw').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
  }
  var criarLigado = false;
  function montarCriar() {
    if (marca.fontesMarca && est.par === 'auto') est.par = 'marca';
    desenharFormatos();
    montarCampos();
    desenharPares();
    desenharPaletas();
    swatches($('#cores-peca'), est.corDest ? 'paleta' : est.cor, function (c) { est.cor = c; est.corDest = ''; mudou(); desenharLayouts(); desenharPaletas(); }, true);
    if (!criarLigado) { criarLigado = true; ligarCriar(); }
    desenharControles(); infoPlano();
    desenharLayouts();
    atualizarPrevia();
  }
  /* Formatos: a pessoa marca onde vai publicar. Um marcado = uma peça; vários = uma campanha. */
  function marcados() { var fo = formatoAtual(); return fo.kit ? fo.kit.slice() : [fo.id]; }
  function definirMarcados(ids) {
    var ordem = F.lista.map(function (f) { return f.id; });
    ids = ids.filter(function (x, i, l) { return l.indexOf(x) === i; }).sort(function (a, b) { return ordem.indexOf(a) - ordem.indexOf(b); });
    var novo = ids.length === 1 ? ids[0] : 'kit:' + ids.join(',');
    if (novo === est.formato) return;
    if (est.editando) { est.editando = null; $('#feito').hidden = true; }
    est.formato = novo;
    desenharFormatos(); montarCampos(); desenharLayouts(); mudou();
  }
  function desenharFormatos() {
    var sel = marcados(), grupos = {}, ordem = [], dAntes = $('#formatos details.mais'), aberto = dAntes && dAntes.open;
    F.lista.forEach(function (f) { if (f.kit) return; var g = f.extra ? '_extra' : f.rede; if (!grupos[g]) { grupos[g] = []; ordem.push(g); } grupos[g].push(f); });
    function card(f) {
      var on = sel.indexOf(f.id) >= 0, r = f.altura ? f.largura / f.altura : 0.6;
      var w = r >= 1 ? 26 : Math.round(26 * r), h = r >= 1 ? Math.round(26 / r) : 26;
      return '<button type="button" class="pub" data-f="' + f.id + '" aria-pressed="' + on + '"><span class="pub-forma" aria-hidden="true"><i style="width:' + w + 'px;height:' + h + 'px"></i></span>' +
        '<span class="pub-txt"><b>' + f.nome + '</b><small>' + (f.email ? 'HTML · 600 px' : f.largura + ' × ' + f.altura) + '</small></span><span class="pub-check" aria-hidden="true"></span></button>';
    }
    var atalhos = '<div class="pub-atalhos" role="group" aria-label="Combinações prontas">' + F.ATALHOS.map(function (a) {
      var igual = a[1].length === sel.length && a[1].every(function (x) { return sel.indexOf(x) >= 0; });
      return '<button type="button" class="chip" data-atalho="' + a[1].join(',') + '" aria-pressed="' + igual + '">' + a[0] + '</button>';
    }).join('') + '</div>';
    var html = '<p class="pub-pergunta">Onde você vai publicar? <span>Marque um ou mais.</span></p>' + atalhos +
      ordem.filter(function (g) { return g !== '_extra'; }).map(function (g) { return '<div class="pub-grupo"><span>' + g + '</span><div class="pub-lista">' + grupos[g].map(card).join('') + '</div></div>'; }).join('') +
      '<details class="mais"' + (aberto || grupos._extra.some(function (f) { return sel.indexOf(f.id) >= 0; }) ? ' open' : '') + '><summary>Mais formatos <span class="opc">· banner, e-mail, cartaz, outdoor</span></summary><div class="pub-lista">' + grupos._extra.map(card).join('') + '</div></details>' +
      '<p class="pub-resumo" aria-live="polite"><b>' + (sel.length === 1 ? '1 peça' : sel.length + ' peças') + '</b>: ' + sel.map(function (x) { var f = F.porId(x); return f.nome + (f.rede === 'LinkedIn' ? ' (LinkedIn)' : ''); }).join(' · ') + '</p>';
    $('#formatos').innerHTML = html;
  }

  function campoHtml(id) {
    var c = F.CAMPOS[id], v = est.dados[id] == null ? '' : est.dados[id];
    var w = el('div', { class: 'campo', 'data-campo': id });
    var rot = c.rotulo + (id === 'apoio' ? ' <span class="opc">· opcional</span>' : '');
    if (c.tipo === 'escolha') {
      w.innerHTML = '<span class="rot" id="r-' + id + '">' + rot + '</span><div class="chips" role="group" aria-labelledby="r-' + id + '">' +
        Object.keys(F.ASSUNTOS).map(function (k) { return '<button type="button" class="chip" data-v="' + k + '" aria-pressed="' + (k === (v || 'novidade')) + '">' + F.ASSUNTOS[k].nome + '</button>'; }).join('') + '</div>';
      w.querySelector('.chips').addEventListener('click', function (e) {
        var b = e.target.closest('.chip'); if (!b) return;
        est.dados[id] = b.dataset.v; $$('.chip', w).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); mudou(); mudouMinis();
      });
      return w;
    }
    var tipo = c.tipo === 'data' ? 'date' : c.tipo === 'hora' ? 'time' : 'text';
    var campo = c.tipo === 'area' ? '<textarea id="f-' + id + '" maxlength="' + c.max + '" placeholder="' + esc(c.placeholder || '') + '"></textarea>'
      : '<input id="f-' + id + '" type="' + (id === 'link' ? 'url' : tipo) + '"' + (c.max ? ' maxlength="' + (c.max + 30) + '"' : '') + ' placeholder="' + esc(c.placeholder || '') + '" autocomplete="off">';
    w.innerHTML = '<label for="f-' + id + '">' + rot + (c.max && c.tipo !== 'data' ? '<span class="conta" id="c-' + id + '"></span>' : '') + '</label>' + campo + (c.ajuda ? '<p class="ajuda" id="a-' + id + '">' + c.ajuda + '</p>' : '');
    var inp = w.querySelector('input,textarea');
    inp.value = v;
    if (c.ajuda) inp.setAttribute('aria-describedby', 'a-' + id);
    if (c.formato === 'realce' && inp.tagName === 'INPUT') {
      /* Título: editor visual, o destaque aparece como na peça (sem os códigos). */
      var edt = window.CriouFormatacao.editorRealce(inp, M.realces(marcaDa(est.layout, est.par, est.cor)));
      w.replaceChild(edt.raiz, inp); inp = edt.campo; editores[id] = edt;
      var lb = w.querySelector('label'); lb.id = 'l-' + id; inp.setAttribute('aria-labelledby', 'l-' + id);
      lb.addEventListener('click', function (e) { if (!e.target.closest('.conta')) { e.preventDefault(); inp.focus(); } });
    } else if (c.formato) w.insertBefore(window.CriouFormatacao.barra(inp, M.realces(marcaDa(est.layout, est.par, est.cor)), c.formato), inp);
    inp.addEventListener('input', function () { est.dados[id] = inp.value; contar(id); mudou(); mudouMinis(); });
    return w;
  }
  /* ---------- Ícone: catálogo com busca e temas ---------- */
  var temaIcone = 'todos';
  function campoIcone() {
    var I = window.CriouIcones, w = el('div', { class: 'campo campo-icone', 'data-campo': 'icone' });
    function atual() { var id = est.dados.icone; return id && I.existe(id) ? id : ''; }
    function cab() {
      var id = atual();
      return '<span class="rot" id="r-icone">Ícone <span class="opc">· opcional</span></span>' +
        '<div class="icone-atual"><span class="icone-amostra" aria-hidden="true">' + (id ? I.svg(id, 'currentColor', 1.8) : '') + '</span>' +
        '<span>' + (id ? esc(I.NOMES[id]) : 'Nenhum ícone') + '</span>' +
        '<button type="button" class="btn sec sm" data-icone-abrir aria-expanded="false">' + (id ? 'Trocar' : 'Escolher ícone') + '</button>' +
        (id ? '<button type="button" class="btn sec sm" data-icone-tirar>Tirar</button>' : '') + '</div>';
    }
    w.innerHTML = '<div class="icone-cab">' + cab() + '</div><div class="icone-painel" hidden>' +
      '<input type="search" class="icone-busca" placeholder="Busque: pão, saúde, festa, seta…" aria-label="Buscar ícone">' +
      '<div class="chips icone-temas" role="group" aria-label="Temas de ícones"><button type="button" class="chip" data-tema="todos" aria-pressed="true">Todos</button>' +
      I.TEMAS.map(function (t) { return '<button type="button" class="chip" data-tema="' + esc(t.nome) + '" aria-pressed="false">' + esc(t.nome) + '</button>'; }).join('') + '</div>' +
      '<div class="icone-grade" role="listbox" aria-label="Ícones"></div><p class="icone-conta"></p></div>';
    var painel = $('.icone-painel', w), grade = $('.icone-grade', w), busca = $('.icone-busca', w);
    function lista() {
      var q = busca.value, ids = q ? I.buscar(q) : (temaIcone === 'todos' ? I.buscar('') : (I.TEMAS.filter(function (t) { return t.nome === temaIcone; })[0] || { icones: [] }).icones);
      grade.innerHTML = ids.map(function (id) { return '<button type="button" role="option" class="icone-op" data-id="' + id + '" aria-selected="' + (id === atual()) + '" title="' + esc(I.NOMES[id]) + '" aria-label="' + esc(I.NOMES[id]) + '">' + I.svg(id, 'currentColor', 1.8) + '</button>'; }).join('') || '<p class="icone-vazio">Nada com esse nome. Tente outra palavra.</p>';
      $('.icone-conta', w).textContent = ids.length + ' ícone' + (ids.length === 1 ? '' : 's');
    }
    function redesenharCab() { $('.icone-cab', w).innerHTML = cab(); $('[data-icone-abrir]', w).setAttribute('aria-expanded', String(!painel.hidden)); }
    w.addEventListener('click', function (e) {
      if (e.target.closest('[data-icone-abrir]')) { painel.hidden = !painel.hidden; redesenharCab(); if (!painel.hidden) { lista(); busca.focus(); } return; }
      if (e.target.closest('[data-icone-tirar]')) { delete est.dados.icone; redesenharCab(); lista(); mudou(); mudouMinis(); return; }
      var t = e.target.closest('[data-tema]');
      if (t) { temaIcone = t.dataset.tema; busca.value = ''; $$('[data-tema]', w).forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); }); lista(); return; }
      var o = e.target.closest('.icone-op');
      if (o) { est.dados.icone = o.dataset.id; painel.hidden = true; redesenharCab(); mudou(); mudouMinis(); }
    });
    busca.addEventListener('input', lista);
    return w;
  }
  var editores = {};
  function atualizarEditores() { var r = M.realces(marcaDa(est.layout, est.par, est.cor)); Object.keys(editores).forEach(function (k) { if (document.body.contains(editores[k].campo)) editores[k].atualizar(r); else delete editores[k]; }); }
  var PRINCIPAIS = ['titulo', 'apoio', 'texto'];
  function montarCampos() {
    var fo = formatoAtual(), a = $('#campos'), b = $('#campos-mais');
    a.innerHTML = ''; b.innerHTML = '';
    fo.campos.forEach(function (id) {
      if (id === 'imagem') return;
      (PRINCIPAIS.indexOf(id) >= 0 ? a : b).appendChild(campoHtml(id));
      contar(id);
    });
    if (!fo.email && window.CriouIcones) a.appendChild(campoIcone());
    $('#mais-opcoes').hidden = !b.children.length;
    var temFoto = fo.campos.indexOf('imagem') >= 0;
    $('#secao-foto').hidden = !temFoto;
    if (temFoto) desenharFoto();
  }
  function contar(id) {
    var c = F.CAMPOS[id], s = $('#c-' + id); if (!s || !c.max) return;
    var n = MO.semMarcas(est.dados[id] || '').length;
    s.textContent = n + ' / ' + c.max;
    s.style.color = n > c.max ? 'var(--erro)' : '';
  }

  /* ---------- Foto ---------- */
  function desenharFoto() {
    var caixa = $('#campo-foto');
    var L = M.LAYOUTS[M.layout(est.layout)];
    if (!$('#f-imagem')) {
      caixa.innerHTML = '<label class="arquivo"><input id="f-imagem" class="sr-arquivo" type="file" accept="image/jpeg,image/png,image/webp"><span class="btn sec sm" aria-hidden="true">Escolher foto</span><span class="arquivo-nome" id="f-imagem-nome">Nenhuma foto escolhida</span></label><p class="ajuda" id="foto-nota"></p><div id="recorte-caixa"></div>';
      $('#f-imagem').addEventListener('change', function () { var f = this.files[0]; $('#f-imagem-nome').textContent = f ? f.name : 'Nenhuma foto escolhida'; lerFoto(f); });
    }
    $('#foto-nota').textContent = !L.foto ? 'O layout "Só texto" não usa foto. Escolha outro layout para ela aparecer.' : L.foto === 'fundo' ? 'No layout "Foto de fundo", a foto ocupa a peça inteira.' : 'Quer a foto na peça inteira? Escolha "Foto de fundo" em Layout.';
    desenharRecorte();
  }
  var TIPOS_IMG = /^image\/(png|jpeg|webp|svg\+xml)$/;
  function arquivoOk(arquivo, mb) {
    if (!TIPOS_IMG.test(arquivo.type || '')) { aviso('Use uma imagem PNG, JPG ou WebP.'); return false; }
    if (arquivo.size > mb * 1048576) { aviso('Arquivo grande demais (máximo ' + mb + ' MB).'); return false; }
    return true;
  }
  function lerFoto(arquivo) {
    if (!arquivo || !arquivoOk(arquivo, 15)) return;
    var leitor = new FileReader();
    leitor.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 2400 / Math.max(im.naturalWidth, im.naturalHeight));
        var cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        est.imagem = { src: cv.toDataURL('image/jpeg', 0.9), ajuste: { x: 0.5, y: 0.5, zoom: 1 } };
        desenharRecorte(); mudou(); desenharLayouts();
      };
      im.onerror = function () { aviso('Não consegui abrir essa foto.'); };
      im.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }
  function desenharRecorte() {
    var caixa = $('#recorte-caixa'); if (!caixa) return;
    caixa.innerHTML = '';
    if (!est.imagem) return;
    var fo = formatoDasMinis(), lay = M.LAYOUTS[M.layout(est.layout)].foto ? est.layout : 'limpo';
    var dec = MO.decidir(fo, Object.assign({}, est.dados, { imagem: est.imagem }), marca, lay), s = MD.quadroFoto(fo, dec) || { w: fo.largura, h: fo.altura };
    var ed = window.CriouRecorte.editor({ id: 'foto', numero: 'Enquadramento', rotulo: 'Foto', w: s.w, h: s.h, src: est.imagem.src, ajuste: est.imagem.ajuste, aoMudar: function (aj) { est.imagem.ajuste = aj; mudou(); mudouMinis(); } });
    ed.style.maxWidth = Math.round(300 * s.w / s.h) + 'px';
    caixa.appendChild(ed);
    var tirar = el('button', { type: 'button', class: 'btn-mini' }, 'Tirar a foto');
    tirar.style.marginTop = '8px';
    tirar.addEventListener('click', function () { est.imagem = null; var i = $('#f-imagem'); if (i) { i.value = ''; $('#f-imagem-nome').textContent = 'Nenhuma foto escolhida'; } desenharRecorte(); mudou(); desenharLayouts(); });
    caixa.appendChild(tirar);
  }

  /* ---------- Layouts (miniaturas ao vivo com o texto da pessoa) ---------- */
  var geracaoMinis = 0;
  async function desenharLayouts() {
    var caixa = $('#layouts'), fo = formatoDasMinis();
    if (!caixa.children.length) {
      /* Grade única e compacta, com filtro: quem é leigo vê tudo de uma vez e separa o que é grátis. */
      var nomeNivel = function (n) { return n === 'Premium' ? 'Premium' : 'Grátis'; };
      caixa.innerHTML = '<div class="lay-filtro chips" role="group" aria-label="Filtrar layouts">' +
        ['Todos', 'Grátis', 'Premium'].map(function (f, i) { return '<button type="button" class="chip" data-filtro="' + f + '" aria-pressed="' + (i === 0) + '">' + f + '</button>'; }).join('') + '</div><p class="lay-frase" id="lay-frase" aria-live="polite"></p>' +
        '<div class="lay-grade">' + Object.keys(M.LAYOUTS).sort(function (a, b) { var o = { 'Básico': 0, 'Elaborado': 1, 'Premium': 2 }; return o[M.LAYOUTS[a].nivel] - o[M.LAYOUTS[b].nivel]; }).map(function (k) {
          var L = M.LAYOUTS[k], trava = L.premium && PLANO === 'gratuito';
          return '<button type="button" class="lay" role="radio" data-l="' + k + '" data-nivel="' + nomeNivel(L.nivel) + '" aria-checked="false" title="' + esc(L.frase || L.nome) + '" aria-label="Layout ' + L.nome + ', ' + (L.premium ? 'premium' : 'grátis') + (trava ? ', disponível no plano Essencial' : '') + '">' +
            (L.premium ? '<span class="cadeado' + (trava ? '' : ' livre') + '" aria-hidden="true">' + (trava ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' : '★') + '</span>' : '') +
            '<div class="mini"></div><b>' + L.nome + '</b></button>';
        }).join('') + '</div>';
      $('.lay-filtro', caixa).addEventListener('click', function (e) {
        var f = e.target.closest('[data-filtro]'); if (!f) return;
        $$('[data-filtro]', caixa).forEach(function (x) { x.setAttribute('aria-pressed', String(x === f)); });
        $$('.lay', caixa).forEach(function (l) { l.hidden = f.dataset.filtro !== 'Todos' && l.dataset.nivel !== f.dataset.filtro; });
      });
    }
    fraseLayout();
    $$('.lay', caixa).forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.l === M.layout(est.layout))); });
    $$('.lay .mini', caixa).forEach(function (m) { m.style.aspectRatio = fo.largura + ' / ' + fo.altura; });
    var d = Object.assign({}, est.dados);
    if (!MO.limpar(d.titulo)) d.titulo = 'Seu recado aqui';
    var minha = ++geracaoMinis, ks = Object.keys(M.LAYOUTS);
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i], m = marcaDa(k, est.par, est.cor);
      var r = await dadosPara(fo, k, m, d);
      if (minha !== geracaoMinis) return;
      mini($('.lay[data-l="' + k + '"] .mini', caixa), fo, r.d, m, r.dec);
    }
  }
  var mudouMinis = adiar(desenharLayouts, 450);
  function fraseLayout() {
    var L = M.LAYOUTS[M.layout(est.layout)], f = $('#lay-frase'); if (!f) return;
    f.innerHTML = '<b>' + esc(L.nome) + ':</b> ' + esc(L.frase || '') + (L.premium && PLANO === 'gratuito' ? ' <span class="opc">Premium: dá para ver a prévia; registrar e baixar é no plano Essencial.</span>' : '');
  }

  function desenharPares() {
    var html = '<button type="button" class="chip" role="radio" data-p="auto" aria-checked="' + (est.par === 'auto') + '">Automática</button>';
    if (marca.fontesMarca) html += '<button type="button" class="chip" role="radio" data-p="marca" aria-checked="' + (est.par === 'marca') + '">Da marca</button>';
    html += Object.keys(M.PARES).map(function (k) {
      var p = M.PARES[k];
      return '<button type="button" class="chip" role="radio" data-p="' + k + '" aria-checked="' + (est.par === k) + '" title="' + p.titulo + ' + ' + p.texto + '" style="font-family:\'' + p.titulo + '\',sans-serif;font-weight:700">' + p.nome + '</button>';
    }).join('');
    $('#pares').innerHTML = html;
  }

  var OPCOES = {
    posicao: [['', 'Automática'], ['topo', 'Topo'], ['centro', 'Centro'], ['base', 'Base']],
    alinhamento: [['', 'Automático'], ['esquerda', 'Esquerda'], ['centro', 'Centro'], ['direita', 'Direita']],
    girar: [['0', 'Horizontal'], ['1', 'Vertical']]
  };
  function desenharControles() {
    var L = M.LAYOUTS[M.layout(est.layout)];
    var girado = L.girar && (est.dados.girar == null ? !!L.giradoPadrao : !!est.dados.girar);
    /* Com o título na vertical, a posição não muda a composição: o controle sai para não parecer quebrado. */
    $('#ctl-posicao').hidden = !L.posicao || girado; $('#ctl-alinhamento').hidden = !L.posicao; $('#ctl-girar').hidden = !L.girar;
    $('#ctl-nota').textContent = !L.posicao ? 'O layout ' + L.nome + ' tem composição fixa' + (L.girar ? ': dá para escolher só a direção do título.' : '.') : girado ? 'Com o título na vertical, ele ocupa a altura da peça; a posição volta quando ele fica na horizontal.' : '';
    $$('#secao-texto [data-ctl]').forEach(function (g) {
      var k = g.getAttribute('data-ctl'), atual = k === 'girar' ? (est.dados.girar == null ? (L.giradoPadrao ? '1' : '0') : (est.dados.girar ? '1' : '0')) : (est.dados[k] || '');
      g.innerHTML = OPCOES[k].map(function (o) { return '<button type="button" class="chip" role="radio" data-v="' + o[0] + '" aria-checked="' + (o[0] === atual) + '">' + o[1] + '</button>'; }).join('');
    });
  }
  function ligarCriar() {
    $('.sub-abas').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sub]'); if (!b) return;
      $('.cartao.opcoes').dataset.sub = b.dataset.sub;
      $$('.sub-abas [data-sub]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    });
    $('#paletas').addEventListener('click', function (e) {
      var b = e.target.closest('.pal'); if (!b) return;
      var p = M.PALETAS.filter(function (x) { return x.id === b.dataset.p; })[0]; if (p) usarPaleta(p.principal, p.destaque);
    });
    $('#pal-sortear').addEventListener('click', function () {
      var l = M.PALETAS.filter(function (x) { return x.principal !== est.cor; }), p = l[Math.floor(Math.random() * l.length)];
      usarPaleta(p.principal, p.destaque);
    });
    $('#pal-trocar').addEventListener('click', function () {
      var a = est.cor || marca.cores.principal, b = est.corDest || M.paleta(marcaDa(est.layout, est.par, est.cor)).destaque;
      usarPaleta(b, a);
    });
    $('#secao-texto').addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]'), g = b && b.closest('[data-ctl]'); if (!g) return;
      var k = g.getAttribute('data-ctl');
      if (k === 'girar') est.dados.girar = b.dataset.v === '1'; else est.dados[k] = b.dataset.v;
      $$('[data-v]', g).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      if (k === 'girar') desenharControles();
      mudou(); mudouMinis();
    });
    $('#formatos').addEventListener('click', function (e) {
      var at = e.target.closest('[data-atalho]');
      if (at) { definirMarcados(at.dataset.atalho.split(',')); return; }
      var b = e.target.closest('[data-f]'); if (!b) return;
      var id = b.dataset.f, f = F.porId(id), sel = marcados(), tem = sel.indexOf(id) >= 0;
      if (f.email || (sel.length === 1 && F.porId(sel[0]).email)) { definirMarcados([id]); return; }  // e-mail é sempre sozinho
      if (tem && sel.length === 1) return;  // pelo menos um formato
      definirMarcados(tem ? sel.filter(function (x) { return x !== id; }) : sel.concat(id));
    });
    $('#layouts').addEventListener('click', function (e) {
      var b = e.target.closest('.lay'); if (!b) return;
      est.layout = b.dataset.l;
      $$('#layouts .lay').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      fraseLayout(); desenharControles();
      if (formatoAtual().campos.indexOf('imagem') >= 0) desenharFoto();
      mudou();
    });
    $('#pares').addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]'); if (!b) return;
      est.par = b.dataset.p;
      $$('#pares [data-p]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      mudou(); desenharLayouts();
    });
    $('#form-peca').addEventListener('submit', registrar);
    $('#editar').addEventListener('click', function () { $('#feito').hidden = true; var t = $('#f-titulo'); if (t) t.focus(); });
    $('#nova').addEventListener('click', function () { est.dados = { assunto: 'novidade' }; est.imagem = null; est.editando = null; $('#feito').hidden = true; montarCriar(); window.scrollTo(0, 0); });
  }

  /* Dados prontos para o desenho: foto recortada no quadro do layout. */
  async function dadosPara(fo, layoutId, m, dadosBase) {
    var d = Object.assign({}, dadosBase || est.dados, { imagem: est.imagem });
    /* Só entram na peça os campos que este formato pede (data e botão preenchidos num post
       não podem aparecer cortados numa miniatura de vídeo, onde nem há campo para apagá-los). */
    if (fo.campos) Object.keys(F.CAMPOS).forEach(function (k) { if (fo.campos.indexOf(k) < 0 && k !== 'link') delete d[k]; });
    if (fo.campos && fo.campos.indexOf('chamada') < 0) delete d.link;
    var dec = MO.decidir(fo, d, m, layoutId);
    if (est.imagem && dec.temFoto) Object.assign(d, await MD.fotos(fo, dec, est.imagem.src, est.imagem.ajuste, fo.email ? 2 : 1));
    return { d: d, dec: dec };
  }

  var geracao = 0;
  var alturaTela = 0;
  async function atualizarPrevia() {
    var fo = formatoAtual(), minha = ++geracao, m = marcaDa(est.layout, est.par, est.cor);
    var palco = $('#palco'), largura = Math.max(220, Math.min((palco.clientWidth || 360) - 36, 560));
    /* A prévia cabe na altura da tela (computador e tablet): fica fixa ao lado sem passar do quadro.
       Altura da primeira medida da tela, para a barra do navegador não mexer no tamanho. */
    var telaH = alturaTela || (alturaTela = window.innerHeight), lado = window.innerWidth > 760;
    var alturaMax = lado ? Math.max(240, telaH - 380) : Math.max(320, telaH - 230);
    var lista = fo.kit ? fo.kit.map(F.porId) : [fo];
    var feitos = [];
    for (var i = 0; i < lista.length; i++) feitos.push(await dadosPara(lista[i], est.layout, m));
    if (minha !== geracao) return;
    var novo = el('div', { class: 'palco-novo' }), destino = palco;
    palco = novo;
    if (fo.kit) {
      var g = el('div', { class: 'kit' + (lista.length === 2 ? ' dois' : '') });
      var linhas = Math.ceil(lista.length / 2), altLinha = alturaMax / linhas - 26;
      lista.forEach(function (f, i) {
        var fig = el('figure');
        var w = Math.min((largura - 14) / 2, f.altura ? altLinha * f.largura / f.altura : (largura - 14) / 2);
        fig.appendChild(quadro(MD.html(f, feitos[i].d, m, feitos[i].dec, { previa: !LIBERADO }), f.largura, f.altura, Math.max(90, w), f.nome));
        fig.appendChild(el('figcaption', null, f.nome + (f.rede && f.rede !== 'Instagram' ? ' · ' + f.rede : '')));
        g.appendChild(fig);
      });
      palco.appendChild(g);
    } else {
      var alvoW = fo.altura ? Math.min(largura, (alturaMax - 10) * fo.largura / fo.altura) : largura;
      palco.appendChild(quadro(MD.html(fo, feitos[0].d, m, feitos[0].dec, { previa: !LIBERADO }), fo.largura, fo.altura, alvoW, fo.nome));
    }
    var velhos = Array.prototype.slice.call(destino.children);
    if (velhos.length) novo.classList.add('chegando');
    destino.appendChild(novo);
    carregado(novo).then(function () {
      if (minha !== geracao) { if (novo.parentNode && destino.children.length > 1) novo.remove(); return; }
      velhos.forEach(function (v) { v.remove(); }); novo.classList.remove('chegando');
    });
    $('#legenda').textContent = fo.kit ? fo.descricao + ' Prévia ao vivo.' : (fo.rede ? fo.rede + ' · ' : '') + fo.nome + (fo.email ? ' · 600 px de largura' : ' · ' + fo.largura + ' × ' + fo.altura + ' px') + (fo.nota ? ' · ' + fo.nota : '');
    $('#porque').innerHTML = feitos[0].dec.porque.map(function (p) { return '<li><b>' + p.tema + ':</b> ' + esc(p.texto) + '</li>'; }).join('');
    mensagens(false);
  }
  /* Cada mudança ganha um número; a confirmação de "peça registrada" só some se algo mudou depois do registro
     (antes, uma mudança ainda na fila escondia a confirmação de quem digitava e registrava rápido). */
  var versao = 0, versaoRegistrada = -1;
  var mudouAdiado = adiar(function () { if (versao !== versaoRegistrada) $('#feito').hidden = true; atualizarPrevia(); atualizarEditores(); }, 160);
  function mudou() { versao++; mudouAdiado(); }

  function mensagens(mostrarErros) {
    var v = MO.validar(formatoAtual(), est.dados, marca);
    var html = '';
    $$('#form-peca .campo').forEach(function (c) { c.classList.remove('tem-erro'); });
    v.erros.forEach(function (e) {
      if (!mostrarErros && e.campo === 'titulo' && !MO.limpar(est.dados.titulo)) return;
      html += '<div class="msg erro">' + esc(e.texto) + '</div>';
      var c = $('#form-peca [data-campo="' + e.campo + '"]');
      if (c && mostrarErros) { c.classList.add('tem-erro'); if (c.closest('details')) c.closest('details').open = true; }
    });
    v.avisos.forEach(function (a) { html += '<div class="msg aviso">' + esc(a.texto) + '</div>'; });
    if (bloqueadoPremium()) html = '<div class="msg premium"><b>Layout premium, disponível no plano Essencial.</b> Veja a prévia à vontade.</div>' + html;
    $('#msgs').innerHTML = html;
    $('#pendencia').textContent = v.ok ? '' : (MO.limpar(est.dados.titulo) ? 'Resolva o que está em vermelho para registrar.' : 'Escreva o recado para registrar.');
    return v;
  }

  /* ---------- Registro (neste aparelho) ---------- */
  var CHAVE_PECAS = 'criou.pecas.v1';
  function lerPecas() {
    try {
      var l = JSON.parse(localStorage.getItem(CHAVE_PECAS)) || [];
      if (!Array.isArray(l)) return [];
      return l.filter(function (p) { return p && typeof p === 'object' && /^[A-Z0-9-]{4,20}$/i.test(String(p.codigo || '')); }).slice(0, 200).map(function (p) {
        var d = {}; Object.keys(p.dados || {}).forEach(function (k) { var v = p.dados[k]; if (/^[a-z0-9_]{1,30}$/i.test(k) && (typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number')) d[k] = typeof v === 'string' ? v.slice(0, 600) : v; });
        return { codigo: String(p.codigo), formato: F.porId(p.formato) ? String(p.formato).slice(0, 200) : 'kit:post-retrato,story', estilo: M.layout(p.estilo), par: M.PARES && M.PARES[p.par] ? p.par : 'auto', cor: M.corValida(p.cor), corDest: M.corValida(p.corDest), dados: d, edicoes: Math.max(0, parseInt(p.edicoes, 10) || 0), quando: isNaN(Date.parse(p.quando)) ? new Date().toISOString() : p.quando, comFoto: !!p.comFoto };
      });
    } catch (e) { return []; }
  }
  function codigoNovo() { return 'CR-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 4).toUpperCase(); }
  function hoje() { return new Date().toISOString().slice(0, 10); }
  function usoHoje() { try { var u = JSON.parse(localStorage.getItem('criou.uso') || '{}'); return u.dia === hoje() ? u.n : 0; } catch (e) { return 0; } }
  function contarUso() { try { localStorage.setItem('criou.uso', JSON.stringify({ dia: hoje(), n: usoHoje() + 1 })); } catch (e) { } }
  function bloqueadoPremium() { return PLANO === 'gratuito' && M.LAYOUTS[M.layout(est.layout)].premium; }
  function infoPlano() {
    var i = $('#plano-info'); if (!i) return;
    i.textContent = !CADASTRADO ? 'Criar e salvar é livre. Para baixar, você vai precisar do cadastro gratuito, que abre em breve.'
      : PLANO === 'gratuito' ? 'Plano gratuito: ' + usoHoje() + ' de ' + LIMITE_DIA + ' peças hoje. Layouts premium no Essencial.' : 'Plano Essencial: sem limite no uso normal.';
  }
  function registrar(e) {
    e.preventDefault();
    var v = mensagens(true);
    if (!v.ok) { if (window.matchMedia('(max-width:760px)').matches) aba('info'); var p = $('#form-peca .tem-erro input, #form-peca .tem-erro textarea, #form-peca .tem-erro .fmt-campo'); if (p) setTimeout(function () { p.focus(); }, 300); return; }
    if (bloqueadoPremium()) { $('#msgs').insertAdjacentHTML('afterbegin', '<div class="msg premium"><b>Layout premium.</b> Ele faz parte do plano Essencial. Você pode ver a prévia à vontade; para registrar no gratuito, escolha um layout básico ou elaborado.</div>'); $('#layouts').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    /* Editar uma peça é livre até EDICOES_LIVRES vezes; depois disso conta como peça nova no gratuito. */
    var antiga = est.editando ? lerPecas().filter(function (x) { return x.codigo === est.editando; })[0] : null;
    var edicoes = antiga ? (antiga.edicoes || 0) + 1 : 0, contaComoNova = !antiga || edicoes > EDICOES_LIVRES;
    if (PLANO === 'gratuito' && contaComoNova && usoHoje() >= LIMITE_DIA) { $('#msgs').insertAdjacentHTML('afterbegin', '<div class="msg premium"><b>Limite de hoje.</b> O plano gratuito cria até ' + LIMITE_DIA + ' peças por dia. Amanhã libera de novo, ou conheça o Essencial, sem limite no uso normal.</div>'); return; }
    var fo = formatoAtual(), lista = lerPecas(), codigo = est.editando || codigoNovo();
    if (contaComoNova) { contarUso(); edicoes = 0; }
    infoPlano();
    var reg = { codigo: codigo, edicoes: edicoes, formato: fo.id, estilo: est.layout, par: est.par, cor: est.cor, corDest: est.corDest || '', dados: est.dados, quando: new Date().toISOString(), comFoto: !!est.imagem };
    lista = lista.filter(function (x) { return x.codigo !== codigo; }); lista.unshift(reg);
    try { localStorage.setItem(CHAVE_PECAS, JSON.stringify(lista.slice(0, 200))); } catch (err) { aviso('Sem espaço neste aparelho para guardar a peça. Apague peças antigas em "Minhas peças".'); return; }
    est.editando = codigo; versaoRegistrada = versao;
    $('#codigo').textContent = codigo;
    $('#feito-sub').textContent = fo.kit ? 'Campanha registrada.' : 'Peça registrada.';
    montarDownloads(fo, codigo);
    $('#feito').hidden = false; $('#feito').focus();
    $('#feito').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Downloads ---------- */
  function nomeArquivo(fo, codigo, m) {
    var rede = fo.rede && !fo.extra && !fo.kit ? fo.rede + '-' : '';
    return (m.nome + '-' + rede + fo.nome + '-' + codigo).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  }
  function montarDownloads(fo, codigo) {
    var caixa = $('#baixar'); caixa.innerHTML = '';
    if (!CADASTRADO) {
      caixa.innerHTML = '<p class="ajuda"><b>Para baixar, falta o cadastro gratuito</b>, que abre em breve. Sua peça já está salva em "Minhas peças". No plano gratuito, o download sai em PNG com uma marca d\'água discreta; no Essencial, em PNG, JPG, PDF e PowerPoint, sem marca.</p>';
      return;
    }
    var lista = fo.kit ? fo.kit.map(F.porId) : [fo];
    if (!LIBERADO) caixa.insertAdjacentHTML('beforeend', '<p class="ajuda">Plano gratuito: PNG com uma marca d\'água discreta. Sem marca e em JPG, PDF e PowerPoint no Essencial.</p>');
    lista.forEach(function (f) {
      var linha = el('div', { class: 'exportar', role: 'group', 'aria-label': 'Baixar ' + f.nome });
      linha.insertAdjacentHTML('beforeend', '<span class="rot" style="width:100%;margin:6px 0 0">' + f.nome + (f.rede && fo.kit && f.rede !== 'Instagram' ? ' · ' + f.rede : '') + '</span>');
      (LIBERADO ? f.exportar : ['png']).forEach(function (t) {
        var b = el('button', { type: 'button', class: 'btn-mini' }, t.toUpperCase() + ' ↓');
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
      var m = marcaDa(est.layout, est.par, est.cor);
      window.CriouFontesAtivas = [m.fontes.titulo, m.fontes.texto];
      var r = await dadosPara(fo, est.layout, m);
      var html = MD.html(fo, r.d, m, r.dec, { previa: !LIBERADO });
      var nome = nomeArquivo(fo, codigo, m);
      var info = { largura: fo.largura, escala: fo.email ? 2 : 1, dpi: fo.dpi, codigo: codigo, fonte: m.fontes.texto, empresa: m.nome, autor: m.nome };
      if (tipo === 'html') await X.arquivo(new Blob([html], { type: 'text/html' }), nome + '.html');
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
      var L = M.LAYOUTS[M.layout(p.estilo)];
      return '<div class="cartao peca-item"><div><b>' + esc(MO.semMarcas(p.dados.titulo || '')) + '</b><small>' + esc(p.codigo) + ' · ' + (f.rede && !f.kit && !f.extra ? f.rede + ' · ' : '') + f.nome + ' · ' + L.nome + ' · ' + new Date(p.quando).toLocaleDateString('pt-BR') + (p.comFoto ? ' · tinha foto' : '') + '</small></div><button class="btn sec" type="button" data-abrir="' + esc(p.codigo) + '">Abrir</button></div>';
    }).join('');
  }
  $('#lista-pecas').addEventListener('click', function (e) {
    if (e.target.closest('[data-ir2]')) { ir('criar'); return; }
    var b = e.target.closest('[data-abrir]'); if (!b) return;
    var p = lerPecas().filter(function (x) { return x.codigo === b.dataset.abrir; })[0]; if (!p) return;
    est.formato = F.porId(p.formato) ? p.formato : 'kit:post-retrato,story'; est.layout = M.layout(p.estilo); est.par = p.par || 'auto'; est.cor = p.cor || ''; est.corDest = p.corDest || '';
    est.dados = clone(p.dados); est.imagem = null; est.editando = p.codigo;
    ir('criar');
  });

  /* ---------- Celular: abas Informações · Opções · Prévia ---------- */
  function aba(n) {
    $('#vista-criar').setAttribute('data-aba', n);
    $$('.abas [data-aba]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-aba') === n)); });
    if (n === 'criacao') atualizarPrevia();
    if (n === 'opcoes') desenharLayouts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('.abas [data-aba]').forEach(function (b) { b.addEventListener('click', function () { aba(b.getAttribute('data-aba')); }); });
  $$('[data-ir-aba]').forEach(function (b) { b.addEventListener('click', function () { aba(b.getAttribute('data-ir-aba')); }); });
  $$('.ir-form').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); if (window.matchMedia('(max-width:760px)').matches) aba('info'); else $('#form-peca').scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });

  /* ---------- Início ---------- */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!$('#vista-criar').hidden) { desenharLayouts(); atualizarPrevia(); } });
  ir((location.hash || '').slice(1) || 'criar');
  /* A coluna da prévia (com o registro e os downloads) só fica fixa na rolagem se couber na tela;
     se for mais alta, rola junto, para nenhum botão ficar escondido embaixo dela. */
  function ajustarFixa() {
    var c = $('.zona-criacao .previa-col'); if (!c) return;
    c.classList.toggle('fixa', window.innerWidth > 760 && c.offsetHeight < (alturaTela || window.innerHeight) - 70);
  }
  if (window.ResizeObserver) new ResizeObserver(ajustarFixa).observe($('.zona-criacao .previa-col'));
  window.addEventListener('resize', ajustarFixa);
  (function () {
    var a = $('#aviso-topo'), x = $('#aviso-x'); if (!a || !x) return;
    try { if (localStorage.getItem('criou.aviso.fechado') === '1') a.hidden = true; } catch (e) { }
    x.addEventListener('click', function () { a.hidden = true; try { localStorage.setItem('criou.aviso.fechado', '1'); } catch (e) { } });
  })();
  window.addEventListener('hashchange', function () { var v = (location.hash || '').slice(1); if (/^[a-z]+$/.test(v) && $('#vista-' + v) && $('#vista-' + v).hidden) ir(v); });
  /* Só redesenha se a LARGURA mudar. No celular e no tablet, rolar a página esconde a barra do navegador
     e muda só a altura: antes isso redesenhava tudo a cada rolagem (prévia piscando e "deslizando"). */
  var larguraAntes = window.innerWidth;
  window.addEventListener('resize', adiar(function () {
    if (Math.abs(window.innerWidth - larguraAntes) < 40) return;
    larguraAntes = window.innerWidth; alturaTela = 0;
    if (!$('#vista-criar').hidden) { atualizarPrevia(); desenharLayouts(); }
  }, 300));
})();
