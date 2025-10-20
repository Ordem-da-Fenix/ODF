/**
 * Arquivo principal da aplicação OFtech
 * Versão API - integração completa com API de produção
 */

import { CompressorManager } from './modules/compressor.js';
import { CompressorInterfaceManager } from './modules/compressor-interface.js';
import { ChartManager } from './modules/chart.js';
import { ModalManager } from './modules/modal.js';
import { NotificationManager } from './modules/notifications.js';
import { SearchFilterManager } from './modules/search-filter.js';
import { Utils } from './modules/utils.js';
import { router } from './modules/router.js';
import { appConfig, appState, configUtils } from '../data/config.js';
import { apiService } from '../data/api.js';

class OFtechApp {
    constructor() {
        this.router = router;
        this.compressorManager = null;
        this.compressorInterfaceManager = null;
        this.chartManager = null;
        this.modalManager = null;
        this.notificationManager = null;
        this.searchFilterManager = null;
        
        // Estados de controle
        this.isInitialized = false;
        this.healthCheckInterval = null;
        this.retryInterval = null;
        
        this.init();
    }

    setupMetricButtons() {
        // Configurar apenas os gráficos permitidos: pressão, temperatura, umidade, corrente, temperatura ambiente
        // Usar setTimeout para garantir que os elementos existam após mudanças de rota
        setTimeout(() => {
            this._bindMetricCards();
        }, 100);
    }

