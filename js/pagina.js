/* Página inicial: dúvidas frequentes, planos e detalhes de interação. */
{
const FAQ=[
['O Criou é um editor de imagens?','Não. Não há tela de edição livre. Você informa o que quer comunicar e escolhe entre opções prontas de layout, cor, fonte e posição do texto. O Criou organiza e monta a peça seguindo as regras da sua marca. Nos planos pagos, a peça também sai em PowerPoint com os textos editáveis, para um ajuste fino.'],
['Quais formatos posso criar?','Para redes sociais: post quadrado, post retrato e story do Instagram, miniatura de vídeo do YouTube e posts do LinkedIn. Também há banner do site, topo de e-mail, e-mail marketing, cartaz A4 e outdoor. A campanha completa reúne post, story, LinkedIn e banner do site.'],
['Que layouts existem?','Grátis: Limpo, Só texto, Número, Pôster, Manchete, Bloco de cor, Foto de fundo, Neon, Dividido e Fita. Premium: Editorial, Gradiente, Foco, Grade, Meio-tom, Colagem, Corte, Mosaico e Revista (com efeitos de luz, desfoque, grade, retícula, título que vaza da peça e foto fatiada). Todos seguem a cor e o logotipo da sua marca, e você troca de layout, fonte e cor vendo a peça mudar na hora.'],
['Posso mudar o texto de lugar ou girar o título?','Sim. Em boa parte dos layouts você escolhe se o texto fica no topo, no centro ou na base, e o alinhamento. Em Manchete, Só texto e Meio-tom, o título também pode ir na vertical.'],
['Preciso entender de design?','Não. Você decide o que dizer; o Criou decide como apresentar.'],
['Preciso ter uma identidade visual?','Não. Dá para começar só com o nome da empresa e uma cor. Logotipo, fontes e textos fixos podem ser adicionados depois, nos ajustes da marca.'],
['Posso usar o logotipo e as fotos da minha empresa?','Sim. O logotipo entra em todas as peças, e você envia e enquadra suas fotos. Use apenas imagens que você tem direito de usar.'],
['Posso usar a fonte da minha marca?','Você escolhe entre as fontes disponíveis no Criou, todas do Google Fonts. O envio de um arquivo de fonte própria ainda não está disponível.'],
['Posso usar outros elementos gráficos da marca, como texturas e ícones?','Os seus próprios elementos ainda não: hoje entram logotipo, cores, fontes, forma dos elementos e textos fixos. Para ícones, há um catálogo com mais de 240 ícones prontos, organizados por tema (comida, saúde, beleza, eventos, pets e outros), que ganham a cor da peça. Elementos gráficos próprios podem ser configurados no serviço de consultoria e implementação.'],
['Não entendo de cores. Como escolho?','Escolha uma das combinações prontas pelo nome (Padaria, Saúde, Neon, Luxo…) ou toque em "Sortear combinação" até gostar. O Criou confere sozinho se o texto dá para ler em cima de cada cor.'],
['O sistema cria meu logotipo?','Não. O Criou usa o logotipo que você envia. Ele não cria logotipos nem identidades visuais.'],
['Posso experimentar antes de pagar?','Sim. A versão de teste está aberta: você cria e vê as peças sem cadastro. Para baixar, é preciso o cadastro gratuito, que abre em breve.'],
['Onde ficam salvas as minhas peças?','Na versão de teste, ficam salvas só no seu aparelho. Com o cadastro, passam a ficar na sua conta.'],
['Por que tem marca d\'água?','No plano gratuito, a peça sai com uma marca d\'água discreta: um selo pequeno no canto. No Essencial, ela sai limpa. Para baixar em qualquer plano, é preciso o cadastro e a confirmação do e-mail.'],
['O que o plano gratuito inclui?','Cadastro, uma marca e até 3 peças por dia nos layouts básicos e elaborados, com download em PNG e uma marca d\'água discreta. Os layouts premium aparecem na prévia, mas ficam para o Essencial.'],
['Posso criar mais peças de graça?','Sim, até 3 por dia. Uma campanha completa conta como uma. Para criar sem limite no uso normal, usar os layouts premium e baixar sem marca d\'água, é preciso a assinatura Essencial.'],
['Quantas marcas posso cadastrar?','O plano gratuito e o plano Essencial permitem cadastrar uma marca por conta.'],
['Existe limite de peças no Essencial?','Não há limite fixo de quantidade no uso normal, sujeito à política de uso razoável e às regras de prevenção de abuso.'],
['Como vou pagar?','As formas de pagamento e as condições completas serão informadas antes da contratação.'],
['Posso cancelar minha assinatura?','Sim. O cancelamento pode ser feito pelo próprio painel, sem ligação telefônica.'],
['Recebo reembolso se desistir?','Nas contratações abrangidas pelo direito de arrependimento previsto na legislação brasileira, você pode cancelar e pedir a devolução integral em até sete dias, observadas as condições aplicáveis.'],
['Posso usar minhas peças comercialmente?','Sim, conforme os Termos de Uso, desde que você tenha os direitos sobre os logotipos, imagens, fontes e demais materiais que enviar.'],
['O sistema revisa meus textos?','Em parte. O Criou avisa sobre excesso de exclamações, título todo em maiúsculas, chamadas vagas, estrangeirismos e palavras que a sua marca não usa. Ele não faz revisão ortográfica, jurídica ou técnica.'],
['O sistema garante vendas ou engajamento?','Não. O Criou é uma ferramenta de produção visual. Não garante resultados comerciais, alcance ou desempenho de campanhas.'],
['Posso contratar uma implantação personalizada?','Sim. Empresas com manual de identidade visual e necessidades específicas podem contratar o serviço de consultoria e implementação.']
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const item=([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`;
document.getElementById('faq').innerHTML=FAQ.slice(0,8).map(item).join('')+`<details class="more"><summary>Ver todas as dúvidas (${FAQ.length})</summary>${FAQ.slice(8).map(item).join('')}</details>`;
/* Formatos (Clínica Ventura) */
const FMT={publico:'clientes',campanha:true,assunto:'novidade',titulo:'Check-up completo em uma manhã',apoio:'Exames, consulta e resultado no mesmo dia.',chamada:'Agendar'};
(async()=>{await DPP.fontes(DPP.EXEMPLOS.ventura);document.querySelectorAll('canvas[data-marca]').forEach(c=>{const out=DPP.desenhar(DPP.EXEMPLOS[c.dataset.marca],c.dataset.fmt,FMT);DPP.previa(c,out.canvas,{maxW:c.dataset.fmt==='banner'?900:640,marcaDagua:false});});})();
DPP.evento('landing_view');
/* Planos: mensal ou anual */
const per=document.querySelector('.periodo');
per.addEventListener('click',e=>{const b=e.target.closest('button[data-p]');if(!b)return;per.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  const anual=b.dataset.p==='anual';
  document.getElementById('preco').innerHTML=anual?'R$ 299<small>/ano</small>':'R$ 29,90<small>/mês</small>';
  document.getElementById('eco').textContent=anual?'Economize R$ 59,80 em relação a 12 mensalidades.':'Cancele quando quiser, pelo painel.';});
}
