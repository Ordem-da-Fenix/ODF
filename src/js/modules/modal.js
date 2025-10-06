/**
 * Módulo para gerenciar modais
 * Versão standalone com dados mock
 */

import { apiMock } from '../../data/mocks.js';

export class ModalManager {
    constructor() {
        this.spans = document.getElementsByClassName('close');
        this.modal = document.getElementById('modal-detalhes');
        this.loginModal = document.getElementById('loginModal');
        this.loginForm = document.getElementById('loginForm');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botão de login no header
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.abrirLoginModal();
            });
        }

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
            if (event.target === this.loginModal) {
                this.fecharLoginModal();
            }
        });

        // Fechar modal com tecla ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.fecharTodosModais();
            }
        });

        // Manipular envio do formulário de login
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                this.handleLoginSubmit(e);
            });
        }
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
        this.loginModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    fecharTodosModais() {
        this.fecharModal();
        this.fecharLoginModal();
    }

    abrirLoginModal() {
        this.loginModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    async handleLoginSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.loginForm);
        const data = Object.fromEntries(formData);
        
        // Validação básica
        if (this.validarFormulario(data)) {
            // Mostrar loading
            this.mostrarCarregamento(true);
            
            try {
                // Tentar login com API mock
                const response = await apiMock.login(data.email, data.senha);
                
                if (response.success) {
                    // Login bem-sucedido
                    this.processarLoginSucesso(response.data);
                    this.fecharLoginModal();
                    this.mostrarMensagemSucesso('Login realizado com sucesso!');
                } else {
                    // Login falhou
                    this.mostrarErro(response.message || 'Erro no login');
                }
            } catch (error) {
                console.error('Erro no login:', error);
                this.mostrarErro('Erro de conexão. Tente novamente.');
            } finally {
                this.mostrarCarregamento(false);
            }
        }
    }

    processarLoginSucesso(userData) {
        // Salvar dados do usuário no localStorage
        localStorage.setItem('userSession', JSON.stringify({
            id: userData.id,
            nome: userData.nome,
            email: userData.email,
            cargo: userData.cargo,
            permissoes: userData.permissoes,
            token: userData.token,
            loginTime: new Date().toISOString()
        }));
        
        // Disparar evento de login bem-sucedido
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { user: userData }
        }));
    }

    mostrarCarregamento(mostrar) {
        const submitBtn = this.loginForm.querySelector('button[type="submit"]');
        if (mostrar) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
            `;
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    }

    validarFormulario(data) {
        const { nome, email, senha, telefone } = data;
        
        if (!nome || nome.length < 2) {
            this.mostrarErro('Nome deve ter pelo menos 2 caracteres');
            return false;
        }
        
        if (!email || !email.includes('@')) {
            this.mostrarErro('Email inválido');
            return false;
        }
        
        if (!senha || senha.length < 6) {
            this.mostrarErro('Senha deve ter pelo menos 6 caracteres');
            return false;
        }
        
        if (!telefone || telefone.length < 10) {
            this.mostrarErro('Telefone deve ter pelo menos 10 dígitos');
            return false;
        }
        
        return true;
    }



    mostrarErro(mensagem) {
        // Criar ou atualizar elemento de erro
        let errorElement = document.getElementById('login-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'login-error';
            errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
            this.loginForm.insertBefore(errorElement, this.loginForm.firstChild);
        }
        
        errorElement.textContent = mensagem;
        
        // Remover erro após 5 segundos
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }

    mostrarMensagemSucesso(mensagem = 'Operação realizada com sucesso!') {
        // Criar notificação de sucesso
        const successElement = document.createElement('div');
        successElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        successElement.textContent = mensagem;
        
        document.body.appendChild(successElement);
        
        // Animar entrada
        setTimeout(() => {
            successElement.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            successElement.style.transform = 'translateX(full)';
            setTimeout(() => {
                if (successElement.parentNode) {
                    successElement.remove();
                }
            }, 300);
        }, 3000);
    }
}