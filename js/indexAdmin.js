let currentSearchToken = 0;
let currentCategoryToken = 0;
let currentMenuToken = 0;

// Função para buscar e renderizar produtos
async function fetchAndRenderProducts(query = '') {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    // Controle de token para evitar duplicação
    currentSearchToken++;
    const thisSearchToken = currentSearchToken;

    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'username': localStorage.getItem('username'),
                'password': localStorage.getItem('password')
            }
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.products)) {
            let products = data.products;
            
            // Filtro de pesquisa - agora busca produtos que começam com a sequência
            if (query) {
                products = products.filter(p => 
                    (p.name && p.name.toLowerCase().startsWith(query)) || 
                    (p.description && p.description.toLowerCase().startsWith(query)) ||
                    (p.tags && p.tags.some(tag => tag.toLowerCase().startsWith(query)))
                );
            }
            
            if (products.length === 0) {
                // Só mostra se for a busca mais recente
                if (thisSearchToken === currentSearchToken) {
                    container.innerHTML = '<p class="no-results">Nenhum produto encontrado.</p>';
                }
                return;
            }

            // Só mostra se for a busca mais recente
            if (thisSearchToken !== currentSearchToken) return;

            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                // Calcular preço com desconto
                const precoOriginal = Number(product.price);
                const precoComDesconto = product.desconto ? 
                    precoOriginal * (1 - product.desconto/100) : 
                    precoOriginal;

                // Gerar estrelas baseado na avaliação
                const stars = '★'.repeat(Math.floor(product.rate || 0)) + 
                            '☆'.repeat(5 - Math.floor(product.rate || 0));

                // Gerar tags HTML
                const tagsHtml = (product.tags || [])
                    .map(tag => `<span class="product-tag">${tag}</span>`)
                    .join('');

                card.innerHTML = `
                    <div class="product-image-wrapper">
                        <img src="${product.photo || '../img/no-image.png'}" alt="Produto" class="product-image">
                        <button class="edit-btn" data-id="${product.id}" title="Editar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <div class="product-tags">${tagsHtml}</div>
                        <div class="product-rating">
                            <span class="stars">${stars}</span>
                            <span class="votes">(${product.votes || 0} votos)</span>
                        </div>
                        <div class="product-price">
                            ${product.desconto ? 
                                `<span class="original-price">R$ ${precoOriginal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>` 
                                : ''}
                            <span class="current-price">R$ ${precoComDesconto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            ${product.desconto ? 
                                `<span class="discount-badge">-${product.desconto}%</span>` 
                                : ''}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>Nenhum produto encontrado.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Erro ao carregar produtos.</p>';
    }
}

// Evento de busca
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        fetchAndRenderProducts(query);
    });
}

// Evento para criar item
const createBtn = document.getElementById('createProductBtn');

// Evento para editar produto
const container = document.getElementById('productsContainer');

// Função de alternância de tema
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Função para mostrar o modal de criação de produto
function showCreateProductModal() {
    const modal = document.getElementById('createProductModal');
    modal.style.display = 'block';
}

// Função para fechar o modal
function closeCreateProductModal() {
    const modal = document.getElementById('createProductModal');
    modal.style.display = 'none';
    document.getElementById('createProductForm').reset();
}

// Função para criar um novo produto
async function createProduct(productData) {
    try {
        // Coletar tags selecionadas
        const selectedTags = Array.from(document.querySelectorAll('input[name="tags"]:checked'))
            .map(checkbox => checkbox.value);
        
        productData.tags = selectedTags;
        
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Erro ao criar produto');
        }

        const newProduct = await response.json();
        return newProduct;
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Event Listeners para o menu principal
document.addEventListener('DOMContentLoaded', () => {
    // Tema salvo
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    fetchAndRenderProducts();

    // Alternância de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-theme');
            setTheme(isDark ? 'light' : 'dark');
        });
    }

    // Evento para os botões do menu principal
    const mainMenuButtons = document.querySelectorAll('.main-menu a');
    mainMenuButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const category = button.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });

    // Evento para os botões do menu de departamentos
    const departmentsButtons = document.querySelectorAll('.departments-menu a');
    departmentsButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const category = button.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });

    const createProductBtn = document.getElementById('createProductBtn');
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    const createProductForm = document.getElementById('createProductForm');

    createProductBtn.addEventListener('click', showCreateProductModal);
    cancelCreateBtn.addEventListener('click', closeCreateProductModal);

    createProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(createProductForm);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            photo: formData.get('photo'),
            desconto: parseFloat(formData.get('desconto')) || 0
        };

        try {
            await createProduct(productData);
            closeCreateProductModal();
            fetchAndRenderProducts();
            alert('Produto criado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar produto. Por favor, tente novamente.');
        }
    });

    // Configura os menus
    setupMenus();

    // Ajusta o menu ao carregar e ao redimensionar
    window.addEventListener('resize', adjustAdminMenu);
    adjustAdminMenu();
});

// Utilitário para abrir/fechar modais
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Variáveis para guardar o produto em edição/exclusão
let editingProductId = null;

// Abrir modal de edição ao clicar no lápis
container.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-btn')) {
        const id = e.target.closest('.edit-btn').dataset.id;
        // Buscar dados do produto atual
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'username': localStorage.getItem('username'),
                'password': localStorage.getItem('password')
            }
        });
        const data = await response.json();
        const product = data.products.find(p => p.id === id);
        if (!product) return alert('Produto não encontrado!');
        editingProductId = id;
        
        // Preencher campos do modal
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductPhoto').value = product.photo;
        document.getElementById('editProductDesconto').value = product.desconto || 0;
        
        // Marcar checkboxes das tags
        const checkboxes = document.querySelectorAll('input[name="edit-tags"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = product.tags && product.tags.includes(checkbox.value);
        });
        
        showModal('editProductModal');
    }
});

// Fechar modal de edição
document.getElementById('cancelEditBtn').onclick = () => {
    closeModal('editProductModal');
    editingProductId = null;
};

// Salvar alterações (PUT)
document.getElementById('editProductForm').onsubmit = async (e) => {
    e.preventDefault();
    
    // Coletar tags selecionadas
    const selectedTags = Array.from(document.querySelectorAll('input[name="edit-tags"]:checked'))
        .map(checkbox => checkbox.value);
    
    const productData = {
        name: document.getElementById('editProductName').value,
        description: document.getElementById('editProductDescription').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        photo: document.getElementById('editProductPhoto').value,
        tags: selectedTags,
        desconto: parseFloat(document.getElementById('editProductDesconto').value) || 0
    };
    
    try {
        const response = await fetch(`${API_URL}/products/${editingProductId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Erro ao atualizar produto');
        closeModal('editProductModal');
        fetchAndRenderProducts();
        alert('Produto atualizado com sucesso!');
    } catch (error) {
        alert('Erro ao atualizar produto.');
    }
};

// Abrir modal de confirmação de exclusão
document.getElementById('deleteProductBtn').onclick = () => {
    showModal('confirmDeleteModal');
};

// Cancelar exclusão
document.getElementById('cancelDeleteBtn').onclick = () => {
    closeModal('confirmDeleteModal');
};

// Confirmar exclusão (DELETE)
document.getElementById('confirmDeleteBtn').onclick = async () => {
    try {
        const response = await fetch(`${API_URL}/products/${editingProductId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        if (!response.ok) throw new Error('Erro ao excluir produto');
        closeModal('confirmDeleteModal');
        closeModal('editProductModal');
        fetchAndRenderProducts();
        alert('Produto excluído com sucesso!');
    } catch (error) {
        alert('Erro ao excluir produto.');
    }
};

// Função para filtrar produtos por categoria
async function filterProductsByCategory(category) {
    // Incrementa o token de categoria
    currentCategoryToken++;
    const thisCategoryToken = currentCategoryToken;

    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'username': localStorage.getItem('username'),
                'password': localStorage.getItem('password')
            }
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.products)) {
            let products = data.products;
            
            // Mapeamento de categorias para tags
            const categoryToTag = {
                'promocoes': '#PROMOÇÕES',
                'pc-gamer': '#PC GAMER',
                'kit-upgrade': '#KIT UPGRADE',
                'hardware': '#HARDWARE',
                'notebooks': '#NOTEBOOKS',
                'monitores': '#MONITORES',
                'perifericos': '#PERIFÉRICOS',
                'cadeiras': '#CADEIRAS',
                'redes': '#REDES'
            };

            // Filtrar produtos pela tag correspondente à categoria
            const tagToFilter = categoryToTag[category];
            if (tagToFilter) {
                products = products.filter(p => 
                    p.tags && p.tags.includes(tagToFilter)
                );
            }
            
            // Verifica se este é o token mais recente
            if (thisCategoryToken !== currentCategoryToken) return;

            if (products.length === 0) {
                container.innerHTML = '<p class="no-results">Nenhum produto encontrado nesta categoria.</p>';
                return;
            }

            // Renderizar produtos filtrados
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                // Calcular preço com desconto
                const precoOriginal = Number(product.price);
                const precoComDesconto = product.desconto ? 
                    precoOriginal * (1 - product.desconto/100) : 
                    precoOriginal;

                // Gerar estrelas baseado na avaliação
                const stars = '★'.repeat(Math.floor(product.rate || 0)) + 
                            '☆'.repeat(5 - Math.floor(product.rate || 0));

                // Gerar tags HTML
                const tagsHtml = (product.tags || [])
                    .map(tag => `<span class="product-tag">${tag}</span>`)
                    .join('');

                card.innerHTML = `
                    <div class="product-image-wrapper">
                        <img src="${product.photo || '../img/no-image.png'}" alt="Produto" class="product-image">
                        <button class="edit-btn" data-id="${product.id}" title="Editar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <div class="product-tags">${tagsHtml}</div>
                        <div class="product-rating">
                            <span class="stars">${stars}</span>
                            <span class="votes">(${product.votes || 0} votos)</span>
                        </div>
                        <div class="product-price">
                            ${product.desconto ? 
                                `<span class="original-price">R$ ${precoOriginal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>` 
                                : ''}
                            <span class="current-price">R$ ${precoComDesconto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            ${product.desconto ? 
                                `<span class="discount-badge">-${product.desconto}%</span>` 
                                : ''}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>Nenhum produto encontrado.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Erro ao carregar produtos.</p>';
    }
}

// Função para configurar os menus (principal e departamentos)
function setupMenus() {
    const departmentsBtn = document.getElementById('departments-toggle');
    const departmentsMenu = document.getElementById('departments-menu');
    const mainMenu = document.querySelector('.main-menu');
    const navContainer = document.querySelector('.main-nav');
    
    // Função para lidar com o clique nos itens do menu
    function handleMenuClick(e) {
        e.preventDefault();
        const category = this.getAttribute('data-category');
        if (category) {
            // Incrementa o token do menu
            currentMenuToken++;
            const thisMenuToken = currentMenuToken;

            // Executa o filtro apenas se este for o token mais recente
            if (thisMenuToken === currentMenuToken) {
                filterProductsByCategory(category);
                if (departmentsMenu.classList.contains('open')) {
                    departmentsMenu.classList.remove('open');
                }
            }
        }
    }

    if (departmentsBtn && departmentsMenu) {
        // Evento de clique no botão de departamentos
        departmentsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            departmentsMenu.classList.toggle('open');
        });
        
        // Fecha o menu ao clicar fora
        document.addEventListener('click', function(e) {
            if (!departmentsMenu.contains(e.target) && !departmentsBtn.contains(e.target)) {
                departmentsMenu.classList.remove('open');
            }
        });
    }

    // Função para ajustar os itens do menu
    function adjustMenuItems() {
        if (!mainMenu || !departmentsMenu) return;

        const navWidth = navContainer.getBoundingClientRect().width;
        const departmentsBtnWidth = departmentsBtn ? departmentsBtn.getBoundingClientRect().width + 20 : 0;
        const createBtnWidth = document.querySelector('.create-product-btn')?.getBoundingClientRect().width + 20 || 0;
        const availableWidth = navWidth - departmentsBtnWidth - createBtnWidth - 40;

        const mainMenuItems = Array.from(mainMenu.children);
        const departmentsList = departmentsMenu.querySelector('ul');
        
        // Limpa itens dinâmicos anteriores
        Array.from(departmentsList.querySelectorAll('li[data-dinamico="true"]')).forEach(item => item.remove());
        
        // Marca itens originais como fixos
        Array.from(departmentsList.querySelectorAll('li')).forEach(item => {
            if (!item.hasAttribute('data-fixo')) {
                item.setAttribute('data-fixo', 'true');
            }
        });

        let currentWidth = 0;
        const menuItems = [];

        // Calcula a largura total necessária para cada item
        mainMenuItems.forEach(item => {
            const itemWidth = item.getBoundingClientRect().width + 10;
            menuItems.push({ element: item, width: itemWidth });
        });

        // Distribui os itens entre o menu principal e o menu de departamentos
        menuItems.forEach(({ element, width }) => {
            if (currentWidth + width <= availableWidth) {
                // Item cabe no menu principal
                if (element.parentElement !== mainMenu) {
                    const link = element.querySelector('a');
                    if (link) {
                        // Remove o elemento antigo e cria um novo sem eventos
                        const newLink = link.cloneNode(true);
                        link.parentNode.replaceChild(newLink, link);
                        newLink.addEventListener('click', handleMenuClick);
                    }
                    mainMenu.appendChild(element);
                }
                currentWidth += width;
            } else {
                // Item vai para o menu de departamentos
                const category = element.querySelector('a')?.dataset.category;
                if (category && !departmentsList.querySelector(`li[data-category="${category}"]`)) {
                    const clone = element.cloneNode(true);
                    clone.setAttribute('data-dinamico', 'true');
                    
                    const link = clone.querySelector('a');
                    if (link) {
                        link.addEventListener('click', handleMenuClick);
                    }
                    
                    departmentsList.appendChild(clone);
                }
            }
        });
    }

    // Ajusta o menu ao carregar e ao redimensionar
    window.addEventListener('resize', adjustMenuItems);
    adjustMenuItems();

    // Configuração inicial dos itens do menu principal
    if (mainMenu) {
        const mainMenuItems = mainMenu.querySelectorAll('a');
        mainMenuItems.forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            newItem.addEventListener('click', handleMenuClick);
        });
    }
}

