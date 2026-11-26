import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {PNG} from 'pngjs';

const url=new URL(process.argv[2]);
if(url.protocol!=='https:')throw new Error('Use the final HTTPS address.');
const file='dist/downloads/kingdom-qr.png';
await QRCode.toFile(file,url.href,{type:'png',errorCorrectionLevel:'Q',margin:4,scale:24,color:{dark:'#171e1e',light:'#ffffff'}});
const image=PNG.sync.read(await readFile(file));
const decoded=jsQR(new Uint8ClampedArray(image.data),image.width,image.height);
assert.equal(decoded?.data,url.href);
console.log('QR decoded to',decoded.data);
