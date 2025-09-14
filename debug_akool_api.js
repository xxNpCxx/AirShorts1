#!/usr/bin/env node

/**
 * Скрипт для отладки Akool API
 */

const https = require('https');

const clientId = "mrj0kTxsc6LoKCEJX2oyyA==";
const clientSecret = "J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF";

console.log("🔍 Отладка Akool API");
console.log("===================");
console.log();

// Функция для получения токена
async function getToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      clientId: clientId,
      clientSecret: clientSecret
    });

    const options = {
      hostname: 'openapi.akool.com',
      port: 443,
      path: '/api/open/v3/getToken',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.code === 1000) {
            resolve(response.token);
          } else {
            reject(new Error(`Ошибка получения токена: ${response.msg}`));
          }
        } catch (error) {
          reject(new Error(`Ошибка парсинга ответа: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Ошибка запроса: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Функция для тестирования эндпоинта
async function testEndpoint(token, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openapi.akool.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            response: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            response: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Ошибка запроса: ${error.message}`));
    });

    req.end();
  });
}

// Основная функция
async function main() {
  try {
    console.log("🔑 Получаю токен...");
    const token = await getToken();
    console.log("✅ Токен получен");
    console.log();

    // Тестируем разные эндпоинты
    const endpoints = [
      '/api/open/v3/video/status/68c67e93993286d395173391',
      '/api/open/v3/content/video/getvideostatus?task_id=68c67e93993286d395173391',
      '/api/open/v3/video/list',
      '/api/open/v3/content/video/list',
      '/api/open/v3/tasks',
      '/api/open/v3/video/tasks'
    ];

    for (const endpoint of endpoints) {
      console.log(`🔍 Тестирую: ${endpoint}`);
      try {
        const result = await testEndpoint(token, endpoint);
        console.log(`  Статус: ${result.status}`);
        if (result.status === 200) {
          console.log(`  ✅ Успех!`);
          console.log(`  📋 Ответ: ${JSON.stringify(result.response, null, 2)}`);
        } else {
          console.log(`  ❌ Ошибка: ${result.response.msg || result.response}`);
        }
      } catch (error) {
        console.log(`  ❌ Ошибка: ${error.message}`);
      }
      console.log();
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
}

// Запуск
main();
