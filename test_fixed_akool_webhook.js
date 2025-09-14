#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки исправленного кода Akool webhook
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

console.log("🔓 Тестирование исправленного кода Akool webhook");
console.log("===============================================");
console.log();

// Функция проверки подписи (как в исправленном коде)
function verifySignature(clientId, timestamp, nonce, dataEncrypt, signature) {
  const sortedParams = [clientId, timestamp.toString(), nonce, dataEncrypt].sort().join('');
  const calculatedSignature = crypto.createHash('sha1').update(sortedParams).digest('hex');
  return calculatedSignature === signature;
}

// Функция расшифровки AES (как в исправленном коде)
function decryptAES(dataEncrypt, clientId, clientSecret) {
  try {
    const CryptoJS = require('crypto-js');

    // Создаем ключ и IV согласно документации
    const aesKey = clientSecret;
    const key = CryptoJS.enc.Utf8.parse(aesKey);
    const iv = CryptoJS.enc.Utf8.parse(clientId);

    console.log(`🔑 Ключ (UTF-8): ${key.toString(CryptoJS.enc.Hex)} (${key.sigBytes} байт)`);
    console.log(`🔑 IV (UTF-8): ${iv.toString(CryptoJS.enc.Hex)} (${iv.sigBytes} байт)`);

    // Расшифровываем AES-192-CBC с PKCS#7 padding используя crypto-js
    const decrypted = CryptoJS.AES.decrypt(dataEncrypt, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);
    console.log('✅ Расшифровка успешна');
    return result;
  } catch (error) {
    throw new Error(`Ошибка расшифровки: ${error.message}`);
  }
}

// Основная функция тестирования
async function testFixedCode() {
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
        console.log(`🎉 УСПЕХ! Исправленный код работает!`);
        
        // Проверяем структуру данных
        if (jsonData._id && jsonData.status && jsonData.type && jsonData.url) {
          console.log(`✅ Структура данных корректна!`);
          console.log(`  ID: ${jsonData._id}`);
          console.log(`  Status: ${jsonData.status}`);
          console.log(`  Type: ${jsonData.type}`);
          console.log(`  URL: ${jsonData.url}`);
        }
        
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
testFixedCode();
