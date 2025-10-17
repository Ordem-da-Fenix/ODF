# OFtech - Sistema de Monitoramento de Compressores

## 📋 Descrição
Sistema web avançado para monitoramento em tempo real de compressores industriais, desenvolvido para a OFtech com integração completa de API e interface dinâmica.

## 🚀 Funcionalidades Principais
- ✅ **Integração completa com API REST** - Dados reais em tempo real
- ✅ **Monitoramento industrial avançado** - **7 parâmetros**: pressão, temperatura equipamento/ambiente, potência, **umidade**, **vibração** 
- ✅ **Sistema de alertas inteligente** - 5 níveis (muito baixo → crítico) com cores e emojis
- ✅ **Interface dinâmica** - Cards gerados automaticamente da API
- ✅ **Gráficos interativos** - 3 tipos: Pressão, Temperatura e Consumo com tooltips precisos
- ✅ **Filtros avançados** - Pesquisa e filtragem por múltiplos critérios
- ✅ **Modais completos** - 7 cards informativos + gráfico integrado
- ✅ **Design responsivo** - Interface adaptável com Tailwind CSS
- ✅ **Health monitoring** - Verificação automática de conectividade
- ✅ **Formatação precisa** - Temperaturas (1 casa), demais parâmetros (2 casas decimais)

## 📁 Estrutura do Projeto
```
ODF/
├── index.html                    # Página principal
├── LICENSE                       # Licença do projeto
├── API_DOCUMENTATION.md          # Documentação da API
├── src/
│   ├── js/
│   │   ├── app.js                # Orquestrador principal
│   │   └── modules/
│   │       ├── compressor.js           # Gerenciamento de modais
│   │       ├── compressor-interface.js # Interface dinâmica com API
│   │       ├── chart.js               # Gráficos em tempo real
│   │       ├── modal.js               # Sistema de modais
│   │       ├── notifications.js       # Sistema de notificações
│   │       ├── search-filter.js       # Sistema de filtros avançados
│   │       └── utils.js               # Utilitários gerais
│   ├── css/                      # Estilos customizados
│   └── data/
│       ├── api.js                # Serviços de API REST
│       ├── config.js             # Configurações e estado da app
│       └── [removido mocks.js]   # Sistema focado na API
├── assets/
│   └── images/                   # Imagens e recursos
├── docs/
│   └── TECHNICAL.md              # Documentação técnica
└── README.md                     # Este arquivo
```

## 🛠️ Tecnologias Utilizadas
- **Frontend**: HTML5, JavaScript ES6+ Modules, Tailwind CSS
- **API**: REST API com fallback para dados mock
- **Gráficos**: Chart.js para visualizações em tempo real
- **Arquitetura**: Modular híbrida com gerenciamento de estado
- **Responsividade**: Mobile-first design
- **Comunicação**: Fetch API com error handling avançado

## 🔧 Instalação e Uso

### Requisitos
- Navegador moderno com suporte a ES6+ Modules
- Servidor web local (recomendado para evitar CORS)
- **API Backend** (opcional): `localhost:8000` para dados reais

### Configuração Completa

#### 1. Frontend (Obrigatório)
```bash
# Clone o repositório
git clone <repository-url> ODF
cd ODF

# Inicie servidor local
python -m http.server 8080
# OU
php -S localhost:8080
# OU
npx live-server --port=8080
```

#### 2. Backend API (Opcional)
```bash
# Se você tiver a API rodando em localhost:8000
# O sistema detecta automaticamente e usa dados reais
# Caso contrário, usa dados mock seamlessly
```

#### 3. Acesso
- Abra `http://localhost:8080` no navegador
- Sistema verifica API automaticamente
- Interface se adapta aos dados disponíveis

### Modos de Operação

#### 🟢 Modo API (Recomendado)
- **URL da API**: `http://localhost:8000`
- **Dados**: Tempo real da sua base de dados
- **Status**: Indicador verde "API Conectada"
- **Funcionalidades**: 100% das features ativas

#### 🟡 Modo Híbrido (Automático)
- **Detecção**: Health check a cada 30s
- **Reconexão**: Automática quando API volta
- **Transição**: Seamless entre modos

#### 🔴 Modo Mock (Fallback)
- **Dados**: Simulação realística completa
- **Status**: Indicador vermelho "Modo Offline"
- **Funcionalidades**: Todas disponíveis com dados simulados

## 📊 Arquitetura de Módulos

