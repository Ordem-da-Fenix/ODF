/**
 * Configurações da aplicação
 * Sistema standalone - sem dependências externas
 */

export const appConfig = {
    // Sistema standalone - sem backend
    mode: 'standalone',
    
    // Intervalos de atualização
    updateInterval: {
        realTimeData: 2000, // 2 segundos
        chartData: 5000,    // 5 segundos
    },
    
    // Configurações dos gráficos
    chart: {
        dataPoints: 24,
        colors: {
            primary: '#ea580c',
            secondary: '#c2410c',
            background: 'rgba(234, 88, 12, 0.1)'
        }
    },
    
    // Configurações de notificações
    notifications: {
        duration: 3000, // 3 segundos
        errorDuration: 5000 // 5 segundos
    },
    
    // URLs futuras da API (quando implementar backend)
    api: {
        baseUrl: 'http://localhost:3000/api',
        endpoints: {
            compressores: '/compressores',
            login: '/auth/login',
            dadosTempoReal: '/compressores/{id}/dados',
            historico: '/compressores/{id}/historico'
        }
    }
};

/**
 * Estados da aplicação
 */
export const appState = {
    currentUser: null,
    activeCompressor: null,
    isModalOpen: false,
    intervals: {
        realTimeData: null,
        chartUpdate: null
    }
};