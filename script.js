// Agricultural Inventory Management System
class AgriculturalInventoryManager {
    constructor() {
        this.products = this.loadProducts();
        this.currentEditId = null;
        this.currentDeleteId = null;
        this.currentUser = null;
        this.currentAddType = 'manual';
        this.cameraStream = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.detectDevice();
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
        const uploadOptionTitle = document.getElementById('uploadOptionTitle');
        const uploadOptionDesc = document.getElementById('uploadOptionDesc');
        const uploadFeature1 = document.getElementById('uploadFeature1');
        const mobileOnlyOptions = document.querySelectorAll('.mobile-only');

        switch (deviceType) {
            case 'mobile':
                deviceIcon.className = 'fas fa-mobile-alt';
                deviceText.textContent = 'Detectamos que estás usando un móvil';
                uploadOptionTitle.textContent = 'Galería';
                uploadOptionDesc.textContent = 'Selecciona una imagen desde tu galería';
                uploadFeature1.textContent = 'Desde galería';
                mobileOnlyOptions.forEach(option => option.style.display = 'block');
                break;
            case 'tablet':
                deviceIcon.className = 'fas fa-tablet-alt';
                deviceText.textContent = 'Detectamos que estás usando una tablet';
                uploadOptionTitle.textContent = 'Galería/Archivos';
                uploadOptionDesc.textContent = 'Selecciona una imagen desde tu dispositivo';
                uploadFeature1.textContent = 'Desde dispositivo';
                mobileOnlyOptions.forEach(option => option.style.display = 'block');
                break;
            default:
                deviceIcon.className = 'fas fa-desktop';
                deviceText.textContent = 'Detectamos que estás usando una computadora';
                uploadOptionTitle.textContent = 'Subir Archivo';
                uploadOptionDesc.textContent = 'Selecciona una imagen desde tu computadora';
                uploadFeature1.textContent = 'Desde computadora';
                mobileOnlyOptions.forEach(option => option.style.display = 'none');
        }
    }

