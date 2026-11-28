/* ============================================================
   Criou · Minha marca
   A marca de cada cliente: cores, fontes, logo, forma, rodapé e
   regras de linguagem. Enquanto o cadastro não abre, fica guardada
   neste aparelho (localStorage). Tudo o que as peças usam sai daqui.
   ============================================================ */
(function (raiz) {
  'use strict';

  var CHAVE = 'criou.marca.v1';

  /* ---------- Cores ---------- */
  function hexRgb(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    if (isNaN(n) || h.length !== 6) return [0, 0, 0];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbHex(r) { return '#' + r.map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }).join(''); }
  function mix(a, b, t) { var x = hexRgb(a), y = hexRgb(b); return rgbHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function lum(h) {
    return hexRgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function contraste(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  /* Texto que lê bem sobre um fundo: branco ou a cor escura da marca. */
  function sobre(fundo, escuro) { return contraste(fundo, '#ffffff') >= contraste(fundo, escuro || '#111111') ? '#ffffff' : (escuro || '#111111'); }
  /* Escurece (ou clareia) até chegar no contraste pedido. */
  function garantir(cor, fundo, alvo) {
    var c = cor, passos = 0, clarear = lum(fundo) < 0.35;
    while (contraste(c, fundo) < alvo && passos < 30) { c = mix(c, clarear ? '#ffffff' : '#000000', 0.08); passos++; }
    return c;
  }
  function girar(h, graus) {
    var r = hexRgb(h).map(function (v) { return v / 255; });
    var max = Math.max.apply(null, r), min = Math.min.apply(null, r), l = (max + min) / 2, s = 0, hh = 0, d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      hh = max === r[0] ? (r[1] - r[2]) / d + (r[1] < r[2] ? 6 : 0) : max === r[1] ? (r[2] - r[0]) / d + 2 : (r[0] - r[1]) / d + 4;
      hh /= 6;
    }
    hh = (hh + graus / 360) % 1; if (hh < 0) hh += 1;
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    if (!s) return rgbHex([l * 255, l * 255, l * 255]);
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return rgbHex([f(p, q, hh + 1 / 3) * 255, f(p, q, hh) * 255, f(p, q, hh - 1 / 3) * 255]);
  }

  /* ---------- Fontes (Google Fonts, pesos válidos por família) ---------- */
  var FONTES = {
    'Inter': { pesos: '400;500;600;700;800;900', tipo: 'Sem serifa neutra' },
    'Montserrat': { pesos: '400;500;600;700;800;900', tipo: 'Sem serifa geométrica' },
    'Poppins': { pesos: '400;500;600;700;800;900', tipo: 'Sem serifa redonda' },
    'Archivo': { pesos: '400;500;600;700;800;900', tipo: 'Sem serifa firme' },
    'Figtree': { pesos: '400;500;600;700;800;900', tipo: 'Sem serifa amigável' },
    'Space Grotesk': { pesos: '400;500;600;700', tipo: 'Sem serifa técnica' },
    'Bricolage Grotesque': { pesos: '400;500;600;700;800', tipo: 'Sem serifa com personalidade' },
    'Unbounded': { pesos: '400;500;600;700;800;900', tipo: 'Larga e expressiva' },
    'Nunito': { pesos: '400;600;700;800;900', tipo: 'Arredondada' },
    'Fredoka': { pesos: '400;500;600;700', tipo: 'Arredondada divertida' },
    'Playfair Display': { pesos: '400;600;700;800', ital: true, tipo: 'Serifa elegante' },
    'DM Serif Display': { pesos: '400', ital: true, tipo: 'Serifa de destaque' },
    'Anton': { pesos: '400', tipo: 'Condensada de impacto' },
    'Oswald': { pesos: '400;500;600;700', tipo: 'Condensada firme' }
  };
  /* Peso mais próximo que a família tem de verdade (sem negrito falso). */
  function peso(f, desejado) { var d = FONTES[f]; if (!d) return desejado; var ps = d.pesos.split(';').map(Number); return ps.reduce(function (a, b) { return Math.abs(b - desejado) < Math.abs(a - desejado) ? b : a; }, ps[0]); }
  function urlFontes(lista) {
    var vistas = {};
    var partes = lista.filter(function (f) { if (!FONTES[f] || vistas[f]) return false; vistas[f] = 1; return true; }).map(function (f) {
      var d = FONTES[f], nome = 'family=' + f.replace(/ /g, '+');
      if (d.ital) {
        var p = d.pesos.split(';');
        return nome + ':ital,wght@' + p.map(function (w) { return '0,' + w; }).concat(p.map(function (w) { return '1,' + w; })).join(';');
      }
      return nome + ':wght@' + d.pesos;
    });
    return 'https://fonts.googleapis.com/css2?' + partes.join('&') + '&display=swap';
  }
  function serifada(f) { return /Playfair|Serif/.test(f); }
  function pilha(f) { return "'" + f + "', " + (serifada(f) ? "Georgia, 'Times New Roman', serif" : 'Arial, Helvetica, sans-serif'); }

  /* ---------- Formas ---------- */
  var FORMAS = {
    reta: { nome: 'Reta', raio: function () { return [0, 0, 0, 0]; } },
    suave: { nome: 'Cantos suaves', raio: function (h) { var r = Math.round(h * 0.16); return [r, r, r, r]; } },
    pilula: { nome: 'Pílula', raio: function (h) { var r = Math.round(h / 2); return [r, r, r, r]; } },
    folha: { nome: 'Folha (cantos opostos)', raio: function (h) { var r = Math.round(h * 0.34); return [r, 0, r, 0]; } }
  };
  function raioCss(r) { return r.map(function (v) { return v + 'px'; }).join(' '); }

  /* ---------- Combinações de fontes (Google Fonts) ---------- */
  var PARES = {
    direto: { nome: 'Direta', titulo: 'Archivo', texto: 'Inter' },
    geometrica: { nome: 'Geométrica', titulo: 'Montserrat', texto: 'Inter' },
    amigavel: { nome: 'Amigável', titulo: 'Poppins', texto: 'Figtree' },
    contemporanea: { nome: 'Contemporânea', titulo: 'Bricolage Grotesque', texto: 'Inter' },
    tecnica: { nome: 'Técnica', titulo: 'Space Grotesk', texto: 'Inter' },
    expressiva: { nome: 'Expressiva', titulo: 'Unbounded', texto: 'Figtree' },
    elegante: { nome: 'Elegante', titulo: 'Playfair Display', texto: 'Inter' },
    editorial: { nome: 'Editorial', titulo: 'DM Serif Display', texto: 'Figtree' },
    divertida: { nome: 'Divertida', titulo: 'Fredoka', texto: 'Nunito' },
    impacto: { nome: 'Impacto', titulo: 'Anton', texto: 'Inter' },
    condensada: { nome: 'Condensada', titulo: 'Oswald', texto: 'Inter' }
  };

  /* ---------- Paletas prontas: duas cores que já combinam, por clima ----------
     Quem não entende de cor escolhe pelo nome; a paleta derivada confere a leitura. */
  var PALETAS = [
    ['padaria', 'Padaria', 'Quentes', '#C2410C', '#FDE68A'], ['por-do-sol', 'Pôr do sol', 'Quentes', '#E11D48', '#FDBA74'],
    ['cafe', 'Café', 'Quentes', '#6F4E37', '#F3D9B1'], ['tomate', 'Tomate', 'Quentes', '#DC2626', '#FEF3C7'], ['terra', 'Terra', 'Quentes', '#9A3412', '#FCD34D'],
    ['oceano', 'Oceano', 'Frias', '#0E7490', '#A5F3FC'], ['saude', 'Saúde', 'Frias', '#0F766E', '#CCFBF1'], ['ceu', 'Céu', 'Frias', '#2563EB', '#BFDBFE'], ['menta', 'Menta', 'Frias', '#059669', '#D1FAE5'],
    ['neon', 'Neon', 'Vibrantes', '#16161D', '#D6FF3D'], ['choque', 'Rosa choque', 'Vibrantes', '#DB2777', '#FDE047'], ['eletrico', 'Elétrico', 'Vibrantes', '#4F46E5', '#FDE047'], ['laranja-pop', 'Laranja pop', 'Vibrantes', '#EA580C', '#C7D2FE'],
    ['pastel', 'Pastel', 'Suaves', '#DB6FA6', '#DDD6FE'], ['lavanda', 'Lavanda', 'Suaves', '#7C3AED', '#EDE9FE'], ['pessego', 'Pêssego', 'Suaves', '#F97316', '#FFE4E6'], ['areia', 'Areia', 'Suaves', '#A16207', '#FEF9C3'],
    ['luxo', 'Luxo', 'Sóbrias', '#1C1917', '#D4AF37'], ['vinho', 'Vinho', 'Sóbrias', '#7F1D1D', '#FBCFE8'], ['grafite', 'Grafite', 'Sóbrias', '#334155', '#FACC15'], ['marinho', 'Marinho', 'Sóbrias', '#1E3A8A', '#FCD34D'],
    ['floresta', 'Floresta', 'Natureza', '#166534', '#BEF264'], ['oliva', 'Oliva', 'Natureza', '#4D7C0F', '#FEF08A'], ['brinquedo', 'Brinquedo', 'Natureza', '#2563EB', '#FB7185']
  ].map(function (p) { return { id: p[0], nome: p[1], grupo: p[2], principal: p[3], destaque: p[4] }; });

  /* ---------- Layouts, em três níveis ---------- */
  var LAYOUTS = {
    limpo: { nivel: 'Básico', nome: 'Limpo', desenho: 'simples', par: 'direto', foto: 'bloco', frase: 'Fundo claro, bastante respiro e uma cor de destaque.' },
    texto: { nivel: 'Básico', nome: 'Só texto', desenho: 'texto', par: 'contemporanea', foto: null, girar: true, frase: 'O recado é a imagem: título grande, sem foto.' },
    manchete: { nivel: 'Elaborado', nome: 'Manchete', desenho: 'manchete', par: 'direto', foto: 'fundo', girar: true, frase: 'Título enorme como manchete, legendas pequenas nos cantos.' },
    bloco: { nivel: 'Elaborado', nome: 'Bloco de cor', desenho: 'robusto', par: 'direto', foto: 'bloco', frase: 'Cor chapada, título grande e formas fortes.' },
    fundo: { nivel: 'Elaborado', nome: 'Foto de fundo', desenho: 'fundo', par: 'geometrica', foto: 'fundo', frase: 'A foto ocupa a peça inteira e o texto vem por cima, com sombra para ler.' },
    editorial: { nivel: 'Premium', nome: 'Editorial', desenho: 'sofisticado', par: 'elegante', foto: 'bloco', frase: 'Fundo profundo, linhas finas e composição de revista.' },
    gradiente: { nivel: 'Premium', nome: 'Gradiente', desenho: 'efeito', par: 'expressiva', foto: 'bloco', frase: 'Luzes em degradê, textura e foto em cartão.' },
    foco: { nivel: 'Premium', nome: 'Foco', desenho: 'foco', par: 'geometrica', foto: 'fundo', posicao: false, frase: 'Foto desfocada na cor da marca, com uma janela nítida e o título por cima.' },
    grade: { nivel: 'Premium', nome: 'Grade', desenho: 'grade', par: 'tecnica', foto: 'fundo', posicao: false, frase: 'Pôster com grade, quadrados de cor e título que vaza da peça.' },
    numero: { nivel: 'Básico', nome: 'Número', desenho: 'numero', par: 'impacto', foto: null, posicao: false, frase: 'Um número gigante ao lado do texto. Comece o título com um número ("5 dicas…") ou preencha a data.' },
    neon: { nivel: 'Elaborado', nome: 'Neon', desenho: 'neon', par: 'direto', foto: 'bloco', posicao: false, frase: 'Fundo escuro, palavra em caixa neon e uma faixa atravessando a foto.' },
    colagem: { nivel: 'Premium', nome: 'Colagem', desenho: 'colagem', par: 'condensada', foto: 'bloco', posicao: false, frase: 'Papel rasgado atrás do título, adesivo redondo e foto tipo polaroide.' },
    poster: { nivel: 'Básico', nome: 'Pôster', desenho: 'poster', par: 'impacto', foto: 'bloco', frase: 'Cor chapada, título condensado gigante e informações pequenas nos cantos.' },
    dividido: { nivel: 'Elaborado', nome: 'Dividido', desenho: 'dividido', par: 'condensada', foto: 'bloco', posicao: false, frase: 'Metade texto, metade foto, com os dados em etiquetas brancas.' },
    fita: { nivel: 'Elaborado', nome: 'Fita', desenho: 'fita', par: 'impacto', foto: null, posicao: false, frase: 'Título enorme e fitas coloridas atravessando com as informações.' },
    corte: { nivel: 'Premium', nome: 'Corte', desenho: 'corte', par: 'impacto', foto: 'fundo', posicao: false, frase: 'Título gigante que vaza da peça de propósito, sobre a foto em preto e branco.' },
    mosaico: { nivel: 'Premium', nome: 'Mosaico', desenho: 'mosaico', par: 'geometrica', foto: 'fundo', posicao: false, frase: 'A foto fatiada em grade, com partes em preto e branco e o título por cima.' },
    revista: { nivel: 'Premium', nome: 'Revista', desenho: 'revista', par: 'condensada', foto: 'fundo', posicao: false, frase: 'Capa de revista: nome da marca no topo, manchete grande e chamadas nos cantos.' },
    meiotom: { nivel: 'Premium', nome: 'Meio-tom', desenho: 'meiotom', par: 'expressiva', foto: 'fundo', posicao: false, girar: true, giradoPadrao: true, frase: 'Recorte em retícula, como impressão antiga, e título na vertical.' }
  };
  Object.keys(LAYOUTS).forEach(function (k) { LAYOUTS[k].premium = LAYOUTS[k].nivel === 'Premium'; if (LAYOUTS[k].posicao !== false) LAYOUTS[k].posicao = true; });
  /* Nomes antigos (peças registradas antes) */
  var ANTIGOS = { simples: 'limpo', sofisticado: 'editorial', robusto: 'bloco' };
  function layout(id) { return LAYOUTS[id] ? id : (ANTIGOS[id] || 'limpo'); }
  var ESTILOS = {};
  Object.keys(LAYOUTS).forEach(function (k) { ESTILOS[k] = LAYOUTS[k]; });

  /* ---------- Marca padrão (exemplo fictício) ---------- */
  function padrao() {
    return {
      nome: 'Sua marca',
      logo: '', logoClaro: '',
      cores: { principal: '#1F3DFF', escura: '', acao: '', destaque: '', fundo: '' },
      fontes: { titulo: 'Archivo', texto: 'Inter' },
      forma: 'suave',
      estilo: 'limpo',
      rodape: { site: '', social: '', frase: '' },
      legal: '',
      linguagem: { tom: 'proximo', proibidas: '', estrangeirismos: true, maxExclamacoes: 1, caixaAltaTitulo: false },
      configurada: false
    };
  }

  function ler() {
    try {
      var s = raiz.localStorage.getItem(CHAVE);
      if (!s) return padrao();
      var m = JSON.parse(s), p = padrao();
      Object.keys(p).forEach(function (k) {
        if (m[k] == null) m[k] = p[k];
        else if (typeof p[k] === 'object' && !Array.isArray(p[k])) m[k] = Object.assign({}, p[k], m[k]);
      });
      return limpar(m);
    } catch (e) { return padrao(); }
  }

  /* Segurança: o que vem do aparelho pode ter sido alterado à mão. Antes de virar HTML,
     cada valor passa por aqui: cor só em #rrggbb, imagem só PNG/JPEG/WebP em data URL,
     fonte e forma só da lista, textos com tamanho limitado. */
  var COR = /^#[0-9a-f]{6}$/i, IMG = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+\/=]+$/i;
  function cor(v) { return typeof v === 'string' && COR.test(v) ? v : ''; }
  function imagem(v) { return typeof v === 'string' && v.length < 3e6 && IMG.test(v) ? v : ''; }
  function texto(v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; }
  function limpar(m) {
    var p = padrao(), r = Object.assign({}, m);
    r.nome = texto(m.nome, 40) || p.nome;
    r.logo = imagem(m.logo); r.logoClaro = imagem(m.logoClaro);
    r.cores = {}; Object.keys(p.cores).forEach(function (k) { r.cores[k] = cor((m.cores || {})[k]); });
    if (!r.cores.principal) r.cores.principal = p.cores.principal;
    var f = m.fontes || {};
    r.fontes = { titulo: FONTES[f.titulo] ? f.titulo : p.fontes.titulo, texto: FONTES[f.texto] ? f.texto : p.fontes.texto };
    r.forma = FORMAS[m.forma] ? m.forma : p.forma;
    r.estilo = layout(m.estilo);
    var rd = m.rodape || {};
    r.rodape = { site: texto(rd.site, 120), social: texto(rd.social, 80), frase: texto(rd.frase, 160) };
    r.legal = texto(m.legal, 400);
    var lg = m.linguagem || {}, pl = p.linguagem;
    r.linguagem = { tom: texto(lg.tom, 20) || pl.tom, proibidas: texto(lg.proibidas, 600), estrangeirismos: lg.estrangeirismos !== false, maxExclamacoes: isNaN(parseInt(lg.maxExclamacoes, 10)) ? pl.maxExclamacoes : Math.max(0, Math.min(5, parseInt(lg.maxExclamacoes, 10))), caixaAltaTitulo: !!lg.caixaAltaTitulo };
    r.configurada = !!m.configurada;
    return r;
  }
  function salvar(m) {
    try { raiz.localStorage.setItem(CHAVE, JSON.stringify(m)); return true; }
    catch (e) { return false; } // logo grande demais para o aparelho
  }

  /* ---------- Paleta derivada, sempre com contraste conferido ---------- */
  function paleta(m) {
    var c = m.cores || {}, P = c.principal || '#1F3DFF';
    var escura = c.escura || mix(P, '#0b0b14', 0.62);
    if (contraste(escura, '#ffffff') < 7) escura = garantir(escura, '#ffffff', 7);
    var fundo = c.fundo || mix(P, '#ffffff', 0.93);
    var destaque = c.destaque || (function () {
      var d = girar(P, 150); d = mix(d, '#ffffff', 0.25);
      return contraste(d, escura) >= 4.5 ? d : mix(P, '#ffffff', 0.7);
    })();
    var acao = c.acao || P;
    var porque = [];
    // Ação precisa ler com texto em cima (botão).
    var txtAcao = sobre(acao, escura);
    if (contraste(acao, txtAcao) < 4.5) { acao = garantir(acao, txtAcao, 4.5); porque.push('A cor do botão foi ajustada para o texto ficar legível.'); }
    var txtP = sobre(P, escura);
    var apoio = mix(P, '#ffffff', 0.8);
    return {
      principal: P, escura: escura, fundo: fundo, destaque: destaque, acao: acao, apoio: apoio,
      branco: '#ffffff', texto: mix(escura, '#333333', 0.35), suave: mix(escura, '#ffffff', 0.42), linha: mix(escura, '#ffffff', 0.85),
      sobrePrincipal: txtP, sobreEscura: '#ffffff', sobreAcao: sobre(acao, escura), sobreDestaque: sobre(destaque, escura),
      // Principal como texto sobre fundo claro (ex.: palavra em destaque).
      principalLegivel: contraste(P, '#ffffff') >= 4.5 ? P : garantir(P, '#ffffff', 4.5),
      porque: porque
    };
  }

  /* Realces da barra de formatação (cores de fundo sob o texto). */
  function realces(m) {
    var p = paleta(m);
    var comp = girar(p.principal, 180), quente = girar(p.principal, 40);
    return [
      { id: 'destaque', nome: 'destaque', fundo: p.destaque, texto: p.sobreDestaque },
      { id: 'marca', nome: 'da marca', fundo: p.principal, texto: p.sobrePrincipal },
      { id: 'apoio', nome: 'apoio', fundo: p.apoio, texto: p.escura },
      { id: 'escura', nome: 'escura', fundo: p.escura, texto: sobre(p.escura) },
      { id: 'acao', nome: 'do botão', fundo: p.acao, texto: sobre(p.acao) },
      { id: 'comp', nome: 'complementar', fundo: comp, texto: sobre(comp) },
      { id: 'vizinha', nome: 'vizinha', fundo: quente, texto: sobre(quente) },
      { id: 'branco', nome: 'branco', fundo: '#ffffff', texto: '#111111' },
      { id: 'preto', nome: 'preto', fundo: '#111111', texto: '#ffffff' }
    ].filter(function (r, i, l) {
      // as três primeiras sempre ficam (peças antigas usam); as outras saem se repetirem uma cor quase igual
      if (i < 3) return true;
      return !l.slice(0, i).some(function (o) { return contraste(o.fundo, r.fundo) < 1.25; });
    });
  }

  raiz.CriouMarca = {
    ler: ler, salvar: salvar, limpar: limpar, PALETAS: PALETAS, corValida: cor, imagemValida: imagem, padrao: padrao, paleta: paleta, realces: realces,
    FONTES: FONTES, peso: peso, urlFontes: urlFontes, pilha: pilha, serifada: serifada,
    FORMAS: FORMAS, raioCss: raioCss, ESTILOS: ESTILOS, LAYOUTS: LAYOUTS, PARES: PARES, layout: layout,
    cor: { mix: mix, contraste: contraste, sobre: sobre, garantir: garantir, lum: lum, girar: girar }
  };
})(window);
