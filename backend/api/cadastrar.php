<?php

$origens_permitidas = [
    "http://172.20.10.2:3002",
    "http://localhost",  // 🔁 o teu IP
];

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origem, $origens_permitidas)) {
    header("Access-Control-Allow-Origin: $origem");
}

header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Dados inválidos"]);
    exit;
}

$tema         = trim($data['tema']         ?? '');
$resumo         = trim($data['resumo']         ?? '');
$area         = trim($data['area']         ?? '');
$orientador   = trim($data['orientador']   ?? '');
$necessidades = trim($data['necessidades'] ?? '');
$curso        = trim($data['curso']        ?? '');
$turma = trim($data['turma'] ?? '');
$membros      = $data['membros']           ?? [];
$usuario_id   = intval($data['usuario_id'] ?? 0) ?: null;

if (!$tema || !$resumo || !$area || !$orientador || !$curso || !$turma) {
    echo json_encode(["success" => false, "message" => "Preenche todos os campos obrigatórios"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Inserir projecto com usuario_id
    $stmt = $pdo->prepare("
        INSERT INTO projectos (tema, resumo, area, orientador, necessidades, curso, turma, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$tema,$resumo, $area, $orientador, $necessidades, $curso, $turma, $usuario_id]);
    $projectoId = $pdo->lastInsertId();

    // Inserir membros
    $stmtMembro = $pdo->prepare("
        INSERT INTO membros (projecto_id, nome, email) VALUES (?, ?, ?)
    ");
    foreach ($membros as $membro) {
        $nome  = trim($membro['nome']  ?? '');
        $email = trim($membro['email'] ?? '');
        if ($nome) {
            $stmtMembro->execute([$projectoId, $nome, $email]);
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Projecto cadastrado!", "id" => $projectoId]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => "Erro: " . $e->getMessage()]);
}
?>