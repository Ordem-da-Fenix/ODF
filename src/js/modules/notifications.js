/**
 * Sistema de Notificações para Anomalias dos Compressores
 * Gerencia detecção, exibição e interação com notificações
 */

export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.panel = null;
        this.toggleButton = null;
        this.badge = null;
        this.list = null;
        this.overlay = null;
        this.isOpen = false;
        this.currentFilter = 'all';
        
        this.init();
    }

    init() {
        this.setupDOMReferences();
        this.setupEventListeners();
        this.loadStoredNotifications();
        this.startAnomalyDetection();
    }

    setupDOMReferences() {
        this.panel = document.getElementById('notifications-panel');
        this.toggleButton = document.getElementById('notifications-toggle');
        this.badge = document.getElementById('notification-badge');
        this.list = document.getElementById('notifications-list');
        this.overlay = document.getElementById('notifications-overlay');
        this.closeButton = document.getElementById('notifications-close');
        this.clearButton = document.getElementById('clear-all-notifications');
        this.filterButtons = document.querySelectorAll('.notification-filter');
    }

    setupEventListeners() {
        // Toggle painel
        this.toggleButton?.addEventListener('click', () => this.togglePanel());
        this.closeButton?.addEventListener('click', () => this.closePanel());
        this.overlay?.addEventListener('click', () => this.closePanel());

        // Filtros
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });

        // Limpar todas
        this.clearButton?.addEventListener('click', () => this.clearAllNotifications());

        // ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closePanel();
            }
        });
    }

    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        this.isOpen = true;
        this.panel.classList.remove('translate-x-full');
        this.overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Marcar notificações como lidas
        this.markAllAsRead();
    }

    closePanel() {
        this.isOpen = false;
        this.panel.classList.add('translate-x-full');
        this.overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Atualizar botões de filtro
        this.filterButtons.forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active', 'bg-oftech-orange', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
                btn.classList.remove('active', 'bg-oftech-orange', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });

        this.renderNotifications();
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            isRead: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        
        // Limitar a 50 notificações
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        this.saveNotifications();
        this.updateBadge();
        this.renderNotifications();
        
        // Mostrar toast se painel estiver fechado
        if (!this.isOpen) {
            this.showToast(notification);
        }

        return newNotification.id;
    }

    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 max-w-sm bg-white border-l-4 shadow-lg rounded-r-lg p-4 z-50 transform translate-x-full transition-transform duration-300 ${
            this.getNotificationColors(notification.type).borderColor
        }`;
        
        toast.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-800">${notification.title}</p>
                    <p class="text-xs text-gray-600 mt-1">${notification.message}</p>
                </div>
                <button class="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => toast.classList.remove('translate-x-full'), 100);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('translate-x-full');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    renderNotifications() {
        const filteredNotifications = this.currentFilter === 'all' 
            ? this.notifications 
            : this.notifications.filter(n => n.type === this.currentFilter);

        if (filteredNotifications.length === 0) {
            this.list.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.5-3.5a8.002 8.002 0 010-11.314L21 2v5.586L15 17z"></path>
                    </svg>
                    <p>Nenhuma notificação ${this.currentFilter === 'all' ? '' : `do tipo "${this.currentFilter}"`}</p>
                </div>
            `;
            return;
        }

        this.list.innerHTML = filteredNotifications.map(notification => 
            this.renderNotificationItem(notification)
        ).join('');
    }

    renderNotificationItem(notification) {
        const colors = this.getNotificationColors(notification.type);
        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        return `
            <div class="notification-item p-3 border-l-4 ${colors.borderColor} bg-white border border-gray-200 rounded-r-lg mb-3 ${notification.isRead ? 'opacity-75' : ''}" data-id="${notification.id}">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0 mt-1">
                        ${this.getNotificationIcon(notification.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h4 class="text-sm font-medium text-gray-800 truncate">${notification.title}</h4>
                            <span class="text-xs text-gray-500 ml-2">${timeAgo}</span>
                        </div>
                        <p class="text-xs text-gray-600 mt-1">${notification.message}</p>
                        ${notification.compressorId ? `
                            <div class="flex items-center mt-2 space-x-2">
                                <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                    Compressor ${notification.compressorId}
                                </span>
                                ${notification.value ? `<span class="text-xs text-gray-500">${notification.value}</span>` : ''}
                            </div>
                        ` : ''}
                        <div class="flex items-center justify-end mt-2 space-x-2">
                            <button class="text-xs text-oftech-orange hover:text-oftech-dark" onclick="window.notificationManager.viewCompressor('${notification.compressorId}')">
                                Ver Detalhes
                            </button>
                            <button class="text-xs text-gray-400 hover:text-gray-600" onclick="window.notificationManager.removeNotification('${notification.id}')">
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getNotificationColors(type) {
        const colors = {
            erro: { borderColor: 'border-red-500', iconColor: 'text-red-500' },
            aviso: { borderColor: 'border-yellow-500', iconColor: 'text-yellow-500' },
            info: { borderColor: 'border-blue-500', iconColor: 'text-blue-500' },
            sucesso: { borderColor: 'border-green-500', iconColor: 'text-green-500' }
        };
        return colors[type] || colors.info;
    }

    getNotificationIcon(type) {
        const colors = this.getNotificationColors(type);
        const icons = {
            erro: `<svg class="w-5 h-5 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            aviso: `<svg class="w-5 h-5 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>`,
            info: `<svg class="w-5 h-5 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            sucesso: `<svg class="w-5 h-5 ${colors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`
        };
        return icons[type] || icons.info;
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }

    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        
        if (unreadCount > 0) {
            this.badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            this.badge.classList.remove('hidden');
        } else {
            this.badge.classList.add('hidden');
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.isRead = true);
        this.saveNotifications();
        this.updateBadge();
        this.renderNotifications();
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateBadge();
        this.renderNotifications();
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateBadge();
        this.renderNotifications();
    }

    viewCompressor(compressorId) {
        // Fechar painel de notificações
        this.closePanel();
        
        // Disparar evento para abrir compressor específico
        const compressorElement = document.querySelector(`[data-id="${compressorId}"]`);
        if (compressorElement) {
            compressorElement.click();
        }
    }

    saveNotifications() {
        try {
            localStorage.setItem('oftech_notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Erro ao salvar notificações:', error);
        }
    }

    loadStoredNotifications() {
        try {
            const stored = localStorage.getItem('oftech_notifications');
            if (stored) {
                this.notifications = JSON.parse(stored).map(n => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));
                this.updateBadge();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
            this.notifications = [];
        }
    }

    startAnomalyDetection() {
        // Sistema de detecção de anomalias baseado nos dados dos compressores
        setInterval(() => {
            this.detectAnomalies();
        }, 10000); // Verificar a cada 10 segundos
    }

    detectAnomalies() {
        // Escutar eventos de dados dos compressores
        window.addEventListener('compressorDataUpdated', (event) => {
            const { compressorId, data } = event.detail;
            this.checkForAnomalies(compressorId, data);
        });
    }

    checkForAnomalies(compressorId, data) {
        const { pressao, temperatura, consumoEnergia } = data;
        
        // Limites de anomalia
        const limits = {
            pressao: { min: 60, max: 120, critical: 130 },
            temperatura: { min: 15, max: 40, critical: 50 },
            consumo: { min: 0, max: 100, critical: 120 }
        };

        // Verificar pressão
        if (pressao > limits.pressao.critical) {
            this.addNotification({
                type: 'erro',
                title: 'Pressão Crítica!',
                message: 'Pressão excedeu o limite crítico. Intervenção imediata necessária.',
                compressorId,
                value: `${pressao.toFixed(1)} PSI`
            });
        } else if (pressao > limits.pressao.max) {
            this.addNotification({
                type: 'aviso',
                title: 'Pressão Elevada',
                message: 'Pressão acima do normal. Monitore com atenção.',
                compressorId,
                value: `${pressao.toFixed(1)} PSI`
            });
        }

        // Verificar temperatura
        if (temperatura > limits.temperatura.critical) {
            this.addNotification({
                type: 'erro',
                title: 'Temperatura Crítica!',
                message: 'Temperatura perigosamente alta. Risco de danos ao equipamento.',
                compressorId,
                value: `${temperatura.toFixed(1)} °C`
            });
        } else if (temperatura > limits.temperatura.max) {
            this.addNotification({
                type: 'aviso',
                title: 'Superaquecimento',
                message: 'Temperatura acima do recomendado.',
                compressorId,
                value: `${temperatura.toFixed(1)} °C`
            });
        }

        // Verificar consumo
        if (consumoEnergia > limits.consumo.critical) {
            this.addNotification({
                type: 'erro',
                title: 'Consumo Excessivo!',
                message: 'Consumo de energia crítico. Possível problema mecânico.',
                compressorId,
                value: `${consumoEnergia.toFixed(1)} kW`
            });
        } else if (consumoEnergia > limits.consumo.max) {
            this.addNotification({
                type: 'aviso',
                title: 'Alto Consumo',
                message: 'Consumo de energia elevado.',
                compressorId,
                value: `${consumoEnergia.toFixed(1)} kW`
            });
        }
    }

    // Métodos públicos para uso externo
    createManualNotification(type, title, message, compressorId = null) {
        return this.addNotification({
            type,
            title,
            message,
            compressorId
        });
    }

    getNotifications() {
        return [...this.notifications];
    }

    getUnreadCount() {
        return this.notifications.filter(n => !n.isRead).length;
    }
}