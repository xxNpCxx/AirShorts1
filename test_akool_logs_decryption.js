#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки расшифровки webhook от AKOOL
 * Использует данные из логов и проверяет разные варианты
 */

const crypto = require('crypto');

// Данные из более свежих логов (успешная проверка подписи)
const testData = {
  signature: "9a0403251957a130fad76ea64236e02c3c521e70",
  dataEncrypt: "dOiIGl2CZPmj6UKlO9yzmWPW4Tb+T93rLqKQj6ES7xP7k4H5OhvVugbymXZ0kGW8v+Bfa0oJKI0RlPkC7P7ow8MGfv8ow1idyPVOpDA0ncWuZmgMLazug/Vm1yEHrDhdr77Sz4hk9O0Oezc5VHKB6/Me5xwehJZjyVSCKTe/+2lqV7ezzDhi6LmMy7sCkVwt4rOFvq8Yafi64CnCcZLzpA==",
  timestamp: 1757785623798,
  nonce: "9047"
};

// Ключи из переменных окружения (как в оригинальном коде)
const clientId = process.env.AKOOL_CLIENT_ID || "mrj0kTxsc6LoKCEJX2oyyA==";
const clientSecret = process.env.AKOOL_CLIENT_SECRET || "J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF";

console.log("🔓 Тестирование расшифровки с данными из логов");
console.log("==============================================");
console.log();

console.log("📊 Данные из логов:");
console.log(`  Signature: ${testData.signature}`);
console.log(`  Data Encrypt: ${testData.dataEncrypt}`);
console.log(`  Timestamp: ${testData.timestamp}`);
console.log(`  Nonce: ${testData.nonce}`);
console.log();

console.log("🔑 Ключи из логов:");
console.log(`  Client ID: ${clientId} (${clientId.length} символов)`);
console.log(`  Client Secret: ${clientSecret} (${clientSecret.length} символов)`);
console.log();

// Функция проверки подписи (как в оригинальном коде)
function verifySignature(clientId, timestamp, nonce, dataEncrypt, signature) {
  const sortedParams = [clientId, timestamp.toString(), nonce, dataEncrypt].sort().join('');
  const calculatedSignature = crypto.createHash('sha1').update(sortedParams).digest('hex');
  return calculatedSignature === signature;
}

// Функция расшифровки AES (как в оригинальном коде)
function decryptAES(dataEncrypt, clientId, clientSecret) {
  try {
    // Создаем ключ и IV
    let key = Buffer.from(clientSecret, 'utf8');
    let iv = Buffer.from(clientId, 'utf8');
    
    console.log(`  Исходный ключ: ${key.toString('hex')} (${key.length} байт)`);
    console.log(`  Исходный IV: ${iv.toString('hex')} (${iv.length} байт)`);
    
    // Обрезаем до нужной длины
    if (key.length > 24) {
      key = key.slice(0, 24);
      console.log(`  Обрезанный ключ: ${key.toString('hex')} (${key.length} байт)`);
    }
    
    if (iv.length > 16) {
      iv = iv.slice(0, 16);
      console.log(`  Обрезанный IV: ${iv.toString('hex')} (${iv.length} байт)`);
    }
    
    console.log(`  Финальный ключ: ${key.toString('hex')} (${key.length} байт)`);
    console.log(`  Финальный IV: ${iv.toString('hex')} (${iv.length} байт)`);
    
    // Расшифровываем AES-192-CBC
    const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(dataEncrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Ошибка расшифровки: ${error.message}`);
  }
}

// Основная функция тестирования
async function testDecryption() {
  try {
    console.log("=== ШАГ 1: Проверка подписи ===");
    const isSignatureValid = verifySignature(
      clientId,
      testData.timestamp,
      testData.nonce,
      testData.dataEncrypt,
      testData.signature
    );
    
    console.log(`Подпись: ${isSignatureValid ? '✅ Валидна' : '❌ Невалидна'}`);
    
    if (!isSignatureValid) {
      console.log("❌ Подпись невалидна, прекращаем тестирование");
      return;
    }
    
    console.log();
    console.log("=== ШАГ 2: Расшифровка данных ===");
    
    try {
      const decryptedData = decryptAES(testData.dataEncrypt, clientId, clientSecret);
      console.log(`✅ Расшифровка успешна!`);
      console.log(`📋 Расшифрованные данные: ${decryptedData}`);
      
      // Пробуем парсинг JSON
      try {
        const jsonData = JSON.parse(decryptedData);
        console.log(`✅ JSON парсинг успешен!`);
        console.log(`📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
      } catch (jsonError) {
        console.log(`❌ JSON парсинг не удался: ${jsonError.message}`);
        console.log(`Сырые данные: ${decryptedData}`);
      }
      
    } catch (decryptError) {
      console.log(`❌ Ошибка расшифровки: ${decryptError.message}`);
      
      // Попробуем альтернативные варианты
      console.log();
      console.log("=== ШАГ 3: Альтернативные варианты ===");
      
      // Вариант 1: Base64 декодирование ключей
      try {
        console.log("Вариант 1: Base64 декодирование ключей");
        const decodedClientId = Buffer.from(clientId, 'base64').toString('utf8');
        const decodedClientSecret = Buffer.from(clientSecret, 'base64').toString('utf8');
        
        console.log(`  Декодированный ClientId: ${decodedClientId} (${decodedClientId.length} символов)`);
        console.log(`  Декодированный ClientSecret: ${decodedClientSecret} (${decodedClientSecret.length} символов)`);
        
        const decryptedData = decryptAES(testData.dataEncrypt, decodedClientId, decodedClientSecret);
        console.log(`✅ Расшифровка успешна!`);
        console.log(`📋 Расшифрованные данные: ${decryptedData}`);
        
        try {
          const jsonData = JSON.parse(decryptedData);
          console.log(`✅ JSON парсинг успешен!`);
          console.log(`📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
        } catch (jsonError) {
          console.log(`❌ JSON парсинг не удался: ${jsonError.message}`);
        }
        
      } catch (altError) {
        console.log(`❌ Альтернативный вариант не удался: ${altError.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Общая ошибка: ${error.message}`);
    console.log(error.stack);
  }
}

// Запуск тестирования
testDecryption();
