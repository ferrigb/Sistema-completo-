// Estado da aplicação
let currentSale = null;
let salesHistory = [];

// URLs da API
const API_BASE = '/api';

// Elementos do DOM - serão inicializados após o DOM carregar
let productForm = null;
let productsList = null;
let totalValue = null;
let clearSaleBtn = null;
let finishSaleBtn = null;
let salesHistory_div = null;
let modal = null;
let modalTitle = null;
let modalMessage = null;
let modalCancel = null;
let modalConfirm = null;

// Função para inicializar elementos do DOM
function initializeDOMElements() {
    productForm = document.getElementById('product-form');
    productsList = document.getElementById('products-list');
    totalValue = document.getElementById('total-value');
    clearSaleBtn = document.getElementById('clear-sale');
    finishSaleBtn = document.getElementById('finish-sale');
    salesHistory_div = document.getElementById('sales-history');
    modal = document.getElementById('modal');
    modalTitle = document.getElementById('modal-title');
    modalMessage = document.getElementById('modal-message');
    modalCancel = document.getElementById('modal-cancel');
    modalConfirm = document.getElementById('modal-confirm');
    
    // Verificar se todos os elementos essenciais foram encontrados
    const essentialElements = {
        'product-form': productForm,
        'products-list': productsList,
        'total-value': totalValue,
        'clear-sale': clearSaleBtn,
        'finish-sale': finishSaleBtn,
        'sales-history': salesHistory_div,
        'modal': modal,
        'modal-title': modalTitle,
        'modal-message': modalMessage,
        'modal-cancel': modalCancel,
        'modal-confirm': modalConfirm
    };
    
    const missingElements = [];
    for (const [id, element] of Object.entries(essentialElements)) {
        if (!element) {
            missingElements.push(id);
        }
    }
    
    if (missingElements.length > 0) {
        console.error('Elementos não encontrados no DOM:', missingElements);
        showError(`Erro: Elementos não encontrados: ${missingElements.join(', ')}`);
        return false;
    }
    
    return true;
}

// Inicialização - aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando aplicação...');
    
    // Inicializar elementos do DOM
    if (!initializeDOMElements()) {
        console.error('Falha ao inicializar elementos do DOM');
        return;
    }
    
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar aplicação
    initializeApp();
});

// Configurar event listeners
function setupEventListeners() {
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleAddProduct(e);
        });
    }
    
    if (clearSaleBtn) {
        clearSaleBtn.addEventListener('click', handleClearSale);
    }
    
    if (finishSaleBtn) {
        finishSaleBtn.addEventListener('click', handleFinishSale);
    }
    
    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }
    
    // Fechar modal clicando fora
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// Inicializar aplicação
async function initializeApp() {
    try {
        // Para GitHub Pages, simular dados locais em vez de fazer chamadas de API
        await loadLocalData();
        await createNewSale();
    } catch (error) {
        console.error("Erro ao inicializar aplicação:", error);
        showError("Erro ao inicializar o sistema");
    }
}

// Carregar dados locais (simulação para GitHub Pages)
async function loadLocalData() {
    try {
        // Carregar dados do localStorage se existirem
        const savedHistory = localStorage.getItem('salesHistory');
        if (savedHistory) {
            salesHistory = JSON.parse(savedHistory);
        } else {
            salesHistory = [];
        }
        updateSalesHistoryUI();
    } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
        salesHistory = [];
    }
}

// Criar nova venda
async function createNewSale() {
    try {
        currentSale = {
            id: Date.now(), // Usar timestamp como ID único
            itens: [],
            total: 0,
            data_venda: new Date().toISOString(),
            finalizada: false
        };
        updateUI();
    } catch (error) {
        console.error('Erro ao criar nova venda:', error);
        showError('Erro ao criar nova venda');
    }
}

