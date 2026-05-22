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

$email = trim($data['email'] ?? '');
$senha = trim($data['senha'] ?? '');

if (!$email || !$senha) {
    echo json_encode(["success" => false, "message" => "Preenche todos os campos."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Email inválido."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($senha, $user['senha'])) {
        echo json_encode(["success" => false, "message" => "Email ou senha incorretos."]);
        exit;
    }

    // Token simples (em produção usa JWT)
    $token = bin2hex(random_bytes(32));

    echo json_encode([
        "success" => true,
        "message" => "Login feito com sucesso!",
        "token"   => $token,
        "user"    => ["id" => $user['id'], "nome" => $user['nome'], "email" => $user['email']]
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Erro: " . $e->getMessage()]);
}
?>