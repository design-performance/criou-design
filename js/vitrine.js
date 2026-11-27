/* ============================================================
   Criou · Vitrine da página inicial
   Peças de exemplo desenhadas pelo próprio motor do estúdio
   (app/js), com marcas fictícias e fotos do Unsplash.
   Cada [data-ex] vira um iframe do tamanho real, em escala.
   ============================================================ */
(function () {
  'use strict';
  var M = window.CriouMarca, F = window.CriouFormatos, MO = window.CriouMotor, MD = window.CriouModelos;

  function foto(id, w, h) {
    return 'https://images.unsplash.com/photo-' + id + '?w=' + Math.round(w) + '&h=' + Math.round(h) + '&fit=crop&crop=entropy&auto=format&q=80';
  }

  var MARCAS = {
    aurora: { nome: 'Padaria Aurora', cor: '#B5562B', site: 'padariaaurora.com.br', social: '@padariaaurora' },
    vento: { nome: 'Studio Vento', cor: '#FF6A00', site: 'studiovento.com.br', social: '@studiovento' },
    bento: { nome: 'Pet Bento', cor: '#7A1FA2', site: 'petbento.com.br', social: '@petbento' },
    lume: { nome: 'Café Lume', cor: '#3B2A20', site: 'cafelume.com.br', social: '@cafelume' },
    ciclo: { nome: 'Brechó Ciclo', cor: '#E5243B', site: 'brechociclo.com.br', social: '@brechociclo' },
    verde: { nome: 'Verde Vivo', cor: '#2F6B4F', site: 'verdevivo.com.br', social: '@verdevivo' },
    ventura: { nome: 'Clínica Ventura', cor: '#0E7C66', site: 'clinicaventura.com.br', social: '' }
  };

  var EX = {
    /* Topo da página */
    'h-story': { marca: 'ciclo', formato: 'story', layout: 'fundo', par: 'expressiva', foto: '1757830034050-82ff5713fba7',
      dados: { assunto: 'novidade', titulo: 'Garimpo novo toda ==sexta==', apoio: 'Peças únicas a partir de R$ 29.', chamada: 'Ver as peças' } },
    'h-post': { marca: 'vento', formato: 'post-retrato', layout: 'gradiente', par: 'expressiva', foto: '1747239069226-55382c570116',
      dados: { assunto: 'evento', titulo: 'Aula aberta de ==pilates== no sábado', apoio: 'Traga um amigo. Vagas limitadas.', data: '2026-12-12', hora: '09:00', chamada: 'Garantir vaga' } },
    'h-quad': { marca: 'bento', formato: 'post-quadrado', layout: 'bloco', par: 'divertida', foto: '1535320730793-87242ae1f53d',
      dados: { assunto: 'promocao', titulo: 'Banho e tosa com ==20%== na terça', chamada: 'Agendar' } },
    'h-link': { marca: 'lume', formato: 'post-linkedin', layout: 'editorial', par: 'editorial', foto: '1485808191679-5f86510681a2',
      dados: { assunto: 'novidade', titulo: 'Novo latte de ==doce de leite==', apoio: 'Feito com leite da serra e café da casa.' } },
    /* Demonstração (Como funciona) */
    'd-0': { marca: 'ciclo', formato: 'post-retrato', layout: 'limpo', par: 'direto', dados: { assunto: 'evento', titulo: '' } },
    'd-1': { marca: 'ciclo', formato: 'post-retrato', layout: 'limpo', par: 'direto', foto: '1757830034050-82ff5713fba7', dados: { assunto: 'evento', titulo: 'Feira de troca no ==domingo==', apoio: 'Traga até 5 peças e leve outras.', data: '2026-12-13', hora: '10:00', chamada: 'Quero participar' } },
    'd-2': { marca: 'ciclo', formato: 'post-retrato', layout: 'fundo', par: 'geometrica', foto: '1757830034050-82ff5713fba7', dados: { assunto: 'evento', titulo: 'Feira de troca no ==domingo==', apoio: 'Traga até 5 peças e leve outras.', data: '2026-12-13', hora: '10:00', chamada: 'Quero participar' } },
    'd-3': { marca: 'ciclo', formato: 'post-retrato', layout: 'gradiente', par: 'expressiva', cor: '#1F3DFF', foto: '1757830034050-82ff5713fba7', dados: { assunto: 'evento', titulo: 'Feira de troca no ==domingo==', apoio: 'Traga até 5 peças e leve outras.', data: '2026-12-13', hora: '10:00', chamada: 'Quero participar' } },
    'd-4': { marca: 'ciclo', formato: 'post-retrato', layout: 'manchete', par: 'direto', cor: '#0E7C66', dados: { assunto: 'evento', titulo: 'feira de troca no ==domingo.==', apoio: 'Traga até 5 peças e leve outras.', data: '2026-12-13', hora: '10:00', chamada: 'Quero participar' } },
    /* Exemplos */
    'e-manchete': { marca: 'verde', formato: 'post-retrato', layout: 'manchete', par: 'direto',
      dados: { assunto: 'dica', titulo: 'plantas boas mudam a ==casa toda.==', apoio: 'Cinco espécies que aguentam pouca luz.', chamada: 'Ver a lista' } },
    'e-foco': { marca: 'vento', formato: 'post-retrato', layout: 'foco', par: 'geometrica', foto: '1747239069226-55382c570116',
      dados: { assunto: 'novidade', titulo: '==fo==co', apoio: 'Uma hora de pilates para desligar o resto do dia. Aulas às 7h, 12h e 19h.', chamada: 'Agendar aula' } },
    'e-meiotom': { marca: 'ciclo', formato: 'story', layout: 'meiotom', par: 'expressiva', foto: '1757830034050-82ff5713fba7',
      dados: { assunto: 'novidade', titulo: 'garimpo', apoio: 'Peças únicas toda sexta. Uma de cada, quem chega primeiro leva.', data: '2026-12-05' } },
    'e-grade': { marca: 'lume', formato: 'post-quadrado', layout: 'grade', par: 'tecnica', foto: '1485808191679-5f86510681a2',
      dados: { assunto: 'evento', titulo: 'Noite do café', apoio: 'Degustação de grãos especiais com o barista.', data: '2026-12-19', hora: '19:00', chamada: 'Reservar' } },
    'e-aurora': { marca: 'aurora', formato: 'post-retrato', layout: 'fundo', par: 'elegante', foto: '1549438247-223f2db1dd29',
      dados: { assunto: 'novidade', titulo: 'Pão de fermentação natural sai às ==7h==', apoio: 'Encomende até as 18h do dia anterior.', chamada: 'Encomendar' } },
    'e-verde': { marca: 'verde', formato: 'post-quadrado', layout: 'limpo', par: 'amigavel', foto: '1543169621-36c1c4662410',
      dados: { assunto: 'dica', titulo: 'Plantas que aguentam ==pouca luz==', apoio: 'Cinco escolhas para apartamento.', chamada: 'Ver a lista' } },
    'e-vento': { marca: 'vento', formato: 'story', layout: 'bloco', par: 'direto', foto: '1717500252297-b09508db7ceb',
      dados: { assunto: 'promocao', titulo: 'Primeira aula ==grátis== em dezembro', apoio: 'Reformer, solo ou alongamento.', chamada: 'Agendar' } },
    'e-bento': { marca: 'bento', formato: 'post-retrato', layout: 'editorial', par: 'elegante', foto: '1528846104175-4fd300ee59da',
      dados: { assunto: 'novidade', titulo: 'Spa completo para o seu ==melhor amigo==', apoio: 'Banho, hidratação e tosa na tesoura.', chamada: 'Agendar' } },
    'e-ventura': { marca: 'ventura', formato: 'post-quadrado', layout: 'texto', par: 'contemporanea',
      dados: { assunto: 'aviso', titulo: 'Horário especial no ==feriado==', apoio: 'Dia 25, atendimento das 8h às 12h.', chamada: 'Agendar' } },
    'e-lume': { marca: 'lume', formato: 'thumb-youtube', layout: 'fundo', par: 'geometrica', foto: '1485808191679-5f86510681a2',
      dados: { assunto: 'dica', titulo: 'Como fazemos o ==latte perfeito==' } },
    'e-ciclo': { marca: 'ciclo', formato: 'post-linkedin', layout: 'gradiente', par: 'tecnica', foto: '1621262331542-df0768a47e2c',
      dados: { assunto: 'evento', titulo: 'Feira de troca de roupas no ==domingo==', apoio: 'Traga até 5 peças e leve outras.', data: '2026-12-13', hora: '10:00' } }
  };

  function marcaDe(k, par, cor) {
    var b = MARCAS[k], m = M.padrao();
    m.nome = b.nome; m.cores.principal = cor || b.cor; m.configurada = true;
    m.rodape.site = b.site; m.rodape.social = b.social;
    var p = M.PARES[par] || M.PARES.direto;
    m.fontes = { titulo: p.titulo, texto: p.texto };
    return m;
  }

  function desenhar(el) {
    var e = EX[el.getAttribute('data-ex')]; if (!e) return;
    var fo = F.porId(e.formato), m = marcaDe(e.marca, e.par, e.cor), d = Object.assign({}, e.dados);
    if (e.foto) d.imagem = { src: 'unsplash' };
    var dec = MO.decidir(fo, d, m, e.layout);
    if (e.foto && dec.temFoto) {
      var s = MD.slot(fo, dec), efeitos = s && (s.forma && (s.forma.efeito || s.forma.janela || s.forma.escurecer) || s.extras || s.chave);
      if (s && !efeitos) d._foto = foto(e.foto, s.w, s.h);
      else if (s) {
        // Efeitos de foto precisam do recorte no navegador (o Unsplash libera o uso em canvas).
        var q = MD.quadroFoto(fo, dec);
        el.style.aspectRatio = fo.largura + ' / ' + fo.altura;
        MD.fotos(fo, dec, foto(e.foto, Math.min(1600, q.w * 1.2), Math.min(1600, q.h * 1.2)), {}, 1).then(function (fs) { Object.assign(d, fs); montar(el, fo, d, m, dec); }).catch(function () { montar(el, fo, d, m, dec); });
        return;
      }
    }
    montar(el, fo, d, m, dec);
  }
  function montar(el, fo, d, m, dec) {
    var f = document.createElement('iframe');
    f.setAttribute('title', m.nome + ': ' + MO.semMarcas(d.titulo));
    f.setAttribute('tabindex', '-1');
    f.setAttribute('loading', 'lazy');
    f.setAttribute('sandbox', 'allow-scripts');
    f.style.cssText = 'position:absolute;left:0;top:0;border:0;transform-origin:0 0;pointer-events:none;width:' + fo.largura + 'px;height:' + fo.altura + 'px';
    f.srcdoc = MD.html(fo, d, m, dec);
    el.style.aspectRatio = fo.largura + ' / ' + fo.altura;
    el.innerHTML = '';
    el.appendChild(f);
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Exemplo: ' + fo.nome + ' de ' + m.nome + ', layout ' + M.LAYOUTS[dec.estilo].nome + ': ' + MO.semMarcas(d.titulo));
    escalar(el);
  }
  function escalar(el) {
    var f = el.firstChild; if (!f) return;
    var fo = F.porId(EX[el.getAttribute('data-ex')].formato);
    f.style.transform = 'scale(' + (el.clientWidth / fo.largura) + ')';
  }

  var pecas = Array.prototype.slice.call(document.querySelectorAll('[data-ex]'));
  pecas.forEach(desenhar);
  if (window.ResizeObserver) { var ro = new ResizeObserver(function (es) { es.forEach(function (x) { escalar(x.target); }); }); pecas.forEach(function (p) { ro.observe(p); }); }
  else window.addEventListener('resize', function () { pecas.forEach(escalar); });

  /* Seção rosa: as dúvidas vão sendo riscadas quando a seção aparece. */
  var duv = document.querySelector('.duvidas');
  if (duv && window.IntersectionObserver) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { duv.classList.add('vivo'); o.disconnect(); } }, { threshold: 0.35 }).observe(duv);
  else if (duv) duv.classList.add('vivo');

  /* Como funciona: o estúdio montando a peça, em passos. */
  var palco = document.querySelector('.est-palco');
  if (palco) {
    var camadas = palco.querySelectorAll('.camada'), passos = document.querySelectorAll('#passos li');
    var digita = document.getElementById('digita'), lay = document.querySelectorAll('#est-lay em'), cores = document.querySelectorAll('#est-cor i');
    var btn = document.getElementById('est-btn'), ok = document.getElementById('est-ok');
    var TXT = 'Feira de troca no domingo';
    function mostra(n) { camadas.forEach(function (c, i) { c.classList.toggle('on', i === n); }); }
    function passo(n) { passos.forEach(function (p, i) { p.classList.toggle('on', i === n); }); }
    function layout(l) { lay.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-l') === l); }); }
    function cor(n) { cores.forEach(function (x, i) { x.classList.toggle('on', i === n); }); }
    var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calmo) { mostra(4); passo(2); digita.textContent = TXT; layout('manchete'); cor(2); }
    else {
      var t = [];
      function em(ms, fn) { t.push(setTimeout(fn, ms)); }
      function ciclo() {
        t.forEach(clearTimeout); t = [];
        digita.textContent = ''; layout('limpo'); cor(0); btn.classList.remove('on'); ok.classList.remove('on');
        mostra(0); passo(0);
        em(1400, function () { passo(1); });
        for (var i = 1; i <= TXT.length; i++) (function (k) { em(1500 + k * 60, function () { digita.textContent = TXT.slice(0, k); }); })(i);
        em(1500 + TXT.length * 60 + 200, function () { mostra(1); });
        var b = 1500 + TXT.length * 60 + 1600;
        em(b, function () { passo(2); layout('fundo'); mostra(2); });
        em(b + 1700, function () { layout('gradiente'); cor(1); mostra(3); });
        em(b + 3400, function () { layout('manchete'); cor(2); mostra(4); });
        em(b + 5200, function () { passo(3); btn.classList.add('on'); });
        em(b + 5700, function () { ok.classList.add('on'); });
        em(b + 8200, ciclo);
      }
      if (window.IntersectionObserver) { var rodando = false; new IntersectionObserver(function (es) { if (es[0].isIntersecting && !rodando) { rodando = true; ciclo(); } }, { threshold: 0.3 }).observe(palco); }
      else ciclo();
    }
  }
})();
