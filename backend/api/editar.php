<?php
$origens_permitidas = [
    "http://172.20.10.2:3002",
    "http://localhost",
];

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origem, $origens_permitidas)) {
    header("Access-Control-Allow-Origin: $origem");
}

header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$id           = intval($data['id']           ?? 0);
$tema         = trim($data['tema']           ?? '');
$resumo       = trim($data['resumo']         ?? '');
$area         = trim($data['area']           ?? '');
$orientador   = trim($data['orientador']     ?? '');
$necessidades = trim($data['necessidades']   ?? '');
$curso        = trim($data['curso']          ?? '');
$turma = trim($data['turma'] ?? '');
$membros      = $data['membros']             ?? [];

if (!$id || !$tema || !$area || !$orientador || !$curso) {
    echo json_encode(["success" => false, "message" => "Campos obrigatórios em falta."]);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        UPDATE projectos
        SET tema=?, resumo=?, area=?, orientador=?, necessidades=?, curso=?, turma=?
        WHERE id=?
    ");
    $stmt->execute([$tema, $resumo, $area, $orientador, $necessidades, $curso, $turma, $id]);

    $pdo->prepare("DELETE FROM membros WHERE projecto_id = ?")->execute([$id]);

    $stmtM = $pdo->prepare("INSERT INTO membros (projecto_id, nome, email) VALUES (?, ?, ?)");
    foreach ($membros as $m) {
        $nome  = trim($m['nome']  ?? '');
        $email = trim($m['email'] ?? '');
        if ($nome) $stmtM->execute([$id, $nome, $email]);
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Projecto atualizado!"]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>