### 🏗️ Core Application (`app.js`)
- **Orquestração**: Inicialização e coordenação de módulos
- **Health Monitor**: Verificação automática de conectividade da API
- **State Management**: Gerenciamento centralizado de estado
- **Auto-Reconnection**: Reconexão automática com API

### 🖥️ CompressorInterfaceManager (`compressor-interface.js`)
- **Renderização Dinâmica**: Cards gerados automaticamente da API
- **Data Extraction**: Algoritmos inteligentes para extrair dados
- **Real-time Updates**: Atualização automática de status
- **API Integration**: Integração completa com endpoints REST

### 🔍 SearchFilterManager (`search-filter.js`)
- **Filtros Avançados**: Por status, fabricante, setor, potência
- **Pesquisa Inteligente**: Busca em tempo real
- **Export Functions**: Exportação de resultados filtrados
- **Dynamic Filtering**: Funciona com elementos criados dinamicamente

### 🎛️ CompressorManager (`compressor.js`)
- **Modal Control**: Gerenciamento de modais com event delegation
- **Real-time Data**: Atualização de dados em tempo real
- **Status Management**: Controle de estados dos compressores
- **API Synchronization**: Sincronização com dados da API

### 📈 ChartManager (`chart.js`)  
- **Real-time Charts**: Gráficos atualizados automaticamente
- **Historical Data**: Visualização de dados históricos
- **Multiple Chart Types**: Linha, barra, pizza
- **API Data Integration**: Dados diretos da API ou mock

### 🚨 NotificationsManager (`notifications.js`)
- **Alert System**: Sistema completo de notificações
- **Toast Messages**: Mensagens temporárias elegantes
- **Status Indicators**: Indicadores visuais de estado
- **API Status**: Notificações de conectividade

### 🌐 ApiService (`api.js`)
- **REST Client**: Cliente completo para API REST
- **Error Handling**: Tratamento robusto de erros
- **Timeout Management**: Gestão de timeouts
- **Health Checks**: Verificações de saúde da API

### ⚙️ ConfigManager (`config.js`)
- **App Configuration**: Configurações centralizadas
- **State Management**: Estado global da aplicação
- **API Settings**: Configurações de API e timeouts
- **Feature Flags**: Controle de funcionalidades

## � Integração de API

### Endpoints Principais
```javascript
GET /compressores/          // Lista todos os compressores
GET /dados/{id}            // Dados específicos de um compressor  
GET /sensor                // Dados dos sensores
GET /health               // Health check da API
```

### Estrutura de Dados da API
```json
{
  "id_compressor": 1001,
  "nome_marca": "Atlas Copco GA22 VSD+", 
  "esta_ligado": true,
  "localizacao": "Setor A - Galpão Principal",
  "data_cadastro": "2025-10-15T18:31:40Z",
  "pressao": 8.75,
  "temp_equipamento": 38.5,
  "temp_ambiente": 25.0,
  "potencia_kw": 0.35,
  "umidade": 40.25,
  "vibracao": false,
  "alertas": {
    "pressao": "normal",
    "temperatura_equipamento": "normal", 
    "temperatura_ambiente": "normal",
    "potencia": "normal",
    "umidade": "normal",
    "vibracao": "normal"
  }
}
```

### 💾 Sistema de Fallback (Mock Data)

#### Sistema Standalone (Sem Autenticação)
- **Modo híbrido**: Tenta API primeiro, fallback para mock
- **Sem login**: Sistema funciona diretamente sem autenticação
- **Dados consistentes**: Mock segue estrutura da API documentada

#### Compressores Simulados  
- **5 compressores** com diferentes status e fabricantes (Atlas Copco, Schulz, Kaeser, Chicago Pneumatic, Ingersoll Rand)
- **7 parâmetros monitorados**: `pressao` (bar), `temp_equipamento`, `temp_ambiente`, `potencia_kw`, **`umidade`**, **`vibracao`**
- **Sistema de alertas avançado**: 7 parâmetros com 5 níveis (muito_baixo 🔵, baixo 🟡, normal 🟢, alto 🟠, critico 🔴)
- **Histórico completo** de energia e operação (24h) com precisão de 2 casas decimais
- **Geolocalização** por setores (A, B, C, D, E)
- **Formatação inteligente**: Temperaturas 1 casa decimal, demais 2 casas

## �️ Configurações e Personalização

### 🎨 Identidade Visual
```javascript
// Cores da marca OFtech
primaryColor: '#ea580c',      // Laranja principal
primaryDark: '#c2410c',       // Laranja escuro  
success: '#10b981',           // Verde para status online
error: '#ef4444',             // Vermelho para alertas
warning: '#f59e0b'            // Amarelo para avisos
```

