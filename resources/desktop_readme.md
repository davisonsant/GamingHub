# GamingHub — Guia de Compilação Desktop (Electron)

Este documento descreve passo a passo como compilar e empacotar o **GamingHub** como um aplicativo Desktop executável nativo. Ele foi configurado para gerar:
1. **Windows Installer (`.exe` com instalador padrão NSIS)**
2. **Windows Portable (`.exe` portátil de clique único)**
3. **Linux Executable (nos formatos `.AppImage` e `.deb`)**

---

## 📋 Pré-requisitos

Para realizar a compilação local no seu computador, você precisará ter instalado:

1. **Node.js** (Versão `18.x`, `20.x` ou superior recomendada):
   - Baixe em: [nodejs.org](https://nodejs.org/)
2. **Pecan/Package Manager**:
   - O próprio Node vem com o `npm`.

---

## 🛠️ Passo a Passo para Compilar

### 1. Instalar dependências
Antes de qualquer build, abra o terminal na pasta do projeto e execute:
```bash
npm install
```

### 2. Comandos de Compilação

Configuramos scripts automatizados no seu `package.json` para facilitar a vida. Basta rodar o comando correspondente à sua necessidade:

#### 🖥️ Para Computadores Windows:
*   **Instalação Padrão Windows (Instalador NSIS `.exe`):**
    Gera um executável de instalação limpo que cria atalhos no menu iniciar e desktop.
    ```bash
    npm run electron:build:win
    ```
*   **Executável Portátil Windows (Portable `.exe`):**
    Gera um único arquivo `.exe` portátil. Excelente para carregar em pen-drives e rodar diretamente de qualquer pasta sem precisar instalar.
    ```bash
    npm run electron:build:portable
    ```
*   **Especificar arquitetura (64 bits ou 32 bits):**
    ```bash
    # Para sistemas de 64 bits (padrão moderno)
    npm run electron:build:win64
    
    # Para sistemas mais antigos de 32 bits
    npm run electron:build:win32
    ```

#### 🐧 Para Sistemas Linux:
*   **Gerar versões Linux (`.AppImage` e `.deb`):**
    Gera um pacote instalável Debian/Ubuntu (`.deb`) e uma imagem universal portátil (`.AppImage`).
    ```bash
    npm run electron:build:linux
    ```

#### ⚡ Gerar Tudo de Uma VezSó (Windows & Linux):
Se você estiver numa máquina compatível e quiser criar as distribuições de Windows e de Linux simultaneamente:
```bash
npm run electron:build:all
```

---

## 📦 Onde os arquivos são salvos?

Após a finalização de qualquer comando de compilação, uma pasta chamada `dist_electron/` será criada na raiz do seu projeto. Nela você encontrará:

*   **Para Windows Installer (`npm run electron:build:win`):**
    *   `dist_electron/GamingHub Setup 0.0.0.exe` (Instalador pronto para distribuição)
*   **Para Windows Portable (`npm run electron:build:portable`):**
    *   `dist_electron/GamingHub 0.0.0.exe` (Versão portátil de clique único)
*   **Para Linux (`npm run electron:build:linux`):**
    *   `dist_electron/GamingHub_0.0.0_amd64.deb` (Instalador Debian/Ubuntu)
    *   `dist_electron/GamingHub-0.0.0.AppImage` (Executável portátil universal de Linux)

---

## 🎨 Personalização de Nome, Versão e Ícones

Para customizar as aparências e metadados antes de compilar:

1.  **Ícones:**
    *   Substitua o arquivo `public/icon.ico` com o logotipo de sua preferência (para Windows).
    *   Substitua o arquivo `public/icon.png` com o logotipo de 512x512 pixels (para Linux).
2.  **Configurações no `package.json`:**
    *   No campo `"name"` e `"version"`, altere o nome do pacote e a versão.
    *   No bloco `"build"`, você pode alterar `"productName"` (o nome exibido no topo da janela do app e nos atalhos) ou ajustar o `"appId"` (identificador único do app).

---

## ⚡ Desenvolvimento & Testes Locais

Para testar o aplicativo em modo desktop e inspecioná-lo de forma interativa antes de compilar o binário de produção, execute:
```bash
npm run electron:dev
```
Isso iniciará o servidor de desenvolvimento Vite e abrirá a janela do Electron conectada em tempo real para permitir ajustes rápidos e depuração (HMR).
