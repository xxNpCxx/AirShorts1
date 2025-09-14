#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки расшифровки с использованием crypto-js
 * Согласно официальной документации Akool
 */

const CryptoJS = require('crypto-js');
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

console.log("🔓 Тестирование с crypto-js (официальная документация)");
console.log("=====================================================");
console.log();

// Функция проверки подписи (как в документации)
function generateMsgSignature(clientId, timestamp, nonce, msgEncrypt) {
  const sortedStr = [clientId, timestamp, nonce, msgEncrypt].sort().join('');
  const hash = crypto.createHash('sha1').update(sortedStr).digest('hex');
  return hash;
}

// Функция расшифровки AES (как в документации)
function generateAesDecrypt(dataEncrypt, clientId, clientSecret) {
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
}

// Основная функция тестирования
async function testWithCryptoJS() {
  try {
    console.log("=== ШАГ 1: Проверка подписи ===");
    const calculatedSignature = generateMsgSignature(
      exampleClientId,
      officialExample.timestamp,
      officialExample.nonce,
      officialExample.dataEncrypt
    );
    
    console.log(`  Ожидаемая подпись: ${officialExample.signature}`);
    console.log(`  Вычисленная подпись: ${calculatedSignature}`);
    console.log(`  Подпись: ${calculatedSignature === officialExample.signature ? '✅ Валидна' : '❌ Невалидна'}`);
    
    if (calculatedSignature !== officialExample.signature) {
      console.log("❌ Подпись невалидна, прекращаем тестирование");
      return;
    }
    
    console.log();
    console.log("=== ШАГ 2: Расшифровка данных ===");
    
    try {
      const decryptedData = generateAesDecrypt(
        officialExample.dataEncrypt,
        exampleClientId,
        exampleClientSecret
      );
      
      console.log(`✅ Расшифровка успешна!`);
      console.log(`📋 Расшифрованные данные: ${decryptedData}`);
      
      // Пробуем парсинг JSON
      try {
        const jsonData = JSON.parse(decryptedData);
        console.log(`✅ JSON парсинг успешен!`);
        console.log(`📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
        console.log(`🎉 УСПЕХ! Официальный пример работает с crypto-js!`);
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
testWithCryptoJS();
