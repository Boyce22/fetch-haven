const path = require('path');
const inquirer = require('inquirer');
const { downloader } = require('./downloader');

async function main() {
  try {
    logTitle('Configurar Download');
    const config = await promptUserConfig();
    const numberImageArr = generateImageRange(config.inicio, config.fim);

    logTitle('Iniciando download turbo');
    const resultado = await runDownloader(config, numberImageArr);

    logTitle('DOWNLOAD FINALIZADO');
    console.table(resultado);
  } catch (err) {
    console.error('\nErro geral:', err);
  }
}

function logTitle(title) {
  console.log(`\n=== ${title} ===\n`);
}

async function promptUserConfig() {
  const questions = [
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Informe o domínio base:',
      default: process.env.BASE_URL || 'https://site-project-madara.com',
    },
    {
      type: 'input',
      name: 'dataUpload',
      message: 'Informe o caminho (ex: wp-content/uploads/2024/09):',
      default: process.env.DATA_UPLOAD || 'wp-content/uploads/2024/09',
    },
    {
      type: 'input',
      name: 'name',
      message: 'Informe o nome do álbum:',
      default: process.env.ALBUM_NAME || 'One Piece',
    },
    {
      type: 'input',
      name: 'inicio',
      message: 'Número inicial da imagem:',
      default: parseEnvInt(process.env.INICIO),
      validate: validateNumber,
      filter: parseIntFilter,
    },
    {
      type: 'input',
      name: 'fim',
      message: 'Número final da imagem:',
      default: parseEnvInt(process.env.FIM),
      validate: validateNumber,
      filter: parseIntFilter,
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Diretório de saída:',
      default: process.env.OUTPUT_DIR || './downloads',
    },
  ];

  return inquirer.prompt(questions);
}

function parseEnvInt(value) {
  return value ? parseInt(value, 10) : undefined;
}

function validateNumber(value) {
  return !isNaN(parseInt(value, 10)) || 'Digite um número válido';
}

function parseIntFilter(value) {
  return parseInt(value, 10);
}

function generateImageRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

function runDownloader(config, numberImageArr) {
  return downloader({
    baseUrl: config.baseUrl,
    dataUpload: config.dataUpload,
    name: config.name,
    numberImageArr,
    outputDir: path.resolve(config.outputDir),
  });
}

main();
