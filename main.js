const path = require('path');
const inquirer = require('inquirer');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { downloader } = require('./downloader');
require('dotenv').config();

async function main() {
  try {
    const argv = yargs(hideBin(process.argv))
      .option('baseUrl', { type: 'string' })
      .option('dataUpload', { type: 'string' })
      .option('name', { type: 'string' })
      .option('inicio', { type: 'number' })
      .option('fim', { type: 'number' })
      .option('output', { type: 'string' })
      .option('concurrent', { type: 'number' })
      .option('retries', { type: 'number' })
      .option('retryDelay', { type: 'number' }).argv;

    const config = argv.inicio && argv.fim ? parseArgsConfig(argv) : await promptUserConfig();

    const numberImageArr = generateImageRange(config.inicio, config.fim);

    logTitle('Iniciando download');
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

function parseArgsConfig(argv) {
  return {
    baseUrl: argv.baseUrl || process.env.BASE_URL || 'https://site-project-madara.com',
    dataUpload: argv.dataUpload || process.env.DATA_UPLOAD || 'wp-content/uploads/2024/09',
    name: argv.name || process.env.ALBUM_NAME || 'One Piece',
    inicio: argv.inicio,
    fim: argv.fim,
    outputDir: argv.output || process.env.OUTPUT_DIR || './downloads',
    concurrent: argv.concurrent,
    retries: argv.retries,
    retryDelay: argv.retryDelay,
  };
}

async function promptUserConfig() {
  const questions = [
    { type: 'input', name: 'baseUrl', message: 'Informe o domínio base:', default: process.env.BASE_URL },
    { type: 'input', name: 'dataUpload', message: 'Informe o caminho:', default: process.env.DATA_UPLOAD },
    { type: 'input', name: 'name', message: 'Informe o nome do álbum:', default: process.env.ALBUM_NAME },
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
    concurrent: config.concurrent,
    retries: config.retries,
    retryDelay: config.retryDelay,
  });
}

main();
