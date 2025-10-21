/**
 * Utilitários gerais da aplicação
 */

export class Utils {
    /**
     * Gera dados aleatórios para simulação
     */
    static gerarDadosAleatorios(min, max, decimals = 1) {
        const random = Math.random() * (max - min) + min;
        return parseFloat(random.toFixed(decimals));
    }

    /**
     * Formata timestamp para exibição
     */
    static formatarTempo(timestamp) {
        return new Date(timestamp).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo' // Horário brasileiro
        });
    }

    /**
     * Debounce para otimizar eventos
     */
    static debounce(func, wait) {
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

    /**
     * Throttle para limitar execução
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    /**
     * Validar email
     */
    static validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validar telefone brasileiro
     */
    static validarTelefone(telefone) {
        const re = /^[\(\)0-9\s\-\+]+$/;
        const numeros = telefone.replace(/\D/g, '');
        return re.test(telefone) && numeros.length >= 10 && numeros.length <= 11;
    }

    /**
     * Sanitizar string para evitar XSS
     */
    static sanitizarString(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Converter status para cor
     */
    static getStatusColor(status) {
        const colors = {
            'online': 'bg-green-500',
            'offline': 'bg-red-500',
            'manutencao': 'bg-yellow-500',
            'erro': 'bg-red-600'
        };
        return colors[status] || 'bg-gray-500';
    }

    /**
     * Animar elemento
     */
    static animarElemento(elemento, animacao, duracao = 300) {
        elemento.style.transition = `all ${duracao}ms ease`;
        elemento.classList.add(animacao);
        
        setTimeout(() => {
            elemento.classList.remove(animacao);
        }, duracao);
    }

    /**
     * Copiar texto para clipboard
     */
    static async copiarParaClipboard(texto) {
        try {
            await navigator.clipboard.writeText(texto);
            return true;
        } catch (err) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = texto;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    /**
     * Salvar no localStorage com tratamento de erro
     */
    static salvarLocalStorage(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
            return true;
        } catch (err) {
            console.error('Erro ao salvar no localStorage:', err);
            return false;
        }
    }

    /**
     * Carregar do localStorage com tratamento de erro
     */
    static carregarLocalStorage(chave, valorPadrao = null) {
        try {
            const item = localStorage.getItem(chave);
            return item ? JSON.parse(item) : valorPadrao;
        } catch (err) {
            console.error('Erro ao carregar do localStorage:', err);
            return valorPadrao;
        }
    }
}