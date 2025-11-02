# FetchHaven 🚀

**FetchHaven** é uma ferramenta de linha de comando profissional para download massivo e otimizado de álbuns de imagens da web. Desenvolvido para alta performance e confiabilidade.

---

## ✨ Funcionalidades Avançadas

### 🚀 **Performance**
- Download concorrente massivo (até 200+ conexões simultâneas)
- Processamento em chunks inteligente para evitar memory leaks
- Pipeline otimizado com controle de fluxo
- Cache em memória para evitar duplicações

### 🔧 **Controle Avançado**
- **Controle de Concorrência**: `MAX_CONCURRENT` ajustável dinamicamente
- **Sistema de Retry**: Tentativas automáticas com backoff configurável (`RETRIES` & `RETRY_DELAY`)
- **Timeout por Requisição**: `TIMEOUT` personalizável por operação
- **Suporte a Múltiplos Formatos**: `jpg`, `png`, `webp`, `jpeg`, `gif`

### 📊 **Monitoramento em Tempo Real**
- Progresso visual com porcentagem
- Estatísticas detalhadas de performance
- Logs estruturados com Bunyan
- Métricas de velocidade (imagens/segundo)

### 🛡️ **Resiliência**
- Detecção e skip de arquivos duplicados
- Cleanup automático de downloads corrompidos
- Continuação de downloads interrompidos
- Tratamento granular de erros

---

## 🚀 **Instalação Rápida**

```bash
# Clone o repositório
git clone <repo-url>
cd fetchhaven

# Instale as dependências
npm install

# Execute a verificação do sistema
node main.js --check
```

---

## ⚙️ **Configuração**

### **Método 1: Variáveis de Ambiente** (Recomendado)
Crie um arquivo `.env` na raiz:

```env
# URLs e Paths
BASE_URL=https://site-project-madara.com
DATA_UPLOAD=wp-content/uploads/2024/09
ALBUM_NAME=One Piece

# Intervalo de Download
INICIO=1
FIM=1000

# Diretórios
OUTPUT_DIR=./downloads

# Performance (Avançado)
MAX_CONCURRENT=200
RETRIES=3
RETRY_DELAY=1000
TIMEOUT=30000
```

### **Método 2: CLI Interativo**
```bash
node main.js
```

### **Método 3: Parâmetros de Linha de Comando**
```bash
node main.js --url https://exemplo.com --album "Meu Album" --inicio 1 --fim 500 --concurrent 100
```

---

## 🎯 **Exemplos de Uso**

### **Caso 1: Download com Interação Direto no Terminal**
```bash
node main.js
```
*Interativo - ideal para testes rápidos*

### **Caso 2: Download em Massa**
```bash
# Baixar 5000 imagens com alta concorrência
node main.js --inicio 1 --fim 5000 --concurrent 200 --output ./mass-downloads
```

## 📊 **Saída do Sistema**

### **Progresso em Tempo Real**
```
131/5000 (2.6%)

```

## 🏗 **Arquitetura do Projeto**

```
fetchhaven/
│
├── 📁 logs/                    # Logs rotativos diários
│   ├── downloader.log         # Logs detalhados das operações
│   └── error.log              # Logs de erros críticos
│
├── 📁 downloads/              # Diretório padrão de downloads
│   └── 📁 [Album_Name]/       # Estrutura automática por álbum
│
├── 🔧 main.js                 # CLI Principal & Interface
├── ⚡ downloader.js           # Motor de Download (Otimizado)
├── 📝 logger.js               # Sistema de Logging (Bunyan)
│
├── ⚙️ .env                    # Configurações de Ambiente
├── 📦 package.json           # Dependências e scripts
└── 🔒 package-lock.json      # Lock de versões
```

---

## 🛠 **Configurações de Performance**

### **Configurações no `downloader.js`:**
```javascript
const CONFIG = {
  MAX_CONCURRENT_DOWNLOADS: 200,    // Máximo de downloads paralelos
  RETRY_ATTEMPTS: 3,                // Tentativas por imagem
  RETRY_DELAY: 1000,                // Delay entre tentativas (ms)
  TIMEOUT: 30000,                   // Timeout por requisição (ms)
  CHUNK_SIZE: 1000                  // Processamento em lotes
};
```

### **Recomendações por Cenário:**
- **Rede Rápida**: `MAX_CONCURRENT: 200`
- **Rede Doméstica**: `MAX_CONCURRENT: 50`
- **Conexão Instável**: `MAX_CONCURRENT: 10, RETRIES: 5`

---

## 📈 **Sistema de Logs**

### **Estrutura dos Logs:**
```json
{
  "name": "image-downloader",
  "level": "info",
  "chunkIndex": 5,
  "totalChunks": 20,
  "successCount": 250,
  "duration": "45.2s",
  "speed": "21.8 img/s"
}
```

### **Níveis de Log:**
- `DEBUG`: Informações detalhadas de debugging
- `INFO`: Progresso e estatísticas
- `WARN`: Tentativas de retry e avisos
- `ERROR`: Falhas críticas e erros de rede

---

## 🔄 **Workflows Comuns**

### **Download de Grande Volume:**
1. Configure `.env` com intervalo desejado
2. Execute com alta concorrência
3. Monitor progresso em tempo real
4. Revise relatório final e logs

### **Download com Pausa/Continuação:**
1. Interrompa com `Ctrl+C`
2. Reinicie o comando
3. Sistema automaticamente pula arquivos existentes

### **Debug de Problemas:**
1. Verifique logs em `logs/downloader.log`
2. Reduza concorrência para teste
3. Aumente timeout se necessário

---

## 🐛 **Solução de Problemas**

### **Problemas Comuns:**

| Problema | Solução |
|----------|---------|
| `ECONNRESET` | Reduza `MAX_CONCURRENT` |
| `ETIMEDOUT` | Aumente `TIMEOUT` |
| Downloads lentos | Ajuste concorrência conforme rede |
| Memory leak | Sistema já inclui chunking automático |

### **Comando de Diagnóstico:**
```bash
node main.js --check
```

---

## 🤝 **Contribuição**

1. **Reporte Bugs**: [Issues](https://github.com/Boyce22/fetch-haven/issues)
2. **Sugira Features**: [Issues](https://github.com/Boyce22/fetch-haven/issues)
3. **Envie PRs**: 
   - Siga o padrão de código
   - Atualize documentação
   - Adicione testes quando possível

### **Scripts de Desenvolvimento:**
```bash
npm run format  # Formatação automática
```

---

## 🏆 **Benchmarks**

* **10.000 imagens**: ~45 segundos (200 concorrente)
* **1.000 imagens**: ~8 segundos (100 concorrente)  
* **100 imagens**: ~2 segundos (50 concorrente)

*Testado em conexão de 100Mbps com servidor otimizado*

---

**FetchHaven** - Baixe mais, espere menos! 🚀✨
