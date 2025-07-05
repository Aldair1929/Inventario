// Sistema de Gestión de Inventario - Componente Principal
class InventoryManager {
    constructor() {
        this.apiBase = '/api';
        this.currentUser = null;
        this.currentEditId = null;
        this.currentDeleteId = null;
        this.currentAddType = 'manual';
        this.cameraStream = null;
        this.products = [];
        this.categories = [];
        this.suppliers = [];
        this.warehouses = [];
        this.clients = [];
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.detectDevice();
    }

    async checkAuthentication() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            await this.showMainApp();
        } else {
            this.showLoginScreen();
        }
    }

    async showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        if (this.currentUser) {
            document.getElementById('currentUser').textContent = this.currentUser.role;
        }
        
        await this.loadInitialData();
        this.displayProducts();
        this.updateStats();
        this.populateFilters();
    }

    async loadInitialData() {
        try {
            // Cargar productos
            const productsResponse = await fetch(`${this.apiBase}/getProducts.php`);
            const productsData = await productsResponse.json();
            
            if (productsData.success) {
                this.products = productsData.data;
                this.categories = productsData.categories;
                this.updateStats(productsData.stats);
            }

            // Cargar proveedores
            const suppliersResponse = await fetch(`${this.apiBase}/getSuppliers.php`);
            const suppliersData = await suppliersResponse.json();
            if (suppliersData.success) {
                this.suppliers = suppliersData.data;
            }

            // Cargar almacenes
            const warehousesResponse = await fetch(`${this.apiBase}/getWarehouses.php`);
            const warehousesData = await warehousesResponse.json();
            if (warehousesData.success) {
                this.warehouses = warehousesData.data;
            }

        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Error al cargar datos iniciales', 'error');
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.apiBase}/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                await this.showMainApp();
                this.showToast('Inicio de sesión exitoso', 'success');
            } else {
                this.showToast(data.message || 'Error de autenticación', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Error de conexión', 'error');
        }
    }

    async logout() {
        try {
            await fetch(`${this.apiBase}/logout.php`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.showLoginScreen();
        this.showToast('Sesión cerrada exitosamente', 'success');
    }

    displayProducts() {
        const container = document.getElementById('productsContainer');
        const noProducts = document.getElementById('noProducts');
        
        if (this.products.length === 0) {
            container.style.display = 'none';
            noProducts.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        noProducts.style.display = 'none';

        const header = `
            <div class="products-header">
                <div class="header-content-grid">
                    <div>Producto</div>
                    <div>Categoría</div>
                    <div>Proveedor</div>
                    <div>Precio</div>
                    <div>Stock</div>
                    <div>Nivel</div>
                    <div>Acciones</div>
                </div>
            </div>
        `;

        const productsList = this.products.map(product => `
            <div class="product-item" data-id="${product.id}">
                <div class="product-content">
                    <div class="product-main-info">
                        <div class="product-title-list">${product.name}</div>
                        <div class="product-description-list">${product.description || ''}</div>
                    </div>
                    <div class="product-category-list">
                        <span class="category-badge">${product.category_name || 'Sin categoría'}</span>
                    </div>
                    <div class="product-supplier-list">
                        ${product.supplier_name || 'Sin proveedor'}
                    </div>
                    <div class="product-price-list">$${parseFloat(product.price).toFixed(2)}</div>
                    <div class="product-stock-list">
                        <div class="stock-info">
                            <span class="stock-indicator ${this.getStockLevel(product.stock)}"></span>
                            <span>${product.stock}</span>
                        </div>
                    </div>
                    <div class="product-level-list">
                        <span class="level-badge ${this.getStockLevel(product.stock)}">${product.stock_level || this.getStockLevelText(product.stock)}</span>
                    </div>
                    <div class="product-actions-list">
                        <button class="btn btn-warning btn-sm" onclick="inventoryManager.editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="inventoryManager.showDeleteModal(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-info btn-sm" onclick="inventoryManager.showMovementModal(${product.id})">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="products-list">
                ${header}
                ${productsList}
            </div>
        `;
    }

    getStockLevel(stock) {
        if (stock <= 5) return 'low';
        if (stock <= 20) return 'normal';
        return 'high';
    }

    getStockLevelText(stock) {
        if (stock <= 5) return 'Bajo';
        if (stock <= 20) return 'Normal';
        return 'Alto';
    }

    updateStats(stats = null) {
        if (stats) {
            document.getElementById('totalProducts').textContent = stats.total_products || 0;
            document.getElementById('totalValue').textContent = `$${parseFloat(stats.total_value || 0).toFixed(2)}`;
            document.getElementById('lowStockCount').textContent = stats.low_stock_count || 0;
            document.getElementById('categoriesCount').textContent = stats.categories_count || 0;
        } else {
            // Calcular estadísticas localmente
            const totalProducts = this.products.length;
            const totalValue = this.products.reduce((sum, product) => sum + (parseFloat(product.price) * parseInt(product.stock)), 0);
            const lowStockCount = this.products.filter(product => parseInt(product.stock) <= 5).length;
            const categories = [...new Set(this.products.map(product => product.category_name))];

            document.getElementById('totalProducts').textContent = totalProducts;
            document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
            document.getElementById('lowStockCount').textContent = lowStockCount;
            document.getElementById('categoriesCount').textContent = categories.length;
        }
    }

    populateFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        
        categoryFilter.innerHTML = '<option value="">Todas las Categorías</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });

        // Poblar select de proveedores en el modal
        const supplierSelect = document.getElementById('productSupplier');
        if (supplierSelect) {
            supplierSelect.innerHTML = '<option value="">Seleccionar proveedor</option>';
            this.suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                supplierSelect.appendChild(option);
            });
        }
    }

    async searchProducts() {
        const searchTerm = document.getElementById('searchInput').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (categoryFilter) params.append('category', categoryFilter);
            if (stockFilter) params.append('stock_level', stockFilter);

            const response = await fetch(`${this.apiBase}/getProducts.php?${params}`);
            const data = await response.json();

            if (data.success) {
                this.products = data.data;
                this.displayProducts();
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Error al buscar productos', 'error');
        }
    }

    async handleFormSubmit() {
        const formData = {
            name: document.getElementById('productName').value.trim(),
            category: document.getElementById('productCategory').value.trim(),
            supplier_id: document.getElementById('productSupplier').value || null,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value.trim()
        };

        if (!formData.name || !formData.category || !formData.price || !formData.stock) {
            this.showToast('Por favor complete todos los campos requeridos', 'error');
            return;
        }

        try {
            const url = this.currentEditId 
                ? `${this.apiBase}/updateProduct.php?id=${this.currentEditId}`
                : `${this.apiBase}/addProduct.php`;
            
            const method = this.currentEditId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(data.message, 'success');
                await this.loadInitialData();
                this.displayProducts();
                this.closeModal();
            } else {
                this.showToast(data.message || 'Error al procesar solicitud', 'error');
            }
        } catch (error) {
            console.error('Form submit error:', error);
            this.showToast('Error de conexión', 'error');
        }
    }

    async editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        this.currentEditId = id;
        
        document.getElementById('modalTitle').textContent = 'Editar Producto';
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category_name || '';
        document.getElementById('productSupplier').value = product.supplier_id || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productDescription').value = product.description || '';
        
        document.getElementById('productModal').style.display = 'block';
        document.getElementById('productName').focus();
    }

    async confirmDelete() {
        if (!this.currentDeleteId) return;

        try {
            const response = await fetch(`${this.apiBase}/deleteProduct.php?id=${this.currentDeleteId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(data.message, 'success');
                await this.loadInitialData();
                this.displayProducts();
            } else {
                this.showToast(data.message || 'Error al eliminar producto', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Error de conexión', 'error');
        }

        this.closeDeleteModal();
    }

    showDeleteModal(id) {
        this.currentDeleteId = id;
        document.getElementById('deleteModal').style.display = 'block';
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
        this.currentDeleteId = null;
    }

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
        this.currentEditId = null;
        
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showAddOptions() {
        document.getElementById('addOptionsModal').style.display = 'block';
    }

    closeAddOptionsModal() {
        document.getElementById('addOptionsModal').style.display = 'none';
    }

    showAddModal(type = 'manual') {
        this.currentAddType = type;
        this.closeAddOptionsModal();
        
        document.getElementById('modalTitle').textContent = 'Agregar Nuevo Producto';
        document.getElementById('productForm').reset();
        this.currentEditId = null;
        
        document.getElementById('productModal').style.display = 'block';
        document.getElementById('productName').focus();
    }

    detectDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768;
        
        if (isMobile && !isTablet) {
            this.updateDeviceUI('mobile');
        } else if (isTablet) {
            this.updateDeviceUI('tablet');
        } else {
            this.updateDeviceUI('desktop');
        }
    }

    updateDeviceUI(deviceType) {
        const deviceIcon = document.getElementById('deviceIcon');
        const deviceText = document.getElementById('deviceText');
        const mobileOnlyOptions = document.querySelectorAll('.mobile-only');

        switch (deviceType) {
            case 'mobile':
                if (deviceIcon) deviceIcon.className = 'fas fa-mobile-alt';
                if (deviceText) deviceText.textContent = 'Detectamos que estás usando un móvil';
                mobileOnlyOptions.forEach(option => option.style.display = 'block');
                break;
            case 'tablet':
                if (deviceIcon) deviceIcon.className = 'fas fa-tablet-alt';
                if (deviceText) deviceText.textContent = 'Detectamos que estás usando una tablet';
                mobileOnlyOptions.forEach(option => option.style.display = 'block');
                break;
            default:
                if (deviceIcon) deviceIcon.className = 'fas fa-desktop';
                if (deviceText) deviceText.textContent = 'Detectamos que estás usando una computadora';
                mobileOnlyOptions.forEach(option => option.style.display = 'none');
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Product form
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('productModal');
            const deleteModal = document.getElementById('deleteModal');
            const addOptionsModal = document.getElementById('addOptionsModal');
            
            if (e.target === modal) this.closeModal();
            if (e.target === deleteModal) this.closeDeleteModal();
            if (e.target === addOptionsModal) this.closeAddOptionsModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeDeleteModal();
                this.closeAddOptionsModal();
            }
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    async exportData() {
        try {
            const response = await fetch(`${this.apiBase}/exportData.php`);
            const data = await response.json();
            
            if (data.success) {
                const dataStr = JSON.stringify(data.data, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = `inventario_${new Date().toISOString().split('T')[0]}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
                
                this.showToast('Datos exportados exitosamente', 'success');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error al exportar datos', 'error');
        }
    }
}

// Instancia global
let inventoryManager;

// Funciones globales para HTML onclick events
function showAddOptions() {
    inventoryManager.showAddOptions();
}

function showAddModal(type) {
    inventoryManager.showAddModal(type);
}

function closeModal() {
    inventoryManager.closeModal();
}

function closeAddOptionsModal() {
    inventoryManager.closeAddOptionsModal();
}

function closeDeleteModal() {
    inventoryManager.closeDeleteModal();
}

function confirmDelete() {
    inventoryManager.confirmDelete();
}

function searchProducts() {
    inventoryManager.searchProducts();
}

function filterProducts() {
    inventoryManager.searchProducts();
}

function exportData() {
    inventoryManager.exportData();
}

function logout() {
    inventoryManager.logout();
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    inventoryManager = new InventoryManager();
});