#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки расшифровки с примером из официальной документации Akool
 * https://docs.akool.com/ai-tools-suite/webhook
 */

const crypto = require('crypto');

// Пример из официальной документации Akool
const officialExample = {
  signature: "04e30dd43d9d8f95dd7c127dad617f0929d61c1d",
  dataEncrypt: "LuG1OVSVIwOO/xpW00eSYo77Ncxa9h4VKmOJRjwoyoAmCIS/8FdJRJ+BpZn90BVAAg8xpU1bMmcDlAYDT010Wa9tNi1jivX25Ld03iA4EKs=",
  timestamp: 1710757981609,
  nonce: "1529"
};

// Ключи из примера документации
const exampleClientId = "AKDt8rWEczpYPzCGur2xE=";
const exampleClientSecret = "nmwUjMAK0PJpl0MOiXLOOOwZADm0gkLo";

console.log("🔓 Тестирование с примером из официальной документации Akool");
console.log("==========================================================");
console.log();

console.log("📊 Пример из документации:");
console.log(`  Signature: ${officialExample.signature}`);
console.log(`  Data Encrypt: ${officialExample.dataEncrypt}`);
console.log(`  Timestamp: ${officialExample.timestamp}`);
console.log(`  Nonce: ${officialExample.nonce}`);
console.log();

console.log("🔑 Ключи из примера:");
console.log(`  Client ID: ${exampleClientId} (${exampleClientId.length} символов)`);
console.log(`  Client Secret: ${exampleClientSecret} (${exampleClientSecret.length} символов)`);
console.log();

// Функция проверки подписи
function verifySignature(clientId, timestamp, nonce, dataEncrypt, signature) {
  const sortedParams = [clientId, timestamp.toString(), nonce, dataEncrypt].sort().join('');
  const calculatedSignature = crypto.createHash('sha1').update(sortedParams).digest('hex');
  return calculatedSignature === signature;
}

// Функция расшифровки AES
function decryptAES(dataEncrypt, clientId, clientSecret) {
  try {
    // Создаем ключ и IV согласно документации
    let key = Buffer.from(clientSecret, 'utf8');
    let iv = Buffer.from(clientId, 'utf8');
    
    console.log(`  Исходный ключ: ${key.toString('hex')} (${key.length} байт)`);
    console.log(`  Исходный IV: ${iv.toString('hex')} (${iv.length} байт)`);
    
    // Обрезаем до нужной длины
    if (key.length > 24) key = key.slice(0, 24);
    if (iv.length > 16) iv = iv.slice(0, 16);
    
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
async function testOfficialExample() {
  try {
    console.log("=== ШАГ 1: Проверка подписи ===");
    const isSignatureValid = verifySignature(
      exampleClientId,
      officialExample.timestamp,
      officialExample.nonce,
      officialExample.dataEncrypt,
      officialExample.signature
    );
    
    console.log(`Подпись: ${isSignatureValid ? '✅ Валидна' : '❌ Невалидна'}`);
    
    if (!isSignatureValid) {
      console.log("❌ Подпись невалидна, прекращаем тестирование");
      return;
    }
    
    console.log();
    console.log("=== ШАГ 2: Расшифровка данных ===");
    
    try {
      const decryptedData = decryptAES(officialExample.dataEncrypt, exampleClientId, exampleClientSecret);
      console.log(`✅ Расшифровка успешна!`);
      console.log(`📋 Расшифрованные данные: ${decryptedData}`);
      
      // Пробуем парсинг JSON
      try {
        const jsonData = JSON.parse(decryptedData);
        console.log(`✅ JSON парсинг успешен!`);
        console.log(`📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
        console.log(`🎉 УСПЕХ! Официальный пример работает!`);
      } catch (jsonError) {
        console.log(`❌ JSON парсинг не удался: ${jsonError.message}`);
        console.log(`Сырые данные: ${decryptedData}`);
      }
      
    } catch (decryptError) {
      console.log(`❌ Ошибка расшифровки: ${decryptError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Общая ошибка: ${error.message}`);
    console.log(error.stack);
  }
}

// Запуск тестирования
testOfficialExample();
