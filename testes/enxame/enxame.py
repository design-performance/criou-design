#!/usr/bin/env python3
"""
Enxame de teste do Criou.

Inspirado em simuladores de população com agentes (como o MiroFish): em vez de um roteiro
único, solta vários agentes com personalidades diferentes (personas.json) usando o site ao
mesmo tempo. Cada um sorteia aparelho, ritmo e textos a partir da semente, anota o que deu
errado e, no fim, os achados de todos são somados: o relatório mostra quantos agentes
tropeçaram no mesmo problema.

Uso (na raiz do repositório):
  pip install playwright && python3 -m playwright install chromium
  python3 testes/enxame/enxame.py                       # enxame padrão (14 agentes)
  python3 testes/enxame/enxame.py --agentes 28 --semente 7
  python3 testes/enxame/enxame.py --personas hacker,teclado
  python3 testes/enxame/enxame.py --url https://design-performance.github.io/criou-design/

Saída: testes/enxame/saida/relatorio.html (abre no navegador) e relatorio.json.
Sem --url, sobe um servidor local com os arquivos do repositório. Por padrão, as fontes do
Google e as fotos do Unsplash são simuladas (o teste não depende de internet); use --online
para carregar as reais.
"""
import argparse, asyncio, functools, html, http.server, json, os, random, socketserver, threading, time
from pathlib import Path
from playwright.async_api import async_playwright

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
FIX = AQUI / 'fixtures'
SAIDA = AQUI / 'saida'
FOTO = (FIX / 'foto.jpg').read_bytes()
PERSONAS = json.loads((AQUI / 'personas.json').read_text('utf-8'))['personas']
GRAV = {'crítica': 0, 'alta': 1, 'média': 2, 'baixa': 3, 'info': 4}

XSS = [
    '<b data-pwn="1">negrito</b>',
    '"><img src=x data-pwn="1" onerror="top.__pwn=1">',
    "</style><script data-pwn='1'>top.__pwn=1</script>",
    '<svg data-pwn="1" onload="top.__pwn=1"></svg>',
    'javascript:top.__pwn=1',
    '==(x" data-pwn="1)==teste==',
]


# ---------------------------------------------------------------- servidor local
def servir():
    class Quieto(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quieto, directory=str(RAIZ))
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, 'http://127.0.0.1:%d/' % srv.server_address[1]


