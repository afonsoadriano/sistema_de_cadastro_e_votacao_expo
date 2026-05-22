<?php

$origens_permitidas = [
    "http://172.20.10.2:3002",
    "http://localhost",
];

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origem, $origens_permitidas)) {
    header("Access-Control-Allow-Origin: $origem");
}

header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/db.php';

try {

    // Ler JSON enviado pelo React
    $dados = json_decode(file_get_contents("php://input"), true);

    if (!isset($dados['projeto_id'])) {
        echo json_encode([
            "success" => false,
            "message" => "ID do projecto não enviado."
        ]);
        exit;
    }

    $projecto_id = intval($dados['projeto_id']);

    // Verificar se projecto existe
    $stmt = $pdo->prepare("
        SELECT id FROM projectos WHERE id = ?
    ");

    $stmt->execute([$projecto_id]);

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Projecto não encontrado."
        ]);
        exit;
    }

    // IP do visitante
    $ip = $_SERVER['REMOTE_ADDR'];

    // Impedir votos duplicados por IP
    $check = $pdo->prepare("
        SELECT id 
        FROM votos
        WHERE projecto_id = ?
        AND ip_address = ?
    ");

    $check->execute([$projecto_id, $ip]);

    if ($check->rowCount() > 0) {
        echo json_encode([
            "success" => false,
            "message" => "Já votou neste projecto."
        ]);
        exit;
    }

    // Registar voto
    $insert = $pdo->prepare("
        INSERT INTO votos (projecto_id, ip_address)
        VALUES (?, ?)
    ");

    $insert->execute([$projecto_id, $ip]);

    // Total de votos
    $total = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM votos
        WHERE projecto_id = ?
    ");

    $total->execute([$projecto_id]);

    $resultado = $total->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message" => "Voto registado com sucesso.",
        "total_votos" => intval($resultado['total'])
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}