### ⏱️ Intervalos de Atualização
```javascript
realTimeData: 2000,          // Dados em tempo real (2s)
charts: 5000,                 // Gráficos (5s)
healthCheck: 30000,           // Verificação de API (30s)
statusUpdate: 6000            // Atualização de status (6s)
```

### 🔧 Configurações de API
```javascript
apiBaseUrl: 'http://localhost:8000',
timeout: 5000,                // Timeout de requisições
maxRetries: 3,                // Tentativas de reconexão
retryDelay: 2000              // Delay entre tentativas
```

### 🎯 Filtros Disponíveis
- **Status**: Online, Offline
- **Fabricante**: Atlas Copco, Schulz, Kaeser, Chicago Pneumatic
- **Setor**: A, B, C, D, etc.
- **Potência**: Filtro por kW mínimo
- **Alertas**: Com ou sem alertas ativos
- **Novos Parâmetros**: Umidade e vibração nos cards da lista

## 🆕 **NOVIDADES v2.0 - Monitoramento Industrial Avançado**

### ✨ **Novos Parâmetros Monitorados**
- 💧 **Umidade Ambiente**: Monitoramento de umidade (0-100%) com 5 níveis de alerta
- ⚡ **Vibração do Equipamento**: Detecção binária (Normal/Detectada) para manutenção preditiva
- 📊 **Total**: 7 parâmetros industriais completos

### 🎯 **Sistema de Alertas Expandido**
```javascript
// Configuração dos novos parâmetros
umidade: {
  muito_baixo: "0-30%",   // 🔵 Ar muito seco
  baixo: "30-40%",        // 🟡 Pouco úmido  
  normal: "40-60%",       // 🟢 Ideal
  alto: "60-70%",         // 🟠 Úmido
  critico: "70-100%"      // 🔴 Muito úmido
},
vibracao: {
  normal: false,          // 🟢 Sem vibração
  critico: true           // 🔴 Vibração detectada
}
```

### 🖥️ **Interface Aprimorada**
- **Modal Completo**: 7 cards (5 clicáveis para gráficos + 2 informativos)
- **Lista Inteligente**: Todos os parâmetros exibidos com emojis de status
- **Gráficos Otimizados**: 3 tipos - Pressão, Temperatura Equipamento, Consumo
- **Cards Não-Clicáveis**: Umidade e Vibração são apenas informativos

### 📐 **Formatação Precisa**
- **Temperaturas**: 38.5°C (1 casa decimal)
- **Pressão**: 8.75 bar (2 casas decimais)
- **Potência**: 0.35 kW (2 casas decimais)
- **Umidade**: 40.25% (2 casas decimais)
- **Tooltips**: Formatação automática por tipo de dado

### 🔧 **Melhorias Técnicas**
- **API Otimizada**: Uso de `limit=5` para contornar bugs de `limit=1`
- **Dados Reais**: Sistema usa dados da API sem fallbacks desnecessários  
- **Alertas Automáticos**: Calculados pela API e exibidos em tempo real
- **Precisão Visual**: Formatação consistente em todos os componentes

## 📱 Responsividade
- Design mobile-first
- Breakpoints otimizados
- Modais adaptáveis

## 🔒 Segurança
- Sanitização de inputs
- Validação client-side
- Prevenção XSS básica

## ✅ Status do Projeto

### 🎉 Funcionalidades Implementadas *(Última atualização: 17/10/2025)*
- [x] **API REST Integration** - Integração completa com backend
- [x] **Monitoramento Industrial Completo** - **7 parâmetros**: pressão, temperatura equipamento/ambiente, potência, **umidade**, **vibração**
- [x] **Sistema de Alertas Avançado** - 5 níveis com cores e emojis automáticos
- [x] **Interface Dinâmica Aprimorada** - Renderização automática com novos parâmetros
- [x] **Gráficos Interativos Melhorados** - 3 tipos com tooltips precisos (1-2 casas decimais)
- [x] **Modal Completo** - 7 cards informativos (5 clicáveis + 2 informativos)
- [x] **Formatação Inteligente** - Temperaturas 1 casa, demais 2 casas decimais
- [x] **Filtros Avançados** - Sistema completo de filtragem
- [x] **Health Monitoring** - Monitoramento de conectividade
- [x] **Real-time Updates** - Atualizações automáticas com dados mais recentes
- [x] **Event Delegation** - Eventos funcionam com conteúdo dinâmico  
- [x] **Error Handling** - Tratamento robusto de erros e fallbacks
- [x] **Responsive Design** - Interface adaptável
- [x] **Data Extraction** - Algoritmos inteligentes de extração com novos parâmetros

