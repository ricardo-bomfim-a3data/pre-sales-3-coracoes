// Converte ícones oficiais AWS (SVG do pacote aws-icons) em PNG 2x para usar no deck.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const base = 'node_modules/aws-icons/icons/architecture-service';
const icones = {
  s3: 'AmazonSimpleStorageService',
  glue: 'AWSGlue',
  personalize: 'AmazonPersonalize',
  sagemaker: 'AmazonSageMakerAI',
  stepfunctions: 'AWSStepFunctions',
  kms: 'AWSKeyManagementService',
  cloudtrail: 'AWSCloudTrail',
  athena: 'AmazonAthena',
  grafana: 'AmazonManagedGrafana',
};
fs.mkdirSync('assets/icons', { recursive: true });
for (const [nome, arq] of Object.entries(icones)) {
  const svg = path.join(base, `${arq}.svg`);
  if (!fs.existsSync(svg)) { console.log('ausente:', arq); continue; }
  await sharp(svg, { density: 300 }).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(`assets/icons/${nome}.png`);
  console.log('ok', nome);
}
