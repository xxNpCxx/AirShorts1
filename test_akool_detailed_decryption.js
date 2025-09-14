#!/usr/bin/env node

/**
 * Детальный тестовый скрипт для проверки расшифровки webhook от AKOOL
 * Тестирует разные варианты обработки ключей
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

console.log("🔓 Детальное тестирование расшифровки AKOOL webhook");
console.log("==================================================");
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

// Функция проверки подписи
function verifySignature(clientId, timestamp, nonce, dataEncrypt, signature) {
  const sortedParams = [clientId, timestamp.toString(), nonce, dataEncrypt].sort().join('');
  const calculatedSignature = crypto.createHash('sha1').update(sortedParams).digest('hex');
  return calculatedSignature === signature;
}

// Функция расшифровки AES
function decryptAES(dataEncrypt, key, iv) {
  try {
    const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(dataEncrypt, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Ошибка расшифровки: ${error.message}`);
  }
}

// Тестируем разные варианты обработки ключей
const testCases = [
  {
    name: "Вариант 1: Оригинальные ключи как UTF-8",
    clientId: clientId,
    clientSecret: clientSecret
  },
  {
    name: "Вариант 2: ClientId как Base64, ClientSecret как UTF-8",
    clientId: Buffer.from(clientId, 'base64').toString('utf8'),
    clientSecret: clientSecret
  },
  {
    name: "Вариант 3: ClientId как UTF-8, ClientSecret как Base64",
    clientId: clientId,
    clientSecret: Buffer.from(clientSecret, 'base64').toString('utf8')
  },
  {
    name: "Вариант 4: Оба ключа как Base64",
    clientId: Buffer.from(clientId, 'base64').toString('utf8'),
    clientSecret: Buffer.from(clientSecret, 'base64').toString('utf8')
  },
  {
    name: "Вариант 5: ClientId обрезан до 16 символов",
    clientId: clientId.substring(0, 16),
    clientSecret: clientSecret
  },
  {
    name: "Вариант 6: ClientSecret обрезан до 24 символов",
    clientId: clientId,
    clientSecret: clientSecret.substring(0, 24)
  },
  {
    name: "Вариант 7: Оба ключа обрезаны",
    clientId: clientId.substring(0, 16),
    clientSecret: clientSecret.substring(0, 24)
  }
];

console.log("🧪 Тестируем разные варианты обработки ключей:");
console.log("==============================================");
console.log();

for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i];
  console.log(`\n--- ${testCase.name} ---`);
  
  try {
    // Проверяем подпись
    const isSignatureValid = verifySignature(
      testCase.clientId,
      testData.timestamp,
      testData.nonce,
      testData.dataEncrypt,
      testData.signature
    );
    
    console.log(`  Подпись: ${isSignatureValid ? '✅ Валидна' : '❌ Невалидна'}`);
    
    if (isSignatureValid) {
      console.log("  🎉 Подпись валидна! Пробуем расшифровку...");
      
      // Создаем ключ и IV
      let key = Buffer.from(testCase.clientSecret, 'utf8');
      let iv = Buffer.from(testCase.clientId, 'utf8');
      
      console.log(`  Исходный ключ: ${key.toString('hex')} (${key.length} байт)`);
      console.log(`  Исходный IV: ${iv.toString('hex')} (${iv.length} байт)`);
      
      // Обрезаем до нужной длины
      if (key.length > 24) key = key.slice(0, 24);
      if (iv.length > 16) iv = iv.slice(0, 16);
      
      console.log(`  Финальный ключ: ${key.toString('hex')} (${key.length} байт)`);
      console.log(`  Финальный IV: ${iv.toString('hex')} (${iv.length} байт)`);
      
      // Пробуем расшифровку
      const decryptedData = decryptAES(testData.dataEncrypt, key, iv);
      console.log(`  ✅ Расшифровка успешна!`);
      console.log(`  📋 Данные: ${decryptedData}`);
      
      // Пробуем парсинг JSON
      try {
        const jsonData = JSON.parse(decryptedData);
        console.log(`  ✅ JSON парсинг успешен!`);
        console.log(`  📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
        console.log(`  🎉 УСПЕХ! Найден рабочий вариант!`);
        break;
      } catch (jsonError) {
        console.log(`  ❌ JSON парсинг не удался: ${jsonError.message}`);
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Ошибка: ${error.message}`);
  }
}

console.log("\n🎯 Тестирование завершено!");