// Função para ajustar o menu responsivo
function adjustAdminMenu() {
    const mainMenu = document.querySelector('.main-menu');
    const departmentsMenu = document.querySelector('#departments-menu ul');
    if (!mainMenu || !departmentsMenu) return;

    // Limpa os itens dinâmicos anteriores
    Array.from(departmentsMenu.querySelectorAll('li[data-dinamico="true"]')).forEach(item => {
        item.remove();
    });

    // Marca os itens originais do departamentos como fixos
    Array.from(departmentsMenu.querySelectorAll('li')).forEach(item => {
        if (!item.hasAttribute('data-fixo')) {
            item.setAttribute('data-fixo', 'true');
        }
    });

    // Verifica se algum item da main-menu está fora da tela
    const mainMenuItems = Array.from(mainMenu.children);
    const navLimite = mainMenu.parentElement.getBoundingClientRect().right;

    mainMenuItems.forEach(item => {
        const textoItem = item.textContent.trim().toUpperCase();
        
        // Verifica se já existe um item fixo com o mesmo texto
        const existeFixo = Array.from(departmentsMenu.querySelectorAll('li[data-fixo="true"]')).some(li => {
            const textoFixo = li.textContent.trim().toUpperCase();
            return textoFixo === textoItem;
        });

        // Se o item estiver fora da tela e não existir como fixo, move para o menu de departamentos
        if (!existeFixo && item.getBoundingClientRect().right > navLimite) {
            const clone = item.cloneNode(true);
            clone.setAttribute('data-dinamico', 'true');
            
            // Adiciona o evento de clique ao clone
            const link = clone.querySelector('a');
            if (link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const category = this.getAttribute('data-category');
                    if (category) {
                        filterProductsByCategory(category);
                        departmentsMenu.classList.remove('open');
                    }
                });
            }
            
            departmentsMenu.appendChild(clone);
        }
    });
}