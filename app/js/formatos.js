/* ============================================================
   Criou · Formatos
   Medidas, margem de segurança, campos pedidos e downloads de cada
   formato. O desenho vem de modelos.js (um desenho por estilo que se
   adapta à proporção); a árvore de decisão fica em motor.js.
   ============================================================ */
(function (raiz) {
  'use strict';

  var CAMPOS_PECA = ['assunto', 'titulo', 'apoio', 'imagem', 'data', 'hora', 'local', 'chamada'];

  var P4 = ['png', 'jpg', 'pdf', 'pptx'];
  /* rede: agrupa na tela. extra: fica em "Mais formatos", sem destaque. */
  var FORMATOS = [
    { id: 'kit', nome: 'Campanha completa', rede: 'Campanha', descricao: 'Post do feed, story, LinkedIn e banner largo de uma vez.', kit: ['post-retrato', 'story', 'linkedin-quadrado', 'banner-site'], campos: CAMPOS_PECA, atalho: 'Tudo' },
    { id: 'kit-instagram', nome: 'Só Instagram', rede: 'Campanha', descricao: 'Post 4:5, post 3:4 da grade nova e story.', kit: ['post-retrato', 'post-34', 'story'], campos: CAMPOS_PECA, atalho: null },
    { id: 'kit-local', nome: 'Evento ou loja', rede: 'Campanha', descricao: 'Post, story (serve no status do WhatsApp) e cartaz A4 para imprimir.', kit: ['post-retrato', 'story', 'cartaz-a4'], campos: CAMPOS_PECA, atalho: 'Evento com cartaz' },
    { id: 'post-quadrado', nome: 'Quadrado 1:1', rede: 'Instagram', largura: 1080, altura: 1080, margem: 90, campos: CAMPOS_PECA, exportar: P4 },
    { id: 'post-retrato', nome: 'Post 4:5', rede: 'Instagram', largura: 1080, altura: 1350, margem: 90, campos: CAMPOS_PECA, exportar: P4, nota: 'O tamanho mais seguro para o feed. Na grade do perfil, o topo e a base aparecem um pouco cortados.' },
    { id: 'post-34', nome: 'Post 3:4', rede: 'Instagram', largura: 1080, altura: 1440, margem: 90, campos: CAMPOS_PECA, exportar: P4, nota: 'Mesmo formato da grade do perfil: aparece inteiro lá.' },
    { id: 'story', nome: 'Story, Reels e Status', rede: 'Instagram', largura: 1080, altura: 1920, margem: 90, margens: { topo: 230, base: 300 }, campos: CAMPOS_PECA, exportar: P4, nota: 'Topo e base livres para os elementos do Instagram. Serve também no status do WhatsApp.' },
    { id: 'thumb-youtube', nome: 'Miniatura de vídeo', rede: 'YouTube', largura: 1280, altura: 720, margem: 64, campos: ['assunto', 'titulo', 'apoio', 'imagem'], exportar: P4, nota: 'Canto inferior direito livre para a duração do vídeo.' },
    { id: 'linkedin-quadrado', nome: 'Post quadrado', rede: 'LinkedIn', largura: 1200, altura: 1200, margem: 96, campos: CAMPOS_PECA, exportar: P4, nota: 'O tamanho recomendado para post de imagem no LinkedIn.' },
    { id: 'linkedin-vertical', nome: 'Post vertical', rede: 'LinkedIn', largura: 1080, altura: 1350, margem: 90, campos: CAMPOS_PECA, exportar: P4 },
    { id: 'post-linkedin', nome: 'LinkedIn paisagem (link)', rede: 'LinkedIn', extra: true, largura: 1200, altura: 627, margem: 60, campos: CAMPOS_PECA, exportar: P4, nota: 'Formato de prévia de link. Para post de imagem, prefira o quadrado.' },
    { id: 'banner-site', nome: 'Banner largo', rede: 'Site e e-mail', extra: true, largura: 1500, altura: 500, margem: 56, campos: CAMPOS_PECA, exportar: P4 },
    { id: 'topo-email', nome: 'Topo de e-mail', rede: 'Site e e-mail', extra: true, largura: 800, altura: 300, margem: 36, campos: ['assunto', 'titulo', 'apoio', 'imagem', 'data', 'hora'], exportar: ['png', 'jpg'] },
    { id: 'email', nome: 'E-mail marketing', rede: 'Site e e-mail', extra: true, largura: 600, email: true, campos: ['assunto', 'titulo', 'apoio', 'texto', 'imagem', 'data', 'hora', 'local', 'chamada', 'link'], exportar: ['html', 'png', 'pdf'] },
    { id: 'cartaz-a4', nome: 'Cartaz A4', rede: 'Impressos', extra: true, largura: 1240, altura: 1754, margem: 100, dpi: 150, impresso: true, campos: CAMPOS_PECA, exportar: ['pdf', 'png', 'pptx'], nota: 'A4 em 150 dpi.' },
    { id: 'outdoor', nome: 'Outdoor 9 × 3 m', rede: 'Impressos', extra: true, largura: 3000, altura: 1000, margem: 110, campos: ['assunto', 'titulo', 'apoio', 'imagem', 'chamada'], exportar: ['pdf', 'png', 'jpg'], nota: 'Proporção 3:1. Confirme com a gráfica a resolução e a sangria.' }
  ];

  var ASSUNTOS = {
    novidade: { nome: 'Novidade', selo: 'Novidade' },
    evento: { nome: 'Evento', selo: 'Evento' },
    promocao: { nome: 'Promoção', selo: 'Promoção' },
    aviso: { nome: 'Aviso', selo: 'Aviso' },
    dica: { nome: 'Dica', selo: 'Dica' },
    institucional: { nome: 'Institucional', selo: '' }
  };

  /* Rótulos, limites e ajuda de cada campo. */
  var CAMPOS = {
    assunto: { rotulo: 'Sobre o que é?', tipo: 'escolha' },
    titulo: { rotulo: 'Qual é o recado?', tipo: 'texto', max: 90, ajuda: 'O título. Até 40 caracteres fica maior; acima de 90 não cabe.', placeholder: 'Ex.: Aula aberta de pilates no sábado', formato: 'realce' },
    apoio: { rotulo: 'Frase de apoio', tipo: 'texto', max: 120, opcional: true, placeholder: 'Ex.: Traga um amigo. Vagas limitadas.' },
    texto: { rotulo: 'Texto do e-mail', tipo: 'area', max: 3000, opcional: true, placeholder: 'Escreva como falaria. Linhas com "- " viram lista.', formato: 'completo' },
    imagem: { rotulo: 'Foto', tipo: 'imagem', opcional: true },
    data: { rotulo: 'Data', tipo: 'data', opcional: true },
    hora: { rotulo: 'Horário', tipo: 'hora', opcional: true },
    local: { rotulo: 'Local', tipo: 'texto', max: 50, opcional: true, placeholder: 'Ex.: Studio Vento, sala 2' },
    chamada: { rotulo: 'Chamada (botão)', tipo: 'texto', max: 24, opcional: true, placeholder: 'Ex.: Garantir vaga' },
    link: { rotulo: 'Link do botão', tipo: 'texto', max: 300, opcional: true, placeholder: 'https://' }
  };

  function simples(id) { return FORMATOS.filter(function (f) { return f.id === id; })[0]; }
  /* Campanha montada pela pessoa: "kit:post-retrato,story" vira um kit com essas peças. */
  function porId(id) {
    if (typeof id === 'string' && id.indexOf('kit:') === 0) {
      var ids = id.slice(4).split(',').filter(function (x, i, l) { var f = simples(x); return f && !f.kit && !f.email && l.indexOf(x) === i; });
      if (!ids.length) return null;
      if (ids.length === 1) return simples(ids[0]);
      var campos = [];
      ids.forEach(function (x) { simples(x).campos.forEach(function (c) { if (campos.indexOf(c) < 0) campos.push(c); }); });
      return { id: 'kit:' + ids.join(','), nome: 'Campanha', rede: 'Campanha', kit: ids, campos: CAMPOS_PECA.filter(function (c) { return campos.indexOf(c) >= 0; }),
        descricao: ids.length + ' peças: ' + ids.map(function (x) { return nomeCurto(simples(x)); }).join(', ') + '.' };
    }
    return simples(id);
  }
  function nomeCurto(f) { return (f.rede === 'LinkedIn' ? 'LinkedIn ' : f.rede === 'YouTube' ? '' : '') + f.nome.charAt(0).toLowerCase() + f.nome.slice(1); }
  /* Atalhos para quem não quer pensar: um toque marca a combinação. */
  var ATALHOS = [
    ['Feed + Story', ['post-retrato', 'story']],
    ['Instagram + LinkedIn', ['post-retrato', 'story', 'linkedin-quadrado']],
    ['Só LinkedIn', ['linkedin-quadrado', 'linkedin-vertical']],
    ['Tudo', ['post-retrato', 'story', 'linkedin-quadrado', 'banner-site']],
    ['Evento com cartaz', ['post-retrato', 'story', 'cartaz-a4']]
  ];

  raiz.CriouFormatos = { lista: FORMATOS, porId: porId, ATALHOS: ATALHOS, ASSUNTOS: ASSUNTOS, CAMPOS: CAMPOS };
})(window);
