/* ============================================================
   Criou · Formatos
   Medidas, margem de segurança, campos pedidos e downloads de cada
   formato. O desenho vem de modelos.js (um desenho por estilo que se
   adapta à proporção); a árvore de decisão fica em motor.js.
   ============================================================ */
(function (raiz) {
  'use strict';

  var CAMPOS_PECA = ['assunto', 'titulo', 'apoio', 'imagem', 'data', 'hora', 'local', 'chamada'];

  var FORMATOS = [
    { id: 'kit', nome: 'Campanha completa', grupo: 'Campanha', descricao: 'Post, story, banner do site e topo de e-mail de uma vez.', kit: ['post-retrato', 'story', 'banner-site', 'topo-email'], campos: CAMPOS_PECA, recomendado: true },
    { id: 'post-quadrado', nome: 'Post quadrado', grupo: 'Redes sociais', largura: 1080, altura: 1080, margem: 90, campos: CAMPOS_PECA, exportar: ['png', 'jpg', 'pdf', 'pptx'] },
    { id: 'post-retrato', nome: 'Post retrato', grupo: 'Redes sociais', largura: 1080, altura: 1350, margem: 90, campos: CAMPOS_PECA, exportar: ['png', 'jpg', 'pdf', 'pptx'] },
    { id: 'story', nome: 'Story', grupo: 'Redes sociais', largura: 1080, altura: 1920, margem: 90, margens: { topo: 230, base: 300 }, campos: CAMPOS_PECA, exportar: ['png', 'jpg', 'pdf', 'pptx'], nota: 'Topo e base livres para os elementos do Instagram.' },
    { id: 'post-linkedin', nome: 'Post LinkedIn', grupo: 'Redes sociais', largura: 1200, altura: 627, margem: 60, campos: CAMPOS_PECA, exportar: ['png', 'jpg', 'pdf', 'pptx'] },
    { id: 'banner-site', nome: 'Banner do site', grupo: 'Site e e-mail', largura: 1500, altura: 500, margem: 56, campos: CAMPOS_PECA, exportar: ['png', 'jpg', 'pdf', 'pptx'] },
    { id: 'topo-email', nome: 'Topo de e-mail', grupo: 'Site e e-mail', largura: 800, altura: 300, margem: 36, campos: ['assunto', 'titulo', 'apoio', 'imagem', 'data', 'hora'], exportar: ['png', 'jpg'] },
    { id: 'email', nome: 'E-mail marketing', grupo: 'Site e e-mail', largura: 600, email: true, campos: ['assunto', 'titulo', 'apoio', 'texto', 'imagem', 'data', 'hora', 'local', 'chamada', 'link'], exportar: ['html', 'png', 'pdf'] },
    { id: 'cartaz-a4', nome: 'Cartaz A4', grupo: 'Impressos', largura: 1240, altura: 1754, margem: 100, dpi: 150, impresso: true, campos: CAMPOS_PECA, exportar: ['pdf', 'png', 'pptx'], nota: 'A4 em 150 dpi.' },
    { id: 'convite', nome: 'Convite', grupo: 'Impressos', largura: 874, altura: 1240, margem: 70, dpi: 150, impresso: true, campos: ['assunto', 'titulo', 'apoio', 'imagem', 'data', 'hora', 'local', 'chamada'], exportar: ['pdf', 'png', 'pptx'], nota: 'A5 (148 × 210 mm) em 150 dpi.', assuntoPadrao: 'evento' }
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