    _bindMetricCards() {
        // Tornar os cards clicáveis e acessíveis via teclado
        const cardPressao = document.getElementById("card-pressao");
        const cardTemperatura = document.getElementById("card-temperatura");
        const cardUmidade = document.getElementById("card-umidade");
        const cardCorrente = document.getElementById("card-corrente");
        const cardTemperaturaAmbiente = document.getElementById("card-temperatura-ambiente");

        const bindCard = (el, metricId, metricName) => {
            if (!el) {
                console.warn(`⚠️ Card não encontrado: ${el?.id || 'undefined'}`);
                return;
            }
            
            // Remover listeners antigos para evitar duplicação
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            
            const activate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Log para debug
                console.log(`🔘 Card clicado: ${metricName}, view atual: ${window.location.hash}`);
                
                // Verificar se estamos na view de detalhes
                const detailsView = document.getElementById('compressor-details-view');
                if (!detailsView || detailsView.style.display === 'none') {
                    console.log('❌ Gráfico só pode ser ativado na view de detalhes');
                    return false;
                }
                
                console.log(`📊 Ativando gráfico: ${metricName}`);
                this.chartManager.setMetric(metricId);
                return false;
            };
            
            newEl.addEventListener("click", activate);
            newEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    activate(e);
                }
            });
        };

        // Bind dos cards clicáveis
        bindCard(cardPressao, "pressao", "Pressão");
        bindCard(cardTemperatura, "temperatura", "Temperatura do Equipamento");
        bindCard(cardUmidade, "umidade", "Umidade");
        bindCard(cardCorrente, "corrente", "Corrente");
        bindCard(cardTemperaturaAmbiente, "temperaturaAmbiente", "Temperatura Ambiente");

        console.log('📊 Cards de gráficos configurados: pressão, temperatura, umidade, corrente, temperatura ambiente');
    }

    _highlightMetricButton(id) {
        const mapping = {
            'btn-pressao': {on: ['bg-oftech-orange','text-white'], off: ['bg-white','text-oftech-orange']},
            'btn-temperatura': {on: ['bg-red-500','text-white'], off: ['bg-white','text-red-500']},
            'btn-consumo': {on: ['bg-oftech-orange','text-white'], off: ['bg-white','text-oftech-orange']}
        };

        Object.keys(mapping).forEach(b => {
            const el = document.getElementById(b);
            if (!el) return;
            const cfg = mapping[b];
            if (b === id) {
                // aplicar on classes
                el.classList.remove(...cfg.off);
                el.classList.add(...cfg.on);
            } else {
                el.classList.remove(...cfg.on);
                el.classList.add(...cfg.off);
            }
        });
    }

    async init() {
        try {
            // Aguardar o DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                await this.initializeApp();
            }
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeApp() {
        console.log('🚀 Iniciando OFtech App...');
        
        // Marcar início das estatísticas
        appState.stats.startTime = new Date();
        
        // 1. Verificar conectividade com API (ÚNICA VEZ)
        await this.initializeApiConnection();
        
        // 2. Inicializar módulos base (sem dependência de API)
        this.modalManager = new ModalManager();
        this.notificationManager = new NotificationManager();
        
        // 3. Inicializar módulos que dependem de API (passando status já verificado)
        this.compressorInterfaceManager = new CompressorInterfaceManager(appState.apiStatus.isOnline);
        this.searchFilterManager = new SearchFilterManager();
        this.compressorManager = new CompressorManager(appState.apiStatus.isOnline);
        this.chartManager = new ChartManager();
        
        // 4. Aguardar inicialização dos módulos assíncronos
        await this.waitForModulesInit();
        
        // 5. Expor managers globalmente
        this.exposeGlobalManagers();
        
        // 6. Configurar eventos e UI
        this.setupMetricButtons();
        this.setupModuleEvents();
        this.setupHealthCheck();
        this.setupAutoUpdates();
        
        // 7. Mostrar notificação de inicialização
        this.showInitializationStatus();
        
        this.isInitialized = true;
        console.log('✅ OFtech App inicializado com sucesso!');
    }

    /**
     * Inicializa conexão com API
     */
    async initializeApiConnection() {
        console.log('🔌 Conectando com API...');
        
        try {
            const health = await apiService.checkHealth();
            
            if (health) {
                appState.apiStatus.isOnline = true;
                appState.apiStatus.mode = 'online';
                appState.apiStatus.lastCheck = new Date();
                
                console.log('✅ API conectada:', health.status);
                
                // Salvar informações da API
                if (health.version) {
                    appState.apiStatus.version = health.version;
                }
            } else {
                throw new Error('Health check falhou');
            }
        } catch (error) {
            console.error('❌ API não disponível, sistema não pode funcionar:', error.message);
            appState.apiStatus.isOnline = false;
            appState.apiStatus.mode = 'offline';
            appState.apiStatus.retryCount++;
        }
    }

    /**
     * Aguarda inicialização completa dos módulos
     */
    async waitForModulesInit() {
        // Managers já foram inicializados em seus construtores
        // Aguardar apenas sincronização final
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Expõe managers globalmente
     */
    exposeGlobalManagers() {
        window.notificationManager = this.notificationManager;
        window.searchFilterManager = this.searchFilterManager;
        window.compressorManager = this.compressorManager;
        window.compressorInterfaceManager = this.compressorInterfaceManager;
        window.chartManager = this.chartManager;
        window.oftechApp = this;
    }

    /**
     * Mostra status de inicialização
     */
    showInitializationStatus() {
        setTimeout(() => {
            const isApiOnline = appState.apiStatus.isOnline;
            
            this.notificationManager.addNotification({
                type: isApiOnline ? 'sucesso' : 'info',
                title: 'Sistema Iniciado',
                message: `OFtech iniciado com sucesso. Modo: ${isApiOnline ? 'API Online' : 'Sistema Offline'}`,
                compressorId: null
            });

            // Adicionar notificação sobre API se estiver offline
            if (!isApiOnline) {
                setTimeout(() => {
                    this.notificationManager.addNotification({
                        type: 'aviso',
                        title: 'API Indisponível',
                        message: 'Usando dados de demonstração. Tentando reconectar...',
                        compressorId: null
                    });
                }, 1000);
            }
        }, 1500);
    }

    /**
     * Configura health check periódico
     */
    setupHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, appConfig.updateInterval.healthCheck);
    }

    /**
     * Executa health check da API
     */
    async performHealthCheck() {
        try {
            const previousStatus = appState.apiStatus.isOnline;
            const health = await apiService.checkHealth();
            
            appState.apiStatus.lastCheck = new Date();
            
            if (health) {
                appState.apiStatus.isOnline = true;
                appState.apiStatus.mode = 'online';
                appState.apiStatus.retryCount = 0;
                
                // Se reconectou, notificar
                if (!previousStatus) {
                    console.log('🔄 API reconectada com sucesso');
                    this.notificationManager.addNotification({
                        type: 'sucesso',
                        title: 'API Reconectada',
                        message: 'Conexão com API restabelecida. Dados em tempo real disponíveis.',
                        compressorId: null
                    });
                    
                    // Reativar modo API nos módulos
                    await this.reactivateApiMode();
                }
            } else {
                throw new Error('Health check falhou');
            }
        } catch (error) {
            const wasOnline = appState.apiStatus.isOnline;
            appState.apiStatus.isOnline = false;
            appState.apiStatus.mode = 'fallback';
            appState.apiStatus.retryCount++;
            
            // Notificar apenas na primeira falha
            if (wasOnline) {
                console.warn('❌ Conexão com API perdida');
                this.notificationManager.addNotification({
                    type: 'erro',
                    title: 'API Desconectada',
                    message: 'Perdeu conexão com API. Sistema funcionando em modo limitado.',
                    compressorId: null
                });
            }
            
            configUtils.updateStats('errors');
        }
    }

    /**
     * Reativa modo API após reconexão
     */
    async reactivateApiMode() {
        if (this.compressorManager && typeof this.compressorManager.reconnectApi === 'function') {
            await this.compressorManager.reconnectApi();
        }
        
        if (this.compressorInterfaceManager && typeof this.compressorInterfaceManager.reloadCompressores === 'function') {
            await this.compressorInterfaceManager.reloadCompressores();
        }
        
        if (this.searchFilterManager && typeof this.searchFilterManager.loadCompressors === 'function') {
            await this.searchFilterManager.loadCompressors();
        }
        
        // Recarregar gráfico se modal estiver aberto
        if (appState.isModalOpen && this.chartManager) {
            await this.chartManager.recarregarDados();
        }
    }

    /**
     * Tratamento de erros de inicialização
     */
    handleInitializationError(error) {
        console.error('💥 Erro crítico na inicialização:', error);
        
        // Tentar mostrar erro na interface se possível
        try {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50';
            errorDiv.innerHTML = `
                <h3 class="font-bold">Erro de Inicialização</h3>
                <p class="text-sm mt-1">Falha ao inicializar aplicação. Recarregue a página.</p>
                <button onclick="location.reload()" class="mt-2 bg-white text-red-500 px-3 py-1 rounded text-sm">
                    Recarregar
                </button>
            `;
            document.body.appendChild(errorDiv);
        } catch (uiError) {
            // Se não conseguir nem criar UI, pelo menos alertar
            alert('Erro crítico na aplicação. Recarregue a página.');
        }
    }

    setupModuleEvents() {
        // Event listeners do Router
        this.setupRouterEvents();
        
        // Evento de modal fechado - parar atualizações do gráfico
        window.addEventListener('modalClosed', (event) => {
            if (event.detail.modalType === 'compressor') {
                this.compressorManager.fecharModal();
                this.chartManager.pararAtualizacao();
                appState.isModalOpen = false;
                appState.activeCompressor = null;
                
                // Modal fechado - log removido para reduzir ruído
            }
        });

        // Evento de compressor selecionado - inicializar gráfico
        window.addEventListener('compressorSelected', async (event) => {
            const { compressorId } = event.detail;
            appState.activeCompressor = compressorId;
            appState.isModalOpen = true;
            
            console.log(`📊 Compressor ${compressorId} selecionado`);
            
            // Configurar gráfico para o compressor
            this.chartManager.setCompressor(compressorId);
            
            // Aguardar um pouco para o modal aparecer
            setTimeout(async () => {
                await this.chartManager.inicializarGrafico();
                
                // Definir métrica padrão baseada na disponibilidade da API
                const defaultMetric = appState.apiStatus.isOnline ? 'pressao' : 'consumo';
                await this.chartManager.setMetric(defaultMetric);
                
                // Highlight do botão correto
                this._highlightMetricButton(appState.apiStatus.isOnline ? 'btn-pressao' : 'btn-consumo');
            }, 150);
        });

        // Evento de dados de compressor atualizados
        window.addEventListener('compressorDataUpdated', (event) => {
            const { compressorId, data, source } = event.detail;
            
            // Log apenas para debug, remover em produção
            if (Math.random() < 0.1) { // 10% das vezes
                console.log(`📈 Dados atualizados - Compressor ${compressorId} via ${source}`);
            }
            
            configUtils.updateStats('dataUpdates');
        });

        // Eventos de teclado globais
        document.addEventListener('keydown', (event) => {
            // Esc para voltar ao dashboard da página de detalhes
            if (event.key === 'Escape') {
                const detailsView = document.getElementById('compressor-details-view');
                if (detailsView && detailsView.style.display !== 'none') {
                    console.log('🔙 ESC pressionado, voltando ao dashboard com recarregamento');
                    window.location.href = window.location.pathname + window.location.search;
                    return;
                }
                
                // Fallback para modal (se ainda existir)
                if (appState.isModalOpen) {
                    this.compressorManager.fecharModal();
                }
            }
            
            // F5 para forçar reconexão (desenvolvimento)
            if (event.key === 'F5' && event.ctrlKey) {
                event.preventDefault();
                this.forceApiReconnect();
            }
            
            // Ctrl + Shift + D para debug info
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                event.preventDefault();
                this.showDebugInfo();
            }
        });

        // Eventos de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('⏸️ Página oculta, pausando atualizações desnecessárias');
                // Reduzir frequência quando página não está visível
            } else {
                console.log('▶️ Página visível, retomando atualizações');
                // Verificar se precisa atualizar dados
                if (appState.isModalOpen) {
                    this.compressorManager.atualizarDadosTempoReal();
                }
            }
        });
    }

    setupAutoUpdates() {
        // Health check periódico já configurado em setupHealthCheck()
        
        // Sistema de retry para reconexão
        this.retryInterval = setInterval(async () => {
            if (!appState.apiStatus.isOnline && appState.apiStatus.retryCount < appConfig.api.retries) {
                console.log(`🔄 Tentativa de reconexão ${appState.apiStatus.retryCount + 1}/${appConfig.api.retries}`);
                await this.performHealthCheck();
            }
        }, appConfig.updateInterval.retry);
        
        // Limpeza periódica de cache
        setInterval(() => {
            this.cleanupCache();
        }, appState.cache.ttl * 2); // A cada 2 minutos
        
        // Atualização periódica do dashboard
        setInterval(async () => {
            if (appState.apiStatus.isOnline && !appState.isModalOpen) {
                await this.atualizarDashboardIndependente();
            }
        }, appConfig.updateInterval.realTimeData * 2); // A cada 4 segundos (2 * 2)
        
        // Log de estatísticas periódico
        setInterval(() => {
            this.logStats();
        }, 60000); // A cada minuto
    }

    /**
     * Limpa cache antigo
     */
    cleanupCache() {
        if (!configUtils.isCacheValid(appState.cache.lastUpdate)) {
            appState.cache.compressores = null;
            appState.cache.configuracoes = null;
            appState.cache.lastUpdate = null;
            console.log('🧹 Cache limpo');
        }
    }

    /**
     * Log de estatísticas (desenvolvimento)
     */
    logStats() {
        if (appState.stats.dataUpdates > 0) {
            console.log('📊 Stats:', {
                uptime: Math.round((Date.now() - appState.stats.startTime) / 60000) + 'm',
                apiCalls: appState.stats.apiCalls,
                dataUpdates: appState.stats.dataUpdates,
                errors: appState.stats.errors,
                apiStatus: appState.apiStatus.mode
            });
        }
    }

    // Métodos públicos para interação externa
    getAppState() {
        return { ...appState };
    }

    getApiStatus() {
        return { ...appState.apiStatus };
    }

    getStats() {
        return { ...appState.stats };
    }

    getCurrentUser() {
        return appState.currentUser;
    }

    isUserLoggedIn() {
        return appState.currentUser !== null;
    }

    isApiOnline() {
        return appState.apiStatus.isOnline;
    }

    /**
     * Força tentativa de reconexão com API
     */
    async forceApiReconnect() {
        console.log('🔄 Forçando reconexão com API...');
        appState.apiStatus.retryCount = 0;
        
        await this.initializeApiConnection();
        
        if (appState.apiStatus.isOnline) {
            await this.reactivateApiMode();
            
            this.notificationManager.addNotification({
                type: 'sucesso',
                title: 'Reconexão Manual',
                message: 'Reconexão com API realizada com sucesso.',
                compressorId: null
            });
        } else {
            this.notificationManager.addNotification({
                type: 'erro',
                title: 'Reconexão Falhou',
                message: 'Não foi possível conectar com a API. Verifique a conexão.',
                compressorId: null
            });
        }
        
        return appState.apiStatus.isOnline;
    }



    /**
     * Mostra informações de debug
     */
    showDebugInfo() {
        const debugInfo = {
            app: {
                initialized: this.isInitialized,
                mode: appConfig.mode,
                uptime: Math.round((Date.now() - appState.stats.startTime) / 60000) + 'm'
            },
            api: this.getApiStatus(),
            stats: this.getStats(),
            modules: {
                compressor: !!this.compressorManager,
                compressorInterface: !!this.compressorInterfaceManager,
                chart: !!this.chartManager,
                notifications: !!this.notificationManager,
                search: !!this.searchFilterManager,
                modal: !!this.modalManager
            },
            state: {
                modalOpen: appState.isModalOpen,
                activeCompressor: appState.activeCompressor
            }
        };
        
        console.group('🔍 Debug Info - OFtech');
        console.table(debugInfo.app);
        console.table(debugInfo.api);
        console.table(debugInfo.stats);
        console.table(debugInfo.modules);
        console.table(debugInfo.state);
        console.groupEnd();
        
        return debugInfo;
    }

    // Cleanup para quando a página for fechada
    destroy() {
        console.log('🧹 Limpando recursos da aplicação...');
        
        // Limpar intervalos principais
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
        }
        
        // Destruir módulos
        if (this.chartManager) {
            this.chartManager.destruir();
        }
        
        if (this.compressorManager && this.compressorManager.intervaloDados) {
            clearInterval(this.compressorManager.intervaloDados);
        }

        if (this.notificationManager) {
            this.notificationManager.saveNotifications();
        }
        
        // Limpar intervalos do estado
        Object.values(appState.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        // Resetar estado
        appState.isModalOpen = false;
        appState.activeCompressor = null;
        
        this.isInitialized = false;
        
        console.log('✅ Cleanup concluído');
    }

    /**
     * Configura event listeners específicos do router
     */
    setupRouterEvents() {
        // Botão voltar na página de detalhes
        const backButton = document.getElementById('back-to-dashboard');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔙 Voltando ao dashboard com recarregamento');
                // Recarregar a página diretamente para garantir que os event listeners funcionem
                window.location.href = window.location.pathname + window.location.search;
            });
        }

        // Botão compartilhar na página de detalhes
        const shareButton = document.getElementById('share-compressor');
        if (shareButton) {
            shareButton.addEventListener('click', async () => {
                const compressorId = appState.activeCompressor;
                if (compressorId) {
                    const success = await this.router.shareCompressor(compressorId);
                    if (success) {
                        // Mostrar feedback visual
                        shareButton.innerHTML = `
                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span class="text-sm text-green-600">Copiado!</span>
                        `;
                        
                        setTimeout(() => {
                            shareButton.innerHTML = `
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                                </svg>
                                <span class="text-sm">Compartilhar</span>
                            `;
                        }, 2000);
                    }
                }
            });
        }

        // Event listener para mudanças de rota
        window.addEventListener('routeChanged', (event) => {
            const { route, view, compressorId } = event.detail;
            console.log(`🔄 Rota alterada: ${route} -> ${view}`);

            if (view === 'compressor-details' && compressorId) {
                // Configurar o compressor ativo
                appState.activeCompressor = compressorId;
                appState.isModalOpen = false; // Não é modal mais
                
                // Configurar gráfico para o compressor
                this.chartManager.setCompressor(compressorId);
                
                // Aguardar um pouco para a view aparecer
                setTimeout(async () => {
                    await this.chartManager.inicializarGrafico();
                    
                    // Reconfigurar cards de métricas para esta view
                    this._bindMetricCards();
                    
                    // Definir métrica padrão baseada na disponibilidade da API
                    if (appState.apiStatus.isOnline) {
                        this.chartManager.setMetric('pressao');
                        this._highlightMetricButton('btn-pressao');
                    } else {
                        this.chartManager.gerarDadosSimulados();
                    }

                    // Iniciar atualização em tempo real dos dados do compressor
                    this.compressorManager.atualizarDadosTempoReal();
                    
                    // Limpar intervalos anteriores
                    if (this.compressorManager.intervaloDados) {
                        clearInterval(this.compressorManager.intervaloDados);
                    }
                    
                    // Criar novo intervalo para atualização de dados
                    this.compressorManager.intervaloDados = setInterval(() => {
                        this.compressorManager.atualizarDadosTempoReal();
                    }, appConfig.updateInterval.modalData);
                }, 100);
                
            } else if (view === 'dashboard') {
                // Limpar estado do compressor ativo
                appState.activeCompressor = null;
                appState.isModalOpen = false;
                
                // Parar atualizações do gráfico
                this.chartManager.pararAtualizacao();
                
                // Limpar intervalo de dados
                if (this.compressorManager && this.compressorManager.intervaloDados) {
                    clearInterval(this.compressorManager.intervaloDados);
                    this.compressorManager.intervaloDados = null;
                }
            }
        });

        console.log('🗺️ Event listeners do router configurados');
    }

    /**
     * Atualiza dashboard com dados do compressor ativo independentemente
     */
    async atualizarDashboardIndependente() {
        if (!appState.apiStatus.isOnline) return;
        
        try {
            // Buscar dados do primeiro compressor para atualizar dashboard
            const response = await apiService.getCompressores();
            
            if (response && response.compressores && response.compressores.length > 0) {
                const compressor = response.compressores[0]; // Pegar o primeiro compressor
                
                // Buscar dados de sensores
                const dadosResponse = await apiService.getDadosTempoReal(compressor.id_compressor, 1);
                
                if (dadosResponse?.dados && dadosResponse.dados.length > 0) {
                    const ultimoDado = dadosResponse.dados[0];
                    
                    // Atualizar elementos do dashboard
                    this.atualizarElementosDashboard({
                        pressao: ultimoDado.pressao || 0.0,
                        temperatura: ultimoDado.temp_equipamento || 0.0,
                        temperaturaAmbiente: ultimoDado.temp_ambiente || 0.0,
                        potencia: ultimoDado.potencia_kw || 0.0,
                        umidade: ultimoDado.umidade || 0.0,
                        vibracao: ultimoDado.vibracao || false,
                        corrente: ultimoDado.corrente || 0.0,
                        ligado: compressor.esta_ligado
                    });
                }
            }
        } catch (error) {
            console.warn('Erro ao atualizar dashboard independente:', error);
        }
    }

    /**
     * Atualiza elementos específicos do dashboard
     */
    atualizarElementosDashboard(dados) {
        // Atualizar pressão
        const pressaoEl = document.getElementById('pressao');
        if (pressaoEl) {
            pressaoEl.textContent = `${dados.pressao.toFixed(1)} bar`;
        }
        
        // Atualizar temperatura
        const temperaturaEl = document.getElementById('temperatura');
        if (temperaturaEl) {
            temperaturaEl.textContent = `${dados.temperatura.toFixed(1)} °C`;
        }
        
        // Atualizar temperatura ambiente
        const tempAmbienteEl = document.getElementById('temperatura-ambiente-dashboard');
        if (tempAmbienteEl) {
            tempAmbienteEl.textContent = `${dados.temperaturaAmbiente.toFixed(1)} °C`;
        }
        
        // Atualizar umidade
        const umidadeEl = document.getElementById('umidade');
        if (umidadeEl) {
            umidadeEl.textContent = `${dados.umidade.toFixed(1)}%`;
        }
        
        // Atualizar corrente
        const correnteEl = document.getElementById('corrente');
        if (correnteEl) {
            correnteEl.textContent = `${dados.corrente.toFixed(1)} A`;
        }
        
        // Atualizar funcionamento
        const funcionamentoEl = document.getElementById('funcionamento-dashboard');
        if (funcionamentoEl) {
            if (dados.ligado) {
                funcionamentoEl.textContent = '🟢 Ligado';
                funcionamentoEl.className = 'text-2xl font-bold text-green-600';
            } else {
                funcionamentoEl.textContent = '🔴 Desligado';
                funcionamentoEl.className = 'text-2xl font-bold text-red-600';
            }
        }
        
        // Atualizar vibração
        const vibracaoEl = document.getElementById('vibracao');
        if (vibracaoEl) {
            if (dados.vibracao) {
                vibracaoEl.textContent = '⚠️ Anormal';
                vibracaoEl.className = 'text-2xl font-bold text-red-600';
            } else {
                vibracaoEl.textContent = '✅ Normal';
                vibracaoEl.className = 'text-2xl font-bold text-green-600';
            }
        }
    }
}

// Inicializar aplicação
const app = new OFtechApp();

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
    app.destroy();
});

// Exportar para uso global se necessário
window.OFtechApp = app;

export default OFtechApp;