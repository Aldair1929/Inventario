<?php
require_once '../config.php';

// Solo permitir método PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

try {
    $pdo = getDBConnection();
    
    // Obtener ID del producto de la URL
    $productId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if ($productId <= 0) {
        sendResponse(['success' => false, 'message' => 'ID de producto inválido'], 400);
    }

    // Verificar que el producto existe
    $checkStmt = $pdo->prepare("SELECT * FROM Productos WHERE IdProducto = ?");
    $checkStmt->execute([$productId]);
    $existingProduct = $checkStmt->fetch();

    if (!$existingProduct) {
        sendResponse(['success' => false, 'message' => 'Producto no encontrado'], 404);
    }

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
    $category_id = $existingProduct['IdCategoria'];
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

    // Preparar consulta de actualización
    $sql = "UPDATE Productos SET 
                Nombre = ?, 
                Descripcion = ?, 
                Precio = ?, 
                Stock = ?, 
                IdCategoria = ?
            WHERE IdProducto = ?";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['name'],
        $data['description'] ?? '',
        (float)$data['price'],
        (int)$data['stock'],
        $category_id,
        $productId
    ]);

    // Registrar movimiento de inventario si cambió el stock
    $newStock = (int)$data['stock'];
    $oldStock = (int)$existingProduct['Stock'];
    
    if ($newStock !== $oldStock) {
        $tipoMovimiento = $newStock > $oldStock ? 'Entrada' : 'Salida';
        $cantidad = abs($newStock - $oldStock);
        
        $movementStmt = $pdo->prepare("
            INSERT INTO Movimientos (IdProducto, TipoMovimiento, Cantidad, Fecha) 
            VALUES (?, ?, ?, GETDATE())
        ");
        $movementStmt->execute([$productId, $tipoMovimiento, $cantidad]);

        // Registrar en historial
        $historyStmt = $pdo->prepare("
            INSERT INTO InventarioHistorial (IdProducto, StockAnterior, StockNuevo, Fecha) 
            VALUES (?, ?, ?, GETDATE())
        ");
        $historyStmt->execute([$productId, $oldStock, $newStock]);
    }

    // Obtener el producto actualizado con información completa
    $getProductStmt = $pdo->prepare("SELECT * FROM VistaProductosCompleta WHERE IdProducto = ?");
    $getProductStmt->execute([$productId]);
    $product = $getProductStmt->fetch();

    // Convertir nombres de campos
    $product = convertFieldNames($product);

    sendResponse([
        'success' => true,
        'message' => 'Producto actualizado exitosamente',
        'data' => $product
    ]);

} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error al actualizar producto: ' . $e->getMessage()], 500);
}
?>