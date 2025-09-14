#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки расшифровки с реальными данными из логов
 * Использует crypto-js
 */

const CryptoJS = require('crypto-js');
const crypto = require('crypto');

// Данные из реальных логов (успешная проверка подписи)
const testData = {
  signature: "9a0403251957a130fad76ea64236e02c3c521e70",
  dataEncrypt: "dOiIGl2CZPmj6UKlO9yzmWPW4Tb+T93rLqKQj6ES7xP7k4H5OhvVugbymXZ0kGW8v+Bfa0oJKI0RlPkC7P7ow8MGfv8ow1idyPVOpDA0ncWuZmgMLazug/Vm1yEHrDhdr77Sz4hk9O0Oezc5VHKB6/Me5xwehJZjyVSCKTe/+2lqV7ezzDhi6LmMy7sCkVwt4rOFvq8Yafi64CnCcZLzpA==",
  timestamp: 1757785623798,
  nonce: "9047"
};

// Ключи из переменных окружения
const clientId = process.env.AKOOL_CLIENT_ID || "mrj0kTxsc6LoKCEJX2oyyA==";
const clientSecret = process.env.AKOOL_CLIENT_SECRET || "J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF";

console.log("🔓 Тестирование с реальными данными из логов (crypto-js)");
console.log("=======================================================");
console.log();

console.log("📊 Данные из логов:");
console.log(`  Signature: ${testData.signature}`);
console.log(`  Data Encrypt: ${testData.dataEncrypt}`);
console.log(`  Timestamp: ${testData.timestamp}`);
console.log(`  Nonce: ${testData.nonce}`);
console.log();

console.log("🔑 Ключи:");
console.log(`  Client ID: ${clientId} (${clientId.length} символов)`);
console.log(`  Client Secret: ${clientSecret} (${clientSecret.length} символов)`);
console.log();

// Функция проверки подписи (как в оригинальном коде)
function verifySignature(clientId, timestamp, nonce, dataEncrypt, signature) {
  const sortedParams = [clientId, timestamp.toString(), nonce, dataEncrypt].sort().join('');
  const calculatedSignature = crypto.createHash('sha1').update(sortedParams).digest('hex');
  return calculatedSignature === signature;
}

// Функция расшифровки AES с crypto-js
function decryptAESWithCryptoJS(dataEncrypt, clientId, clientSecret) {
  try {
    const aesKey = clientSecret;
    const key = CryptoJS.enc.Utf8.parse(aesKey);
    const iv = CryptoJS.enc.Utf8.parse(clientId);
    
    console.log(`  Ключ (UTF-8): ${key.toString(CryptoJS.enc.Hex)} (${key.sigBytes} байт)`);
    console.log(`  IV (UTF-8): ${iv.toString(CryptoJS.enc.Hex)} (${iv.sigBytes} байт)`);
    
    const decrypted = CryptoJS.AES.decrypt(dataEncrypt, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error(`Ошибка расшифровки: ${error.message}`);
  }
}

// Функция расшифровки AES с нативным crypto
function decryptAESWithNativeCrypto(dataEncrypt, clientId, clientSecret) {
  try {
    let key = Buffer.from(clientSecret, 'utf8');
    let iv = Buffer.from(clientId, 'utf8');
    
    // Обрезаем до нужной длины
    if (key.length > 24) key = key.slice(0, 24);
    if (iv.length > 16) iv = iv.slice(0, 16);
    
    console.log(`  Ключ (нативный): ${key.toString('hex')} (${key.length} байт)`);
    console.log(`  IV (нативный): ${iv.toString('hex')} (${iv.length} байт)`);
    
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
async function testRealLogs() {
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
    console.log("=== ШАГ 2: Расшифровка с crypto-js ===");
    
    try {
      const decryptedData = decryptAESWithCryptoJS(testData.dataEncrypt, clientId, clientSecret);
      console.log(`✅ Расшифровка успешна!`);
      console.log(`📋 Расшифрованные данные: ${decryptedData}`);
      
      // Пробуем парсинг JSON
      try {
        const jsonData = JSON.parse(decryptedData);
        console.log(`✅ JSON парсинг успешен!`);
        console.log(`📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
        console.log(`🎉 УСПЕХ! Расшифровка с crypto-js работает!`);
      } catch (jsonError) {
        console.log(`❌ JSON парсинг не удался: ${jsonError.message}`);
        console.log(`Сырые данные: ${decryptedData}`);
      }
      
    } catch (decryptError) {
      console.log(`❌ Ошибка расшифровки с crypto-js: ${decryptError.message}`);
    }
    
    console.log();
    console.log("=== ШАГ 3: Расшифровка с нативным crypto ===");
    
    try {
      const decryptedData = decryptAESWithNativeCrypto(testData.dataEncrypt, clientId, clientSecret);
      console.log(`✅ Расшифровка успешна!`);
      console.log(`📋 Расшифрованные данные: ${decryptedData}`);
      
      // Пробуем парсинг JSON
      try {
        const jsonData = JSON.parse(decryptedData);
        console.log(`✅ JSON парсинг успешен!`);
        console.log(`📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
        console.log(`🎉 УСПЕХ! Расшифровка с нативным crypto работает!`);
      } catch (jsonError) {
        console.log(`❌ JSON парсинг не удался: ${jsonError.message}`);
        console.log(`Сырые данные: ${decryptedData}`);
      }
      
    } catch (decryptError) {
      console.log(`❌ Ошибка расшифровки с нативным crypto: ${decryptError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Общая ошибка: ${error.message}`);
    console.log(error.stack);
  }
}

// Запуск тестирования
testRealLogs();