# ---------------------------------------------------------------- agente
class Agente:
    def __init__(self, n, persona, semente, base, online):
        self.n, self.persona, self.base, self.online = n, persona, base, online
        self.p = PERSONAS[persona]
        self.rnd = random.Random(semente * 1000 + n)
        w, h, movel = self.rnd.choice(self.p['aparelhos'])
        self.vw, self.vh, self.movel = w, h, movel
        self.achados, self.passos, self.medidas = [], [], {}
        self.id = '%s-%02d' % (persona, n)
        self.pg = None

    def pausa(self):
        a, b = self.p['paciencia_ms']
        return self.pg.wait_for_timeout(self.rnd.randint(a, b))

    def passo(self, t):
        self.passos.append(t)

    async def achar(self, grav, tipo, onde, detalhe, foto=True):
        arq = None
        if foto and self.pg:
            arq = 'shots/%s-%d.png' % (self.id, len(self.achados))
            try: await self.pg.screenshot(path=str(SAIDA / arq))
            except Exception: arq = None
        self.achados.append({'agente': self.id, 'persona': self.persona, 'gravidade': grav, 'tipo': tipo, 'onde': onde, 'detalhe': detalhe[:400], 'foto': arq})

    async def contexto(self, nav):
        ctx = await nav.new_context(viewport={'width': self.vw, 'height': self.vh}, is_mobile=self.movel, has_touch=self.movel, accept_downloads=True, locale='pt-BR')
        if not self.online:
            await ctx.route(lambda u: 'fonts.googleapis.com' in u, lambda r: r.fulfill(status=200, content_type='text/css', body='/* offline */'))
            await ctx.route(lambda u: 'fonts.gstatic.com' in u, lambda r: r.abort())
            await ctx.route(lambda u: 'images.unsplash.com' in u, lambda r: r.fulfill(status=200, content_type='image/jpeg', body=FOTO, headers={'Access-Control-Allow-Origin': '*'}))
        pg = await ctx.new_page()
        self.pg = pg
        base = self.base.split('/')[2]
        pg.on('pageerror', lambda e: self.achados.append({'agente': self.id, 'persona': self.persona, 'gravidade': 'alta', 'tipo': 'Erro de JavaScript', 'onde': pg.url.split('/')[-1] or 'página', 'detalhe': str(e)[:300], 'foto': None}))
        def console(m):
            t = m.text
            if m.type != 'error' or 'gstatic' in t or 'ERR_FAILED' in t or 'net::' in t: return
            g = 'alta' if 'Content Security Policy' in t else 'média'
            self.achados.append({'agente': self.id, 'persona': self.persona, 'gravidade': g, 'tipo': 'Bloqueio da CSP' if g == 'alta' else 'Erro no console', 'onde': pg.url.split('/')[-1] or 'página', 'detalhe': t[:300], 'foto': None})
        pg.on('console', console)
        pg.on('response', lambda r: (base in r.url and r.status >= 400) and self.achados.append({'agente': self.id, 'persona': self.persona, 'gravidade': 'média', 'tipo': 'Arquivo não encontrado', 'onde': r.url.replace(self.base, '/'), 'detalhe': 'HTTP %d' % r.status, 'foto': None}))
        pg.on('request', lambda r: '__pwn' in r.url and self.achados.append({'agente': self.id, 'persona': self.persona, 'gravidade': 'crítica', 'tipo': 'Código injetado rodou', 'onde': r.url, 'detalhe': 'Um payload fez uma requisição', 'foto': None}))
        return ctx, pg

    # ------------------------------------------------------------ utilidades do estúdio
    async def entrar(self, plano='', teste=True, nome='Padaria Sol', cor='#FF6A00'):
        q = '?nome=%s&cor=%s' % (nome.replace(' ', '%20'), cor.replace('#', '%23'))
        if teste: q += '&teste=1'
        if plano: q += '&plano=' + plano
        await self.pg.goto(self.base + 'app/' + q)
        await self.pg.wait_for_timeout(700)
        if await self.pg.locator('#vista-entrada').is_visible():
            await self.pg.click('#form-entrada button[type=submit]')
        await self.pg.wait_for_selector('#vista-criar:not([hidden])', timeout=8000)
        await self.pg.wait_for_timeout(500)

    async def aba(self, n):
        if self.vw <= 960:
            b = self.pg.locator('.abas [data-aba="%s"]' % n)
            if await b.count(): await b.click(); await self.pg.wait_for_timeout(400)

    async def sub(self, nome):
        """Abre uma aba das Opções (Layout, Cor, Fonte, Texto)."""
        await self.aba('opcoes')
        b = self.pg.locator('.sub-abas [data-sub="%s"]' % nome)
        if await b.count(): await b.click(); await self.pg.wait_for_timeout(150)

    async def quadro(self):
        el = await self.pg.query_selector('#palco iframe')
        return await el.content_frame() if el else None

    async def conferir_peca(self, onde):
        """Olha dentro da peça (funciona mesmo com sandbox): texto fora da área ou cortado."""
        fr = await self.quadro()
        if not fr: return 'sem prévia'
        try:
            await fr.wait_for_load_state('load', timeout=4000)
            return await fr.evaluate('''() => {
              const peca = document.querySelector('[data-x=peca]'); if (!peca) return null;
              const B = peca.getBoundingClientRect(), r = [], U = Math.min(B.width, B.height);
              const vis = e => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden=true]') && e.textContent.trim(); };
              const textos = [...document.querySelectorAll('[data-x=texto]')].filter(vis);
              const folhas = textos.filter(e => !e.querySelector('[data-x=texto]') && !e.closest('[data-intencional]'));  // corte e fita sobrepõem de propósito
              const nome = e => e.textContent.trim().slice(0, 28);
              document.querySelectorAll('[data-pilha]').forEach(p => { const a = p.getBoundingClientRect();
                if (a.left < B.left - 2 || a.right > B.right + 2 || a.top < B.top - 2 || a.bottom > B.bottom + 2) r.push('bloco de texto sai da peça'); });
              folhas.forEach(e => { const a = e.getBoundingClientRect(), cs = getComputedStyle(e);
                if (a.width && (a.left < B.left - 3 || a.right > B.right + 3 || a.top < B.top - 3 || a.bottom > B.bottom + 3)) r.push('texto passa da borda: "' + nome(e) + '"');
                if (cs.overflow !== 'visible' && (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 2)) r.push('texto cortado: "' + nome(e) + '"');
                for (let p = e.parentElement; p && p !== peca; p = p.parentElement) { if (getComputedStyle(p).overflow === 'visible') continue;
                  const q = p.getBoundingClientRect(); if (a.right > q.right + 3 || a.left < q.left - 3 || a.bottom > q.bottom + 3) r.push('texto cortado pela caixa: "' + nome(e) + '"'); break; }
                if (e.scrollWidth > e.clientWidth + 2 && cs.whiteSpace === 'nowrap' && e.clientWidth) r.push('texto maior que a caixa: "' + nome(e) + '"'); });
              const fit = document.querySelector('[data-fit]');
              if (fit && vis(fit)) { const t = parseFloat(getComputedStyle(fit).fontSize) * (parseFloat(getComputedStyle(fit.parentElement).zoom) || 1);
                if (t < U * 0.03) r.push('título minúsculo (' + Math.round(t) + 'px numa peça de ' + Math.round(U) + 'px)'); }
              for (let i = 0; i < folhas.length; i++) for (let j = i + 1; j < folhas.length; j++) {
                const x = folhas[i], y = folhas[j]; if (x.contains(y) || y.contains(x)) continue;
                const a = x.getBoundingClientRect(), b = y.getBoundingClientRect();
                const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
                if (w > 2 && h > 2 && w * h > 0.15 * Math.min(a.width * a.height, b.width * b.height)) r.push('textos sobrepostos: "' + nome(x) + '" e "' + nome(y) + '"');
              }
              return r.length ? [...new Set(r)].slice(0, 4).join(' · ') : null; }''')
        except Exception as e:
            return 'não deu para ler a prévia: ' + str(e)[:80]

    async def sem_rolagem_lateral(self, onde):
        sw = await self.pg.evaluate('document.documentElement.scrollWidth')
        if sw > self.vw + 1:
            await self.achar('média', 'Rolagem lateral', onde, 'A página tem %dpx numa tela de %dpx.' % (sw, self.vw))

    async def baixar_primeiro(self, onde):
        b = self.pg.locator('#baixar button').first
        if not await b.count():
            return None
        try:
            async with self.pg.expect_download(timeout=30000) as d:
                await b.click()
            dl = await d.value
            tam = os.path.getsize(await dl.path())
            if tam < 2000: await self.achar('alta', 'Download vazio', onde, '%s com %d bytes' % (dl.suggested_filename, tam))
            return dl.suggested_filename
        except Exception as e:
            await self.achar('alta', 'Download falhou', onde, str(e)[:200])
            return None

    async def varrer_injecao(self, onde):
        achou = []
        for fr in self.pg.frames:
            try:
                r = await fr.evaluate('''() => ({ el: document.querySelectorAll('[data-pwn]').length, flag: !!window.__pwn })''')
                if r['el'] or r['flag']: achou.append('%s (%s)' % (fr.url[:40] or 'srcdoc', r))
            except Exception:
                pass
        try:
            if await self.pg.evaluate('!!window.__pwn'): achou.append('página principal executou código')
        except Exception:
            pass
        if achou:
            await self.achar('crítica', 'Injeção de HTML/código', onde, '; '.join(achou))
        return not achou

    # ------------------------------------------------------------ personas
    async def iniciante(self):
        t0 = time.time()
        await self.entrar(teste=self.rnd.random() < .5, nome='Padaria da Lúcia')
        self.passo('entrou no estúdio')
        tit = self.rnd.choice(self.p['titulos'])
        await self.pg.locator('#f-titulo').press_sequentially(tit, delay=self.rnd.randint(40, 110))
        self.passo('escreveu o título')
        await self.pausa()
        await self.sem_rolagem_lateral('estúdio (Informações)')
        pequenos = await self.pg.evaluate('''() => [...document.querySelectorAll('#vista-criar button, #vista-criar a, #vista-criar input:not([type=hidden])')]
          .filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).opacity !== '0' && (r.height < 32 || r.width < 32) && e.offsetParent; })
          .map(e => (e.textContent || e.getAttribute('aria-label') || e.id || e.tagName).trim().slice(0, 30))''')
        if pequenos:
            await self.achar('baixa', 'Alvo de toque pequeno', 'estúdio no celular', '%d controles com menos de 32px: %s' % (len(pequenos), ', '.join(pequenos[:6])), foto=False)
        await self.aba('criacao')
        t1 = time.time()
        try:
            await self.pg.wait_for_selector('#palco iframe', timeout=6000)
            self.medidas['prévia_s'] = round(time.time() - t1, 2)
        except Exception:
            await self.achar('alta', 'Prévia não apareceu', 'aba Prévia', 'Depois de escrever o título, a prévia não apareceu em 6 s.')
            return
        p = await self.conferir_peca('prévia')
        if p: await self.achar('média', 'Problema na peça', 'prévia', p)
        reg = self.pg.locator('#registrar')
        if not await reg.is_visible():
            await self.achar('alta', 'Botão escondido', 'aba Prévia', 'O botão "Registrar peça" não está visível para quem acabou de ver a prévia.')
            return
        await reg.click(); self.passo('registrou')
        await self.pg.wait_for_timeout(900)
        if not await self.pg.locator('#feito').is_visible():
            msg = (await self.pg.locator('#msgs').inner_text())[:200]
            await self.achar('média', 'Não conseguiu registrar', 'aba Prévia', 'Clicou em registrar e nada de "peça registrada". Mensagem: ' + msg)
            return
        txt = await self.pg.locator('#baixar').inner_text()
        if 'cadastro' in txt.lower():
            self.passo('viu que precisa de cadastro para baixar')
        else:
            arq = await self.baixar_primeiro('download no celular')
            if arq: self.passo('baixou ' + arq)
        self.medidas['tempo_total_s'] = round(time.time() - t0, 1)

    async def apressado(self):
        t0 = time.time()
        await self.entrar(teste=True, nome='Loja do Rafa', cor='#E3263C')
        await self.pg.fill('#f-titulo', self.rnd.choice(self.p['titulos']))
        fmt = self.rnd.choice(['post-retrato', 'story', 'kit', 'post-quadrado'])
        await self.pg.click('[data-f="%s"]' % fmt); self.passo('formato ' + fmt)
        lays = await self.pg.eval_on_selector_all('.lay[data-l]', 'e => e.map(x => [x.dataset.l, !!x.querySelector(".cadeado")])')
        tempos = []
        for _ in range(6):
            l, trava = self.rnd.choice(lays)
            antes = await self.pg.evaluate("(document.querySelector('#palco iframe')||{}).srcdoc||''")
            t = time.time()
            await self.pg.click('.lay[data-l="%s"]' % l)
            for _ in range(40):
                agora = await self.pg.evaluate("(document.querySelector('#palco iframe')||{}).srcdoc||''")
                if agora != antes: break
                await self.pg.wait_for_timeout(50)
            tempos.append(time.time() - t)
            await self.sub('cor')
            sw = self.pg.locator('#paletas .pal')
            if await sw.count(): await sw.nth(self.rnd.randrange(await sw.count())).click()
            await self.sub('layout')
            await self.pausa()
        self.medidas['troca_layout_ms'] = round(1000 * sum(tempos) / len(tempos))
        if self.medidas['troca_layout_ms'] > 1500:
            await self.achar('média', 'Troca lenta', 'layouts', 'Trocar de layout leva em média %d ms.' % self.medidas['troca_layout_ms'], foto=False)
        livre = [l for l, trava in lays if not trava]
        await self.pg.click('.lay[data-l="%s"]' % self.rnd.choice(livre))
        await self.pg.wait_for_timeout(400)
        await self.pg.click('#registrar')
        await self.pg.wait_for_timeout(900)
        if not await self.pg.locator('#feito').is_visible():
            await self.achar('média', 'Não conseguiu registrar', 'estúdio', (await self.pg.locator('#msgs').inner_text())[:200])
            return
        await self.baixar_primeiro('download ' + fmt)
        self.medidas['tempo_total_s'] = round(time.time() - t0, 1)
        if self.medidas['tempo_total_s'] > 60:
            await self.achar('baixa', 'Demorou mais de 1 minuto', 'fluxo completo', '%.0f s do início ao download' % self.medidas['tempo_total_s'], foto=False)

    async def designer(self):
        await self.entrar(plano='essencial', nome='Studio Vento', cor='#1F8A70')
        await self.pg.set_input_files('#f-imagem', str(FIX / 'foto.jpg'))
        await self.pg.wait_for_timeout(1200)
        await self.pg.evaluate("document.querySelectorAll('#formatos details').forEach(d => d.open = true)")
        fmts = await self.pg.eval_on_selector_all('[data-f]', 'e => e.map(x => x.dataset.f)')
        meus = [f for i, f in enumerate(fmts) if i % 2 == self.n % 2]
        for k, tit in enumerate(self.p['titulos']):
            await self.pg.fill('#f-titulo', tit)
            if k:  # na segunda rodada, todos os campos cheios, como um cliente caprichoso
                await self.pg.evaluate("document.querySelectorAll('#form-peca details').forEach(d => d.open = true)")
                for campo, v in [('f-apoio', 'Traga um amigo e ganhe um café. Vagas limitadas para quem chegar primeiro.'), ('f-data', '2026-12-13'), ('f-hora', '09:30'), ('f-local', 'Rua das Flores, 1234, Centro'), ('f-chamada', 'Garanta já o seu lugar')]:
                    if await self.pg.locator('#' + campo).count():
                        try: await self.pg.fill('#' + campo, v)
                        except Exception: pass
            for f in meus:
                await self.pg.click('[data-f="%s"]' % f)
                await self.pg.wait_for_timeout(300)
                for l in await self.pg.eval_on_selector_all('.lay[data-l]', 'e => e.map(x => x.dataset.l)'):
                    await self.pg.click('.lay[data-l="%s"]' % l)
                    await self.pausa()
                    p = await self.conferir_peca('%s / %s' % (f, l))
                    if p: await self.achar('média', 'Problema na peça', '%s / %s (título de %d letras)' % (f, l, len(tit)), p)
                    await self.sub('texto')
                    gir = self.pg.locator('#ctl-girar:not([hidden]) [data-v]')
                    if await gir.count() > 1:
                        await gir.nth(1).click(); await self.pausa()
                        p = await self.conferir_peca('%s / %s girado' % (f, l))
                        if p: await self.achar('média', 'Problema na peça', '%s / %s com texto girado' % (f, l), p)
                        await gir.nth(0).click()
                    await self.sub('layout')
        self.passo('conferiu %d formatos' % len(meus))

    async def hacker(self):
        # 1. textos maliciosos em todos os campos
        await self.entrar(teste=True, nome='Teste')
        await self.pg.evaluate("document.querySelectorAll('details').forEach(d => d.open = true)")
        campos = await self.pg.eval_on_selector_all('#form-peca input[type=text], #form-peca textarea, #form-peca input:not([type]), #form-peca [contenteditable=true]', 'e => e.map(x => x.id).filter(Boolean)')
        for i, c in enumerate(campos):
            try: await self.pg.fill('#' + c, XSS[i % len(XSS)])
            except Exception: pass
        for f in ['post-retrato', 'email', 'story']:
            await self.pg.click('[data-f="%s"]' % f); await self.pg.wait_for_timeout(700)
            await self.aba('criacao')
            await self.varrer_injecao('campos do estúdio (%s)' % f)
            await self.aba('info')
        self.passo('textos maliciosos em %d campos' % len(campos))
        # 2. nome pela URL
        await self.pg.context.clear_cookies()
        await self.pg.evaluate('localStorage.clear()')
        await self.pg.goto(self.base + 'app/?nome=%3Cb%20data-pwn%3D1%3Ex%3C%2Fb%3E&teste=1')
        await self.pg.wait_for_timeout(1200)
        await self.varrer_injecao('nome da marca pela URL')
        # 3. dados envenenados no aparelho
        ruim = '#111"><b data-pwn=1>x</b>'
        await self.pg.evaluate('''r => {
          localStorage.setItem('criou.marca.v1', JSON.stringify({ nome: 'Ok', configurada: true, logo: 'x" data-pwn="1', logoClaro: 'javascript:1',
            cores: { principal: r, escura: r, acao: 'red;}</style><b data-pwn=1>', destaque: '', fundo: '' }, fontes: { titulo: '</style><b data-pwn=1>', texto: 'Inter' }, forma: '<b data-pwn=1>' }));
          localStorage.setItem('criou.pecas.v1', JSON.stringify([{ codigo: '<b data-pwn=1>x</b>', formato: 'post-retrato', estilo: 'limpo', cor: r, dados: { titulo: '<b data-pwn=1>t</b>' }, quando: 'x' },
            { codigo: 'CR-OK123', formato: 'post-retrato', estilo: 'limpo', cor: '#123456', dados: { titulo: 'Peça boa' }, quando: new Date().toISOString() }]));
        }''', ruim)
        await self.pg.goto(self.base + 'app/?teste=1#criar'); await self.pg.wait_for_timeout(1500)
        await self.varrer_injecao('marca envenenada no aparelho')
        await self.pg.goto(self.base + 'app/?teste=1#pecas'); await self.pg.wait_for_timeout(1000)
        await self.varrer_injecao('lista de peças envenenada')
        boa = await self.pg.locator('#lista-pecas').inner_text()
        if 'Peça boa' not in boa:
            await self.achar('alta', 'Peças sumiram', 'Minhas peças', 'Uma peça válida não aparece quando há outra corrompida na lista.')
        # 4. uploads
        await self.pg.evaluate('localStorage.clear()')
        await self.pg.goto(self.base + 'app/?teste=1'); await self.pg.wait_for_timeout(800)
        if await self.pg.locator('#e-logo').count():
            await self.pg.set_input_files('#e-logo', str(FIX / 'logo-malicioso.svg')); await self.pg.wait_for_timeout(1200)
            await self.varrer_injecao('logo SVG com script')
            await self.pg.fill('#e-nome', 'Marca SVG')
            await self.pg.click('#form-entrada button[type=submit]'); await self.pg.wait_for_timeout(900)
            logo = await self.pg.evaluate("(JSON.parse(localStorage.getItem('criou.marca.v1')||'{}').logo||'').slice(0,30)")
            if logo and not logo.startswith('data:image/png'):
                await self.achar('alta', 'SVG guardado cru', 'logo', 'O logo foi guardado como ' + logo)
            await self.varrer_injecao('peça com logo SVG')
        await self.pg.wait_for_selector('#vista-criar:not([hidden])', timeout=6000)
        await self.pg.set_input_files('#f-imagem', str(FIX / 'falso.png')); await self.pg.wait_for_timeout(800)
        await self.pg.set_input_files('#f-imagem', {'name': 'enorme.jpg', 'mimeType': 'image/jpeg', 'buffer': b'\xff\xd8' + b'0' * (16 * 1048576)})
        await self.pg.wait_for_timeout(800)
        self.passo('uploads maliciosos')
        # 5. sandbox da prévia
        await self.aba('criacao')
        sb = await self.pg.evaluate("(document.querySelector('#palco iframe')||{getAttribute(){return 'sem iframe'}}).getAttribute('sandbox')")
        if sb is None or 'allow-same-origin' in (sb or ''):
            await self.achar('média', 'Prévia sem isolamento', 'iframe da prévia', 'sandbox=%r' % sb, foto=False)
        # 6. regras do plano gratuito
        await self.pg.evaluate('localStorage.clear()')
        await self.entrar(teste=True, nome='Plano Livre')
        await self.pg.fill('#f-titulo', 'Testando o limite')
        prem = self.pg.locator('.lay:has(.cadeado)').first
        if await prem.count():
            await prem.click(); await self.pg.wait_for_timeout(400)
            await self.aba('criacao'); await self.pg.click('#registrar'); await self.pg.wait_for_timeout(700)
            if await self.pg.locator('#feito').is_visible():
                await self.achar('alta', 'Premium liberado no grátis', 'layouts premium', 'Registrou um layout premium no plano gratuito.')
            await self.aba('opcoes')
            await self.pg.click('.lay:not(:has(.cadeado))'); await self.pg.wait_for_timeout(300)
        feitas = 0
        for i in range(5):
            await self.aba('info'); await self.pg.fill('#f-titulo', 'Peça número %d' % (i + 1))
            await self.aba('criacao'); await self.pg.click('#registrar'); await self.pg.wait_for_timeout(700)
            if await self.pg.locator('#feito').is_visible():
                feitas += 1; await self.pg.click('#nova'); await self.pg.wait_for_timeout(400)
        if feitas > 3:
            await self.achar('alta', 'Limite diário não segurou', 'plano gratuito', 'Registrou %d peças novas num dia (limite 3).' % feitas)
        self.medidas['peças_no_grátis'] = feitas
        await self.achar('info', 'Limitação conhecida', 'regras do plano', 'Sem servidor, limpar os dados do navegador zera o limite diário e a marca d\'água pode ser tirada pelo inspetor. Só o backend resolve.', foto=False)

    async def teclado(self):
        await self.pg.goto(self.base + 'index.html'); await self.pg.wait_for_timeout(1000)
        sem_foco, visitados = [], 0
        for _ in range(45):
            await self.pg.keyboard.press('Tab'); visitados += 1
            r = await self.pg.evaluate('''() => { const e = document.activeElement; if (!e || e === document.body) return null;
              const cs = getComputedStyle(e); const vis = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
              return { vis, nome: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30) }; }''')
            if r and not r['vis']: sem_foco.append(r['nome'])
        if sem_foco:
            await self.achar('média', 'Foco invisível', 'página inicial', '%d de %d elementos sem indicação de foco: %s' % (len(sem_foco), visitados, ', '.join(sorted(set(sem_foco))[:8])), foto=False)
        await self.entrar(teste=True, nome='Caio Teclado')
        await self.pg.evaluate("document.activeElement && document.activeElement.blur(); window.scrollTo(0,0)")
        chegou = False
        for i in range(160):
            await self.pg.keyboard.press('Tab')
            idd = await self.pg.evaluate('document.activeElement && document.activeElement.id')
            if idd == 'f-titulo':
                await self.pg.keyboard.type('Feira de troca no domingo'); self.passo('título digitado no Tab %d' % i)
            if idd == 'registrar':
                await self.pg.keyboard.press('Enter'); chegou = True; self.medidas['tabs_até_registrar'] = i + 1; break
        if not chegou:
            await self.achar('alta', 'Inalcançável pelo teclado', 'estúdio', 'Não chegou ao botão "Registrar peça" com Tab.')
            return
        await self.pg.wait_for_timeout(800)
        if not await self.pg.locator('#feito').is_visible():
            await self.achar('média', 'Não registrou pelo teclado', 'estúdio', (await self.pg.locator('#msgs').inner_text())[:200])
        elif self.medidas['tabs_até_registrar'] > 60:
            await self.achar('baixa', 'Caminho longo no teclado', 'estúdio', 'Foram %d Tabs até registrar.' % self.medidas['tabs_até_registrar'], foto=False)

    async def lenta(self):
        cdp = await self.pg.context.new_cdp_session(self.pg)
        await cdp.send('Network.enable')
        await cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 300, 'downloadThroughput': 90 * 1024, 'uploadThroughput': 40 * 1024})
        await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        t = time.time()
        await self.pg.goto(self.base + 'index.html', wait_until='commit', timeout=90000)
        for _ in range(450):  # wait_for_function usa eval, que a CSP do site bloqueia
            try:
                if await self.pg.evaluate("performance.getEntriesByName('first-contentful-paint').length"): break
            except Exception: pass
            await asyncio.sleep(.2)
        self.medidas['landing_1a_pintura_s'] = round(await self.pg.evaluate("performance.getEntriesByName('first-contentful-paint')[0].startTime") / 1000, 1)
        await self.pg.wait_for_load_state('domcontentloaded', timeout=90000)
        self.medidas['landing_pronta_s'] = round(time.time() - t, 1)
        if self.medidas['landing_1a_pintura_s'] > 6:
            await self.achar('média', 'Página lenta no 3G', 'página inicial', 'O primeiro conteúdo levou %.1f s para aparecer.' % self.medidas['landing_1a_pintura_s'], foto=False)
        t = time.time()
        await self.entrar(teste=False, nome='Mercearia')
        await self.pg.fill('#f-titulo', 'Pamonha fresquinha')
        await self.aba('criacao')
        try:
            await self.pg.wait_for_selector('#palco iframe', timeout=30000)
            self.medidas['estúdio_até_prévia_s'] = round(time.time() - t, 1)
            if self.medidas['estúdio_até_prévia_s'] > 15:
                await self.achar('média', 'Estúdio lento no 3G', 'estúdio', '%.1f s até a primeira prévia.' % self.medidas['estúdio_até_prévia_s'])
        except Exception:
            await self.achar('alta', 'Estúdio não abriu no 3G', 'estúdio', 'Sem prévia em 30 s.')

    async def caotico(self):
        await self.entrar(teste=True, nome='Gremlin')
        lixo = ['', ' ', '😀🔥'*30, 'a'*500, '==', '**', '<i>', '12/13/9999', '-1', 'ÇÃÕ ñ ß 中文 العربية']
        for i in range(70):
            acao = self.rnd.random()
            try:
                if acao < .5:
                    alvos = await self.pg.query_selector_all('#conteudo button:visible, #conteudo summary:visible, header a:visible')
                    if alvos: await self.rnd.choice(alvos).click(timeout=1500)
                elif acao < .8:
                    cs = await self.pg.query_selector_all('#conteudo input[type=text]:visible, #conteudo textarea:visible, #conteudo input:not([type]):visible')
                    if cs: await self.rnd.choice(cs).fill(self.rnd.choice(lixo), timeout=1500)
                elif acao < .9 and self.movel:
                    self.vw, self.vh = self.vh, self.vw
                    await self.pg.set_viewport_size({'width': self.vw, 'height': self.vh})
                else:
                    await self.pg.go_back(timeout=3000) if self.rnd.random() < .3 else await self.pg.keyboard.press(self.rnd.choice(['Escape', 'Enter', 'Tab', 'Space']))
            except Exception:
                pass
            await self.pausa()
        self.passo('70 ações aleatórias')
        if not await self.pg.locator('body').is_visible():
            await self.achar('alta', 'Página travou', 'estúdio', 'Depois das ações aleatórias, a página não respondeu.')

    async def rodar(self, nav):
        ctx, pg = await self.contexto(nav)
        t = time.time()
        try:
            await getattr(self, self.persona)()
        except Exception as e:
            await self.achar('alta', 'Agente travou', self.persona, '%s: %s' % (type(e).__name__, str(e)[:250]))
        self.medidas['duração_s'] = round(time.time() - t, 1)
        await ctx.close()
        return {'id': self.id, 'persona': self.persona, 'quem': self.p['nome'] + ', ' + self.p['quem'], 'tela': '%dx%d%s' % (self.vw, self.vh, ' (celular)' if self.movel else ''), 'passos': self.passos, 'medidas': self.medidas, 'achados': self.achados}


