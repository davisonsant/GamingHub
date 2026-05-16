# GamingHub - Sua Biblioteca de Jogos Pessoal

GamingHub é uma aplicação web moderna e elegante para gerenciar sua coleção de jogos. Desenvolvida com **React**, **TypeScript** e **Tailwind CSS**, ela oferece uma experiência fluida e responsiva para catalogar, organizar e descobrir novos jogos na sua biblioteca.

## 🚀 Funcionalidades

- **Gerenciamento de Biblioteca**: Adicione, edite e remova jogos da sua coleção.
- **Filtros Avançados**: Filtre por gênero, plataforma, desenvolvedora e ano de lançamento.
- **Favoritos e Progresso**: Marque seus jogos favoritos e acompanhe seu progresso de jogo e conquistas (Platinado).
- **Sorteio Aleatório**: Não sabe o que jogar? Use a função "Sortear Jogo" para escolher um jogo aleatório da sua biblioteca.
- **Importação/Exportação**: Faça backup dos seus dados ou importe listas em formato JSON.
- **Modo Escuro/Claro**: Escolha o tema que melhor se adapta ao seu ambiente.
- **Design Responsivo**: Use em qualquer dispositivo, desde celulares até desktops ultra-wide.

## 🛠️ Tecnologias Utilizadas

- **React 18**
- **TypeScript**
- **Tailwind CSS** (Estilização)
- **Framer Motion** (Animações)
- **Lucide React** & **Material Symbols** (Ícones)
- **Vite** (Build tool)

## 📦 Instalação Local

Siga os passos abaixo para rodar o projeto na sua máquina:

### Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**

### Passos

1. **Clone o repositório ou baixe os arquivos.**
2. **Abra o terminal na pasta do projeto.**
3. **Instale as dependências:**
   ```bash
   npm install
   ```
4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
5. **Abra no seu navegador:**
   O projeto estará rodando em `http://localhost:3000` (ou na porta indicada no terminal).

## 🔨 Build para Produção

Para gerar a versão otimizada para publicação:

```bash
npm run build
```

Os arquivos estáticos serão gerados na pasta `dist/`.

## ⚙️ Configurações e Tutorial

### Adicionando um Jogo
1. Clique no botão **"+"** no canto superior direito.
2. Preencha o formulário com o título, sinopse, plataforma e outras informações.
3. Clique em **"Cadastrar Jogo"**.

### Sorteando um Jogo
Se estiver indeciso, clique no botão **"Sortear Jogo"** na barra superior. O sistema escolherá um jogo aleatório da sua lista filtrada.

### Backup dos Dados
Vá em **Configurações > Backup** para exportar sua biblioteca completa. Isso baixará um arquivo `.json` que pode ser restaurado futuramente no mesmo menu.

---
Desenvolvido por **Davison Sant**.
