# Segurança do Criou

Este arquivo descreve o que já protege o Criou hoje, o que só um servidor vai resolver e como conferir.

## O que já está em vigor

| Camada | O que faz | Onde |
|---|---|---|
| Escape de textos | Tudo o que a pessoa digita (título, apoio, data, botão, nome da marca) é escapado antes de virar HTML. As marcações `**negrito**` e `==realce==` são aplicadas depois do escape. | `app/js/modelos.js` (`esc`, `rico`) |
| Validação do que vem do aparelho | Marca e peças guardadas no navegador podem ter sido alteradas à mão. Antes de usar: cor só em `#rrggbb`, imagem só PNG/JPEG/WebP em data URL, fonte e forma só da lista, textos com limite de tamanho, código da peça só letras, números e hífen. | `app/js/marca.js` (`limpar`), `app/js/app.js` (`lerPecas`) |
| Uploads | O logo (inclusive SVG) é desenhado num canvas e guardado como PNG: scripts dentro do SVG nunca rodam. A foto vira JPEG. Só imagens; logo até 5 MB, foto até 15 MB. | `app/js/app.js` (`lerLogo`, `lerFoto`, `arquivoOk`) |
| Link do botão (e-mail) | Só aceita `https://`. Qualquer outra coisa vira `#`. | `app/js/modelos.js` |
| CSP do site | Só roda script do próprio site e o script de encaixe do título (por hash). Bloqueia `onerror=`, `javascript:`, `eval` e scripts injetados. Imagens, fontes e conexões só das origens usadas. | meta CSP em `index.html` e `app/index.html`; cabeçalhos em `_headers` |
| CSP de cada peça | Cada peça gerada tem a própria CSP com `default-src 'none'`. | `app/js/modelos.js` (`CSP_PECA`) |
| Isolamento das prévias | Prévias e vitrine rodam em iframe com `sandbox="allow-scripts"`, sem acesso à página nem aos dados guardados. | `app/js/app.js` (`quadro`), `js/vitrine.js` |
| Cabeçalhos (Worker) | `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, HSTS. | `_headers` |
| Atalhos de teste | `?teste=1` e `?plano=essencial` só existem enquanto `CADASTRO_ABERTO = false`. Quando o cadastro abrir, deixam de valer. | `app/js/app.js` |
| Regras do plano no aparelho | Limite de 3 peças por dia, layouts premium bloqueados e marca d'água no gratuito. Editar uma peça é livre até 3 vezes; depois conta como peça nova. | `app/js/app.js` |

## O que só o servidor resolve

Sem backend, qualquer regra que roda no navegador pode ser contornada por quem sabe abrir o inspetor: limpar os dados zera o limite diário, e a marca d'água da prévia pode ser apagada. Isso é aceitável no pré-lançamento, mas **não pode ser a proteção do plano pago**. O plano para o backend (Worker da Cloudflare):

1. **Cadastro e sessão**: código de acesso por e-mail (sem senha), sessão em cookie `HttpOnly; Secure; SameSite=Lax`. Nunca guardar token no `localStorage`.
2. **Antirrobô**: Cloudflare Turnstile no cadastro e no pedido de código; limite de tentativas por IP e por e-mail.
3. **Plano e cota no servidor**: D1 guarda conta, plano e uso do dia. O download só é liberado depois de o servidor conferir.
4. **Arquivo final gerado no servidor**: no gratuito, PNG com marca d'água aplicada no servidor; a prévia no navegador fica em baixa resolução.
5. **Pagamento** (quando houver CNPJ): webhook assinado do provedor, conferido no servidor; nunca confiar no retorno do navegador.
6. **LGPD**: aceite dos termos e da política de privacidade no cadastro, pedido de exclusão de conta, e mínimo de dados pessoais.
7. **Endereço oficial**: usar o Worker com domínio próprio. No GitHub Pages, `design-performance.github.io` é a mesma origem para todos os projetos da organização, e o Pages não aceita os cabeçalhos do `_headers`.

## Como conferir

```bash
node testes/seguranca/conferir.mjs        # o hash do script de encaixe bate com a CSP?
python3 testes/enxame/enxame.py           # enxame de agentes, inclusive o "hacker"
```

Se mudar o script `ENCAIXE` em `app/js/modelos.js`, rode o primeiro comando e troque o hash nos arquivos que ele apontar.

## Como avisar de uma falha

Escreva para o responsável pelo projeto em joandersantos.com.br, com os passos para reproduzir. Não publique a falha antes da correção.
