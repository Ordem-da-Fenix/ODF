# Sistema de Configuração de Modos - OFtech

## Visão Geral

O sistema OFtech agora possui um **sistema de modos configuráveis** que permite controlar como o sistema interage com a API e dados mock. Isso oferece flexibilidade para diferentes cenários de uso.

## 🔧 Modos Disponíveis

### 1. **Híbrido** (`hybrid`) - *Padrão Recomendado*
- **Comportamento**: Tenta usar a API primeiro, com fallback automático para dados mock
- **Uso**: Ambiente de produção com backup de segurança
- **Vantagens**: Máxima confiabilidade, funcionamento garantido
- **Ideal para**: Ambiente de produção, desenvolvimento com API instável

### 2. **API Only** (`api-only`) - *Produção Pura*
- **Comportamento**: Usa apenas a API, falha se API não estiver disponível
- **Uso**: Ambiente de produção com API confiável
- **Vantagens**: Garante dados reais, sem dependência de mock
- **Ideal para**: Produção final, quando API é estável e confiável

### 3. **Demo Only** (`demo-only`) - *Demonstração*
- **Comportamento**: Usa apenas dados mock, ignora completamente a API
- **Uso**: Demonstrações, desenvolvimento sem API
- **Vantagens**: Funciona offline, dados previsíveis
- **Ideal para**: Apresentações, desenvolvimento inicial, testes de interface

## 🎛️ Como Usar

### Interface Gráfica
1. No cabeçalho do sistema, localize o seletor de modo
2. Selecione o modo desejado: 🔄 Híbrido, 🎯 API Only, ou 🎭 Demo Only
3. Confirme a alteração na caixa de diálogo
4. O sistema será reinicializado automaticamente

### Programático
```javascript
// Alterar modo programaticamente
appConfig.mode = 'api-only';
await compressorManager.init();

// Verificar modo atual
console.log(configUtils.getCurrentModeDescription());

// Verificar se deve usar mock
if (configUtils.shouldUseMock()) {
    // Lógica para dados mock
}
```

## 📊 Status Visual

O sistema exibe um **indicador de status** que mostra o estado atual:

- 🟢 **Verde**: API Online (dados reais)
- 🟡 **Amarelo**: Modo Fallback (usando mock temporariamente)
- 🔵 **Azul**: Modo Demo (apenas mock)
- 🔴 **Vermelho**: Erro na API
- ⚪ **Cinza**: Verificando...

## 🛡️ Comportamento por Modo

### Híbrido
```
API Disponível → Usa API
API Indisponível → Usa Mock automaticamente
```

### API Only
```
API Disponível → Usa API
API Indisponível → ❌ Sistema falha
```

### Demo Only
```
API Disponível → Ignora API, usa Mock
API Indisponível → Usa Mock
```

## ⚙️ Configuração Técnica

### Arquivo: `src/data/config.js`
```javascript
const appConfig = {
    mode: 'hybrid', // 'api-only', 'hybrid', 'demo-only'
    // ...outras configurações
};
```

### Utilitários Disponíveis
```javascript
configUtils.shouldUseMock()         // Deve usar dados mock?
configUtils.isFallbackEnabled()     // Fallback está habilitado?
configUtils.isApiRequired()         // API é obrigatória?
configUtils.getCurrentModeDescription() // Descrição do modo atual
```

## 🚀 Resposta à Pergunta: "Podemos nos desapegar do mock?"

**SIM!** Com o sistema de modos, vocês têm total flexibilidade:

### Para Produção Final
1. **Configure para `api-only`** quando a API estiver estável
2. **Remove dependência de mock** completamente
3. **Sistema falha rapidamente** se API estiver indisponível (fail-fast)

### Para Desenvolvimento/Teste
1. **Mantenha `hybrid`** durante desenvolvimento
2. **Use `demo-only`** para apresentações
3. **Alterne entre modos** conforme necessário

### Benefícios
- ✅ **Flexibilidade total**: Alterne entre modos conforme necessário
- ✅ **Produção limpa**: Modo API-only remove dependência de mock
- ✅ **Desenvolvimento seguro**: Modo híbrido com fallback
- ✅ **Demonstrações**: Modo demo funciona offline
- ✅ **Monitoramento**: Status visual do sistema
- ✅ **Configuração simples**: Interface gráfica ou programática

## 🔧 Próximos Passos Recomendados

1. **Teste todos os modos** em ambiente de desenvolvimento
2. **Configure produção** para `api-only` quando API estiver estável
3. **Use `hybrid`** como padrão durante transição
4. **Mantenha `demo-only`** para apresentações e treinamento

O sistema está **pronto para produção** e permite que vocês se "desapeguem do mock" quando desejarem, mantendo a flexibilidade para diferentes cenários de uso!