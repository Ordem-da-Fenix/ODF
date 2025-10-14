/**
 * Módulo para gerenciar modais
 */

export class ModalManager {
    constructor() {
        this.spans = document.getElementsByClassName('close');
        this.modal = document.getElementById('modal-detalhes');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Fechar modais ao clicar no X
        Array.from(this.spans).forEach(span => {
            span.addEventListener('click', () => {
                this.fecharTodosModais();
            });
        });

        // Fechar modais ao clicar fora
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.fecharModal();
            }
        });

        // Fechar modal com tecla ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.fecharTodosModais();
            }
        });

        // Não há formulário de login quando o sistema está em modo standalone
    }

    fecharModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Disparar evento customizado para outros módulos
        window.dispatchEvent(new CustomEvent('modalClosed', {
            detail: { modalType: 'compressor' }
        }));
    }

    fecharLoginModal() {
        // função removida: não existe mais loginModal
    }

    fecharTodosModais() {
        this.fecharModal();
        // login removido
    }
    mostrarErro(mensagem) {
        // Exibir erro genérico no console e opcionalmente criar UI de erro
        console.error('ModalManager error:', mensagem);
    }

    mostrarMensagemSucesso(mensagem = 'Operação realizada com sucesso!') {
        // Simples notificação sem dependência de login
        const successElement = document.createElement('div');
        successElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successElement.textContent = mensagem;
        document.body.appendChild(successElement);
        setTimeout(() => {
            if (successElement.parentNode) successElement.remove();
        }, 3000);
    }
}