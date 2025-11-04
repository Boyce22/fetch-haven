const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pLimit = require('p-limit');

const { logger } = require('./logger');

const CONFIG = {
  MAX_CONCURRENT: 200,
  RETRIES: 2,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
  FORMATS: ['jpg', 'png', 'webp', 'jpeg'],
};

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

class ImageDownloader {
  constructor(baseUrl) {
    this.baseUrl = baseUrl; // não tá mais aqui quem colocou, é MEME
    this.stats = this._resetStats();
    this.limit = pLimit(CONFIG.MAX_CONCURRENT);
    this.downloaded = new Set();
  }

  _resetStats() {
    return { total: 0, success: 0, failed: 0, skipped: 0, start: 0 };
  }

  async _mkdir(dir) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  _sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  _progress() {
    const { success, failed, skipped, total } = this.stats;
    const done = success + failed + skipped;
    const pct = ((done / total) * 100).toFixed(1);
    process.stdout.write(`\r${done}/${total} (${pct}%)`);
    if (done === total) process.stdout.write('\n');
  }

  async _urlExists(url) {
    try {
      const res = await axios.head(url, { timeout: 5000 });
      return res.status >= 200 && res.status < 400;
    } catch {
      return false;
    }
  }

  async _findValidUrl(basePath) {
    for (const ext of CONFIG.FORMATS) {
      const testUrl = `${this.baseUrl}/${basePath}.${ext}`;
      if (await this._urlExists(testUrl)) return testUrl;
    }
    return null;
  }

  async _downloadStream(url, dest, retries = CONFIG.RETRIES) {
    const log = logger.child({ url, dest });

    if (fs.existsSync(dest)) {
      this.stats.skipped++;
      this._progress();
      return;
    }

    try {
      const { data } = await axios.get(url, {
        responseType: 'stream',
        timeout: CONFIG.TIMEOUT,
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(dest, { flags: 'w' });
        data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      });

      this.stats.success++;
      this.downloaded.add(dest);
    } catch (err) {
      if (retries > 0) {
        log.warn({ retriesLeft: retries - 1 }, 'Erro, repetindo...');
        await this._sleep(CONFIG.RETRY_DELAY);
        return this._downloadStream(url, dest, retries - 1);
      }
      this.stats.failed++;
      log.error({ err }, 'Falha final no download');
    } finally {
      this._progress();
    }
  }

  _constructPath({ variables = [], valueVariables = {} }) {
    return variables
      .map((key) => valueVariables[key])
      .filter(Boolean)
      .join('/');
  }

  async download({
    dataUpload,
    name,
    numberImageArr,
    outputDir,
    variables,
    pageSeparator,
    quantityZeros = 0,
    variablesValue,
  }) {
    const albumDir = path.join(outputDir, name);
    await this._mkdir(albumDir);

    const log = logger.child({ album: name, total: numberImageArr.length });
    this.stats = this._resetStats();
    this.stats.total = numberImageArr.length;
    this.stats.start = Date.now();

    log.info('Iniciando downloads turbo...');

    const tasks = numberImageArr.map((n) =>
      this.limit(async () => {
        const dynamicPath = this._constructPath({ variables, valueVariables: variablesValue });

        const numberPage = Number(quantityZeros) > 0 ? String(n).padStart(Number(quantityZeros), '0') : String(n);

        const basePath = dynamicPath
          ? `${dataUpload}/${dynamicPath}${pageSeparator}${numberPage}`
          : `${dataUpload}/${pageSeparator}${numberPage}`;

        const dest = path.join(albumDir, `${n}.jpg`);

        if (this.downloaded.has(dest)) {
          this.stats.skipped++;
          this._progress();
          return;
        }

        const validUrl = await this._findValidUrl(basePath);
        if (!validUrl) {
          this.stats.failed++;
          log.warn({ basePath }, 'Nenhum formato encontrado');
          this._progress();
          return;
        }

        return this._downloadStream(validUrl, dest);
      })
    );

    await Promise.allSettled(tasks);

    const dur = (Date.now() - this.stats.start) / 1000;
    const speed = (this.stats.success / dur).toFixed(2);
    log.info(
      {
        stats: this.stats,
        duration: `${dur.toFixed(2)}s`,
        speed: `${speed} img/s`,
      },
      'Download turbo finalizado'
    );

    return this.stats;
  }
}

const downloader = async (cfg) => {
  const dl = new ImageDownloader(cfg.baseUrl);
  return dl.download(cfg);
};

module.exports = { downloader, ImageDownloader, logger };
