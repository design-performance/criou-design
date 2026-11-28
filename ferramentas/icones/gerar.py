"""Gera app/js/icones.js a partir dos SVGs do Tabler Icons (MIT) e da lista em temas.py.
Uso: npm pack @tabler/icons && tar xzf tabler-icons-*.tgz && python3 ferramentas/icones/gerar.py package/icons/outline
O corpo de app/js/icones.js (funções svg, url, buscar) fica igual; só os dados SVG, NOMES e TEMAS são trocados."""
import json, os, re, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(AQUI, 'temas.py'), encoding='utf-8').read())
pasta = sys.argv[1]
svg, nomes, temas = {}, {}, []
for tema, lista in TEMAS:
    ids = []
    for i, n in re.findall(r'([a-z0-9-]+):([^:]+?)(?=\s+[a-z0-9-]+:|$)', lista):
        f = os.path.join(pasta, i + '.svg')
        if not os.path.exists(f): print('não existe:', i); continue
        miolo = re.search(r'<svg[^>]*>(.*)</svg>', open(f).read(), re.S).group(1)
        miolo = re.sub(r'<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*/>', '', miolo)
        svg[i] = re.sub(r'\s+', ' ', miolo).strip(); ids.append(i); nomes.setdefault(i, n.strip())
    temas.append({'nome': tema, 'icones': ids})
alvo = os.path.join(AQUI, '..', '..', 'app', 'js', 'icones.js')
js = open(alvo, encoding='utf-8').read()
js = re.sub(r'var SVG = .*?;\n', lambda m: 'var SVG = ' + json.dumps(svg, ensure_ascii=False, separators=(',', ':')) + ';\n', js, count=1, flags=re.S)
js = re.sub(r'var NOMES = .*?;\n', lambda m: 'var NOMES = ' + json.dumps(nomes, ensure_ascii=False, separators=(',', ':')) + ';\n', js, count=1, flags=re.S)
js = re.sub(r'var TEMAS = .*?;\n', lambda m: 'var TEMAS = ' + json.dumps(temas, ensure_ascii=False, separators=(',', ':')) + ';\n', js, count=1, flags=re.S)
open(alvo, 'w', encoding='utf-8').write(js)
print(len(svg), 'ícones em', len(temas), 'temas')
