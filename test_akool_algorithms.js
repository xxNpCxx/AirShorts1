#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки разных алгоритмов шифрования
 */

const crypto = require('crypto');

// Данные из логов (успешная проверка подписи)
const testData = {
  signature: "9a0403251957a130fad76ea64236e02c3c521e70",
  dataEncrypt: "dOiIGl2CZPmj6UKlO9yzmWPW4Tb+T93rLqKQj6ES7xP7k4H5OhvVugbymXZ0kGW8v+Bfa0oJKI0RlPkC7P7ow8MGfv8ow1idyPVOpDA0ncWuZmgMLazug/Vm1yEHrDhdr77Sz4hk9O0Oezc5VHKB6/Me5xwehJZjyVSCKTe/+2lqV7ezzDhi6LmMy7sCkVwt4rOFvq8Yafi64CnCcZLzpA==",
  timestamp: 1757785623798,
  nonce: "9047"
};

// Ключи из переменных окружения
const clientId = process.env.AKOOL_CLIENT_ID || "mrj0kTxsc6LoKCEJX2oyyA==";
const clientSecret = process.env.AKOOL_CLIENT_SECRET || "J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF";

console.log("🔓 Тестирование разных алгоритмов шифрования");
console.log("=============================================");
console.log();

// Создаем ключ и IV
let key = Buffer.from(clientSecret, 'utf8');
let iv = Buffer.from(clientId, 'utf8');

// Обрезаем до нужной длины
if (key.length > 24) key = key.slice(0, 24);
if (iv.length > 16) iv = iv.slice(0, 16);

console.log(`Ключ: ${key.toString('hex')} (${key.length} байт)`);
console.log(`IV: ${iv.toString('hex')} (${iv.length} байт)`);
console.log();

// Тестируем разные алгоритмы
const algorithms = [
  'aes-128-cbc',
  'aes-192-cbc',
  'aes-256-cbc',
  'aes-128-ecb',
  'aes-192-ecb',
  'aes-256-ecb',
  'aes-128-gcm',
  'aes-192-gcm',
  'aes-256-gcm'
];

console.log("🧪 Тестируем разные алгоритмы:");
console.log("==============================");

for (const algorithm of algorithms) {
  console.log(`\n--- ${algorithm} ---`);
  
  try {
    // Создаем decipher
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAutoPadding(true);
    
    // Расшифровываем
    let decrypted = decipher.update(testData.dataEncrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log(`✅ Расшифровка успешна!`);
    console.log(`📋 Данные: ${decrypted.substring(0, 100)}...`);
    
    // Пробуем парсинг JSON
    try {
      const jsonData = JSON.parse(decrypted);
      console.log(`✅ JSON парсинг успешен!`);
      console.log(`📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
      console.log(`🎉 УСПЕХ! Найден рабочий алгоритм: ${algorithm}`);
      break;
    } catch (jsonError) {
      console.log(`❌ JSON парсинг не удался: ${jsonError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
}

console.log("\n🎯 Тестирование алгоритмов завершено!");
