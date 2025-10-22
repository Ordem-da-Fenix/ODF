/**
 * Configurações da aplicação
 * Sistema focado na API
 * 
 * OTIMIZAÇÕES DE PERFORMANCE (v3.0 - TEMPO REAL):
 * - Dashboard: 10s → 5s (ultra responsivo!)
 * - Detalhes: 10s → 2s (quase tempo real!)  
 * - Gráficos: 30s → 15s (análise em tempo real)
 * - Health Check: 3min → 1min (detecção ultra rápida)
 * - Retry: 5s → 2s (reconexão instantânea)
 * - Logs: Otimizados para produção
 */

export const appConfig = {
    
    // Intervalos de atualização (TEMPO REAL)
    updateInterval: {
        realTimeData: 5000,  // 5 segundos - dashboard (muito responsivo)
        modalData: 2000,    // 2 segundos - detalhes (quase tempo real)
        chartData: 15000,   // 15 segundos - gráficos (boa para análise)
        healthCheck: 60000, // 1 minuto - API (monitoramento agressivo)
        retry: 2000         // 2 segundos - retry (super rápido)
    },
    
    // Configurações dos gráficos
    chart: {
        dataPoints: 24,
        colors: {
            primary: '#ea580c',
            secondary: '#c2410c',
            background: 'rgba(234, 88, 12, 0.1)',
            pressao: '#ea580c',
            temperatura: '#ef4444',
            temperaturaAmbiente: '#06b6d4',
            umidade: '#3B82F6',
            corrente: '#F59E0B'
        },
        metrics: ['pressao', 'temperatura', 'umidade', 'corrente', 'temperaturaAmbiente']
    },
    
    // Configurações de notificações
    notifications: {
        duration: 3000, // 3 segundos
        errorDuration: 5000, // 5 segundos
        maxNotifications: 50,
        enableToast: true
    },
    
    // Configurações da API - URLs atualizadas
    api: {
        baseUrl: 'https://ordem-da-fenix-api.fly.dev', // URL da API real
        timeout: 5000, // 5 segundos
        retries: 3,
        endpoints: {
            // Endpoints dos compressores
            compressores: '/compressores/',
            compressor: '/compressores/{id}',
            
            // Endpoints dos sensores
            dados: '/dados',
            dadosCompressor: '/dados/{id}',
            sensor: '/sensor',
            
            // Endpoints do sistema
            health: '/health',
            ping: '/ping',
            configuracoes: '/configuracoes/',
            infoSistema: '/configuracoes/info'
        }
    },
    
    // Limites e alertas (baseado na documentação da API)
    alertas: {
        pressao: {
            muito_baixo: { min: 0, max: 3, color: '#3b82f6', emoji: '🔵' },
            baixo: { min: 3, max: 6, color: '#eab308', emoji: '🟡' },
            normal: { min: 6, max: 8, color: '#22c55e', emoji: '🟢' },
            alto: { min: 8, max: 9, color: '#f97316', emoji: '🟠' },
            critico: { min: 9, max: 999, color: '#ef4444', emoji: '🔴' }
        },
        temperatura_equipamento: {
            muito_baixo: { min: -20, max: 20, color: '#3b82f6', emoji: '🔵' },
            baixo: { min: 20, max: 40, color: '#eab308', emoji: '🟡' },
            normal: { min: 40, max: 70, color: '#22c55e', emoji: '🟢' },
            alto: { min: 70, max: 85, color: '#f97316', emoji: '🟠' },
            critico: { min: 85, max: 999, color: '#ef4444', emoji: '🔴' }
        },
        temperatura_ambiente: {
            muito_baixo: { min: 0, max: 15, color: '#3b82f6', emoji: '🔵' },
            baixo: { min: 15, max: 20, color: '#eab308', emoji: '🟡' },
            normal: { min: 20, max: 30, color: '#22c55e', emoji: '🟢' },
            alto: { min: 30, max: 35, color: '#f97316', emoji: '🟠' },
            critico: { min: 35, max: 999, color: '#ef4444', emoji: '🔴' }
        },
        umidade: {
            muito_baixo: { min: 0, max: 30, color: '#3b82f6', emoji: '💧' },
            baixo: { min: 30, max: 40, color: '#eab308', emoji: '🟡' },
            normal: { min: 40, max: 60, color: '#22c55e', emoji: '🟢' },
            alto: { min: 60, max: 70, color: '#f97316', emoji: '🟠' },
            critico: { min: 70, max: 100, color: '#ef4444', emoji: '🔴' }
        },
        corrente: {
            muito_baixo: { min: 0, max: 5, color: '#3b82f6', emoji: '🔵' },
            baixo: { min: 5, max: 10, color: '#eab308', emoji: '🟡' },
            normal: { min: 10, max: 20, color: '#22c55e', emoji: '🟢' },
            alto: { min: 20, max: 30, color: '#f97316', emoji: '🟠' },
            critico: { min: 30, max: 999, color: '#ef4444', emoji: '🔴' }
        },
        vibracao: {
            normal: { value: false, color: '#22c55e', emoji: '🟢', texto: 'Normal' },
            critico: { value: true, color: '#ef4444', emoji: '⚠️', texto: 'Detectada' }
        }
    },
    
    // Configurações de unidades de medida
    units: {
        pressao: 'bar', // API usa bar, não PSI
        temperatura: '°C',
        umidade: '%',
        corrente: 'A',
        tempo: 'h'
    }
};

/**
 * Estados da aplicação
 */
export const appState = {
    currentUser: null,
    activeCompressor: null,
    isModalOpen: false,
    
    // Estado da conexão com API
    apiStatus: {
        isOnline: false,
        lastCheck: null,
        retryCount: 0,
        mode: 'offline' // 'online', 'offline'
    },
    
    // Intervalos ativos
    intervals: {
        realTimeData: null,
        chartUpdate: null,
        healthCheck: null,
        apiRetry: null
    },
    
    // Cache de dados da API
    cache: {
        compressores: null,
        configuracoes: null,
        lastUpdate: null,
        ttl: 60000 // 1 minuto
    },
    
    // Estatísticas da sessão
    stats: {
        startTime: new Date(),
        apiCalls: 0,
        errors: 0,
        dataUpdates: 0
    }
};

/**
 * Utilitários de configuração
 */
export const configUtils = {

    /**
     * Determina o nível de alerta baseado no valor
     */
    getAlertLevel(type, value) {
        const alerts = appConfig.alertas[type];
        if (!alerts) return 'normal';
        
        for (const [level, config] of Object.entries(alerts)) {
            if (value >= config.min && value < config.max) {
                return level;
            }
        }
        return 'normal';
    },
    
    /**
     * Obtém a configuração visual do alerta
     */
    getAlertConfig(type, level) {
        return appConfig.alertas[type]?.[level] || appConfig.alertas[type]?.normal;
    },
    
    /**
     * Converte ID do compressor para formato da API
     */
    formatCompressorId(id) {
        return parseInt(id);
    },
    
    /**
     * Verifica se o cache ainda é válido
     */
    isCacheValid(timestamp) {
        if (!timestamp) return false;
        return (Date.now() - timestamp) < appState.cache.ttl;
    },
    
    /**
     * Atualiza estatísticas da aplicação
     */
    updateStats(type) {
        if (appState.stats[type] !== undefined) {
            appState.stats[type]++;
        }
    }
};