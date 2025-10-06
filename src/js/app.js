/**
 * Arquivo principal da aplicação OFtech
 * Integra todos os módulos e inicializa a aplicação
 */

import { CompressorManager } from './modules/compressor.js';
import { ChartManager } from './modules/chart.js';
import { ModalManager } from './modules/modal.js';
import { Utils } from './modules/utils.js';
import { appConfig, appState } from '../data/config.js';
import { compressoresMock, apiMock } from '../data/mocks.js';

class OFtechApp {
    constructor() {
        this.compressorManager = null;
        this.chartManager = null;
        this.modalManager = null;
        
        this.init();
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
        this.compressorManager = new CompressorManager();
        this.chartManager = new ChartManager();
        
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
            }, 150);
        });

        // Evento de login bem-sucedido
        window.addEventListener('userLoggedIn', (event) => {
            const { user } = event.detail;
            appState.currentUser = user;
            this.updateUIForLoggedUser(user);
        });
    }

    checkUserSession() {
        const userSession = Utils.carregarLocalStorage('userSession');
        if (userSession) {
            appState.currentUser = userSession;
            this.updateUIForLoggedUser(userSession);
        }
    }

    updateUIForLoggedUser(user) {
        // Atualizar interface para usuário logado
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
        welcomeMessage.innerHTML = `
            <div class="flex items-center justify-between">
                <span>Bem-vindo, <strong>${Utils.sanitizarString(user.nome)}</strong>!</span>
                <button id="logout-btn" class="text-green-700 hover:text-green-900 font-medium">
                    Sair
                </button>
            </div>
        `;
        
        // Inserir no topo da página
        const mainContent = document.querySelector('.max-w-4xl');
        if (mainContent) {
            mainContent.insertBefore(welcomeMessage, mainContent.firstChild);
            
            // Configurar logout
            document.getElementById('logout-btn').addEventListener('click', () => {
                this.logout();
                welcomeMessage.remove();
            });
        }
    }

    logout() {
        localStorage.removeItem('userSession');
        appState.currentUser = null;
        
        // Mostrar mensagem de logout
        const logoutMessage = document.createElement('div');
        logoutMessage.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        logoutMessage.textContent = 'Logout realizado com sucesso!';
        
        document.body.appendChild(logoutMessage);
        
        setTimeout(() => {
            if (logoutMessage.parentNode) {
                logoutMessage.remove();
            }
        }, 3000);
    }

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