/**
 * Arquivo principal da aplicação OFtech
 * Integra todos os módulos e inicializa a aplicação
 */

import { CompressorManager } from './modules/compressor.js';
import { ChartManager } from './modules/chart.js';
import { ModalManager } from './modules/modal.js';
import { NotificationManager } from './modules/notifications.js';
import { SearchFilterManager } from './modules/search-filter.js';
import { Utils } from './modules/utils.js';
import { appConfig, appState } from '../data/config.js';

class OFtechApp {
    constructor() {
        this.compressorManager = null;
        this.chartManager = null;
        this.modalManager = null;
        this.notificationManager = null;
        this.searchFilterManager = null;
        
        this.init();
    }

    setupMetricButtons() {
        const btnP = document.getElementById('btn-pressao');
        const btnT = document.getElementById('btn-temperatura');
        const btnC = document.getElementById('btn-consumo');

        if (btnP) btnP.addEventListener('click', () => {
            this.chartManager.setMetric('pressao');
            this._highlightMetricButton('btn-pressao');
        });
        if (btnT) btnT.addEventListener('click', () => {
            this.chartManager.setMetric('temperatura');
            this._highlightMetricButton('btn-temperatura');
        });
        if (btnC) btnC.addEventListener('click', () => {
            this.chartManager.setMetric('consumo');
            this._highlightMetricButton('btn-consumo');
        });

        // Default highlight
        this._highlightMetricButton('btn-consumo');

        // Tornar os cards clicáveis e acessíveis via teclado
        const cardPressao = document.getElementById("card-pressao");
        const cardTemperatura = document.getElementById("card-temperatura");
        const cardConsumo = document.getElementById("card-consumo");

        const bindCard = (el, metricId, btnId) => {
            if (!el) return;
            const activate = () => {
                this.chartManager.setMetric(metricId);
                this._highlightMetricButton(btnId);
            };
            el.addEventListener("click", activate);
            el.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate();
                }
            });
        };

        bindCard(cardPressao, "pressao", "btn-pressao");
        bindCard(cardTemperatura, "temperatura", "btn-temperatura");
        bindCard(cardConsumo, "consumo", "btn-consumo");
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
                this.initializeApp();
            }
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
        }
    }

    initializeApp() {
        console.log('🚀 Iniciando OFtech App...');
        
        // Inicializar módulos
        this.modalManager = new ModalManager();
        this.notificationManager = new NotificationManager();
        this.searchFilterManager = new SearchFilterManager();
        this.compressorManager = new CompressorManager();
        this.chartManager = new ChartManager();
        
        // Expor managers globalmente para uso nos templates
        window.notificationManager = this.notificationManager;
        window.searchFilterManager = this.searchFilterManager;
        
        // Adicionar algumas notificações de demonstração (remover em produção)
        setTimeout(() => {
            this.notificationManager.addNotification({
                type: 'info',
                title: 'Sistema Iniciado',
                message: 'Sistema de monitoramento OFtech iniciado com sucesso.',
                compressorId: null
            });

            this.notificationManager.addNotification({
                type: 'aviso',
                title: 'Manutenção Programada',
                message: 'Compressor 2 está programado para manutenção em 2 horas.',
                compressorId: '2'
            });
        }, 2000);
        
        // Conectar botões de métrica
        this.setupMetricButtons();
        
        // Configurar eventos entre módulos
        this.setupModuleEvents();
        
        // Verificar sessão do usuário
        this.checkUserSession();
        
        // Configurar atualizações automáticas
        this.setupAutoUpdates();
        
        console.log('✅ OFtech App inicializado com sucesso!');
    }

    setupModuleEvents() {
        // Evento de modal fechado - parar atualizações do gráfico
        window.addEventListener('modalClosed', (event) => {
            if (event.detail.modalType === 'compressor') {
                this.compressorManager.fecharModal();
                this.chartManager.pararAtualizacao();
                appState.isModalOpen = false;
                appState.activeCompressor = null;
            }
        });

        // Evento de compressor selecionado - inicializar gráfico
        window.addEventListener('compressorSelected', (event) => {
            const { compressorId } = event.detail;
            appState.activeCompressor = compressorId;
            appState.isModalOpen = true;
            
            // Aguardar um pouco para o modal aparecer
            setTimeout(() => {
                this.chartManager.inicializarGrafico();
                // garantir que a métrica atual seja aplicada
                this.chartManager.setMetric(this.chartManager.metric);
            }, 150);
        });

    }

    // login/session removed for standalone mode

    setupAutoUpdates() {
        // Verificar se há dados para atualizar periodicamente
        setInterval(() => {
            if (appState.isModalOpen && appState.activeCompressor) {
                // Os dados já são atualizados pelo CompressorManager
                // Aqui podemos adicionar outras verificações se necessário
            }
        }, appConfig.updateInterval.realTimeData);
    }

    // Métodos públicos para interação externa
    getAppState() {
        return { ...appState };
    }

    getCurrentUser() {
        return appState.currentUser;
    }

    isUserLoggedIn() {
        return appState.currentUser !== null;
    }

    // Cleanup para quando a página for fechada
    destroy() {
        if (this.chartManager) {
            this.chartManager.destruir();
        }
        
        if (this.compressorManager && this.compressorManager.intervaloDados) {
            clearInterval(this.compressorManager.intervaloDados);
        }

        if (this.notificationManager) {
            this.notificationManager.saveNotifications();
        }
        
        // Limpar outros intervalos se existirem
        Object.values(appState.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
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