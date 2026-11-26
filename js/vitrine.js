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
    /* Exemplos */
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
      dados: { assunto: 'evento', titulo: 'Feira de troca de roupas no ==domingo==', apoio: 'Traga até 5 peças e leve outras.', data: '2026-12-14', hora: '10:00' } }
  };

  function marcaDe(k, par) {
    var b = MARCAS[k], m = M.padrao();
    m.nome = b.nome; m.cores.principal = b.cor; m.configurada = true;
    m.rodape.site = b.site; m.rodape.social = b.social;
    var p = M.PARES[par] || M.PARES.direto;
    m.fontes = { titulo: p.titulo, texto: p.texto };
    return m;
  }

  function desenhar(el) {
    var e = EX[el.getAttribute('data-ex')]; if (!e) return;
    var fo = F.porId(e.formato), m = marcaDe(e.marca, e.par), d = Object.assign({}, e.dados);
    if (e.foto) d.imagem = { src: 'unsplash' };
    var dec = MO.decidir(fo, d, m, e.layout);
    if (e.foto && dec.temFoto) { var s = MD.slot(fo, dec); if (s) d._foto = foto(e.foto, s.w, s.h); }
    var f = document.createElement('iframe');
    f.setAttribute('title', m.nome + ': ' + MO.semMarcas(d.titulo));
    f.setAttribute('tabindex', '-1');
    f.setAttribute('loading', 'lazy');
    f.style.cssText = 'position:absolute;left:0;top:0;border:0;transform-origin:0 0;pointer-events:none;width:' + fo.largura + 'px;height:' + fo.altura + 'px';
    f.srcdoc = MD.html(fo, d, m, dec);
    el.style.aspectRatio = fo.largura + ' / ' + fo.altura;
    el.innerHTML = '';
    el.appendChild(f);
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Exemplo: ' + fo.nome + ' de ' + m.nome + ', layout ' + M.LAYOUTS[e.layout].nome + ': ' + MO.semMarcas(d.titulo));
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
})();
