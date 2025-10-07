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
        this.tempoFuncionamentoElement = document.getElementById('tempo-funcionamento');
        this.temperaturaAmbienteElement = document.getElementById('temperatura-ambiente');
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

                // Atualizar tempo de funcionamento e temperatura ambiente
                this.atualizarInformacoesAdicionais(compressorId);

                // Disparar evento para sistema de notificações
                window.dispatchEvent(new CustomEvent('compressorDataUpdated', {
                    detail: { 
                        compressorId, 
                        data: { pressao, temperatura, consumoEnergia }
                    }
                }));
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

    atualizarInformacoesAdicionais(compressorId) {
        // Buscar elemento do compressor para pegar dados adicionais
        const compressorElement = document.querySelector(`[data-id="${compressorId}"]`);
        if (compressorElement) {
            const tempoFuncionamento = compressorElement.getAttribute('data-tempo-funcionamento');
            const tempAmbiente = compressorElement.getAttribute('data-temp-ambiente');
            
            if (this.tempoFuncionamentoElement) {
                this.tempoFuncionamentoElement.textContent = tempoFuncionamento || '--';
            }
            
            if (this.temperaturaAmbienteElement) {
                const temp = parseFloat(tempAmbiente);
                if (!isNaN(temp)) {
                    // Simular pequenas variações na temperatura ambiente
                    const variacao = (Math.random() - 0.5) * 0.5; // ±0.25°C
                    const novaTemp = temp + variacao;
                    this.temperaturaAmbienteElement.textContent = `${novaTemp.toFixed(1)} °C`;
                    
                    // Atualizar o atributo no elemento também
                    compressorElement.setAttribute('data-temp-ambiente', novaTemp.toFixed(1));
                } else {
                    this.temperaturaAmbienteElement.textContent = '-- °C';
                }
            }
            
            // Atualizar tempo de funcionamento se estiver online
            if (compressorElement.getAttribute('data-status') === 'online' && tempoFuncionamento !== 'Parado') {
                this.atualizarTempoFuncionamento(compressorElement);
            }
        }
    }
    
    atualizarTempoFuncionamento(compressorElement) {
        const tempoAtual = compressorElement.getAttribute('data-tempo-funcionamento');
        if (tempoAtual && tempoAtual !== 'Parado') {
            // Extrair horas e minutos do formato "8h 23m"
            const match = tempoAtual.match(/(\d+)h (\d+)m/);
            if (match) {
                let horas = parseInt(match[1]);
                let minutos = parseInt(match[2]);
                
                // Incrementar minutos aleatoriamente (simular tempo passando)
                if (Math.random() > 0.8) { // 20% de chance de incrementar
                    minutos++;
                    if (minutos >= 60) {
                        minutos = 0;
                        horas++;
                    }
                    
                    const novoTempo = `${horas}h ${minutos}m`;
                    compressorElement.setAttribute('data-tempo-funcionamento', novoTempo);
                    
                    if (this.tempoFuncionamentoElement) {
                        this.tempoFuncionamentoElement.textContent = novoTempo;
                    }
                }
            }
        }
    }

    // Getter para ser usado por outros módulos
    get isModalOpen() {
        return !this.modal.classList.contains('hidden');
    }
}