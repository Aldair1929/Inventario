-- Crear base de datos
CREATE DATABASE Sistema_Inventario;
GO

USE Sistema_Inventario;
GO

-- Tabla: Categorías
CREATE TABLE Categorias (
    IdCategoria INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL
);

-- Tabla: Proveedores
CREATE TABLE Proveedores (
    IdProveedor INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    Direccion NVARCHAR(150),
    Telefono NVARCHAR(20)
);

-- Tabla: Productos
CREATE TABLE Productos (
    IdProducto INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(255),
    Precio DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL,
    IdCategoria INT FOREIGN KEY REFERENCES Categorias(IdCategoria),
    IdProveedor INT FOREIGN KEY REFERENCES Proveedores(IdProveedor)
);

-- Tabla: Clientes
CREATE TABLE Clientes (
    IdCliente INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    Direccion NVARCHAR(150),
    Telefono NVARCHAR(20)
);

-- Tabla: Pedidos
CREATE TABLE Pedidos (
    IdPedido INT PRIMARY KEY IDENTITY(1,1),
    Fecha DATE NOT NULL,
    IdProveedor INT FOREIGN KEY REFERENCES Proveedores(IdProveedor)
);

-- Tabla: DetallePedido
CREATE TABLE DetallePedido (
    IdDetallePedido INT PRIMARY KEY IDENTITY(1,1),
    IdPedido INT FOREIGN KEY REFERENCES Pedidos(IdPedido),
    IdProducto INT FOREIGN KEY REFERENCES Productos(IdProducto),
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL
);

-- Tabla: Facturas
CREATE TABLE Facturas (
    IdFactura INT PRIMARY KEY IDENTITY(1,1),
    Fecha DATE NOT NULL,
    IdCliente INT FOREIGN KEY REFERENCES Clientes(IdCliente)
);

-- Tabla: DetalleFactura
CREATE TABLE DetalleFactura (
    IdDetalleFactura INT PRIMARY KEY IDENTITY(1,1),
    IdFactura INT FOREIGN KEY REFERENCES Facturas(IdFactura),
    IdProducto INT FOREIGN KEY REFERENCES Productos(IdProducto),
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL
);

-- Tabla: Almacenes
CREATE TABLE Almacenes (
    IdAlmacen INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100),
    Ubicacion NVARCHAR(150)
);

-- Tabla: EstadoInventario
CREATE TABLE EstadoInventario (
    IdEstado INT PRIMARY KEY IDENTITY(1,1),
    IdProducto INT FOREIGN KEY REFERENCES Productos(IdProducto),
    IdAlmacen INT FOREIGN KEY REFERENCES Almacenes(IdAlmacen),
    Estado NVARCHAR(50),
    Fecha DATE NOT NULL
);

-- Tabla: InventarioHistorial
CREATE TABLE InventarioHistorial (
    IdHistorial INT PRIMARY KEY IDENTITY(1,1),
    IdProducto INT FOREIGN KEY REFERENCES Productos(IdProducto),
    StockAnterior INT,
    StockNuevo INT,
    Fecha DATE NOT NULL
);

-- Tabla: Movimientos (entrada/salida)
CREATE TABLE Movimientos (
    IdMovimiento INT PRIMARY KEY IDENTITY(1,1),
    IdProducto INT FOREIGN KEY REFERENCES Productos(IdProducto),
    TipoMovimiento NVARCHAR(50), -- Entrada o Salida
    Cantidad INT NOT NULL,
    Fecha DATE NOT NULL
);

-- Tabla: Transferencias
CREATE TABLE Transferencias (
    IdTransferencia INT PRIMARY KEY IDENTITY(1,1),
    Fecha DATE NOT NULL,
    AlmacenOrigen INT FOREIGN KEY REFERENCES Almacenes(IdAlmacen),
    AlmacenDestino INT FOREIGN KEY REFERENCES Almacenes(IdAlmacen)
);

-- Tabla: DetalleTransferencia
CREATE TABLE DetalleTransferencia (
    IdDetalleTransferencia INT PRIMARY KEY IDENTITY(1,1),
    IdTransferencia INT FOREIGN KEY REFERENCES Transferencias(IdTransferencia),
    IdProducto INT FOREIGN KEY REFERENCES Productos(IdProducto),
    Cantidad INT NOT NULL
);

-- Tabla: Usuarios
CREATE TABLE Usuarios (
    IdUsuario INT PRIMARY KEY IDENTITY(1,1),
    NombreUsuario NVARCHAR(50) NOT NULL,
    Contraseña NVARCHAR(100) NOT NULL,
    Rol NVARCHAR(50) NOT NULL
);

-- Insertar datos de ejemplo

-- Categorías
INSERT INTO Categorias (Nombre) VALUES 
('Electrónicos'),
('Electrodomésticos'),
('Muebles'),
('Iluminación'),
('Suministros de Oficina');

