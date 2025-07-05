-- Estructura de la base de datos para el Sistema de Inventarios
-- Versión: 1.0.0
-- Fecha: 2025-01-27

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS inventory_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_system;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT DEFAULT 5,
    description TEXT,
    image_url VARCHAR(500),
    sku VARCHAR(100) UNIQUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_category (category_id),
    INDEX idx_stock (stock),
    INDEX idx_status (status)
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_type (movement_type),
    INDEX idx_date (created_at)
);

-- Insertar categorías por defecto
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Appliances', 'Home and kitchen appliances'),
('Furniture', 'Office and home furniture'),
('Lighting', 'Lighting fixtures and accessories'),
('Office Supplies', 'Office equipment and supplies');

-- Insertar productos de ejemplo
INSERT INTO products (name, category_id, price, stock, min_stock, description, image_url, sku) VALUES
('Wireless Headphones', 1, 79.99, 25, 5, 'High-quality wireless headphones with noise cancellation', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400', 'WH-001'),
('Coffee Maker', 2, 129.99, 8, 3, 'Programmable coffee maker with 12-cup capacity', 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=400', 'CM-001'),
('Office Chair', 3, 199.99, 15, 5, 'Ergonomic office chair with lumbar support', 'https://images.pexels.com/photos/586763/pexels-photo-586763.jpeg?auto=compress&cs=tinysrgb&w=400', 'OC-001'),
('Smartphone', 1, 699.99, 3, 2, 'Latest smartphone with advanced camera features', 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=400', 'SP-001'),
('Desk Lamp', 4, 39.99, 20, 8, 'LED desk lamp with adjustable brightness', 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=400', 'DL-001');

-- Vista para productos con información de categoría
CREATE VIEW products_with_category AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.stock,
    p.min_stock,
    p.description,
    p.image_url,
    p.sku,
    p.status,
    p.created_at,
    p.updated_at,
    c.name as category_name,
    c.id as category_id,
    CASE 
        WHEN p.stock <= p.min_stock THEN 'low'
        WHEN p.stock <= (p.min_stock * 2) THEN 'normal'
        ELSE 'high'
    END as stock_level
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Procedimiento almacenado para actualizar stock
DELIMITER //
CREATE PROCEDURE UpdateProductStock(
    IN p_product_id INT,
    IN p_quantity INT,
    IN p_movement_type ENUM('in', 'out', 'adjustment'),
    IN p_reason VARCHAR(255),
    IN p_notes TEXT
)
BEGIN
    DECLARE current_stock INT DEFAULT 0;
    DECLARE new_stock INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Obtener stock actual
    SELECT stock INTO current_stock FROM products WHERE id = p_product_id;

    -- Calcular nuevo stock
    CASE p_movement_type
        WHEN 'in' THEN SET new_stock = current_stock + p_quantity;
        WHEN 'out' THEN SET new_stock = current_stock - p_quantity;
        WHEN 'adjustment' THEN SET new_stock = p_quantity;
    END CASE;

    -- Validar que el stock no sea negativo
    IF new_stock < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock';
    END IF;

    -- Actualizar stock del producto
    UPDATE products SET stock = new_stock WHERE id = p_product_id;

    -- Registrar movimiento
    INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_stock, new_stock, reason, notes)
    VALUES (p_product_id, p_movement_type, p_quantity, current_stock, new_stock, p_reason, p_notes);

    COMMIT;
END //
DELIMITER ;

-- Trigger para generar SKU automático si no se proporciona
DELIMITER //
CREATE TRIGGER generate_sku_before_insert
BEFORE INSERT ON products
FOR EACH ROW
BEGIN
    IF NEW.sku IS NULL OR NEW.sku = '' THEN
        SET NEW.sku = CONCAT('PRD-', LPAD(LAST_INSERT_ID() + 1, 6, '0'));
    END IF;
END //
DELIMITER ;