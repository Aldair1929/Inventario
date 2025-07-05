// Servidor de desarrollo local para simular la API
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Base de datos simulada en memoria
let users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'Administrador' },
    { id: 2, username: 'vendedor1', password: 'vend123', role: 'Vendedor' },
    { id: 3, username: 'almacenista1', password: 'alm123', role: 'Almacenista' }
];

let categories = [
    { id: 1, name: 'Electrónicos' },
    { id: 2, name: 'Electrodomésticos' },
    { id: 3, name: 'Muebles' },
    { id: 4, name: 'Iluminación' },
    { id: 5, name: 'Suministros de Oficina' }
];

let suppliers = [
    { id: 1, name: 'TechSupply Corp', address: 'Av. Tecnología 123', phone: '+1-555-0101' },
    { id: 2, name: 'HomeAppliances Ltd', address: 'Calle Industrial 456', phone: '+1-555-0102' },
    { id: 3, name: 'FurnitureWorld', address: 'Blvd. Muebles 789', phone: '+1-555-0103' }
];

let products = [
    {
        id: 1,
        name: 'Audífonos Inalámbricos',
        description: 'Audífonos de alta calidad con cancelación de ruido',
        price: 79.99,
        stock: 25,
        category_id: 1,
        category_name: 'Electrónicos',
        supplier_id: 1,
        supplier_name: 'TechSupply Corp',
        stock_level: 'Alto'
    },
    {
        id: 2,
        name: 'Cafetera Programable',
        description: 'Cafetera programable con capacidad de 12 tazas',
        price: 129.99,
        stock: 8,
        category_id: 2,
        category_name: 'Electrodomésticos',
        supplier_id: 2,
        supplier_name: 'HomeAppliances Ltd',
        stock_level: 'Normal'
    },
    {
        id: 3,
        name: 'Silla de Oficina Ergonómica',
        description: 'Silla ergonómica con soporte lumbar',
        price: 199.99,
        stock: 15,
        category_id: 3,
        category_name: 'Muebles',
        supplier_id: 3,
        supplier_name: 'FurnitureWorld',
        stock_level: 'Normal'
    },
    {
        id: 4,
        name: 'Smartphone Avanzado',
        description: 'Último smartphone con características avanzadas de cámara',
        price: 699.99,
        stock: 3,
        category_id: 1,
        category_name: 'Electrónicos',
        supplier_id: 1,
        supplier_name: 'TechSupply Corp',
        stock_level: 'Bajo'
    },
    {
        id: 5,
        name: 'Lámpara LED de Escritorio',
        description: 'Lámpara LED con brillo ajustable',
        price: 39.99,
        stock: 20,
        category_id: 4,
        category_name: 'Iluminación',
        supplier_id: 1,
        supplier_name: 'TechSupply Corp',
        stock_level: 'Normal'
    }
];

let movements = [];
let nextProductId = 6;
let nextMovementId = 1;

// Rutas de la API

// Login
app.post('/api/login.php', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Usuario y contraseña son requeridos'
        });
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }
});

// Logout
app.post('/api/logout.php', (req, res) => {
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

// Obtener productos
app.get('/api/getProducts.php', (req, res) => {
    const { search, category, stock_level } = req.query;
    let filteredProducts = [...products];
    
    if (search) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category_id == category);
    }
    
    if (stock_level) {
        filteredProducts = filteredProducts.filter(p => {
            if (stock_level === 'low') return p.stock <= 5;
            if (stock_level === 'normal') return p.stock > 5 && p.stock <= 20;
            if (stock_level === 'high') return p.stock > 20;
            return true;
        });
    }
    
    const stats = {
        total_products: products.length,
        total_value: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
        low_stock_count: products.filter(p => p.stock <= 5).length,
        categories_count: categories.length
    };
    
    res.json({
        success: true,
        data: filteredProducts,
        categories: categories,
        stats: stats
    });
});

// Obtener proveedores
app.get('/api/getSuppliers.php', (req, res) => {
    res.json({
        success: true,
        data: suppliers
    });
});