### 🚧 Próximas Melhorias

#### Fase 1 - Enhancement (Curto Prazo)
- [ ] **WebSocket Integration** - Dados em tempo real via WS
- [ ] **Caching Strategy** - Cache inteligente de dados
- [ ] **Offline Mode** - Funcionamento sem conectividade
- [ ] **Advanced Charts** - Mais tipos de visualização
- [ ] **Export Features** - PDF e Excel reports

#### Fase 2 - Advanced Features (Médio Prazo)  
- [ ] **PWA Support** - Aplicativo instalável
- [ ] **Push Notifications** - Alertas em tempo real
- [ ] **Multi-language** - Suporte a idiomas
- [ ] **Dark/Light Theme** - Temas personalizáveis
- [ ] **Advanced Analytics** - Dashboard de análises

#### Fase 3 - Enterprise (Longo Prazo)
- [ ] **Multi-tenant** - Suporte a múltiplas empresas
- [ ] **Mobile App** - React Native / Flutter
- [ ] **AI Integration** - Predição de falhas
- [ ] **IoT Integration** - Integração com sensores IoT
- [ ] **Automated Testing** - Jest + Cypress + E2E

## � Deployment e Produção

### 🏭 Ambiente de Produção

#### Frontend Deploy
```bash
# Build otimizado (se usando bundler)
npm run build

# Deploy estático (Nginx, Apache, Vercel, Netlify)
# Apenas servir os arquivos estáticos
```

#### Configuração de API
```javascript
// config.js - Ambiente de produção
const prodConfig = {
  apiBaseUrl: 'https://api.oftech.com.br',
  environment: 'production',
  debug: false,
  timeout: 10000
};
```

### 🔧 Configuração do Servidor Web

#### Nginx
```nginx
server {
    listen 80;
    server_name oftech.com.br;
    root /var/www/oftech;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000;
    }
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerName oftech.com.br
    DocumentRoot /var/www/oftech
    
    ProxyPass /api/ http://localhost:8000/
    ProxyPassReverse /api/ http://localhost:8000/
</VirtualHost>
```

### 📊 Monitoramento
- **Health Checks**: Endpoint `/health` para monitoring
- **Error Tracking**: Logs estruturados de erros
- **Performance**: Métricas de carregamento e API
- **Uptime**: Monitoramento de disponibilidade

## � Desenvolvimento Local

### Setup do Ambiente
```bash
# Clone do projeto
git clone <repository-url> ODF
cd ODF

# Instalar dependências (se usar package.json futuramente)
npm install

# Iniciar desenvolvimento
python -m http.server 8080
```

### 🧪 Testing
```bash
# Testes unitários (futuro)
npm test

# Testes E2E (futuro)  
npm run e2e

# Linting (futuro)
npm run lint
```

### 🏗️ Contribuição
1. Fork do projeto
2. Criar branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit das mudanças (`git commit -m 'Add nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

### 📋 Code Standards
- **JavaScript**: ES6+ Modules, async/await
- **HTML**: Semantic HTML5, acessibilidade
- **CSS**: Tailwind CSS, mobile-first
- **Commits**: Conventional Commits format

## 👥 Equipe

### Desenvolvedor Principal
- **Frontend**: Sistema modular com JavaScript vanilla
- **Integração**: API REST com fallback inteligente  
- **UX/UI**: Design system consistente com Tailwind

### Foco de Desenvolvimento
- ⚡ **Performance**: Carregamento otimizado e atualizações eficientes
- 🔧 **Manutenibilidade**: Código modular e bem documentado
- 📈 **Escalabilidade**: Arquitetura preparada para crescimento
- 🎯 **UX**: Experiência fluida e intuitiva
- 🔒 **Confiabilidade**: Error handling robusto e fallbacks

## 📞 Suporte

### Documentação
- **README.md** - Guia principal (este arquivo)
- **API_DOCUMENTATION.md** - Documentação da API
- **docs/TECHNICAL.md** - Detalhes técnicos
- **Código comentado** - Comentários inline explicativos

### Contato
- **Issues**: Use o sistema de issues do GitHub
- **Email**: suporte@oftech.com.br
- **Documentação**: Consulte os arquivos de docs/

## 📄 Licença
© 2025 OFtech - Sistema de Monitoramento de Compressores  
Projeto proprietário da OFtech. Todos os direitos reservados.