# ---------------------------------------------------------------- relatório
def relatorio(agentes, args, dur):
    todos = [a for ag in agentes for a in ag['achados']]
    grupos = {}
    for a in todos:
        k = (a['gravidade'], a['tipo'], a['onde'] if a['tipo'] != 'Problema na peça' else a['onde'].split(' (')[0])
        g = grupos.setdefault(k, {'gravidade': a['gravidade'], 'tipo': a['tipo'], 'onde': k[2], 'agentes': set(), 'personas': set(), 'exemplo': a['detalhe'], 'foto': a['foto']})
        g['agentes'].add(a['agente']); g['personas'].add(a['persona'])
        if not g['foto'] and a['foto']: g['foto'] = a['foto']
    lista = sorted(grupos.values(), key=lambda g: (GRAV[g['gravidade']], -len(g['agentes'])))
    for g in lista: g['agentes'] = sorted(g['agentes']); g['personas'] = sorted(g['personas'])
    dados = {'quando': time.strftime('%Y-%m-%d %H:%M'), 'semente': args.semente, 'url': args.url or 'local', 'duração_s': round(dur), 'agentes': agentes, 'achados': lista}
    (SAIDA / 'relatorio.json').write_text(json.dumps(dados, ensure_ascii=False, indent=1), 'utf-8')
    e = html.escape
    cont = {k: sum(1 for g in lista if g['gravidade'] == k) for k in GRAV}
    cor = {'crítica': '#b00020', 'alta': '#d9480f', 'média': '#b8860b', 'baixa': '#4a6fa5', 'info': '#666'}
    linhas = ''.join('<tr><td><span class="g" style="background:%s">%s</span></td><td><b>%s</b><br><small>%s</small></td><td>%s</td><td>%d de %d<br><small>%s</small></td><td>%s</td></tr>' % (
        cor[g['gravidade']], g['gravidade'], e(g['tipo']), e(g['onde']), e(g['exemplo']), len(g['agentes']), len(agentes), e(', '.join(g['personas'])),
        '<a href="%s"><img src="%s" alt="captura"></a>' % (g['foto'], g['foto']) if g['foto'] else '') for g in lista) or '<tr><td colspan="5">Nenhum problema encontrado.</td></tr>'
    cards = ''.join('<div class="ag"><b>%s</b> · %s<br><small>%s</small><p>%s</p><p class="m">%s</p><p class="m">%d achado(s)</p></div>' % (
        e(a['id']), e(a['tela']), e(a['quem']), e(' → '.join(a['passos']) or '—'), e(', '.join('%s: %s' % kv for kv in a['medidas'].items())), len(a['achados'])) for a in agentes)
    pagina = '''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enxame de teste do Criou</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:32px;max-width:1200px;margin:auto;color:#111}h1{margin:0 0 4px}table{width:100%%;border-collapse:collapse;margin:20px 0}td,th{border-top:1px solid #ddd;padding:10px;vertical-align:top;text-align:left}
.g{color:#fff;border-radius:99px;padding:2px 10px;font-size:12px;font-weight:700}img{width:160px;border:1px solid #ddd;border-radius:6px}.res{display:flex;gap:10px;flex-wrap:wrap}.res div{background:#f3f3f6;border-radius:10px;padding:10px 16px}
.ags{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}.ag{border:1px solid #ddd;border-radius:10px;padding:12px}.ag p{margin:6px 0 0}.m{color:#555;font-size:13px}small{color:#555}</style></head><body>
<h1>Enxame de teste do Criou</h1><p>%s · %d agentes · semente %s · %s · %d s</p>
<div class="res">%s</div><h2>Achados (agrupados)</h2><table><tr><th>Gravidade</th><th>O quê</th><th>Detalhe</th><th>Quem viu</th><th>Captura</th></tr>%s</table>
<h2>Agentes</h2><div class="ags">%s</div></body></html>''' % (dados['quando'], len(agentes), args.semente, e(dados['url']), dur, ''.join('<div><b>%d</b> %s</div>' % (cont[k], k) for k in GRAV), linhas, cards)
    (SAIDA / 'relatorio.html').write_text(pagina, 'utf-8')
    return lista, cont


