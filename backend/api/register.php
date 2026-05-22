<?php
$origens_permitidas = [
    "http://172.20.10.2:3002",
    "http://localhost",  // 🔁 o teu IP
];

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origem, $origens_permitidas)) {
    header("Access-Control-Allow-Origin: $origem");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$nome  = trim($data['nome'] ?? '');
$email = trim($data['email'] ?? '');
$senha = trim($data['senha'] ?? '');
$confirmar = trim($data['confirmar'] ?? '');

// Validações backend
if (!$nome || !$email || !$senha || !$confirmar) {
    echo json_encode(["success" => false, "message" => "Todos os campos são obrigatórios."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Email inválido."]);
    exit;
}

if (strlen($senha) < 6) {
    echo json_encode(["success" => false, "message" => "A senha deve ter pelo menos 6 caracteres."]);
    exit;
}

if ($senha !== $confirmar) {
    echo json_encode(["success" => false, "message" => "As senhas não coincidem."]);
    exit;
}

try {
    // Verifica se email já existe
    $check = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $check->execute([$email]);
    if ($check->fetch()) {
        echo json_encode(["success" => false, "message" => "Este email já está registado."]);
        exit;
    }

    $hash = password_hash($senha, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
    $stmt->execute([$nome, $email, $hash]);

    echo json_encode(["success" => true, "message" => "Conta criada com sucesso!"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Erro: " . $e->getMessage()]);
}
?>