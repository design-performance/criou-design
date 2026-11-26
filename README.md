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
.github/workflows/
  publicar.yml        Publica na Cloudflare a cada mudança em public/
```

Próximo passo de código: separar `public/index.html` em `motor.js` (decisões), `desenho.js` (canvas), `marcas/*.json` (pacotes de marca) e `formatos/*.json`, seguindo o modelo do Sistema de Marketing.

## Testar no computador

```
cd public
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicar

A publicação é automática: todo push na `main` que mexe em `public/` publica no Worker `design-por-pergunta` da Cloudflare.

Para funcionar, o repositório precisa da chave da Cloudflare (uma vez só):

1. Na Cloudflare, crie um token em **My Profile → API Tokens → Create Token → Edit Cloudflare Workers**.
2. No GitHub, em **Settings → Secrets and variables → Actions → New repository secret**, crie `CLOUDFLARE_API_TOKEN` com o token.
3. Em **Actions → Publicar site (Cloudflare) → Run workflow**, rode a primeira publicação.

O site fica em `https://design-por-pergunta.<seu-subdominio>.workers.dev`. Depois dá para apontar um domínio próprio em **Workers → design-por-pergunta → Settings → Domains & Routes**.

## Roadmap

1. Motor genérico: pacote de marca + modelos que leem os traços da marca.
2. E-mail marketing (HTML pronto para disparo).
3. Cadastro de marca guiado.
4. Contas, empresas e aprovação (Worker + D1 + R2).
5. Testes com 5–6 pessoas que não são designers, comparando com o Canva.
6. Publicação: landing, plano grátis com limite e case em joandersantos.com.br.