// Adicionar produto
async function handleAddProduct(e) {
    e.preventDefault();
    console.log("handleAddProduct called");
    
    const formData = new FormData(e.target);
    const nomeProduto = formData.get('nome-produto').trim();
    const quantidade = parseFloat(formData.get('quantidade'));
    const tipoQuantidade = formData.get('tipo-quantidade');
    const precoUnitario = parseFloat(formData.get('preco-unitario'));
    
    if (!nomeProduto || quantidade <= 0 || precoUnitario <= 0) {
        showError('Preencha todos os campos corretamente');
        return;
    }
    
    try {
        const novoItem = {
            id: Date.now() + Math.random(), // ID único para o item
            nome_produto: nomeProduto,
            quantidade: quantidade,
            tipo_quantidade: tipoQuantidade,
            preco_unitario: precoUnitario,
            subtotal: quantidade * precoUnitario
        };
        
        currentSale.itens.push(novoItem);
        currentSale.total = currentSale.itens.reduce((total, item) => total + item.subtotal, 0);
        
        updateUI();
        
        // Limpar formulário
        e.target.reset();
        const quantidadeInput = document.getElementById('quantidade');
        const nomeProdutoInput = document.getElementById('nome-produto');
        
        if (quantidadeInput) quantidadeInput.value = '1';
        if (nomeProdutoInput) nomeProdutoInput.focus();
        
        showSuccess('Produto adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        showError(error.message);
    }
}

// Remover produto
async function removeProduct(itemId) {
    try {
        currentSale.itens = currentSale.itens.filter(item => item.id !== itemId);
        currentSale.total = currentSale.itens.reduce((total, item) => total + item.subtotal, 0);
        
        updateUI();
        showSuccess('Produto removido com sucesso!');
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        showError(error.message);
    }
}

// Limpar venda
function handleClearSale() {
    if (!currentSale || currentSale.itens.length === 0) {
        showError('Não há produtos para limpar');
        return;
    }
    
    showModal(
        'Limpar Venda',
        'Tem certeza que deseja remover todos os produtos da venda atual?',
        async () => {
            try {
                await createNewSale();
                showSuccess('Venda limpa com sucesso!');
            } catch (error) {
                console.error('Erro ao limpar venda:', error);
                showError('Erro ao limpar venda');
            }
        }
    );
}

// Finalizar venda
function handleFinishSale() {
    if (!currentSale || currentSale.itens.length === 0) {
        showError('Não há produtos na venda para finalizar');
        return;
    }
    
    showModal(
        'Finalizar Venda',
        `Finalizar venda no valor de R$ ${formatCurrency(currentSale.total)}?`,
        async () => {
            try {
                // Obter nome do cliente se informado
                const nomeClienteInput = document.getElementById("nome-cliente");
                const nomeCliente = nomeClienteInput ? nomeClienteInput.value.trim() : "";
                const formaPagamentoInput = document.getElementById("forma-pagamento");
                const formaPagamento = formaPagamentoInput ? formaPagamentoInput.value : "";
                
                // Finalizar venda
                currentSale.finalizada = true;
                currentSale.data_venda = new Date().toISOString();
                if (nomeCliente) {
                    currentSale.nome_cliente = nomeCliente;
                }
                if (formaPagamento) {
                    currentSale.forma_pagamento = formaPagamento;
                }
                
                // Adicionar ao histórico
                salesHistory.unshift(currentSale); // Adicionar no início do array
                
                // Salvar no localStorage
                localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
                
                showSuccess(`Venda finalizada! Total: R$ ${formatCurrency(currentSale.total)}`);
                
                // Mostrar opção de gerar ticket
                showTicketModal(currentSale.id);
                
                // Atualizar histórico e criar nova venda
                updateSalesHistoryUI();
                await createNewSale();
                
                // Limpar campo de nome do cliente
                if (nomeClienteInput) {
                    nomeClienteInput.value = '';
                }
            } catch (error) {
                console.error('Erro ao finalizar venda:', error);
                showError(error.message);
            }
        }
    );
}

// Atualizar interface
function updateUI() {
    updateProductsList();
    updateTotal();
    updateButtons();
}

// Atualizar lista de produtos
function updateProductsList() {
    if (!productsList) return;
    
    if (!currentSale || currentSale.itens.length === 0) {
        productsList.innerHTML = '<p class="empty-message">Nenhum produto adicionado ainda.</p>';
        return;
    }
    
    productsList.innerHTML = currentSale.itens.map(item => {
        const tipoDisplay = item.tipo_quantidade === 'kg' ? 'kg' : 'unid.';
        return `
            <div class="product-item">
                <div class="product-info">
                    <div class="product-name">${escapeHtml(item.nome_produto)}</div>
                    <div class="product-details">
                        Quantidade: ${item.quantidade} ${tipoDisplay} × R$ ${formatCurrency(item.preco_unitario)}
                    </div>
                </div>
                <div class="product-subtotal">R$ ${formatCurrency(item.subtotal)}</div>
                <button class="btn btn-danger" onclick="removeProduct(${item.id})">
                    Remover
                </button>
            </div>
        `;
    }).join('');
}

// Atualizar total
function updateTotal() {
    if (!totalValue) return;
    
    const total = currentSale ? currentSale.total : 0;
    totalValue.textContent = formatCurrency(total);
}

// Atualizar botões
function updateButtons() {
    const hasItems = currentSale && currentSale.itens.length > 0;
    
    if (clearSaleBtn) {
        clearSaleBtn.disabled = !hasItems;
    }
    
    if (finishSaleBtn) {
        finishSaleBtn.disabled = !hasItems;
    }
}

// Atualizar histórico de vendas
function updateSalesHistoryUI() {
    if (!salesHistory_div) return;
    
    if (salesHistory.length === 0) {
        salesHistory_div.innerHTML = '<p class="empty-message">Nenhuma venda finalizada ainda.</p>';
        return;
    }
    
    // Agrupar vendas por data
    const salesByDate = salesHistory.reduce((acc, sale) => {
        const saleDate = new Date(sale.data_venda).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
        if (!acc[saleDate]) {
            acc[saleDate] = [];
        }
        acc[saleDate].push(sale);
        return acc;
    }, {});

    let htmlContent = '';
    const sortedDates = Object.keys(salesByDate).sort((a, b) => new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-')));

    sortedDates.forEach(date => {
        htmlContent += `
            <div class="sales-day-group">
                <h4 class="sales-date-header">Vendas de ${date}</h4>
        `;
        salesByDate[date].forEach(sale => {
            htmlContent += `
                <div class="sale-item">
                    <div class="sale-header">
                        <div>
                            <div class="sale-id">Venda #${sale.id}</div>
                            <div class="sale-date">${formatDate(sale.data_venda)}</div>
                        </div>
                        <div class="sale-actions">
                            <div class="sale-total">R$ ${formatCurrency(sale.total)}</div>
                            <button class="btn btn-primary btn-small" onclick="generateTicket(${sale.id})">
                                📄 Ticket
                            </button>
                        </div>
                    </div>
                    <div class="sale-items">
                        ${sale.itens.map(item => {
                            const tipoDisplay = item.tipo_quantidade === 'kg' ? 'kg' : 'x';
                            return `
                                <div class="sale-item-detail">
                                    <span>${escapeHtml(item.nome_produto)} (${item.quantidade}${tipoDisplay})</span>
                                    <span>R$ ${formatCurrency(item.subtotal)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        htmlContent += '</div>';
    });
    
    salesHistory_div.innerHTML = htmlContent;
}

// Modal
function showModal(title, message, onConfirm) {
    if (!modal || !modalTitle || !modalMessage || !modalConfirm) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'block';
    
    modalConfirm.onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };
}

function closeModal() {
    if (!modal || !modalConfirm) return;
    
    modal.style.display = 'none';
    modalConfirm.onclick = null;
}

// Modal para gerar ticket
function showTicketModal(vendaId) {
    const ticketModal = document.createElement('div');
    ticketModal.className = 'modal';
    ticketModal.style.display = 'block';
    
    ticketModal.innerHTML = `
        <div class="modal-content">
            <h3>🎫 Venda Finalizada!</h3>
            <p>Deseja gerar um ticket para enviar ao cliente?</p>
            <div class="modal-actions">
                <button id="ticket-cancel" class="btn btn-secondary">Não, obrigado</button>
                <button id="ticket-generate" class="btn btn-primary">📄 Gerar Ticket</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(ticketModal);
    
    // Event listeners
    const ticketCancel = document.getElementById('ticket-cancel');
    const ticketGenerate = document.getElementById('ticket-generate');
    
    if (ticketCancel) {
        ticketCancel.onclick = () => {
            document.body.removeChild(ticketModal);
        };
    }
    
    if (ticketGenerate) {
        ticketGenerate.onclick = () => {
            generateTicket(vendaId);
            document.body.removeChild(ticketModal);
        };
    }
    
    // Fechar clicando fora
    ticketModal.addEventListener('click', function(e) {
        if (e.target === ticketModal) {
            document.body.removeChild(ticketModal);
        }
    });
}

// Gerar ticket em PDF
async function generateTicket(vendaId) {
    try {
        showSuccess("Gerando ticket em PDF...");

        let venda = salesHistory.find((sale) => sale.id === vendaId);
        if (!venda) {
            throw new Error("Venda não encontrada");
        }

        // Verificar se jsPDF está disponível
        if (typeof window.jspdf === 'undefined') {
            throw new Error("Biblioteca jsPDF não carregada");
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let yPosition = 15;

        // Função auxiliar para adicionar texto centralizado
        const addCenteredText = (text, y, fontSize = 10, fontStyle = 'normal', textColor = [0, 0, 0]) => {
            doc.setFontSize(fontSize);
            doc.setFont(undefined, fontStyle);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
            const textX = (pageWidth - textWidth) / 2;
            doc.text(text, textX, y);
        };

        // Cabeçalho da Loja
        addCenteredText("AGRONORTE", yPosition, 16, 'bold');
        yPosition += 8;
        addCenteredText("Sistema de Vendas", yPosition, 12, 'normal');
        yPosition = 25;

        // Informações da Loja
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Rua Araras 100 Centro", margin, yPosition);
        yPosition += 5;
        doc.text("Tel: 3252-6819", margin, yPosition);
        yPosition += 10;

        // Título da Venda
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`RECIBO DE VENDA - VENDA #${venda.id}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Data: ${formatDate(venda.data_venda)}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;

        // Informações do Cliente (se houver)
        if (venda.nome_cliente) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`Cliente: ${venda.nome_cliente}`, margin, yPosition);
            yPosition += 7;
        }

        // Tabela de Produtos
        const tableColumn = ["Produto", "Qtd", "Preço Unit.", "Subtotal"];
        const tableRows = [];

        venda.itens.forEach(item => {
            const tipoDisplay = item.tipo_quantidade === 'kg' ? 'kg' : 'unid.';
            tableRows.push([
                item.nome_produto,
                `${item.quantidade} ${tipoDisplay}`,
                `R$ ${formatCurrency(item.preco_unitario)}`,
                `R$ ${formatCurrency(item.subtotal)}`
            ]);
        });

        // Verificar se autoTable está disponível
        if (typeof doc.autoTable === 'function') {
            doc.autoTable(tableColumn, tableRows, {
                startY: yPosition,
                headStyles: { fillColor: [46, 204, 113], textColor: [255, 255, 255], fontStyle: 'bold' },
                altRowStyles: { fillColor: [245, 245, 245] },
                styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
                margin: { left: margin, right: margin },
                didDrawPage: function(data) {
                    yPosition = data.cursor.y;
                }
            });

            yPosition = doc.autoTable.previous.finalY + 5;
        } else {
            // Fallback se autoTable não estiver disponível
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text("PRODUTOS:", margin, yPosition);
            yPosition += 7;
            
            doc.setFont(undefined, 'normal');
            venda.itens.forEach(item => {
                const tipoDisplay = item.tipo_quantidade === 'kg' ? 'kg' : 'unid.';
                doc.text(`${item.nome_produto} - ${item.quantidade} ${tipoDisplay} x R$ ${formatCurrency(item.preco_unitario)} = R$ ${formatCurrency(item.subtotal)}`, margin, yPosition);
                yPosition += 5;
            });
            yPosition += 5;
        }

        // Total da Venda
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL: R$ ${formatCurrency(venda.total)}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 10;

        // Forma de Pagamento
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Forma de Pagamento: ${venda.forma_pagamento || 'Não Informado'}`, margin, yPosition);
        yPosition += 10;

        // Mensagem de Agradecimento
        addCenteredText("Obrigado pela preferência! Volte sempre!", yPosition, 10, 'italic');
        yPosition += 10;

        // Rodapé
        doc.setFillColor(46, 204, 113);
        doc.rect(0, doc.internal.pageSize.height - 10, pageWidth, 10, 'F');
        addCenteredText("Documento não fiscal", doc.internal.pageSize.height - 5, 7, 'normal', [255, 255, 255]);

        // Salvar PDF
        doc.save(`cupom_venda_${venda.id}.pdf`);
        showSuccess("Ticket PDF gerado com sucesso!");

    } catch (error) {
        console.error('Erro ao gerar ticket:', error);
        showError(error.message || 'Erro ao gerar ticket PDF');
    }
}

// Funções utilitárias
function formatCurrency(value) {
    return parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/\u0027/g, "&#039;");
}

// Mensagens de feedback
function showSuccess(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
            stopOnFocus: true,
        }).showToast();
    } else {
        // Fallback se Toastify não estiver disponível
        alert(message);
    }
}

function showError(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
            stopOnFocus: true,
        }).showToast();
    } else {
        // Fallback se Toastify não estiver disponível
        alert(message);
    }
}

