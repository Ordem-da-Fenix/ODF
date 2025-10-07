/**
 * Sistema de Pesquisa e Filtros para Compressores
 * Gerencia pesquisa por texto, filtros por status e filtros avançados
 */

export class SearchFilterManager {
    constructor() {
        this.compressors = [];
        this.filteredCompressors = [];
        this.currentFilters = {
            search: '',
            status: 'all',
            fabricante: '',
            setor: '',
            potencia: '',
            horas: '',
            alertas: ''
        };
        
        this.init();
    }

    init() {
        this.setupDOMReferences();
        this.setupEventListeners();
        this.loadCompressors();
        this.updateResultsCount();
    }

    setupDOMReferences() {
        // Elementos de pesquisa e filtros
        this.searchInput = document.getElementById('search-compressors');
        this.advancedToggle = document.getElementById('advanced-filters-toggle');
        this.advancedPanel = document.getElementById('advanced-filters');
        this.statusFilters = document.querySelectorAll('.status-filter');
        
        // Filtros avançados
        this.filterFabricante = document.getElementById('filter-fabricante');
        this.filterSetor = document.getElementById('filter-setor');
        this.filterPotencia = document.getElementById('filter-potencia');
        this.filterHoras = document.getElementById('filter-horas');
        this.filterAlertas = document.getElementById('filter-alertas');
        
        // Botões de ação
        this.applyBtn = document.getElementById('apply-filters');
        this.clearBtn = document.getElementById('clear-filters');
        this.exportBtn = document.getElementById('export-results');
        
        // Lista de compressores
        this.compressorsList = document.getElementById('compressors-list');
        this.resultsCount = document.getElementById('results-count');
    }