-- Proveedores
INSERT INTO Proveedores (Nombre, Direccion, Telefono) VALUES 
('TechSupply Corp', 'Av. Tecnología 123, Ciudad', '+1-555-0101'),
('HomeAppliances Ltd', 'Calle Industrial 456, Ciudad', '+1-555-0102'),
('FurnitureWorld', 'Blvd. Muebles 789, Ciudad', '+1-555-0103'),
('LightingSolutions', 'Av. Iluminación 321, Ciudad', '+1-555-0104'),
('OfficeSupplies Inc', 'Calle Oficina 654, Ciudad', '+1-555-0105');

-- Productos
INSERT INTO Productos (Nombre, Descripcion, Precio, Stock, IdCategoria, IdProveedor) VALUES 
('Audífonos Inalámbricos', 'Audífonos de alta calidad con cancelación de ruido', 79.99, 25, 1, 1),
('Cafetera', 'Cafetera programable con capacidad de 12 tazas', 129.99, 8, 2, 2),
('Silla de Oficina', 'Silla ergonómica con soporte lumbar', 199.99, 15, 3, 3),
('Smartphone', 'Último smartphone con características avanzadas de cámara', 699.99, 3, 1, 1),
('Lámpara de Escritorio', 'Lámpara LED con brillo ajustable', 39.99, 20, 4, 4);

-- Clientes
INSERT INTO Clientes (Nombre, Direccion, Telefono) VALUES 
('Juan Pérez', 'Calle Principal 123, Ciudad', '+1-555-1001'),
('María García', 'Av. Central 456, Ciudad', '+1-555-1002'),
('Carlos López', 'Blvd. Norte 789, Ciudad', '+1-555-1003'),
('Ana Martínez', 'Calle Sur 321, Ciudad', '+1-555-1004'),
('Luis Rodríguez', 'Av. Este 654, Ciudad', '+1-555-1005');

-- Almacenes
INSERT INTO Almacenes (Nombre, Ubicacion) VALUES 
('Almacén Principal', 'Zona Industrial Norte'),
('Almacén Secundario', 'Zona Industrial Sur'),
('Almacén de Distribución', 'Centro de la Ciudad');

-- Usuarios
INSERT INTO Usuarios (NombreUsuario, Contraseña, Rol) VALUES 
('admin', 'admin123', 'Administrador'),
('vendedor1', 'vend123', 'Vendedor'),
('almacenista1', 'alm123', 'Almacenista');

-- Vista para productos con información completa
GO
CREATE VIEW VistaProductosCompleta AS
SELECT 
    p.IdProducto,
    p.Nombre,
    p.Descripcion,
    p.Precio,
    p.Stock,
    c.Nombre as NombreCategoria,
    pr.Nombre as NombreProveedor,
    pr.Telefono as TelefonoProveedor,
    CASE 
        WHEN p.Stock <= 5 THEN 'Bajo'
        WHEN p.Stock <= 20 THEN 'Normal'
        ELSE 'Alto'
    END as NivelStock
FROM Productos p
LEFT JOIN Categorias c ON p.IdCategoria = c.IdCategoria
LEFT JOIN Proveedores pr ON p.IdProveedor = pr.IdProveedor;
GO

-- Procedimiento almacenado para actualizar stock
CREATE PROCEDURE ActualizarStock
    @IdProducto INT,
    @Cantidad INT,
    @TipoMovimiento NVARCHAR(50)
AS
BEGIN
    DECLARE @StockActual INT;
    DECLARE @StockNuevo INT;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Obtener stock actual
        SELECT @StockActual = Stock FROM Productos WHERE IdProducto = @IdProducto;
        
        -- Calcular nuevo stock
        IF @TipoMovimiento = 'Entrada'
            SET @StockNuevo = @StockActual + @Cantidad;
        ELSE IF @TipoMovimiento = 'Salida'
            SET @StockNuevo = @StockActual - @Cantidad;
        
        -- Validar que el stock no sea negativo
        IF @StockNuevo < 0
        BEGIN
            RAISERROR('Stock insuficiente', 16, 1);
            RETURN;
        END
        
        -- Actualizar stock del producto
        UPDATE Productos SET Stock = @StockNuevo WHERE IdProducto = @IdProducto;
        
        -- Registrar movimiento
        INSERT INTO Movimientos (IdProducto, TipoMovimiento, Cantidad, Fecha)
        VALUES (@IdProducto, @TipoMovimiento, @Cantidad, GETDATE());
        
        -- Registrar en historial
        INSERT INTO InventarioHistorial (IdProducto, StockAnterior, StockNuevo, Fecha)
        VALUES (@IdProducto, @StockActual, @StockNuevo, GETDATE());
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Función para obtener estadísticas del inventario
CREATE FUNCTION ObtenerEstadisticasInventario()
RETURNS TABLE
AS
RETURN
(
    SELECT 
        COUNT(*) as TotalProductos,
        SUM(Precio * Stock) as ValorTotal,
        COUNT(CASE WHEN Stock <= 5 THEN 1 END) as ProductosBajoStock,
        COUNT(DISTINCT IdCategoria) as TotalCategorias
    FROM Productos
);
GO