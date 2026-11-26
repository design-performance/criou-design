/* ============================================================
   Criou · Motor de regras
   Confere o que foi preenchido, revisa a linguagem e aplica a árvore
   de decisão. Devolve a decisão (o que o desenho usa) e o porquê de
   cada escolha, em português simples. Sem IA e sem custo por uso.
   ============================================================ */
(function (raiz) {
  'use strict';

  var M = raiz.CriouMarca, F = raiz.CriouFormatos;

  var ESTRANGEIRISMOS = {
    'feedback': 'retorno', 'deadline': 'prazo', 'meeting': 'reunião', 'briefing': 'orientação', 'update': 'atualização',
    'kick-off': 'início', 'insight': 'percepção', 'budget': 'orçamento', 'workshop': 'oficina', 'save the date': 'reserve a data',
    'coffee break': 'pausa para o café', 'follow-up': 'acompanhamento', 'networking': 'troca de contatos', 'performance': 'desempenho',
    'sale': 'liquidação', 'off': 'de desconto', 'free': 'grátis', 'delivery': 'entrega'
  };
  var CHAMADAS_GENERICAS = ['clique aqui', 'saiba mais', 'acesse', 'veja', 'clique'];

  function limpar(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  function semMarcas(t) {
    return String(t == null ? '' : t).replace(/>>\([a-z0-9-]+\)\s?/gi, '').replace(/==\([a-z0-9-]+\)([\s\S]+?)==/gi, '$1')
      .replace(/==([\s\S]+?)==/g, '$1').replace(/\*\*([\s\S]+?)\*\*/g, '$1').replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)\*(?!\*)/g, '$1$2');
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* ---------- Revisão de linguagem (avisos, não bloqueia) ---------- */
  function revisar(dados, marca) {
    var L = marca.linguagem || {}, avisos = [], bloqueios = [];
    var titulo = semMarcas(dados.titulo), tudo = [titulo, semMarcas(dados.apoio), semMarcas(dados.texto), limpar(dados.chamada)].join(' \n ');
    if (!L.caixaAltaTitulo && titulo.length > 8 && titulo === titulo.toUpperCase() && /[A-ZÀ-Ú]/.test(titulo))
      avisos.push({ campo: 'titulo', texto: 'Título todo em maiúsculas parece grito e lê pior. Escreva normal: o estilo decide quando usar caixa alta.' });
    var excl = (tudo.match(/!/g) || []).length, maxE = L.maxExclamacoes == null ? 1 : Number(L.maxExclamacoes);
    if (excl > maxE) avisos.push({ campo: 'titulo', texto: 'Muitos pontos de exclamação (' + excl + '). A marca usa no máximo ' + maxE + '.' });
    semMarcas(dados.texto).split(/(?<=[.!?])\s+/).forEach(function (f) {
      if (f.split(/\s+/).filter(Boolean).length > 30) avisos.push({ campo: 'texto', texto: 'Tem frase com mais de 30 palavras. Divida em duas para ler melhor.' });
    });
    var ch = limpar(dados.chamada).toLowerCase();
    if (ch && CHAMADAS_GENERICAS.indexOf(ch) >= 0) avisos.push({ campo: 'chamada', texto: '"' + dados.chamada + '" não diz o que acontece no clique. Prefira algo como "Garantir vaga" ou "Ver cardápio".' });
    if (L.estrangeirismos !== false) {
      var baixo = tudo.toLowerCase();
      Object.keys(ESTRANGEIRISMOS).forEach(function (t) {
        if (new RegExp('(^|[^a-zà-ú])' + escRe(t) + '([^a-zà-ú]|$)').test(baixo)) avisos.push({ campo: 'titulo', texto: '"' + t + '" pode virar "' + ESTRANGEIRISMOS[t] + '".' });
      });
    }
    String(L.proibidas || '').split(/[,;\n]/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (p) {
      if (new RegExp('(^|[^a-zà-ú])' + escRe(p.toLowerCase()) + '([^a-zà-ú]|$)').test(tudo.toLowerCase()))
        bloqueios.push({ campo: 'titulo', texto: 'A marca não usa "' + p + '". Troque essa palavra para seguir.' });
    });
    return { avisos: dedup(avisos), bloqueios: bloqueios };
  }
  function dedup(l) { var v = {}; return l.filter(function (a) { if (v[a.texto]) return false; v[a.texto] = 1; return true; }); }

  /* ---------- Validação ---------- */
  function validar(formato, dados, marca) {
    var erros = [];
    var t = semMarcas(dados.titulo);
    if (!limpar(t)) erros.push({ campo: 'titulo', texto: 'Escreva o recado: é o título da peça.' });
    if (t.length > 90) erros.push({ campo: 'titulo', texto: 'O título tem ' + t.length + ' caracteres. O limite é 90: corte o que puder ir para a frase de apoio.' });
    (formato.campos || []).forEach(function (id) {
      var c = F.CAMPOS[id];
      if (c && c.max && semMarcas(dados[id]).length > c.max && id !== 'titulo') erros.push({ campo: id, texto: c.rotulo + ': máximo de ' + c.max + ' caracteres.' });
    });
    if (formato.email && limpar(dados.chamada) && !/^https:\/\/\S+\.\S+/.test(limpar(dados.link)))
      erros.push({ campo: 'link', texto: 'O botão precisa de um link que comece com https://.' });
    if (formato.email && limpar(dados.link) && !limpar(dados.chamada))
      erros.push({ campo: 'chamada', texto: 'Tem link mas falta o texto do botão.' });
    var r = revisar(dados, marca);
    return { erros: erros.concat(r.bloqueios), avisos: r.avisos, ok: !erros.length && !r.bloqueios.length };
  }

  /* ---------- Árvore de decisão ---------- */
  function decidir(formato, dados, marca, estiloId) {
    var porque = [];
    var estilo = M.layout(estiloId || marca.estilo), L = M.LAYOUTS[estilo];
    var P = M.paleta(marca);
    var t = semMarcas(dados.titulo), n = t.length;
    var escala = n <= 40 ? 1 : n <= 60 ? 0.85 : 0.72;
    porque.push({ tema: 'Hierarquia', texto: n <= 40 ? 'Título curto: ganhou o maior tamanho da escala.' : n <= 60 ? 'Título médio: a fonte desceu um degrau para caber sem apertar.' : 'Título longo: a fonte desceu dois degraus. Se puder, encurte.' });

    var W = formato.largura, H = formato.altura || 0;
    var prop = H ? W / H : 1, tipo = formato.email ? 'email' : prop >= 1.6 ? 'largo' : prop <= 0.75 ? 'alto' : 'quadrado';
    var temFoto = !!(dados.imagem && dados.imagem.src) && !!L.foto;
    if (dados.imagem && dados.imagem.src && !L.foto) porque.push({ tema: 'Composição', texto: 'Layout só texto: a foto não entra. Escolha outro layout para usar a foto.' });
    if (!formato.email) porque.push({ tema: 'Composição', texto: tipo === 'largo' ? 'Formato horizontal: texto à esquerda' + (temFoto ? ' e foto ocupando a lateral' : ' e forma gráfica à direita') + '.' : tipo === 'alto' ? 'Formato vertical: ' + (temFoto ? 'foto em cima e texto embaixo, dentro da área segura.' : 'título no centro óptico, com respiro em volta.') : 'Formato quadrado: ' + (temFoto ? 'foto e texto divididos para os dois respirarem.' : 'título como protagonista.') });
    if (formato.margens) porque.push({ tema: 'Formato', texto: formato.nota || 'Margens maiores no topo e na base.' });

    porque.push({ tema: 'Layout', texto: L.nome + ' (' + L.nivel.toLowerCase() + '): ' + L.frase.charAt(0).toLowerCase() + L.frase.slice(1) });
    if (L.foto === 'fundo') porque.push({ tema: 'Contraste', texto: temFoto ? 'Uma sombra em degradê entra atrás do texto para ele ler bem sobre qualquer foto.' : 'Sem foto: o fundo vira um degradê com as cores da marca.' });
    porque.push({ tema: 'Contraste', texto: 'As cores de texto e fundo foram conferidas: tudo passa de 4,5:1, o mínimo para leitura confortável.' });
    P.porque.forEach(function (p) { porque.push({ tema: 'Contraste', texto: p }); });
    porque.push({ tema: 'Tipografia', texto: 'Títulos em ' + marca.fontes.titulo + ' e textos em ' + marca.fontes.texto + ', as fontes da sua marca.' });
    if (!marca.logo) porque.push({ tema: 'Marca', texto: 'Sem logotipo cadastrado: o nome da marca entra escrito na fonte de título.' });

    var assunto = F.ASSUNTOS[dados.assunto] || F.ASSUNTOS.novidade;
    var temData = !!dados.data;
    if (temData) porque.push({ tema: 'Informação', texto: 'Com data: ganhou um bloco próprio para ninguém perder o dia.' });
    if (limpar(dados.chamada)) porque.push({ tema: 'Ação', texto: 'A chamada virou botão na cor de ação da marca, a única cor reservada para clique.' });

    var extensao = null;
    if (formato.email) {
      var nt = semMarcas(dados.texto).length;
      extensao = nt <= 300 ? 'curto' : nt <= 900 ? 'medio' : 'longo';
      porque.push({ tema: 'E-mail', texto: extensao === 'curto' ? 'Texto curto: título grande e mensagem direta.' : extensao === 'medio' ? 'Texto médio: imagem, título, texto e botão em sequência.' : 'Texto longo: blocos com respiro e intertítulos para escanear.' });
    }
    if (marca.legal) porque.push({ tema: 'Marca', texto: 'O texto legal obrigatório da marca entrou no rodapé.' });

    var extras = (limpar(dados.apoio) ? 1 : 0) + (temData || limpar(dados.local) || limpar(dados.hora) ? 1 : 0) + (limpar(dados.chamada) ? 1 : 0);
    return { extras: extras, desenho: L.desenho, estilo: estilo, paleta: P, escala: escala, tipo: tipo, temFoto: temFoto, temData: temData, assunto: assunto, extensao: extensao, porque: porque };
  }

  raiz.CriouMotor = { validar: validar, decidir: decidir, revisar: revisar, semMarcas: semMarcas, limpar: limpar };
})(window);
