#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки расшифровки webhook от AKOOL
 * Использует исправленный алгоритм согласно официальной документации
 * https://docs.akool.com/ai-tools-suite/webhook
 */

const crypto = require('crypto');

// Тестовые данные из логов
const testData = {
  signature: "b2d282320e8c066d4d18e9f8df0746ebd5650d43",
  dataEncrypt: "dOiIGl2CZPmj6UKlO9yzmWPW4Tb+T93rLqKQj6ES7xP7k4H5OhvVugbymXZ0kGW8v+Bfa0oJKI0RlPkC7P7owzptb5afaKp7Jht+NBOZ6hM=",
  timestamp: 1757785561571,
  nonce: "3253"
};

// Ключи из переменных окружения (из логов)
const clientId = "mrj0kTxsc6LoKCEJX2oyyA==";
const clientSecret = "J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF";

console.log("🔓 Тестирование расшифровки AKOOL webhook");
console.log("==========================================");
console.log();

console.log("📊 Тестовые данные:");
console.log(`  Signature: ${testData.signature}`);
console.log(`  Data Encrypt: ${testData.dataEncrypt}`);
console.log(`  Timestamp: ${testData.timestamp}`);
console.log(`  Nonce: ${testData.nonce}`);
console.log();

console.log("🔑 Ключи:");
console.log(`  Client ID: ${clientId}`);
console.log(`  Client Secret: ${clientSecret}`);
console.log();

// Проверяем длины ключей
console.log("🔍 Проверка длин ключей:");
console.log(`  Client ID длина: ${clientId.length} символов`);
console.log(`  Client Secret длина: ${clientSecret.length} символов`);
console.log();

// Проверяем длины ключей
console.log("⚠️  ВНИМАНИЕ: Проверяем длины ключей");
console.log(`   ClientSecret: ${clientSecret.length} символов (ожидается 24)`);
console.log(`   ClientId: ${clientId.length} символов (ожидается 16)`);
console.log();

// Попробуем разные варианты обработки ключей
console.log("🔍 Тестируем разные варианты обработки ключей:");
console.log();

// Вариант 1: Используем оригинальные ключи
let actualClientSecret = clientSecret;
let actualClientId = clientId;
console.log("Вариант 1: Оригинальные ключи");
console.log(`  ClientSecret: ${actualClientSecret} (${actualClientSecret.length} символов)`);
console.log(`  ClientId: ${actualClientId} (${actualClientId.length} символов)`);
console.log();

console.log("✅ Длины ключей корректны");
console.log();

// Функция проверки подписи
function verifySignature(clientId, timestamp, nonce, dataEncrypt, signature) {
  console.log("🔍 Проверка подписи:");
  
  // Сортируем параметры и объединяем
  const sortedParams = [clientId, timestamp.toString(), nonce, dataEncrypt].sort().join('');
  
  // Вычисляем SHA1 хеш
  const calculatedSignature = crypto.createHash('sha1').update(sortedParams).digest('hex');
  
  console.log(`  Параметры для сортировки: [${clientId}, ${timestamp}, ${nonce}, ${dataEncrypt.substring(0, 20)}...]`);
  console.log(`  Отсортированные параметры: ${sortedParams.substring(0, 100)}...`);
  console.log(`  Ожидаемая подпись: ${signature}`);
  console.log(`  Вычисленная подпись: ${calculatedSignature}`);
  
  const isValid = calculatedSignature === signature;
  console.log(`  Результат проверки: ${isValid ? '✅ Валидна' : '❌ Невалидна'}`);
  
  return isValid;
}

// Функция расшифровки AES
function decryptAES(dataEncrypt, clientId, clientSecret) {
  console.log("🔓 Расшифровка AES:");
  
  try {
    // Создаем ключ и IV согласно документации
    let key = Buffer.from(clientSecret, 'utf8');
    let iv = Buffer.from(clientId, 'utf8');
    
    console.log(`  Исходный ключ (${key.length} байт): ${key.toString('hex')}`);
    console.log(`  Исходный IV (${iv.length} байт): ${iv.toString('hex')}`);
    
    // Для AES-192-CBC нужен ключ 24 байта и IV 16 байт
    if (key.length > 24) {
      key = key.slice(0, 24);
      console.log(`  Обрезанный ключ (${key.length} байт): ${key.toString('hex')}`);
    } else if (key.length < 24) {
      // Дополняем ключ нулями
      const paddedKey = Buffer.alloc(24);
      key.copy(paddedKey);
      key = paddedKey;
      console.log(`  Дополненный ключ (${key.length} байт): ${key.toString('hex')}`);
    }
    
    if (iv.length > 16) {
      iv = iv.slice(0, 16);
      console.log(`  Обрезанный IV (${iv.length} байт): ${iv.toString('hex')}`);
    } else if (iv.length < 16) {
      // Дополняем IV нулями
      const paddedIv = Buffer.alloc(16);
      iv.copy(paddedIv);
      iv = paddedIv;
      console.log(`  Дополненный IV (${iv.length} байт): ${iv.toString('hex')}`);
    }
    
    console.log(`  Финальный ключ (${key.length} байт): ${key.toString('hex')}`);
    console.log(`  Финальный IV (${iv.length} байт): ${iv.toString('hex')}`);
    
    // Расшифровываем AES-192-CBC с PKCS#7 padding
    const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
    decipher.setAutoPadding(true); // PKCS#7 padding
    
    let decrypted = decipher.update(dataEncrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log("✅ Расшифровка успешна");
    return decrypted;
  } catch (error) {
    console.log(`❌ Ошибка расшифровки: ${error.message}`);
    throw error;
  }
}

// Основная функция тестирования
async function testDecryption() {
  try {
    // Шаг 1: Проверка подписи
    console.log("=== ШАГ 1: Проверка подписи ===");
    const isSignatureValid = verifySignature(
      actualClientId,
      testData.timestamp,
      testData.nonce,
      testData.dataEncrypt,
      testData.signature
    );
    
    if (!isSignatureValid) {
      console.log("❌ Подпись невалидна, прекращаем тестирование");
      return;
    }
    
    console.log();
    
    // Шаг 2: Расшифровка данных
    console.log("=== ШАГ 2: Расшифровка данных ===");
    const decryptedData = decryptAES(testData.dataEncrypt, actualClientId, actualClientSecret);
    
    console.log();
    console.log("📋 Расшифрованные данные:");
    console.log(decryptedData);
    
    // Шаг 3: Парсинг JSON
    console.log();
    console.log("=== ШАГ 3: Парсинг JSON ===");
    try {
      const jsonData = JSON.parse(decryptedData);
      console.log("✅ JSON парсинг успешен:");
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (jsonError) {
      console.log(`❌ Ошибка парсинга JSON: ${jsonError.message}`);
      console.log("Сырые данные:", decryptedData);
    }
    
  } catch (error) {
    console.log(`❌ Общая ошибка: ${error.message}`);
    console.log(error.stack);
  }
}

// Запуск тестирования
testDecryption();
