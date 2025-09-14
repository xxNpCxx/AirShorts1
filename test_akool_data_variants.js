#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки разных вариантов обработки данных
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

console.log("🔓 Тестирование разных вариантов обработки данных");
console.log("================================================");
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

// Тестируем разные варианты обработки данных
const dataVariants = [
  {
    name: "Оригинальные данные (Base64)",
    data: testData.dataEncrypt,
    encoding: 'base64'
  },
  {
    name: "Данные как hex",
    data: Buffer.from(testData.dataEncrypt, 'base64').toString('hex'),
    encoding: 'hex'
  },
  {
    name: "Данные как binary",
    data: Buffer.from(testData.dataEncrypt, 'base64'),
    encoding: 'binary'
  }
];

console.log("🧪 Тестируем разные варианты обработки данных:");
console.log("==============================================");

for (const variant of dataVariants) {
  console.log(`\n--- ${variant.name} ---`);
  
  try {
    // Создаем decipher
    const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
    decipher.setAutoPadding(true);
    
    // Расшифровываем
    let decrypted;
    if (variant.encoding === 'binary') {
      decrypted = decipher.update(variant.data);
      decrypted += decipher.final();
      decrypted = decrypted.toString('utf8');
    } else {
      decrypted = decipher.update(variant.data, variant.encoding, 'utf8');
      decrypted += decipher.final('utf8');
    }
    
    console.log(`✅ Расшифровка успешна!`);
    console.log(`📋 Данные: ${decrypted.substring(0, 100)}...`);
    
    // Пробуем парсинг JSON
    try {
      const jsonData = JSON.parse(decrypted);
      console.log(`✅ JSON парсинг успешен!`);
      console.log(`📊 JSON: ${JSON.stringify(jsonData, null, 2)}`);
      console.log(`🎉 УСПЕХ! Найден рабочий вариант: ${variant.name}`);
      break;
    } catch (jsonError) {
      console.log(`❌ JSON парсинг не удался: ${jsonError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
}

// Тестируем разные варианты обработки ключей
console.log("\n🧪 Тестируем разные варианты обработки ключей:");
console.log("==============================================");

const keyVariants = [
  {
    name: "Оригинальные ключи",
    key: key,
    iv: iv
  },
  {
    name: "Ключи как Base64",
    key: Buffer.from(clientSecret, 'base64').slice(0, 24),
    iv: Buffer.from(clientId, 'base64').slice(0, 16)
  },
  {
    name: "Ключи как hex",
    key: Buffer.from(clientSecret, 'hex').slice(0, 24),
    iv: Buffer.from(clientId, 'hex').slice(0, 16)
  }
];

for (const variant of keyVariants) {
  console.log(`\n--- ${variant.name} ---`);
  
  try {
    console.log(`  Ключ: ${variant.key.toString('hex')} (${variant.key.length} байт)`);
    console.log(`  IV: ${variant.iv.toString('hex')} (${variant.iv.length} байт)`);
    
    // Создаем decipher
    const decipher = crypto.createDecipheriv('aes-192-cbc', variant.key, variant.iv);
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
      console.log(`🎉 УСПЕХ! Найден рабочий вариант: ${variant.name}`);
      break;
    } catch (jsonError) {
      console.log(`❌ JSON парсинг не удался: ${jsonError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
}

console.log("\n🎯 Тестирование вариантов обработки завершено!");
