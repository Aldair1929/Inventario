<?php
require_once '../config.php';

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

try {
    $pdo = getDBConnection();
    
    // Obtener datos del cuerpo de la petición
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendResponse(['success' => false, 'message' => 'Datos JSON inválidos'], 400);
    }

    // Sanitizar datos
    $data = sanitizeInput($input);

    // Validar campos requeridos
    $requiredFields = ['name', 'price', 'stock'];
    $errors = validateInput($data, $requiredFields);

    if (!empty($errors)) {
        sendResponse(['success' => false, 'message' => 'Errores de validación', 'errors' => $errors], 400);
    }

    // Validaciones adicionales
    if (!is_numeric($data['price']) || $data['price'] < 0) {
        sendResponse(['success' => false, 'message' => 'El precio debe ser un número positivo'], 400);
    }

    if (!is_numeric($data['stock']) || $data['stock'] < 0) {
        sendResponse(['success' => false, 'message' => 'El stock debe ser un número positivo'], 400);
    }

    // Verificar si la categoría existe o crearla
    $category_id = null;
    if (!empty($data['category'])) {
        $categoryStmt = $pdo->prepare("SELECT IdCategoria FROM Categorias WHERE Nombre = ?");
        $categoryStmt->execute([$data['category']]);
        $category = $categoryStmt->fetch();

        if ($category) {
            $category_id = $category['IdCategoria'];
        } else {
            // Crear nueva categoría
            $insertCategoryStmt = $pdo->prepare("INSERT INTO Categorias (Nombre) VALUES (?)");
            $insertCategoryStmt->execute([$data['category']]);
            $category_id = $pdo->lastInsertId();
        }
    }

    // Obtener proveedor por defecto (el primero disponible)
    $providerStmt = $pdo->prepare("SELECT TOP 1 IdProveedor FROM Proveedores");
    $providerStmt->execute();
    $provider = $providerStmt->fetch();
    $provider_id = $provider ? $provider['IdProveedor'] : null;

    // Preparar consulta de inserción
    $sql = "INSERT INTO Productos (Nombre, Descripcion, Precio, Stock, IdCategoria, IdProveedor) 
            VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['name'],
        $data['description'] ?? '',
        (float)$data['price'],
        (int)$data['stock'],
        $category_id,
        $provider_id
    ]);

    $productId = $pdo->lastInsertId();

    // Registrar movimiento inicial de inventario si hay stock
    if ((int)$data['stock'] > 0) {
        $movementStmt = $pdo->prepare("
            INSERT INTO Movimientos (IdProducto, TipoMovimiento, Cantidad, Fecha) 
            VALUES (?, 'Entrada', ?, GETDATE())
        ");
        $movementStmt->execute([$productId, (int)$data['stock']]);

        // Registrar en historial
        $historyStmt = $pdo->prepare("
            INSERT INTO InventarioHistorial (IdProducto, StockAnterior, StockNuevo, Fecha) 
            VALUES (?, 0, ?, GETDATE())
        ");
        $historyStmt->execute([$productId, (int)$data['stock']]);
    }

    // Obtener el producto creado con información completa
    $getProductStmt = $pdo->prepare("SELECT * FROM VistaProductosCompleta WHERE IdProducto = ?");
    $getProductStmt->execute([$productId]);
    $product = $getProductStmt->fetch();

    // Convertir nombres de campos
    $product = convertFieldNames($product);

    sendResponse([
        'success' => true,
        'message' => 'Producto agregado exitosamente',
        'data' => $product
    ], 201);

} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error al agregar producto: ' . $e->getMessage()], 500);
}
?>