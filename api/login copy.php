<?php
require_once '../config.php';

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

try {
    // Obtener datos del cuerpo de la petición
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendResponse(['success' => false, 'message' => 'Datos JSON inválidos'], 400);
    }

    // Sanitizar datos
    $data = sanitizeInput($input);

    // Validar campos requeridos
    $requiredFields = ['username', 'password'];
    $errors = validateInput($data, $requiredFields);

    if (!empty($errors)) {
        sendResponse(['success' => false, 'message' => 'Errores de validación', 'errors' => $errors], 400);
    }

    // Autenticar usuario
    $authResult = authenticateUser($data['username'], $data['password']);
    
    if ($authResult['success']) {
        // Iniciar sesión
        session_start();
        $_SESSION['user_id'] = $authResult['user']['id'];
        $_SESSION['username'] = $authResult['user']['username'];
        $_SESSION['role'] = $authResult['user']['role'];
        
        sendResponse([
            'success' => true,
            'message' => 'Inicio de sesión exitoso',
            'user' => $authResult['user']
        ]);
    } else {
        sendResponse(['success' => false, 'message' => $authResult['message']], 401);
    }

} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error en el servidor: ' . $e->getMessage()], 500);
}
?>