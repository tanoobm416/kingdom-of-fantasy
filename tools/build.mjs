import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {readdir,unlink} from 'node:fs/promises';

execFileSync(process.execPath,['tools/castle.mjs'],{stdio:'inherit'});
const bundle=await build({
  entryPoints:['src/app.js'],
  outdir:'dist', chunkNames:'chunks/[name]-[hash]', splitting:true,
  bundle:true, metafile:true, minify:true, format:'esm', target:['safari15','chrome100']
});

const outputs=new Set(Object.keys(bundle.metafile.outputs));
for(const entry of await readdir('dist/chunks')){
  const path='dist/chunks/'+entry;
  if(entry.endsWith('.js') && !outputs.has(path))await unlink(path);
}
