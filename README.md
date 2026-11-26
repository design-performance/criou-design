# Design por perguntas

**Design por perguntas, não por arrastar.** Quem não entende de design responde o que sabe (formato, público, assunto, mensagem, data, foto) e recebe a peça pronta, dentro da identidade visual da marca, com a explicação de cada decisão.

Não é um editor. Não tem tela de edição livre: só aparecem escolhas seguras, como combinações de cores que passam no teste de contraste.

> Protótipo. A marca de exemplo é a JS® (Joander Santos). Padaria Aurora e Clínica Ventura são marcas fictícias, usadas para mostrar a troca de marca.

## O que já funciona

- **Criar peça:** 8 perguntas → post do feed (1080×1350), story (1080×1920) ou banner do site (1500×500).
- **Por que ficou assim:** cada decisão do sistema explicada em linguagem simples.
- **Avisos de texto:** título longo, tudo em maiúsculas, excesso de "!", "clique aqui".
- **Marca:** nome, logo (texto ou PNG), 3 cores por papel, fontes, forma (pílula, arredondado, reto) e grafismo (vetor, pontos, faixa).
- **Contraste:** o sistema testa cada combinação de cores e esconde as que não passam em 4,5:1.
- **Pacote de marca:** tudo o que a marca define sai num JSON. O motor é o mesmo para qualquer empresa.
- **Baixar PNG** no tamanho exato do formato.

## Como está organizado

```
public/
  index.html          Protótipo completo (interface, motor de decisões e desenho em canvas)
wrangler.jsonc        Configuração do Worker da Cloudflare que serve o site
```

Próximo passo de código: separar `public/index.html` em `motor.js` (decisões), `desenho.js` (canvas), `marcas/*.json` (pacotes de marca) e `formatos/*.json`, seguindo o modelo do Sistema de Marketing.

## Testar no computador

```
cd public
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicar

A publicação é automática pelo **Workers Builds** da Cloudflare, ligado a este repositório: todo push na `main` publica o Worker `design-por-pergunta` (configurado em `wrangler.jsonc`, servindo a pasta `public/`).

Para ligar (uma vez só): Cloudflare → **Workers & Pages → Create → Import a repository** → escolher `design-performance/design-por-pergunta` → **Save and Deploy**. Não precisa de token.

O site fica em `https://design-por-pergunta.<seu-subdominio>.workers.dev`. Domínio próprio: **Workers → design-por-pergunta → Settings → Domains & Routes**.

## Roadmap

1. Motor genérico: pacote de marca + modelos que leem os traços da marca.
2. E-mail marketing (HTML pronto para disparo).
3. Cadastro de marca guiado.
4. Contas, empresas e aprovação (Worker + D1 + R2).
5. Testes com 5–6 pessoas que não são designers, comparando com o Canva.
6. Publicação: landing, plano grátis com limite e case em joandersantos.com.br.