// Agregar producto
app.post('/api/addProduct.php', (req, res) => {
    const { name, category, supplier_id, price, stock, description } = req.body;
    
    if (!name || !category || price < 0 || stock < 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos inválidos'
        });
    }
    
    // Buscar o crear categoría
    let categoryObj = categories.find(c => c.name === category);
    if (!categoryObj) {
        categoryObj = { id: categories.length + 1, name: category };
        categories.push(categoryObj);
    }
    
    const supplier = suppliers.find(s => s.id == supplier_id);
    
    const newProduct = {
        id: nextProductId++,
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: categoryObj.id,
        category_name: categoryObj.name,
        supplier_id: supplier_id ? parseInt(supplier_id) : null,
        supplier_name: supplier ? supplier.name : null,
        stock_level: stock <= 5 ? 'Bajo' : stock <= 20 ? 'Normal' : 'Alto'
    };
    
    products.push(newProduct);
    
    // Registrar movimiento inicial
    if (stock > 0) {
        movements.push({
            id: nextMovementId++,
            product_id: newProduct.id,
            movement_type: 'Entrada',
            quantity: stock,
            date: new Date().toISOString(),
            product_name: name
        });
    }
    
    res.status(201).json({
        success: true,
        message: 'Producto agregado exitosamente',
        data: newProduct
    });
});

// Actualizar producto
app.put('/api/updateProduct.php', (req, res) => {
    const productId = parseInt(req.query.id);
    const { name, category, supplier_id, price, stock, description } = req.body;
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    
    const oldProduct = products[productIndex];
    
    // Buscar o crear categoría
    let categoryObj = categories.find(c => c.name === category);
    if (!categoryObj) {
        categoryObj = { id: categories.length + 1, name: category };
        categories.push(categoryObj);
    }
    
    const supplier = suppliers.find(s => s.id == supplier_id);
    
    const updatedProduct = {
        ...oldProduct,
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: categoryObj.id,
        category_name: categoryObj.name,
        supplier_id: supplier_id ? parseInt(supplier_id) : null,
        supplier_name: supplier ? supplier.name : null,
        stock_level: stock <= 5 ? 'Bajo' : stock <= 20 ? 'Normal' : 'Alto'
    };
    
    products[productIndex] = updatedProduct;
    
    // Registrar movimiento si cambió el stock
    if (oldProduct.stock !== parseInt(stock)) {
        const movementType = parseInt(stock) > oldProduct.stock ? 'Entrada' : 'Salida';
        const quantity = Math.abs(parseInt(stock) - oldProduct.stock);
        
        movements.push({
            id: nextMovementId++,
            product_id: productId,
            movement_type: movementType,
            quantity: quantity,
            date: new Date().toISOString(),
            product_name: name
        });
    }
    
    res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: updatedProduct
    });
});

// Eliminar producto
app.delete('/api/deleteProduct.php', (req, res) => {
    const productId = parseInt(req.query.id);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    
    products.splice(productIndex, 1);
    
    res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
    });
});

// Agregar movimiento
app.post('/api/addMovement.php', (req, res) => {
    const { product_id, movement_type, quantity } = req.body;
    
    const product = products.find(p => p.id == product_id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    
    const qty = parseInt(quantity);
    let newStock = product.stock;
    
    if (movement_type === 'Entrada') {
        newStock += qty;
    } else if (movement_type === 'Salida') {
        newStock -= qty;
        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock insuficiente'
            });
        }
    }
    
    // Actualizar stock del producto
    product.stock = newStock;
    product.stock_level = newStock <= 5 ? 'Bajo' : newStock <= 20 ? 'Normal' : 'Alto';
    
    // Registrar movimiento
    movements.push({
        id: nextMovementId++,
        product_id: parseInt(product_id),
        movement_type,
        quantity: qty,
        date: new Date().toISOString(),
        product_name: product.name
    });
    
    res.status(201).json({
        success: true,
        message: 'Movimiento registrado exitosamente'
    });
});

// Exportar datos
app.get('/api/exportData.php', (req, res) => {
    const exportData = {
        productos: products,
        categorias: categories,
        proveedores: suppliers,
        movimientos: movements.slice(-100), // Últimos 100 movimientos
        estadisticas: {
            total_productos: products.length,
            valor_total: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
            productos_bajo_stock: products.filter(p => p.stock <= 5).length,
            total_categorias: categories.length
        },
        metadata: {
            fecha_exportacion: new Date().toISOString(),
            version_sistema: '1.0.0'
        }
    };
    
    res.json({
        success: true,
        data: exportData
    });
});

// Servir archivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📊 Sistema de Inventario disponible`);
    console.log(`👤 Credenciales de prueba: admin / admin123`);
});