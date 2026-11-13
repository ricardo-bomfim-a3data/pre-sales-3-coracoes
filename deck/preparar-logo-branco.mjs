// Gera o logo da A3Data em branco (silhueta) para os slides de fundo escuro.
import sharp from 'sharp';
const { data, info } = await sharp('assets/logo-a3data.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; }
await sharp(data, { raw: info }).png().toFile('assets/logo-a3data-branco.png');
console.log('logo branco', info.width, info.height);
