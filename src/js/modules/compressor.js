/**
 * Módulo para gerenciar compressores
 * Versão standalone com dados mock
 */

import { apiMock, compressoresMock } from '../../data/mocks.js';

export class CompressorManager {
    constructor() {
        this.compressores = document.querySelectorAll('.compressor');
        this.modal = document.getElementById('modal-detalhes');
        this.compressorIdElement = document.getElementById('compressor-id');
        this.pressaoElement = document.getElementById('pressao');
        this.temperaturaElement = document.getElementById('temperatura');
        this.intervaloDados = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.compressores.forEach(compressor => {
            compressor.addEventListener('click', () => {
                const compressorId = compressor.getAttribute('data-id');
                this.abrirModal(compressorId);
            });
        });
    }

    abrirModal(compressorId) {
        this.compressorIdElement.textContent = compressorId;
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Disparar evento customizado para outros módulos
        window.dispatchEvent(new CustomEvent('compressorSelected', {
            detail: { compressorId }
        }));
        
        // Iniciar atualização em tempo real
        this.atualizarDadosTempoReal();
        
        // Limpar intervalos anteriores
        if (this.intervaloDados) {
            clearInterval(this.intervaloDados);
        }
        
        // Criar novo intervalo
        this.intervaloDados = setInterval(() => {
            this.atualizarDadosTempoReal();
        }, 2000);
    }

    fecharModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Limpar intervalo de atualização
        if (this.intervaloDados) {
            clearInterval(this.intervaloDados);
            this.intervaloDados = null;
        }
    }

    async atualizarDadosTempoReal() {
        // Usar o ID do compressor ativo
        const compressorId = this.compressorIdElement.textContent;
        
        try {
            // Buscar dados do mock API
            const response = await apiMock.getDadosTempoReal(compressorId);
            
            if (response.success) {
                const { pressao, temperatura, consumoEnergia } = response.data;
                this.pressaoElement.textContent = `${pressao.toFixed(1)} PSI`;
                this.temperaturaElement.textContent = `${temperatura.toFixed(1)} °C`;
                
                // Atualizar consumo se existir elemento
                const consumoElement = document.getElementById('consumo-energia');
                if (consumoElement) {
                    consumoElement.textContent = `${consumoEnergia.toFixed(1)} kW`;
                }
            } else {
                // Dados para compressor offline
                this.pressaoElement.textContent = '0.0 PSI';
                this.temperaturaElement.textContent = `${response.data.temperatura.toFixed(1)} °C`;
            }
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            // Fallback para dados estáticos
            this.pressaoElement.textContent = '-- PSI';
            this.temperaturaElement.textContent = '-- °C';
        }
    }

    // Método auxiliar para buscar dados do compressor
    async getCompressorData(id) {
        try {
            const response = await apiMock.getCompressor(id);
            return response.success ? response.data : null;
        } catch (error) {
            console.error('Erro ao buscar compressor:', error);
            return null;
        }
    }

    // Getter para ser usado por outros módulos
    get isModalOpen() {
        return !this.modal.classList.contains('hidden');
    }
}