async def principal(args):
    SAIDA.mkdir(exist_ok=True); (SAIDA / 'shots').mkdir(exist_ok=True)
    for f in (SAIDA / 'shots').glob('*.png'): f.unlink()
    srv = None
    base = args.url
    if not base:
        srv, base = servir()
    if not base.endswith('/'): base += '/'
    nomes = list(PERSONAS) if args.personas == 'todas' else args.personas.split(',')
    fila = [nomes[i % len(nomes)] for i in range(max(args.agentes, len(nomes)))]
    agentes = [Agente(i, p, args.semente, base, args.online) for i, p in enumerate(fila)]
    sem = asyncio.Semaphore(args.paralelo)
    t = time.time()
    async with async_playwright() as pw:
        nav = await pw.chromium.launch()
        async def um(a):
            async with sem:
                r = await a.rodar(nav)
                print('  %-14s %-20s %2d achado(s)  %s' % (r['id'], r['tela'], len(r['achados']), r['medidas']))
                return r
        res = await asyncio.gather(*[um(a) for a in agentes])
        await nav.close()
    lista, cont = relatorio(res, args, time.time() - t)
    if srv: srv.shutdown()
    print('\nResumo: ' + ', '.join('%d %s' % (cont[k], k) for k in GRAV))
    for g in lista[:15]:
        print('  [%s] %s — %s (%d agente/s)' % (g['gravidade'], g['tipo'], g['onde'], len(g['agentes'])))
    print('\nRelatório: ' + str(SAIDA / 'relatorio.html'))
    return 1 if cont['crítica'] or cont['alta'] else 0


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Enxame de agentes testando o Criou')
    ap.add_argument('--agentes', type=int, default=14)
    ap.add_argument('--semente', type=int, default=42)
    ap.add_argument('--personas', default='todas', help='lista separada por vírgula: ' + ','.join(PERSONAS))
    ap.add_argument('--paralelo', type=int, default=4)
    ap.add_argument('--url', default='', help='testa um endereço publicado em vez do servidor local')
    ap.add_argument('--online', action='store_true', help='carrega Google Fonts e Unsplash de verdade')
    raise SystemExit(asyncio.run(principal(ap.parse_args())))
