# Criou · Design por perguntas

**Você pediu, criou.** Design por perguntas, não por arrastar. Quem não entende de design responde o que sabe (formato, público, assunto, mensagem, data, foto) e recebe a peça pronta, dentro da identidade visual da marca, com a explicação de cada decisão.

Não é um editor. Não tem tela de edição livre: só aparecem escolhas seguras, como combinações de cores que passam no teste de contraste.

> Protótipo. A marca de exemplo é a JS® (Joander Santos). Padaria Aurora e Clínica Ventura são marcas fictícias, usadas para mostrar a troca de marca.

## O que está no ar

- **Página de venda** (`/`): textos do documento-base (Parte 2), com peças reais geradas pelo motor (marcas fictícias), planos e dúvidas frequentes. Faixa de pré-lançamento: cadastro, download e planos ainda não estão abertos.
- **Demonstração sem cadastro** (`/criar/`): etapa 1 (nome, logotipo opcional, cor principal) e etapa 2 (formato, público, assunto, mensagem, data, ação, foto). Prévia com marca d'água em resolução de tela, campanha completa (post, story e banner), "Por que ficou assim" e os gatilhos comerciais da Parte 6.2. "Salvar e baixar" abre o aviso de cadastro (nenhum dado é coletado ainda).
- **Protótipo original** (`/prototipo/`): a primeira versão, com a aba Marca, troca de marcas e o pacote de marca em JSON.

## Como está organizado

```
index.html            Página de venda
criar/index.html      Demonstração sem cadastro
prototipo/            Protótipo original
js/motor.js           Motor: decisões (com o porquê), desenho em canvas, prévia com marca d'água, eventos
wrangler.jsonc        Worker da Cloudflare que serve o site (.assetsignore lista o que não vai para o ar)
.nojekyll             Faz o GitHub Pages publicar os arquivos como estão
```

O motor (`js/motor.js`) é um só para qualquer marca: recebe o pacote de marca, o formato e as respostas, e devolve a peça e as decisões. Os eventos de conversão da Parte 6.3 já são registrados em `window.__eventos`; vão para a API quando o backend existir.

## Próximos passos (MVP)

1. Cadastro por código (Brevo), Turnstile e bloqueio de e-mail temporário.
2. Banco D1 (contas, marcas, peças, aceite dos termos) e R2 (logos, fotos).
3. Download da primeira campanha sem marca d'água, uma por pessoa e por empresa.
4. Assinatura mensal e anual pelo Asaas, com cancelamento no painel.
5. Termos de Uso e Política de Privacidade revisados por advogado e publicados.

## Testar no computador

```
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicar

A publicação é automática pelo **Workers Builds** da Cloudflare, ligado a este repositório: todo push na `main` publica o Worker `design-por-pergunta` (configurado em `wrangler.jsonc`, servindo a raiz do repositório). O mesmo conteúdo também sai no GitHub Pages: design-performance.github.io/design-por-pergunta/.

Para ligar (uma vez só): Cloudflare → **Workers & Pages → Create → Import a repository** → escolher `design-performance/design-por-pergunta` → **Save and Deploy**. Não precisa de token.

O site fica em `https://design-por-pergunta.<seu-subdominio>.workers.dev`. Domínio próprio: **Workers → design-por-pergunta → Settings → Domains & Routes**.

## Roadmap

1. Motor genérico: pacote de marca + modelos que leem os traços da marca.
2. E-mail marketing (HTML pronto para disparo).
3. Cadastro de marca guiado.
4. Contas, empresas e aprovação (Worker + D1 + R2).
5. Testes com 5–6 pessoas que não são designers, comparando com o Canva.
6. Publicação: landing, plano grátis com limite e case em joandersantos.com.br.
