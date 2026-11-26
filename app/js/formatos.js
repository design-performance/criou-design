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
    { id: 'kit', nome: 'Campanha completa', rede: 'Campanha', descricao: 'Post, story, LinkedIn e banner do site de uma vez.', kit: ['post-retrato', 'story', 'post-linkedin', 'banner-site'], campos: CAMPOS_PECA, recomendado: true },
    { id: 'post-quadrado', nome: 'Post quadrado', rede: 'Instagram', largura: 1080, altura: 1080, margem: 90, campos: CAMPOS_PECA, exportar: P4 },
    { id: 'post-retrato', nome: 'Post retrato', rede: 'Instagram', largura: 1080, altura: 1350, margem: 90, campos: CAMPOS_PECA, exportar: P4 },
    { id: 'story', nome: 'Story e Reels', rede: 'Instagram', largura: 1080, altura: 1920, margem: 90, margens: { topo: 230, base: 300 }, campos: CAMPOS_PECA, exportar: P4, nota: 'Topo e base livres para os elementos do Instagram.' },
    { id: 'thumb-youtube', nome: 'Miniatura de vídeo', rede: 'YouTube', largura: 1280, altura: 720, margem: 64, campos: ['assunto', 'titulo', 'apoio', 'imagem'], exportar: P4, nota: 'Canto inferior direito livre para a duração do vídeo.' },
    { id: 'post-linkedin', nome: 'Post', rede: 'LinkedIn', largura: 1200, altura: 627, margem: 60, campos: CAMPOS_PECA, exportar: P4 },
    { id: 'linkedin-vertical', nome: 'Post vertical', rede: 'LinkedIn', largura: 1080, altura: 1350, margem: 90, campos: CAMPOS_PECA, exportar: P4 },
    { id: 'banner-site', nome: 'Banner do site', rede: 'Site e e-mail', extra: true, largura: 1500, altura: 500, margem: 56, campos: CAMPOS_PECA, exportar: P4 },
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

  function porId(id) { return FORMATOS.filter(function (f) { return f.id === id; })[0]; }

  raiz.CriouFormatos = { lista: FORMATOS, porId: porId, ASSUNTOS: ASSUNTOS, CAMPOS: CAMPOS };
})(window);
