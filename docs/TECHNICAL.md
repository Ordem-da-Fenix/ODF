# Documentação Técnica - OFtech Monitoring

## 🏗️ Arquitetura

### Visão Geral
O sistema utiliza uma arquitetura modular baseada em ES6 Modules, garantindo:
- **Separação de responsabilidades**
- **Reutilização de código**
- **Facilidade de manutenção**
- **Testabilidade**

### Fluxo de Dados
```
index.html → app.js → [CompressorManager, ChartManager, ModalManager] → DOM
                 ↕
            config.js ← utils.js
```

## 📦 Módulos Detalhados

### 1. app.js (Orquestrador Principal)
**Responsabilidades:**
- Inicialização da aplicação
- Coordenação entre módulos
- Gerenciamento de eventos globais
- Controle de sessão do usuário

**Eventos Gerenciados:**
- `compressorSelected` - Compressor selecionado
- `modalClosed` - Modal fechado
- `userLoggedIn` - Login realizado

### 2. CompressorManager
**Responsabilidades:**
- Gerenciar lista de compressores
- Controlar modais de detalhes
- Atualizar dados em tempo real
- Gerar dados simulados

**Métodos Principais:**
```javascript
abrirModal(compressorId)     // Abre modal do compressor
fecharModal()                // Fecha modal atual
atualizarDadosTempoReal()    // Atualiza pressão/temperatura
gerarDadosAleatorios()       // Simula dados do sensor
```

### 3. ChartManager
**Responsabilidades:**
- Inicializar gráficos Chart.js
- Atualizar dados do gráfico
- Configurar estilos visuais
- Gerenciar ciclo de vida do gráfico

**Configurações Chart.js:**
```javascript
{
  type: 'line',
  responsive: true,
  maintainAspectRatio: false,
  // Cores personalizadas da OFtech
  borderColor: '#ea580c',
  backgroundColor: 'rgba(234, 88, 12, 0.1)'
}
```

### 4. ModalManager
**Responsabilidades:**
- Controlar abertura/fechamento de modais
- Validar formulários
- Gerenciar eventos de teclado (ESC)
- Notificações de sucesso/erro

**Validações Implementadas:**
- Email format válido
- Senha mínima de 6 caracteres
- Nome mínimo de 2 caracteres
- Telefone brasileiro (10-11 dígitos)

### 5. Utils
**Funções Utilitárias:**
```javascript
gerarDadosAleatorios(min, max, decimals)  // Números aleatórios
validarEmail(email)                        // Validação de email
validarTelefone(telefone)                 // Validação de telefone
sanitizarString(str)                      // Prevenção XSS
salvarLocalStorage(chave, valor)          // Storage seguro
```

## 🎨 Sistema de Cores

### Paleta Principal
```css
/* Laranja OFtech */
--oftech-orange: #ea580c;
--oftech-dark: #c2410c;

/* Estados */
--online: #10b981 (verde)
--offline: #ef4444 (vermelho)
--maintenance: #f59e0b (amarelo)
```

### Aplicação no Tailwind
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'oftech-orange': '#ea580c',
        'oftech-dark': '#c2410c'
      }
    }
  }
}
```

## 📊 Gerenciamento de Estado

### appState (Estado Global)
```javascript
{
  currentUser: null,           // Usuário logado
  activeCompressor: null,      // Compressor ativo
  isModalOpen: false,         // Status do modal
  intervals: {                // Intervalos ativos
    realTimeData: null,
    chartUpdate: null
  }
}
```

### Fluxo de Estados
1. **Inicialização**: Estado limpo
2. **Login**: `currentUser` populado
3. **Seleção**: `activeCompressor` definido
4. **Modal**: `isModalOpen = true`
5. **Cleanup**: Intervalos limpos

## 🔄 Sistema de Eventos

### Eventos Customizados
```javascript
// Compressor selecionado
new CustomEvent('compressorSelected', {
  detail: { compressorId }
});

// Modal fechado
new CustomEvent('modalClosed', {
  detail: { modalType: 'compressor' }
});

// Usuário logado
new CustomEvent('userLoggedIn', {
  detail: { user: userData }
});
```

### Event Listeners
```javascript
// Fechar com ESC
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    // Fechar modais
  }
});

// Clique fora do modal
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    // Fechar modal
  }
});
```

## 📱 Responsividade

### Breakpoints Tailwind
```css
/* Mobile First */
sm: 640px   /* Tablet pequeno */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop pequeno */
xl: 1280px  /* Desktop grande */
```

### Grid System
```html
<!-- Cards responsivos -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <!-- Conteúdo -->
</div>
```

## 🚀 Performance

### Otimizações Implementadas
- **Debounce/Throttle** em eventos de alta frequência
- **Event Delegation** para elementos dinâmicos
- **Lazy Loading** de gráficos (só quando modal abre)
- **Cleanup** de intervalos para evitar memory leaks

### Intervalos Configuráveis
```javascript
const appConfig = {
  updateInterval: {
    realTimeData: 2000,  // 2s - Dados em tempo real
    chartData: 5000      // 5s - Atualização do gráfico
  }
}
```

## 🛡️ Segurança

### Prevenção XSS
```javascript
// Sanitização de inputs
static sanitizarString(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Validação Client-Side
- Email format
- Tamanho mínimo de campos
- Caracteres especiais em telefone
- Sanitização de strings

## 🧪 Testing (Futuro)

### Estrutura Sugerida
```
tests/
├── unit/
│   ├── compressor.test.js
│   ├── chart.test.js
│   └── utils.test.js
├── integration/
│   └── modal-flow.test.js
└── e2e/
    └── user-journey.test.js
```

### Ferramentas Recomendadas
- **Jest** - Testes unitários
- **Testing Library** - Testes de DOM
- **Cypress** - Testes E2E

## 📈 Monitoramento (Futuro)

### Métricas Sugeridas
- Tempo de carregamento
- Erros JavaScript
- Interações do usuário
- Performance do gráfico

### Ferramentas
- Google Analytics
- Sentry (error tracking)
- Performance Observer API

## 🔧 Manutenção

### Convenções de Código
- **ESLint** configurado
- **Prettier** para formatação
- Comentários JSDoc
- Nomenclatura em português (contexto brasileiro)

### Versionamento
- Semantic Versioning (semver)
- Changelog mantido
- Tags de release no Git