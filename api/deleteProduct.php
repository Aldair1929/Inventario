<?php
require_once '../config.php';

// Solo permitir método DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    $product = $checkStmt->fetch();

    if (!$product) {
        sendResponse(['success' => false, 'message' => 'Producto no encontrado'], 404);
    }

    // Verificar si hay movimientos de inventario asociados
    $movementsStmt = $pdo->prepare("SELECT COUNT(*) as count FROM Movimientos WHERE IdProducto = ?");
    $movementsStmt->execute([$productId]);
    $movementsCount = $movementsStmt->fetch()['count'];

    // Verificar si está en facturas o pedidos
    $facturaStmt = $pdo->prepare("SELECT COUNT(*) as count FROM DetalleFactura WHERE IdProducto = ?");
    $facturaStmt->execute([$productId]);
    $facturaCount = $facturaStmt->fetch()['count'];

    $pedidoStmt = $pdo->prepare("SELECT COUNT(*) as count FROM DetallePedido WHERE IdProducto = ?");
    $pedidoStmt->execute([$productId]);
    $pedidoCount = $pedidoStmt->fetch()['count'];

    // Si hay referencias en otras tablas, no permitir eliminación
    if ($movementsCount > 0 || $facturaCount > 0 || $pedidoCount > 0) {
        sendResponse([
            'success' => false,
            'message' => 'No se puede eliminar el producto porque tiene movimientos, facturas o pedidos asociados',
            'action' => 'cannot_delete'
        ], 409);
    } else {
        // Eliminar completamente si no hay referencias
        $deleteStmt = $pdo->prepare("DELETE FROM Productos WHERE IdProducto = ?");
        $deleteStmt->execute([$productId]);
        
        sendResponse([
            'success' => true,
            'message' => 'Producto eliminado exitosamente',
            'action' => 'deleted'
        ]);
    }

} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error al eliminar producto: ' . $e->getMessage()], 500);
}
?>