    setupEventListeners() {
        // Pesquisa em tempo real
        this.searchInput?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.debounce(() => this.applyFilters(), 300)();
        });

        // Toggle filtros avançados
        this.advancedToggle?.addEventListener('click', () => {
            this.toggleAdvancedFilters();
        });

        // Filtros por status
        this.statusFilters?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.getAttribute('data-status');
                this.setStatusFilter(status);
            });
        });

        // Aplicar filtros avançados
        this.applyBtn?.addEventListener('click', () => {
            this.applyAdvancedFilters();
        });

        // Limpar filtros
        this.clearBtn?.addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Exportar resultados
        this.exportBtn?.addEventListener('click', () => {
            this.exportResults();
        });

        // Aplicar filtro ao pressionar Enter nos campos
        [this.filterPotencia, this.filterHoras].forEach(input => {
            input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyAdvancedFilters();
                }
            });
        });
    }

    loadCompressors() {
        // Carregar compressores do DOM
        const compressorElements = document.querySelectorAll('.compressor');
        this.compressors = Array.from(compressorElements).map(el => ({
            element: el,
            id: el.getAttribute('data-id'),
            status: el.getAttribute('data-status'),
            fabricante: el.getAttribute('data-fabricante'),
            setor: el.getAttribute('data-setor'),
            potencia: parseInt(el.getAttribute('data-potencia')) || 0,
            horas: parseInt(el.getAttribute('data-horas')) || 0,
            alertas: el.getAttribute('data-alertas') === 'true',
            name: el.querySelector('span').textContent.toLowerCase(),
            visible: true
        }));

        this.filteredCompressors = [...this.compressors];
    }

    toggleAdvancedFilters() {
        const isHidden = this.advancedPanel.classList.contains('hidden');
        
        if (isHidden) {
            this.advancedPanel.classList.remove('hidden');
            this.advancedToggle.classList.add('bg-oftech-orange', 'text-white');
            this.advancedToggle.classList.remove('bg-gray-100', 'text-gray-700');
        } else {
            this.advancedPanel.classList.add('hidden');
            this.advancedToggle.classList.remove('bg-oftech-orange', 'text-white');
            this.advancedToggle.classList.add('bg-gray-100', 'text-gray-700');
        }
    }

    setStatusFilter(status) {
        this.currentFilters.status = status;
        
        // Atualizar visual dos botões
        this.statusFilters.forEach(btn => {
            if (btn.getAttribute('data-status') === status) {
                btn.classList.add('active', 'bg-oftech-orange', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
                btn.classList.remove('active', 'bg-oftech-orange', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });

        this.applyFilters();
    }

    applyAdvancedFilters() {
        // Coletar valores dos filtros avançados
        this.currentFilters.fabricante = this.filterFabricante?.value || '';
        this.currentFilters.setor = this.filterSetor?.value || '';
        this.currentFilters.potencia = this.filterPotencia?.value || '';
        this.currentFilters.horas = this.filterHoras?.value || '';
        this.currentFilters.alertas = this.filterAlertas?.value || '';

        this.applyFilters();
    }

    applyFilters() {
        this.filteredCompressors = this.compressors.filter(compressor => {
            // Filtro de pesquisa por texto
            if (this.currentFilters.search && 
                !compressor.name.includes(this.currentFilters.search) &&
                !compressor.id.includes(this.currentFilters.search)) {
                return false;
            }

            // Filtro por status
            if (this.currentFilters.status !== 'all' && 
                compressor.status !== this.currentFilters.status) {
                return false;
            }

            // Filtro por fabricante
            if (this.currentFilters.fabricante && 
                compressor.fabricante !== this.currentFilters.fabricante) {
                return false;
            }

            // Filtro por setor
            if (this.currentFilters.setor && 
                compressor.setor !== this.currentFilters.setor) {
                return false;
            }

            // Filtro por potência mínima
            if (this.currentFilters.potencia && 
                compressor.potencia < parseInt(this.currentFilters.potencia)) {
                return false;
            }

            // Filtro por horas mínimas de operação
            if (this.currentFilters.horas && 
                compressor.horas < parseInt(this.currentFilters.horas)) {
                return false;
            }

            // Filtro por alertas
            if (this.currentFilters.alertas !== '') {
                const hasAlertas = this.currentFilters.alertas === 'true';
                if (compressor.alertas !== hasAlertas) {
                    return false;
                }
            }

            return true;
        });

        this.updateDisplay();
        this.updateResultsCount();
    }

    updateDisplay() {
        // Mostrar/ocultar compressores baseado nos filtros
        this.compressors.forEach(compressor => {
            const isVisible = this.filteredCompressors.includes(compressor);
            compressor.element.style.display = isVisible ? 'flex' : 'none';
            compressor.visible = isVisible;
        });

        // Mostrar mensagem se não houver resultados
        this.showNoResultsMessage();
    }

    showNoResultsMessage() {
        const existingMessage = document.getElementById('no-results-message');
        
        if (this.filteredCompressors.length === 0) {
            if (!existingMessage) {
                const message = document.createElement('div');
                message.id = 'no-results-message';
                message.className = 'text-center py-8 text-gray-500';
                message.innerHTML = `
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.07 0-3.946.79-5.344 2.083A8.001 8.001 0 0112 21a8.001 8.001 0 015.344-3.917zM15 10a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <p class="text-lg font-medium mb-2">Nenhum compressor encontrado</p>
                    <p class="text-sm">Tente ajustar os filtros ou termos de pesquisa</p>
                    <button class="mt-3 text-oftech-orange hover:text-oftech-dark transition-colors" onclick="window.searchFilterManager.clearAllFilters()">
                        Limpar todos os filtros
                    </button>
                `;
                this.compressorsList.appendChild(message);
            }
        } else if (existingMessage) {
            existingMessage.remove();
        }
    }

    updateResultsCount() {
        const total = this.compressors.length;
        const showing = this.filteredCompressors.length;
        
        if (this.resultsCount) {
            if (showing === total) {
                this.resultsCount.textContent = `Mostrando ${showing} ${showing === 1 ? 'compressor' : 'compressores'}`;
            } else {
                this.resultsCount.textContent = `Mostrando ${showing} de ${total} ${total === 1 ? 'compressor' : 'compressores'}`;
            }
        }
    }

    clearAllFilters() {
        // Resetar filtros
        this.currentFilters = {
            search: '',
            status: 'all',
            fabricante: '',
            setor: '',
            potencia: '',
            horas: '',
            alertas: ''
        };

        // Limpar campos
        if (this.searchInput) this.searchInput.value = '';
        if (this.filterFabricante) this.filterFabricante.value = '';
        if (this.filterSetor) this.filterSetor.value = '';
        if (this.filterPotencia) this.filterPotencia.value = '';
        if (this.filterHoras) this.filterHoras.value = '';
        if (this.filterAlertas) this.filterAlertas.value = '';

        // Resetar filtro de status para 'all'
        this.setStatusFilter('all');

        // Aplicar filtros (que agora estão limpos)
        this.applyFilters();

        // Fechar painel avançado se estiver aberto
        if (!this.advancedPanel.classList.contains('hidden')) {
            this.toggleAdvancedFilters();
        }
    }

    exportResults() {
        const data = this.filteredCompressors.map(compressor => ({
            ID: compressor.id,
            Nome: compressor.element.querySelector('span').textContent,
            Status: compressor.status,
            Fabricante: compressor.fabricante,
            Setor: compressor.setor,
            Potencia: `${compressor.potencia} kW`,
            Horas_Operacao: compressor.horas,
            Com_Alertas: compressor.alertas ? 'Sim' : 'Não'
        }));

        // Converter para CSV
        const csv = this.convertToCSV(data);
        
        // Download do arquivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `compressores_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Mostrar notificação de sucesso
        if (window.notificationManager) {
            window.notificationManager.addNotification({
                type: 'sucesso',
                title: 'Exportação Concluída',
                message: `${data.length} compressores exportados com sucesso.`
            });
        }
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Métodos públicos
    getFilteredCompressors() {
        return this.filteredCompressors;
    }

    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    addCompressor(compressorData) {
        // Método para adicionar novos compressores dinamicamente
        this.loadCompressors(); // Recarregar da DOM
        this.applyFilters(); // Reaplicar filtros
    }

    removeCompressor(compressorId) {
        // Método para remover compressores
        this.compressors = this.compressors.filter(c => c.id !== compressorId);
        this.applyFilters();
    }
}