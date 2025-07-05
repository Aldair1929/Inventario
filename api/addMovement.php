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
    $requiredFields = ['product_id', 'movement_type', 'quantity'];
    $errors = validateInput($data, $requiredFields);

    if (!empty($errors)) {
        sendResponse(['success' => false, 'message' => 'Errores de validación', 'errors' => $errors], 400);
    }

    // Validaciones adicionales
    if (!is_numeric($data['quantity']) || $data['quantity'] <= 0) {
        sendResponse(['success' => false, 'message' => 'La cantidad debe ser un número positivo'], 400);
    }

    if (!in_array($data['movement_type'], ['Entrada', 'Salida'])) {
        sendResponse(['success' => false, 'message' => 'Tipo de movimiento inválido'], 400);
    }

    // Usar el procedimiento almacenado para actualizar stock
    $stmt = $pdo->prepare("EXEC ActualizarStock ?, ?, ?");
    $stmt->execute([
        (int)$data['product_id'],
        (int)$data['quantity'],
        $data['movement_type']
    ]);

    sendResponse([
        'success' => true,
        'message' => 'Movimiento registrado exitosamente'
    ], 201);

} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error al registrar movimiento: ' . $e->getMessage()], 500);
}
?>