    checkAuthentication() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showMainApp();
        } else {
            this.showLoginScreen();
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

        // Camera controls
        const startCameraBtn = document.getElementById('startCameraBtn');
        const takePictureBtn = document.getElementById('takePictureBtn');
        const retakePictureBtn = document.getElementById('retakePictureBtn');

        if (startCameraBtn) {
            startCameraBtn.addEventListener('click', () => this.startCamera());
        }
        if (takePictureBtn) {
            takePictureBtn.addEventListener('click', () => this.takePicture());
        }
        if (retakePictureBtn) {
            retakePictureBtn.addEventListener('click', () => this.retakePicture());
        }

        // File input change
        const productImageFile = document.getElementById('productImageFile');
        if (productImageFile) {
            productImageFile.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // URL input change
        const productImageUrl = document.getElementById('productImageUrl');
        if (productImageUrl) {
            productImageUrl.addEventListener('input', (e) => this.handleUrlInput(e));
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('productModal');
            const deleteModal = document.getElementById('deleteModal');
            const addOptionsModal = document.getElementById('addOptionsModal');
            
            if (e.target === modal) {
                this.closeModal();
            }
            if (e.target === deleteModal) {
                this.closeDeleteModal();
            }
            if (e.target === addOptionsModal) {
                this.closeAddOptionsModal();
            }
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

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple authentication (in production, this should be server-side)
        if (username === 'admin' && password === 'admin123') {
            this.currentUser = {
                username: username,
                role: 'Administrador',
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showMainApp();
            this.showToast('Inicio de sesión exitoso', 'success');
        } else {
            this.showToast('Usuario o contraseña incorrectos', 'error');
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        if (this.currentUser) {
            document.getElementById('currentUser').textContent = this.currentUser.role;
        }
        
        this.displayProducts();
        this.updateStats();
        this.populateFilters();
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.showLoginScreen();
        this.showToast('Sesión cerrada exitosamente', 'success');
    }

    // Add Options Modal Functions
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
        
        // Hide all image sections first
        document.getElementById('urlImageSection').style.display = 'none';
        document.getElementById('uploadImageSection').style.display = 'none';
        document.getElementById('cameraImageSection').style.display = 'none';
        document.getElementById('imagePreview').style.display = 'none';
        
        // Show appropriate section based on type
        switch (type) {
            case 'url':
                document.getElementById('urlImageSection').style.display = 'block';
                break;
            case 'upload':
                document.getElementById('uploadImageSection').style.display = 'block';
                break;
            case 'camera':
                document.getElementById('cameraImageSection').style.display = 'block';
                break;
            default:
                // Manual entry - no image section shown initially
                break;
        }
        
        document.getElementById('productModal').style.display = 'block';
        document.getElementById('productName').focus();
    }

    // Camera Functions
    async startCamera() {
        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Use back camera on mobile
                } 
            });
            
            const video = document.getElementById('cameraVideo');
            video.srcObject = this.cameraStream;
            video.style.display = 'block';
            
            document.getElementById('startCameraBtn').style.display = 'none';
            document.getElementById('takePictureBtn').style.display = 'inline-flex';
            
            this.showToast('Cámara activada correctamente', 'success');
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showToast('Error al acceder a la cámara', 'error');
        }
    }

    takePicture() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0);
        
        // Convert to blob and show preview
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            this.showImagePreview(url);
            
            // Store the blob for later use
            this.currentImageBlob = blob;
        }, 'image/jpeg', 0.8);
        
        // Hide video and show retake button
        video.style.display = 'none';
        document.getElementById('takePictureBtn').style.display = 'none';
        document.getElementById('retakePictureBtn').style.display = 'inline-flex';
        
        // Stop camera stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }
        
        this.showToast('Foto capturada exitosamente', 'success');
    }

    retakePicture() {
        // Reset camera interface
        document.getElementById('cameraVideo').style.display = 'none';
        document.getElementById('startCameraBtn').style.display = 'inline-flex';
        document.getElementById('takePictureBtn').style.display = 'none';
        document.getElementById('retakePictureBtn').style.display = 'none';
        document.getElementById('imagePreview').style.display = 'none';
        
        // Clear current image
        this.currentImageBlob = null;
    }

    // File handling functions
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showToast('El archivo es demasiado grande. Máximo 5MB.', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
            
            this.currentImageFile = file;
        }
    }

    handleUrlInput(event) {
        const url = event.target.value.trim();
        if (url && this.isValidImageUrl(url)) {
            this.showImagePreview(url);
            this.currentImageUrl = url;
        } else if (url) {
            document.getElementById('imagePreview').style.display = 'none';
        }
    }

    isValidImageUrl(url) {
        try {
            new URL(url);
            return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        } catch {
            return false;
        }
    }

    showImagePreview(src) {
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImg');
        
        img.src = src;
        preview.style.display = 'block';
    }

    removeImagePreview() {
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('previewImg').src = '';
        
        // Clear current image data
        this.currentImageBlob = null;
        this.currentImageFile = null;
        this.currentImageUrl = null;
        
        // Reset file input
        const fileInput = document.getElementById('productImageFile');
        if (fileInput) fileInput.value = '';
        
        // Reset URL input
        const urlInput = document.getElementById('productImageUrl');
        if (urlInput) urlInput.value = '';
    }

    getCurrentImageData() {
        if (this.currentImageBlob) {
            // Convert blob to base64 for storage
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(this.currentImageBlob);
            });
        } else if (this.currentImageFile) {
            // Convert file to base64 for storage
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(this.currentImageFile);
            });
        } else if (this.currentImageUrl) {
            // Return URL directly
            return Promise.resolve(this.currentImageUrl);
        }
        return Promise.resolve(null);
    }

    loadProducts() {
        const products = localStorage.getItem('agriculturalProducts');
        return products ? JSON.parse(products) : this.getDefaultProducts();
    }

    getDefaultProducts() {
        return [
            {
                id: 1,
                name: "Semillas de Tomate Cherry",
                category: "Semillas",
                price: 15.99,
                stock: 50,
                unit: "paquete",
                description: "Semillas de tomate cherry orgánicas, alta germinación",
                image: "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400",
                dateAdded: new Date().toISOString()
            },
            {
                id: 2,
                name: "Fertilizante Orgánico NPK",
                category: "Fertilizantes",
                price: 45.50,
                stock: 25,
                unit: "saco",
                description: "Fertilizante orgánico balanceado 10-10-10, ideal para cultivos",
                image: "https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=400",
                dateAdded: new Date().toISOString()
            },
            {
                id: 3,
                name: "Pala de Jardín",
                category: "Herramientas",
                price: 28.75,
                stock: 15,
                unit: "unidad",
                description: "Pala de jardín resistente con mango ergonómico",
                image: "https://images.pexels.com/photos/4503268/pexels-photo-4503268.jpeg?auto=compress&cs=tinysrgb&w=400",
                dateAdded: new Date().toISOString()
            },
            {
                id: 4,
                name: "Insecticida Natural",
                category: "Pesticidas",
                price: 32.00,
                stock: 8,
                unit: "l",
                description: "Insecticida natural a base de neem, seguro para cultivos orgánicos",
                image: "https://images.pexels.com/photos/4503275/pexels-photo-4503275.jpeg?auto=compress&cs=tinysrgb&w=400",
                dateAdded: new Date().toISOString()
            },
            {
                id: 5,
                name: "Sistema de Riego por Goteo",
                category: "Equipos",
                price: 125.99,
                stock: 12,
                unit: "unidad",
                description: "Kit completo de riego por goteo para 20 plantas",
                image: "https://images.pexels.com/photos/4503276/pexels-photo-4503276.jpeg?auto=compress&cs=tinysrgb&w=400",
                dateAdded: new Date().toISOString()
            },
            {
                id: 6,
                name: "Sustrato Universal",
                category: "Insumos",
                price: 18.25,
                stock: 30,
                unit: "saco",
                description: "Sustrato universal enriquecido para todo tipo de plantas",
                image: "https://images.pexels.com/photos/4503277/pexels-photo-4503277.jpeg?auto=compress&cs=tinysrgb&w=400",
                dateAdded: new Date().toISOString()
            }
        ];
    }

    saveProducts() {
        localStorage.setItem('agriculturalProducts', JSON.stringify(this.products));
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

        // Create header
        const header = `
            <div class="products-header">
                <div class="header-image">Imagen</div>
                <div class="header-content-grid">
                    <div>Producto</div>
                    <div>Precio</div>
                    <div>Stock</div>
                    <div>Unidad</div>
                    <div>Acciones</div>
                </div>
            </div>
        `;

        // Create products list
        const productsList = this.products.map(product => `
            <div class="product-item" data-id="${product.id}">
                <div class="product-image-list">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\"fas fa-seedling\\"></i>'">` : 
                        '<i class="fas fa-seedling"></i>'
                    }
                </div>
                <div class="product-content">
                    <div class="product-main-info">
                        <div class="product-title-list">${product.name}</div>
                        <div class="product-category-list">${product.category}</div>
                        <div class="product-description-list">${product.description}</div>
                    </div>
                    <div class="product-price-list">$${product.price.toFixed(2)}</div>
                    <div class="product-stock-list">
                        <div class="stock-info">
                            <span class="stock-indicator ${this.getStockLevel(product.stock)}"></span>
                            <span>${product.stock}</span>
                        </div>
                    </div>
                    <div class="product-unit-info">
                        <div class="unit-label">${product.unit || 'unidad'}</div>
                    </div>
                    <div class="product-actions-list">
                        <button class="btn btn-warning" onclick="inventoryManager.editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="inventoryManager.showDeleteModal(${product.id})">
                            <i class="fas fa-trash"></i> Eliminar
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
        if (stock <= 10) return 'low';
        if (stock <= 30) return 'normal';
        return 'high';
    }

    updateStats() {
        const totalProducts = this.products.length;
        const totalValue = this.products.reduce((sum, product) => sum + (product.price * product.stock), 0);
        const lowStockCount = this.products.filter(product => product.stock <= 10).length;
        const categories = [...new Set(this.products.map(product => product.category))];

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('lowStockCount').textContent = lowStockCount;
        document.getElementById('categoriesCount').textContent = categories.length;
    }

    populateFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = [...new Set(this.products.map(product => product.category))];
        
        // Clear existing options except the first one
        categoryFilter.innerHTML = '<option value="">Todas las Categorías</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    searchProducts() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        let filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                product.category.toLowerCase().includes(searchTerm) ||
                                product.description.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            
            let matchesStock = true;
            if (stockFilter === 'low') {
                matchesStock = product.stock <= 10;
            } else if (stockFilter === 'normal') {
                matchesStock = product.stock > 10 && product.stock <= 30;
            } else if (stockFilter === 'high') {
                matchesStock = product.stock > 30;
            }

            return matchesSearch && matchesCategory && matchesStock;
        });

        this.displayFilteredProducts(filteredProducts);
    }

    filterProducts() {
        this.searchProducts();
    }

    displayFilteredProducts(products) {
        const container = document.getElementById('productsContainer');
        const noProducts = document.getElementById('noProducts');
        
        if (products.length === 0) {
            container.style.display = 'none';
            noProducts.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        noProducts.style.display = 'none';

        // Create header
        const header = `
            <div class="products-header">
                <div class="header-image">Imagen</div>
                <div class="header-content-grid">
                    <div>Producto</div>
                    <div>Precio</div>
                    <div>Stock</div>
                    <div>Unidad</div>
                    <div>Acciones</div>
                </div>
            </div>
        `;

        // Create products list
        const productsList = products.map(product => `
            <div class="product-item" data-id="${product.id}">
                <div class="product-image-list">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\"fas fa-seedling\\"></i>'">` : 
                        '<i class="fas fa-seedling"></i>'
                    }
                </div>
                <div class="product-content">
                    <div class="product-main-info">
                        <div class="product-title-list">${product.name}</div>
                        <div class="product-category-list">${product.category}</div>
                        <div class="product-description-list">${product.description}</div>
                    </div>
                    <div class="product-price-list">$${product.price.toFixed(2)}</div>
                    <div class="product-stock-list">
                        <div class="stock-info">
                            <span class="stock-indicator ${this.getStockLevel(product.stock)}"></span>
                            <span>${product.stock}</span>
                        </div>
                    </div>
                    <div class="product-unit-info">
                        <div class="unit-label">${product.unit || 'unidad'}</div>
                    </div>
                    <div class="product-actions-list">
                        <button class="btn btn-warning" onclick="inventoryManager.editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="inventoryManager.showDeleteModal(${product.id})">
                            <i class="fas fa-trash"></i> Eliminar
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

    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        this.currentEditId = id;
        this.currentAddType = 'manual';
        
        document.getElementById('modalTitle').textContent = 'Editar Producto';
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productUnit').value = product.unit || '';
        document.getElementById('productDescription').value = product.description;
        
        // Hide all image sections
        document.getElementById('urlImageSection').style.display = 'none';
        document.getElementById('uploadImageSection').style.display = 'none';
        document.getElementById('cameraImageSection').style.display = 'none';
        
        // Show image preview if product has image
        if (product.image) {
            this.showImagePreview(product.image);
            this.currentImageUrl = product.image;
        } else {
            document.getElementById('imagePreview').style.display = 'none';
        }
        
        document.getElementById('productModal').style.display = 'block';
        document.getElementById('productName').focus();
    }

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
        this.currentEditId = null;
        this.removeImagePreview();
        
        // Stop camera if active
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        // Reset camera interface
        document.getElementById('cameraVideo').style.display = 'none';
        document.getElementById('startCameraBtn').style.display = 'inline-flex';
        document.getElementById('takePictureBtn').style.display = 'none';
        document.getElementById('retakePictureBtn').style.display = 'none';
    }

    async handleFormSubmit() {
        const formData = {
            name: document.getElementById('productName').value.trim(),
            category: document.getElementById('productCategory').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            unit: document.getElementById('productUnit').value.trim(),
            description: document.getElementById('productDescription').value.trim()
        };

        if (!formData.name || !formData.category || !formData.price || !formData.stock || !formData.unit) {
            this.showToast('Por favor complete todos los campos requeridos', 'error');
            return;
        }

        // Get image data
        const imageData = await this.getCurrentImageData();
        if (imageData) {
            formData.image = imageData;
        }

        if (this.currentEditId) {
            this.updateProduct(this.currentEditId, formData);
        } else {
            this.addProduct(formData);
        }

        this.closeModal();
    }

    addProduct(productData) {
        const newProduct = {
            id: Date.now(),
            ...productData,
            dateAdded: new Date().toISOString()
        };

        this.products.push(newProduct);
        this.saveProducts();
        this.displayProducts();
        this.updateStats();
        this.populateFilters();
        this.showToast('Producto agregado exitosamente', 'success');
    }

    updateProduct(id, productData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = {
                ...this.products[index],
                ...productData
            };
            this.saveProducts();
            this.displayProducts();
            this.updateStats();
            this.populateFilters();
            this.showToast('Producto actualizado exitosamente', 'success');
        }
    }

    showDeleteModal(id) {
        this.currentDeleteId = id;
        document.getElementById('deleteModal').style.display = 'block';
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
        this.currentDeleteId = null;
    }

    confirmDelete() {
        if (this.currentDeleteId) {
            this.deleteProduct(this.currentDeleteId);
            this.closeDeleteModal();
        }
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.saveProducts();
        this.displayProducts();
        this.updateStats();
        this.populateFilters();
        this.showToast('Producto eliminado exitosamente', 'success');
    }

    exportData() {
        const dataStr = JSON.stringify(this.products, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `inventario_agricola_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Datos exportados exitosamente', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedProducts = JSON.parse(e.target.result);
                if (Array.isArray(importedProducts)) {
                    this.products = importedProducts;
                    this.saveProducts();
                    this.displayProducts();
                    this.updateStats();
                    this.populateFilters();
                    this.showToast('Datos importados exitosamente', 'success');
                } else {
                    this.showToast('Formato de archivo inválido', 'error');
                }
            } catch (error) {
                this.showToast('Error al importar datos', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset the file input
        event.target.value = '';
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
}

// Global functions for HTML onclick events
let inventoryManager;

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
    inventoryManager.filterProducts();
}

function exportData() {
    inventoryManager.exportData();
}

function importData(event) {
    inventoryManager.importData(event);
}

function logout() {
    inventoryManager.logout();
}

function removeImagePreview() {
    inventoryManager.removeImagePreview();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    inventoryManager = new AgriculturalInventoryManager();
});