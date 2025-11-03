require('dotenv').config();

const path = require('path');
const inquirer = require('inquirer');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { downloader, logger } = require('./downloader');
const { listVariableSets, loadVariables, saveVariables } = require('./cache');

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
  const action = await promptMainMenu();
  return await handleUserAction(action);
}

async function promptMainMenu() {
  console.clear();

  const options = [
    { name: '🆕 - Criar nova configuração', value: 'create' },
    { name: '🧩 - Usar configuração existente', value: 'use' },
    { name: '📄 - Listar configurações salvas', value: 'list' },
    { name: '🚪 - Sair', value: 'exit' },
  ];

  const { action } = await inquirer.prompt([
    { type: 'list', name: 'action', message: 'Selecione uma opção:', choices: options },
  ]);

  return action;
}

async function handleUserAction(action) {
  const actions = {
    exit: () => handleExit(),
    list: handleListConfigurations,
    use: handleUseConfiguration,
    create: handleCreateConfiguration,
  };

  const handler = actions[action];
  return handler ? await handler() : promptUserConfig();
}

function handleExit() {
  console.clear();
  console.log('👋 Encerrando...');
  process.exit(0);
}

async function handleListConfigurations() {
  console.clear();

  const configs = listVariableSets();
  displayConfigurations(configs);

  await pause();
  return promptUserConfig();
}

async function handleUseConfiguration() {
  console.clear();

  const configs = listVariableSets();
  if (configs.length === 0) {
    console.log('⚠️  Nenhuma configuração salva. Crie uma nova.\n');
    await pause();
    return promptUserConfig();
  }

  const selected = await promptConfigurationSelection(configs);
  const config = loadVariables(selected);

  console.clear();
  console.log(`✅ Configuração "${selected}" carregada com sucesso!\n`);
  console.table(config);

  const additional = await promptAdditionalParameters();
  const finalConfig = { ...config, ...additional };

  displayFinalConfiguration(finalConfig);
  return finalConfig;
}

async function handleCreateConfiguration() {
  console.clear();
  console.log('🛠️  Criando nova configuração:\n');

  const data = await promptConfigurationData();
  const processed = processConfigurationData(data);

  saveVariables(data.configName, processed);

  console.clear();
  logger.info(`✅ Configuração "${data.configName}" salva com sucesso!\n`);
  console.table(processed);

  await pause();
  return promptUserConfig();
}

function displayConfigurations(configs) {
  if (configs.length === 0) {
    console.log('⚠️  Nenhuma configuração encontrada.\n');
    return;
  }

  console.log('📦 Configurações salvas:\n');
  configs.forEach((c, i) => console.log(`${i + 1}. ${c}`));
  console.log('');
}

async function pause() {
  await inquirer.prompt([{ type: 'input', name: 'back', message: 'Pressione ENTER para voltar ao menu' }]);
}

async function promptConfigurationSelection(configs) {
  const { selected } = await inquirer.prompt([
    { type: 'list', name: 'selected', message: 'Escolha uma configuração para usar:', choices: configs },
  ]);
  return selected;
}

async function promptAdditionalParameters() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Informe o nome do álbum:',
      default: process.env.ALBUM_NAME,
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
  ]);
}

async function promptConfigurationData() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Domínio base:',
      default: 'https://site-project-madara.com',
    },
    {
      type: 'input',
      name: 'dataUpload',
      message: 'Caminho base (ex: wp-content/uploads/2024/09):',
    },
    {
      type: 'input',
      name: 'pageSeparator',
      message: 'Separador da página:',
      default: '/',
    },
    {
      type: 'input',
      name: 'quantityZeros',
      message: 'Há quantos zeros antes do número da imagem:',
      default: 0,
      validate: validateNumber,
      filter: parseIntFilter,
    },
    {
      type: 'input',
      name: 'variables',
      message: 'Variáveis de template (ex: ${mangaId} ${chapterId}):',
    },
    {
      type: 'input',
      name: 'configName',
      message: 'Nome para salvar a configuração:',
    },
  ]);
}

function processConfigurationData(data) {
  const variables = data.variables
    .split(/\s+/)
    .filter(Boolean)
    .map((v) => `\${${v.replace(/^\$\{?|\}?$/g, '')}}`);

  return {
    baseUrl: data.baseUrl,
    dataUpload: data.dataUpload,
    pageSeparator: data.pageSeparator,
    variables,
    quantityZeros: data.quantityZeros,
  };
}

function displayFinalConfiguration(config) {
  console.clear();
  console.log('⚙️  Configuração final:\n');
  console.table(config);
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
