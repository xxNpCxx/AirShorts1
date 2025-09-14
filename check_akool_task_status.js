#!/usr/bin/env node

/**
 * Скрипт для проверки статуса задачи Akool
 */

const https = require('https');

// Данные из логов
const taskId = "68c67e93993286d395173391";
const clientId = "mrj0kTxsc6LoKCEJX2oyyA==";
const clientSecret = "J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF";

console.log("🔍 Проверка статуса задачи Akool");
console.log("===============================");
console.log();

console.log(`Task ID: ${taskId}`);
console.log(`Client ID: ${clientId}`);
console.log(`Client Secret: ${clientSecret.substring(0, 10)}...`);
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

// Функция для проверки статуса задачи
async function checkTaskStatus(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openapi.akool.com',
      port: 443,
      path: `/api/open/v3/video/status/${taskId}`,
      method: 'GET',
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
          resolve(response);
        } catch (error) {
          reject(new Error(`Ошибка парсинга ответа: ${error.message}`));
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

    console.log("📊 Проверяю статус задачи...");
    const status = await checkTaskStatus(token);
    
    console.log("📋 Ответ Akool:");
    console.log(JSON.stringify(status, null, 2));
    
    if (status.code === 1000) {
      const data = status.data;
      console.log();
      console.log("📊 Статус задачи:");
      console.log(`  Task ID: ${data.task_id || 'N/A'}`);
      console.log(`  Video Status: ${data.video_status || 'N/A'}`);
      console.log(`  Video URL: ${data.video_url || 'N/A'}`);
      console.log(`  Error Message: ${data.error_message || 'N/A'}`);
      
      // Расшифровка статуса
      const statusMap = {
        1: 'В очереди',
        2: 'Обрабатывается', 
        3: 'Готово',
        4: 'Ошибка'
      };
      
      const statusText = statusMap[data.video_status] || 'Неизвестно';
      console.log(`  Статус (текст): ${statusText}`);
      
      if (data.video_status === 3 && data.video_url) {
        console.log("🎉 Видео готово!");
        console.log(`🔗 URL: ${data.video_url}`);
      } else if (data.video_status === 4) {
        console.log("❌ Ошибка обработки видео");
        console.log(`💬 Сообщение: ${data.error_message || 'Неизвестная ошибка'}`);
      } else {
        console.log("⏳ Видео еще обрабатывается...");
      }
    } else {
      console.log(`❌ Ошибка API: ${status.msg || 'Неизвестная ошибка'}`);
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
}

// Запуск
main();
