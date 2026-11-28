/* ============================================================
   Barra de formatação · negrito, itálico e realce arredondado
   Trabalha sobre o campo de texto com marcas simples, que a prévia
   já mostra formatadas:  **negrito**   *itálico*   ==(cor)realce==
   Atalhos: Ctrl/Cmd + B (negrito) e Ctrl/Cmd + I (itálico).
   ============================================================ */
(function (raiz) {
  'use strict';

  function avisar(campo) { campo.dispatchEvent(new Event('input', { bubbles: true })); }

  function envolver(campo, antes, depois, exemplo) {
    var ini = campo.selectionStart, fim = campo.selectionEnd;
    var v = campo.value;
    var sel = v.slice(ini, fim);
    // Mantém espaços fora das marcas (" texto " → " **texto** ").
    var esq = sel.match(/^\s*/)[0], dir = sel.match(/\s*$/)[0];
    var miolo = sel.slice(esq.length, sel.length - dir.length);
    // Já formatado com a mesma marca: remove.
    if (miolo && miolo.indexOf(antes) === 0 && miolo.slice(-depois.length) === depois && miolo.length > antes.length + depois.length) {
      var limpo = miolo.slice(antes.length, miolo.length - depois.length);
      campo.value = v.slice(0, ini) + esq + limpo + dir + v.slice(fim);
      campo.setSelectionRange(ini + esq.length, ini + esq.length + limpo.length);
      avisar(campo); return;
    }
    var texto = miolo || exemplo;
    campo.value = v.slice(0, ini) + esq + antes + texto + depois + dir + v.slice(fim);
    var a = ini + esq.length + antes.length;
    campo.focus();
    campo.setSelectionRange(a, a + texto.length);
    avisar(campo);
  }

  /* ---------- Parágrafo em box: >>(cor) no começo do parágrafo ---------- */
  var BOX = /^>>(?:\(([a-z0-9-]+)\))?[ \t]*/i;
  function paragrafos(v, ini, fim) {
    // devolve [{a, b}] dos parágrafos (separados por linha em branco) tocados pela seleção
    var lista = [], re = /\n[ \t]*\n/g, a = 0, m;
    var cortes = [];
    while ((m = re.exec(v))) cortes.push([m.index, re.lastIndex]);
    cortes.push([v.length, v.length]);
    cortes.forEach(function (c) {
      var b = c[0];
      if (b >= ini && a <= Math.max(fim, ini) && v.slice(a, b).trim()) lista.push({ a: a, b: b });
      a = c[1];
    });
    return lista;
  }
  /* cor: id do realce; null alterna (tira se já for box, senão usa a cor padrão). */
  function aplicarBox(campo, cor, padrao) {
    var v = campo.value, ini = campo.selectionStart, fim = campo.selectionEnd;
    var ps = paragrafos(v, ini, fim);
    if (!ps.length) return false;
    var todosBox = ps.every(function (p) { return BOX.test(v.slice(p.a, p.b).replace(/^\s+/, '')); });
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i];
      var trecho = v.slice(p.a, p.b);
      var esp = trecho.match(/^\s*/)[0];
      var miolo = trecho.slice(esp.length).replace(BOX, '');
      var novo = (cor == null && todosBox) ? miolo : '>>(' + (cor || padrao) + ') ' + miolo;
      v = v.slice(0, p.a) + esp + novo + v.slice(p.b);
    }
    campo.value = v;
    var fimSel = paragrafos(v, ps[0].a, ps[0].a)[0];
    campo.focus();
    if (fimSel) campo.setSelectionRange(fimSel.a, ps.length > 1 ? paragrafos(v, ps[0].a, v.length).slice(0, ps.length).pop().b : fimSel.b);
    avisar(campo);
    return true;
  }
  /* A seleção cobre um parágrafo inteiro (ou mais)? Então o realce vira box. */
  function cobreParagrafo(campo) {
    var v = campo.value, ini = campo.selectionStart, fim = campo.selectionEnd;
    if (fim - ini < 2) return false;
    var ps = paragrafos(v, ini, fim);
    if (!ps.length) return false;
    var primeiro = ps[0], ultimo = ps[ps.length - 1];
    var inicioTexto = primeiro.a + v.slice(primeiro.a, primeiro.b).search(/\S/);
    var semMarca = v.slice(inicioTexto, primeiro.b).match(BOX);
    if (semMarca) inicioTexto += semMarca[0].length;
    var fimTexto = ultimo.a + v.slice(ultimo.a, ultimo.b).replace(/\s+$/, '').length;
    return ini <= inicioTexto && fim >= fimTexto;
  }

  function limpar(campo) {
    var ini = campo.selectionStart, fim = campo.selectionEnd;
    if (ini === fim) { ini = 0; fim = campo.value.length; }
    var trecho = campo.value.slice(ini, fim)
      .replace(/(^|\n)[ \t]*>>(?:\([a-z0-9-]+\))?[ \t]*/gi, '$1')
      .replace(/==\([a-z0-9-]+\)([\s\S]+?)==/gi, '$1').replace(/==([\s\S]+?)==/g, '$1')
      .replace(/\*\*([\s\S]+?)\*\*/g, '$1').replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)\*(?!\*)/g, '$1$2');
    campo.value = campo.value.slice(0, ini) + trecho + campo.value.slice(fim);
    campo.setSelectionRange(ini, ini + trecho.length);
    avisar(campo);
  }

  function botao(texto, titulo, classe, acao) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fmt-btn ' + (classe || '');
    b.title = titulo;
    b.setAttribute('aria-label', titulo);
    b.innerHTML = texto;
    // mousedown evita que o campo perca a seleção antes do clique.
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', acao);
    return b;
  }

  /* realces: [{ id, nome, fundo, texto }] já com as cores resolvidas.
     modo 'completo': negrito, itálico, realce e box (texto corrido)
     modo 'simples': só negrito e itálico (ex.: subtítulo)
     modo 'realce': só o realce */
  function barra(campo, realces, modo) {
    var completo = modo !== 'realce';
    var comRealce = modo !== 'simples';
    var comBox = modo === 'completo' && campo.tagName === 'TEXTAREA';
    var padrao = (realces.filter(function (r) { return r.id === 'verde'; })[0] || realces[0] || {}).id;
    var caixa = document.createElement('div');
    caixa.className = 'fmt-barra';
    caixa.setAttribute('role', 'toolbar');
    caixa.setAttribute('aria-label', 'Formatação do texto');
    var sep = document.createElement('span'); sep.className = 'fmt-sep'; sep.setAttribute('aria-hidden', 'true');
    if (completo) {
      caixa.appendChild(botao('<b>B</b>', 'Negrito (Ctrl+B)', '', function () { envolver(campo, '**', '**', 'texto em negrito'); }));
      caixa.appendChild(botao('<i>I</i>', 'Itálico (Ctrl+I)', '', function () { envolver(campo, '*', '*', 'texto em itálico'); }));
      caixa.appendChild(sep);
    }
    if (comRealce) {
      var rot = document.createElement('span'); rot.className = 'fmt-rot'; rot.textContent = 'Realce';
      caixa.appendChild(rot);
      realces.forEach(function (r) {
        var b = botao('<span>Aa</span>', 'Realce ' + r.nome + (comBox ? ' (parágrafo inteiro selecionado vira box)' : ''), 'fmt-realce', function () {
          if (comBox && cobreParagrafo(campo)) aplicarBox(campo, r.id, padrao);
          else envolver(campo, '==(' + r.id + ')', '==', 'destaque');
        });
        b.style.background = r.fundo;
        b.style.color = r.texto;
        caixa.appendChild(b);
      });
    }
    if (comBox) {
      caixa.appendChild(botao('<span class="fmt-box-ico" aria-hidden="true"></span>Box', 'Parágrafo em box: põe ou tira o box do parágrafo onde está o cursor', 'fmt-box', function () { aplicarBox(campo, null, padrao); }));
    }
    var sep2 = sep.cloneNode(); caixa.appendChild(sep2);
    caixa.appendChild(botao('Limpar', 'Tirar a formatação do trecho selecionado', 'fmt-limpar', function () { limpar(campo); }));

    campo.addEventListener('keydown', function (e) {
      if (!completo || !(e.ctrlKey || e.metaKey) || e.altKey) return;
      var k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); envolver(campo, '**', '**', 'texto em negrito'); }
      if (k === 'i') { e.preventDefault(); envolver(campo, '*', '*', 'texto em itálico'); }
    });
    return caixa;
  }


  /* ============================================================
     Editor visual do título: o destaque aparece como na peça, sem códigos.
     Por baixo continua gravando as mesmas marcas (==(estilo-cor)texto==),
     então a prévia, a exportação e as peças antigas seguem funcionando.
     Clicar dentro de um destaque e escolher outro estilo ou cor muda na hora.
     ============================================================ */
  var ESTILOS_R = [['auto', 'Automático', 'Do jeito que o layout desenha'], ['cor', 'Cor', 'Só a cor das letras'], ['box', 'Box', 'Fundo colorido atrás do trecho'], ['faixa', 'Marca-texto', 'Faixa colorida embaixo do trecho']];
  function lerId(id) { var m = /^(cor|box|faixa)-([a-z]+)$/.exec(id || ''); return m ? { e: m[1], c: m[2] } : { e: 'auto', c: id || 'destaque' }; }
  function idDe(e, c) { return e === 'auto' ? c : e + '-' + c; }
  function escH(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function editorRealce(inp, realces) {
    var ed = document.createElement('div');
    ed.className = 'fmt-campo';
    ed.contentEditable = 'true';
    ed.id = inp.id;
    ed.setAttribute('role', 'textbox');
    ed.setAttribute('aria-multiline', 'false');
    ed.setAttribute('spellcheck', 'true');
    ed.dataset.placeholder = inp.getAttribute('placeholder') || '';
    if (inp.getAttribute('aria-describedby')) ed.setAttribute('aria-describedby', inp.getAttribute('aria-describedby'));
    var cores = {}, atual = { e: 'auto', c: 'destaque' }, guardado = null;
    function mapa(lista) { cores = {}; lista.forEach(function (r) { cores[r.id] = r; }); }
    mapa(realces);

    function estilizar(mk) {
      var r = lerId(mk.dataset.r), k = cores[r.c] || cores.destaque || { fundo: '#FFE500', texto: '#111111' };
      var C = raiz.CriouMarca && raiz.CriouMarca.cor;
      var legivel = C ? C.garantir(k.fundo, '#ffffff', 3) : k.fundo;
      mk.title = 'Destaque: ' + ESTILOS_R.filter(function (x) { return x[0] === r.e; })[0][1] + (r.e === 'auto' ? '' : ' · ' + (k.nome || r.c));
      mk.style.cssText = 'color:inherit;padding:0 .1em;border-radius:.2em;box-decoration-break:clone;-webkit-box-decoration-break:clone;' +
        (r.e === 'box' ? 'background:' + k.fundo + ';color:' + k.texto :
         r.e === 'cor' ? 'background:transparent;color:' + legivel + ';font-weight:700' :
         r.e === 'faixa' ? 'background:linear-gradient(transparent 55%,' + k.fundo + ' 55%)' :
         'background:transparent;border-bottom:2px dashed ' + legivel + ';border-radius:0');
    }
    function paraHtml(v) {
      return escH(v || '')
        .replace(/==\(([a-z0-9-]+)\)([\s\S]+?)==/gi, '<mark data-r="$1">$2</mark>')
        .replace(/==([\s\S]+?)==/g, '<mark data-r="destaque">$1</mark>')
        .replace(/\*\*([\s\S]+?)\*\*/g, '<b>$1</b>')
        .replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)\*(?!\*)/g, '$1<i>$2</i>');
    }
    function envolto(a, dentro, b) { var m = dentro.match(/^(\s*)([\s\S]*?)(\s*)$/); return m[2] ? m[1] + a + m[2] + b + m[3] : dentro; }
    function paraTexto(no) {
      var out = '';
      no.childNodes.forEach(function (n) {
        if (n.nodeType === 3) { out += n.nodeValue.replace(/ /g, ' '); return; }
        if (n.nodeType !== 1) return;
        var t = n.tagName, d = paraTexto(n);
        if (t === 'BR') out += ' ';
        else if (t === 'MARK') out += envolto('==(' + (/^[a-z0-9-]+$/i.test(n.dataset.r || '') ? n.dataset.r : 'destaque') + ')', d, '==');
        else if (t === 'B' || t === 'STRONG') out += envolto('**', d, '**');
        else if (t === 'I' || t === 'EM') out += envolto('*', d, '*');
        else out += d;
      });
      return out;
    }
    Object.defineProperty(ed, 'value', {
      get: function () { return paraTexto(ed).replace(/[\r\n]+/g, ' '); },
      set: function (v) { ed.innerHTML = paraHtml(v); ed.querySelectorAll('mark').forEach(estilizar); }
    });
    ed.value = inp.value;

    function avisar() { ed.dispatchEvent(new Event('input', { bubbles: true })); }
    function dentro(n) { return n && (n === ed || ed.contains(n)); }
    function intervalo() {
      var s = raiz.getSelection();
      if (s.rangeCount && dentro(s.getRangeAt(0).commonAncestorContainer)) return s.getRangeAt(0);
      return guardado;
    }
    function markEm(rg) {
      if (!rg) return null;
      var n = rg.startContainer; n = n.nodeType === 3 ? n.parentNode : n;
      var mk = n.closest ? n.closest('mark') : null;
      if (mk && dentro(mk)) return mk;
      if (rg.startContainer === rg.endContainer && rg.startContainer.nodeType === 1) { var f = rg.startContainer.childNodes[rg.startOffset]; if (f && f.tagName === 'MARK' && rg.endOffset === rg.startOffset + 1) return f; }
      return null;
    }
    function desembrulhar(mk) { var pai = mk.parentNode; while (mk.firstChild) pai.insertBefore(mk.firstChild, mk); pai.removeChild(mk); pai.normalize(); }
    /* Deixa o cursor no fim do destaque (sem seleção azul por cima), para o estilo aparecer no campo. */
    function selecionar(no) {
      var s = raiz.getSelection(), r = document.createRange(), t = no.lastChild;
      while (t && t.nodeType === 1 && t.lastChild) t = t.lastChild;
      if (t && t.nodeType === 3) r.setStart(t, t.length); else r.selectNodeContents(no);
      r.collapse(false); s.removeAllRanges(); s.addRange(r); guardado = r.cloneRange();
    }

    var dica = document.createElement('p'); dica.className = 'fmt-dica'; dica.setAttribute('aria-live', 'polite');
    function aplicar(e, c) {
      atual = { e: e, c: c };
      var rg = intervalo(), mk = markEm(rg);
      if (mk) { mk.dataset.r = idDe(e, c); estilizar(mk); selecionar(mk); avisar(); estado(); return; }
      if (!rg || rg.collapsed || !rg.toString().trim()) { dica.textContent = 'Selecione uma ou mais palavras do título e escolha como destacar.'; estado(); return; }
      ed.focus();
      var txt = rg.toString(), esq = txt.length - txt.replace(/^\s+/, '').length, dir = txt.length - txt.replace(/\s+$/, '').length;
      if (esq && rg.startContainer.nodeType === 3) rg.setStart(rg.startContainer, Math.min(rg.startOffset + esq, rg.startContainer.length));
      if (dir && rg.endContainer.nodeType === 3) rg.setEnd(rg.endContainer, Math.max(rg.endOffset - dir, 0));
      var frag = rg.extractContents();
      frag.querySelectorAll('mark').forEach(desembrulhar);
      var novo = document.createElement('mark'); novo.dataset.r = idDe(e, c); novo.appendChild(frag);
      rg.insertNode(novo); estilizar(novo);
      ed.querySelectorAll('mark').forEach(function (m) { if (!m.textContent) m.remove(); });
      dica.textContent = 'Para mudar, toque dentro do destaque e escolha outro estilo ou cor.';
      selecionar(novo); avisar(); estado();
    }
    function tirar() {
      var rg = intervalo(), mk = markEm(rg);
      if (mk) desembrulhar(mk);
      else if (rg) ed.querySelectorAll('mark').forEach(function (m) { if (rg.intersectsNode(m)) desembrulhar(m); });
      dica.textContent = ''; avisar(); estado();
    }

    var barraEl = document.createElement('div');
    barraEl.className = 'fmt-barra fmt-visual';
    barraEl.setAttribute('role', 'toolbar');
    barraEl.setAttribute('aria-label', 'Destaque do título');
    function bt(html, titulo, classe, acao) {
      var b = botao(html, titulo, classe, acao);
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); });
      return b;
    }
    /* Recolhida até a pessoa selecionar uma palavra: menos coisa na tela para quem é leigo. */
    var dicaR = document.createElement('span'); dicaR.className = 'fmt-dica-r'; dicaR.innerHTML = '<b>Destacar:</b> selecione uma palavra do título';
    barraEl.appendChild(dicaR);
    var rot = document.createElement('span'); rot.className = 'fmt-rot'; rot.textContent = 'Destaque';
    barraEl.appendChild(rot);
    var grupoE = document.createElement('div'); grupoE.className = 'fmt-grupo'; grupoE.setAttribute('role', 'group'); grupoE.setAttribute('aria-label', 'Estilo do destaque');
    ESTILOS_R.forEach(function (x) {
      var b = bt('<span class="fmt-amostra fmt-a-' + x[0] + '">Aa</span>' + x[1], x[1] + ': ' + x[2], 'fmt-estilo', function () { aplicar(x[0], x[0] === 'auto' ? atual.c : atual.c); });
      b.dataset.e = x[0]; grupoE.appendChild(b);
    });
    barraEl.appendChild(grupoE);
    var grupoC = document.createElement('div'); grupoC.className = 'fmt-grupo fmt-cores'; grupoC.setAttribute('role', 'group'); grupoC.setAttribute('aria-label', 'Cor do destaque');
    barraEl.appendChild(grupoC);
    function desenharCores() {
      grupoC.innerHTML = '';
      Object.keys(cores).forEach(function (id) {
        var k = cores[id];
        var b = bt('', 'Cor ' + (k.nome || id), 'fmt-cor', function () { aplicar(atual.e === 'auto' ? 'box' : atual.e, id); });
        b.dataset.c = id; b.style.background = k.fundo; grupoC.appendChild(b);
      });
    }
    desenharCores();
    barraEl.appendChild(bt('Tirar', 'Tirar o destaque do trecho', 'fmt-limpar', tirar));

    function estado() {
      var mk = markEm(intervalo()), r = mk ? lerId(mk.dataset.r) : atual;
      if (mk) atual = { e: r.e, c: r.c };
      barraEl.querySelectorAll('.fmt-estilo').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.e === r.e)); });
      barraEl.querySelectorAll('.fmt-cor').forEach(function (b) { b.setAttribute('aria-pressed', String(r.e !== 'auto' && b.dataset.c === r.c)); });
      barraEl.classList.toggle('no-destaque', !!mk);
      var rg = intervalo(), sel = rg && !rg.collapsed && rg.toString().trim();
      barraEl.classList.toggle('recolhida', !(mk || sel));
    }
    document.addEventListener('selectionchange', function () {
      if (!document.body.contains(ed)) return;
      var s = raiz.getSelection();
      if (s.rangeCount && dentro(s.getRangeAt(0).commonAncestorContainer)) { guardado = s.getRangeAt(0).cloneRange(); estado(); }
    });
    ed.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
    ed.addEventListener('paste', function (e) {
      e.preventDefault();
      var t = (e.clipboardData || raiz.clipboardData).getData('text/plain').replace(/\s+/g, ' ');
      document.execCommand('insertText', false, t);
    });
    ed.addEventListener('input', function () {
      if (!ed.textContent) ed.innerHTML = '';
      ed.querySelectorAll('font,span:not([class])').forEach(function (x) { if (x.tagName !== 'MARK') desembrulhar(x); });
      ed.querySelectorAll('mark').forEach(function (m) { if (!m.style.cssText) estilizar(m); });
    });
    estado();

    var raizEl = document.createElement('div'); raizEl.className = 'fmt-editor';
    raizEl.appendChild(ed); raizEl.appendChild(barraEl); raizEl.appendChild(dica);
    return {
      raiz: raizEl, campo: ed,
      atualizar: function (lista) { mapa(lista); desenharCores(); ed.querySelectorAll('mark').forEach(estilizar); estado(); }
    };
  }

  raiz.CriouFormatacao = { barra: barra, editorRealce: editorRealce };
})(window);
