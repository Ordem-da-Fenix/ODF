# OFtech - Sistema de Monitoramento de Compressores

## 📋 Descrição
Sistema web para monitoramento em tempo real de compressores industriais, desenvolvido para a OFtech.

## 🚀 Funcionalidades
- ✅ Monitoramento em tempo real de pressão e temperatura
- ✅ Gráficos dinâmicos de consumo de energia
- ✅ Interface responsiva com Tailwind CSS
- ✅ Sistema de autenticação
- ✅ Modais centralizados para detalhes dos equipamentos
- ✅ Arquitetura modular em JavaScript

## 📁 Estrutura do Projeto
```
ODF/
├── index.html              # Página principal
├── src/
│   ├── js/
│   │   ├── app.js          # Arquivo principal da aplicação
│   │   └── modules/
│   │       ├── compressor.js  # Gerenciamento de compressores
│   │       ├── chart.js       # Gráficos com Chart.js
│   │       ├── modal.js       # Sistema de modais
│   │       └── utils.js       # Utilitários gerais
│   ├── css/                # Estilos customizados
│   └── data/
│       └── config.js       # Configurações e dados
├── assets/
│   └── images/             # Imagens e recursos
├── docs/                   # Documentação
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias Utilizadas
- **Frontend**: HTML5, JavaScript ES6+, Tailwind CSS
- **Gráficos**: Chart.js
- **Arquitetura**: Modular com ES6 Modules

## 🔧 Instalação e Uso

### Requisitos
- Navegador moderno com suporte a ES6+ Modules
- Servidor web local (recomendado para evitar CORS)

### Executar Localmente
1. Clone ou baixe o projeto
2. Abra um servidor local na pasta do projeto:
   ```bash
   # Python 3
   python -m http.server 8080
   
   # PHP
   php -S localhost:8080
   
   # Node.js (se disponível)
   npx live-server --port=8080
   ```
3. Acesse `http://localhost:8080` no navegador

### Sistema Standalone
- ✅ **Sem dependências**: Funciona apenas com navegador
- ✅ **Dados mock**: Simulação completa de API
- ✅ **Pronto para produção**: Facilmente adaptável para backend real

## 📊 Módulos

### CompressorManager
- Gerencia a lista de compressores
- Controla abertura/fechamento de modais
- Atualiza dados em tempo real via API mock
- Simula diferentes status de equipamentos

### ChartManager  
- Inicializa e controla gráficos Chart.js
- Atualização automática de dados
- Configurações visuais personalizadas
- Dados históricos simulados

### ModalManager
- Sistema de modais centralizados
- Validação de formulários com API mock
- Sistema de login funcional
- Notificações de sucesso/erro

### Utils
- Funções utilitárias reutilizáveis
- Validações de dados
- Manipulação de localStorage
- Helpers para mock de dados

## 💾 Sistema de Dados Mock

### Usuários de Teste
```javascript
// Email: joao.silva@oftech.com | Senha: 123456
// Email: maria.santos@oftech.com | Senha: admin123  
// Email: carlos@oftech.com | Senha: tech2024
```

### Compressores Simulados
- **5 compressores** com diferentes status
- **Dados em tempo real** simulados
- **Histórico de energia** com 24h de dados
- **Alertas e notificações** realistas

## 🎨 Personalização

### Cores da Marca
- **Laranja Principal**: `#ea580c`
- **Laranja Escuro**: `#c2410c`
- Configurável em `src/data/config.js`

### Intervalos de Atualização
- **Dados em Tempo Real**: 2 segundos
- **Gráficos**: 5 segundos
- Configurável em `appConfig`

## 📱 Responsividade
- Design mobile-first
- Breakpoints otimizados
- Modais adaptáveis

## 🔒 Segurança
- Sanitização de inputs
- Validação client-side
- Prevenção XSS básica

## 🚧 Roadmap

### Próxima Fase (Backend Integration)
- [ ] **API REST** - Substituir mocks por endpoints reais
- [ ] **Banco de dados** - Armazenamento persistente
- [ ] **Autenticação JWT** - Sistema de tokens
- [ ] **WebSocket** - Dados em tempo real
- [ ] **Dashboard admin** - Configurações avançadas

### Melhorias Futuras
- [ ] **PWA** - Aplicativo instalável
- [ ] **Relatórios PDF** - Exportação de dados
- [ ] **Notificações Push** - Alertas em tempo real
- [ ] **App Mobile** - React Native / Flutter
- [ ] **Testes automatizados** - Jest + Cypress

## 🔄 Migração para Backend

O sistema está preparado para migração fácil:

```javascript
// Trocar import dos mocks
import { apiMock } from './mocks.js';
// Para API real
import { apiService } from './api.js';

// URLs já configuradas em config.js
const API_BASE = 'http://localhost:3000/api';
```

## 👨‍💻 Desenvolvimento
Desenvolvido para OFtech com foco em:
- Performance
- Manutenibilidade  
- Escalabilidade
- Experiência do usuário

## 📄 Licença
Projeto proprietário da OFtech.