/**
 * Sistema de Roteamento Hash para SPA
 * Compatível com GitHub Pages - sem necessidade de backend
 */

export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.currentParams = {};
        
        // Views/containers principais
        this.dashboardView = null;
        this.compressorDetailsView = null;
        
        this.init();
    }

    init() {
        console.log('🗺️ Inicializando Router...');
        
        // Capturar elementos da DOM
        this.dashboardView = document.getElementById('dashboard-view');
        this.compressorDetailsView = document.getElementById('compressor-details-view');
        
        // Event listeners para navegação
        window.addEventListener('hashchange', () => this.handleRouteChange());
        window.addEventListener('load', () => this.handleRouteChange());
        
        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentRoute === '/compressor/:id') {
                this.navigate('/');
            }
        });
        
        // Registrar rotas padrão
        this.registerDefaultRoutes();
        
        console.log('✅ Router configurado');
    }

    /**
     * Registra rotas padrão da aplicação
     */
    registerDefaultRoutes() {
        // Rota principal - Dashboard
        this.addRoute('/', () => this.showDashboard());
        this.addRoute('', () => this.showDashboard());
        
        // Rota de detalhes do compressor com parâmetro
        this.addRoute('/compressor/:id', (params) => this.showCompressorDetails(params.id));
        
        console.log('📍 Rotas registradas: /, /compressor/:id');
    }

    /**
     * Adiciona uma nova rota
     * @param {string} path - Caminho da rota (ex: '/compressor/:id')
     * @param {function} handler - Função para manipular a rota
     */
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    /**
     * Navega para uma nova rota
     * @param {string} path - Caminho de destino
     */
    navigate(path) {
        console.log(`🚀 Navegando para: ${path}`);
        window.location.hash = path;
    }

    /**
     * Manipula mudanças de rota
     */
    handleRouteChange() {
        const hash = window.location.hash.slice(1) || '/';
        console.log(`🔄 Mudança de rota detectada: ${hash}`);
        
        // Encontrar rota correspondente
        const matchedRoute = this.matchRoute(hash);
        
        if (matchedRoute) {
            this.currentRoute = matchedRoute.route;
            this.currentParams = matchedRoute.params;
            
            // Executar handler da rota
            const handler = this.routes.get(matchedRoute.route);
            if (handler) {
                handler(matchedRoute.params);
            }
        } else {
            console.warn(`⚠️ Rota não encontrada: ${hash}`);
            // Fallback para dashboard
            this.navigate('/');
        }
    }

    /**
     * Encontra rota correspondente ao path atual
     * @param {string} path - Caminho atual
     * @returns {object|null} - Objeto com rota e parâmetros ou null
     */
    matchRoute(path) {
        for (const [route] of this.routes) {
            const params = this.extractParams(route, path);
            if (params !== null) {
                return { route, params };
            }
        }
        return null;
    }

    /**
     * Extrai parâmetros de uma rota
     * @param {string} route - Padrão da rota (ex: '/compressor/:id')
     * @param {string} path - Caminho atual (ex: '/compressor/1001')
     * @returns {object|null} - Parâmetros extraídos ou null se não coincide
     */
    extractParams(route, path) {
        // Conversão de rota para regex
        const routePattern = route
            .replace(/:[^/]+/g, '([^/]+)')  // :id vira ([^/]+)
            .replace(/\//g, '\\/');         // / vira \/
        
        const regex = new RegExp(`^${routePattern}$`);
        const match = path.match(regex);
        
        if (!match) return null;
        
        // Extrair nomes dos parâmetros
        const paramNames = route.match(/:[^/]+/g) || [];
        const params = {};
        
        paramNames.forEach((paramName, index) => {
            const cleanName = paramName.slice(1); // Remove ':'
            params[cleanName] = match[index + 1];
        });
        
        return params;
    }

    /**
     * Mostra view do dashboard principal
     */
    showDashboard() {
        console.log('📊 Exibindo Dashboard');
        
        // Ocultar todas as views
        this.hideAllViews();
        
        // Mostrar dashboard
        if (this.dashboardView) {
            this.dashboardView.style.display = 'block';
        }
        
        // Atualizar breadcrumb
        this.updateBreadcrumb([
            { label: 'Dashboard', path: '/', active: true }
        ]);
        
        // Disparar evento para outros módulos
        window.dispatchEvent(new CustomEvent('routeChanged', {
            detail: { route: '/', view: 'dashboard' }
        }));
    }

    /**
     * Mostra view de detalhes do compressor
     * @param {string} compressorId - ID do compressor
     */
    showCompressorDetails(compressorId) {
        console.log(`🔧 Exibindo detalhes do compressor: ${compressorId}`);
        
        // Ocultar todas as views
        this.hideAllViews();
        
        // Mostrar view de detalhes
        if (this.compressorDetailsView) {
            this.compressorDetailsView.style.display = 'block';
        }
        
        // Atualizar breadcrumb
        this.updateBreadcrumb([
            { label: 'Dashboard', path: '/', active: false },
            { label: `Compressor ${compressorId}`, path: `/compressor/${compressorId}`, active: true }
        ]);
        
        // Disparar evento para outros módulos saberem qual compressor foi selecionado
        window.dispatchEvent(new CustomEvent('routeChanged', {
            detail: { 
                route: '/compressor/:id', 
                view: 'compressor-details',
                compressorId: compressorId
            }
        }));
        
        // Disparar evento específico para compressor (mantém compatibilidade)
        window.dispatchEvent(new CustomEvent('compressorSelected', {
            detail: { compressorId }
        }));
    }

    /**
     * Oculta todas as views
     */
    hideAllViews() {
        if (this.dashboardView) {
            this.dashboardView.style.display = 'none';
        }
        if (this.compressorDetailsView) {
            this.compressorDetailsView.style.display = 'none';
        }
    }

    /**
     * Atualiza breadcrumb na interface
     * @param {Array} items - Array de objetos com label, path e active
     */
    updateBreadcrumb(items) {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        
        if (!breadcrumbContainer) return;
        
        const breadcrumbHtml = items.map((item, index) => {
            const isLast = index === items.length - 1;
            let html = '';
            
            if (isLast) {
                html = `<span class="text-gray-600 font-medium">${item.label}</span>`;
            } else {
                const icon = item.path === '/' ? 
                    '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"></path></svg>' :
                    '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>';
                
                html = `<a href="#${item.path}" class="text-oftech-orange hover:text-oftech-dark flex items-center transition-colors">
                    ${icon}${item.label}
                </a>`;
            }
            
            // Adicionar separador se não for o último
            if (!isLast) {
                html += ' <svg class="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg> ';
            }
            
            return html;
        }).join('');
        
        breadcrumbContainer.innerHTML = breadcrumbHtml;
    }

    /**
     * Volta para a página anterior (útil para botões "Voltar")
     */
    goBack() {
        window.history.back();
    }

    /**
     * Obtém rota atual
     * @returns {string} - Rota atual
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Obtém parâmetros da rota atual
     * @returns {object} - Parâmetros da rota atual
     */
    getCurrentParams() {
        return this.currentParams;
    }

    /**
     * Verifica se está em uma rota específica
     * @param {string} route - Rota para verificar
     * @returns {boolean} - True se está na rota
     */
    isCurrentRoute(route) {
        return this.currentRoute === route;
    }

    /**
     * Gera URL completa para compartilhamento
     * @param {string} path - Caminho da rota
     * @returns {string} - URL completa
     */
    getShareableUrl(path) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#${path}`;
    }

    /**
     * Copia URL do compressor para área de transferência
     * @param {string} compressorId - ID do compressor
     */
    async shareCompressor(compressorId) {
        const url = this.getShareableUrl(`/compressor/${compressorId}`);
        
        try {
            await navigator.clipboard.writeText(url);
            console.log(`📋 URL copiada: ${url}`);
            return true;
        } catch (err) {
            console.warn('⚠️ Não foi possível copiar URL:', err);
            return false;
        }
    }
}

// Instância global do router
export const router = new Router();

// Disponibilizar globalmente para debug
window.router = router;