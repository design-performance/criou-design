// Confere se o hash do script de encaixe (app/js/modelos.js) bate com a CSP em todos os lugares.
// Uso: node testes/seguranca/conferir.mjs   (sai com código 1 se algo estiver errado)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const raiz = new URL('../../', import.meta.url);
const ler = (p) => readFileSync(new URL(p, raiz), 'utf8');
const linha = ler('app/js/modelos.js').split('\n').find((l) => l.trim().startsWith('var ENCAIXE'));
let ENCAIXE; eval(linha.replace('var ENCAIXE', 'ENCAIXE'));
const hash = 'sha256-' + createHash('sha256').update(ENCAIXE.replace(/^<script>/, '').replace(/<\/script>$/, '')).digest('base64');
let ok = true;
for (const arq of ['app/js/modelos.js', 'index.html', 'app/index.html', '_headers']) {
  const tem = ler(arq).includes(hash);
  console.log((tem ? 'ok    ' : 'FALTA ') + arq);
  ok = ok && tem;
}
console.log('hash atual: ' + hash);
if (!ok) { console.log('Troque o hash antigo por este nos arquivos marcados com FALTA.'); process.exit(1); }
