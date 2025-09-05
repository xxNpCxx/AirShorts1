/**
 * Тест работоспособности HeyGen API ключа
 * Проверяем известные рабочие endpoints
 */

const { default: fetch } = require('node-fetch');

const API_KEY = process.env.HEYGEN_API_KEY || 'MTdhNzdmMDU5YWMzNDU1N2JjZjA3YjVlNDgyYjAxNTItMTc1NjA3OTE2OQ==';
const BASE_URL = 'https://api.heygen.com';

// Известные рабочие endpoints из документации
const WORKING_ENDPOINTS = [
  {
    name: 'Avatar List',
    endpoint: '/v1/avatar.list',
    method: 'GET',
    description: 'Получить список доступных аватаров'
  },
  {
    name: 'Video Status',
    endpoint: '/v1/video_status.get',
    method: 'GET',
    description: 'Получить статус видео (требует video_id)',
    params: { video_id: 'test_video_id' }
  },
  {
    name: 'Avatar IV Generate',
    endpoint: '/v2/video/av4/generate',
    method: 'POST',
    description: 'Создать Avatar IV видео (требует payload)',
    needsPayload: true
  },
  {
    name: 'Standard Video Generate',
    endpoint: '/v2/video/generate',
    method: 'POST',
    description: 'Создать стандартное видео (требует payload)',
    needsPayload: true
  }
];

async function testEndpoint(endpointInfo) {
  try {
    console.log(`\n🔄 Тестируем: ${endpointInfo.name}`);
    console.log(`📡 ${endpointInfo.method} ${endpointInfo.endpoint}`);
    console.log(`📝 ${endpointInfo.description}`);
    
    let url = `${BASE_URL}${endpointInfo.endpoint}`;
    
    // Добавляем параметры для GET запросов
    if (endpointInfo.params) {
      const searchParams = new URLSearchParams(endpointInfo.params);
      url += `?${searchParams.toString()}`;
    }
    
    const options = {
      method: endpointInfo.method,
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    // Добавляем payload для POST запросов
    if (endpointInfo.needsPayload) {
      options.body = JSON.stringify({
        // Минимальный payload для тестирования
        video_title: 'API Key Test',
        script: 'Test script',
        voice_id: '119caed25533477ba63822d5d1552d25'
      });
    }
    
    const response = await fetch(url, options);
    
    console.log(`📥 Статус: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ УСПЕХ! API Key рабочий!`);
      console.log(`📋 Ответ:`, JSON.stringify(result, null, 2));
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      console.log(`❌ Ошибка: ${errorText.substring(0, 300)}`);
      
      // Анализируем тип ошибки
      if (response.status === 401) {
        console.log(`🔑 Проблема с аутентификацией - API Key неверный`);
      } else if (response.status === 403) {
        console.log(`🚫 Доступ запрещен - API Key неактивный или ограниченный`);
      } else if (response.status === 404) {
        console.log(`🔍 Endpoint не найден - возможно изменился`);
      } else if (response.status === 400) {
        console.log(`📝 Неверный запрос - но API Key работает!`);
      }
      
      return { success: false, error: errorText, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Исключение: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔑 ТЕСТ HEYGEN API KEY');
  console.log('======================');
  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Тестируем ${WORKING_ENDPOINTS.length} рабочих endpoints...`);
  
  const results = [];
  
  for (const endpointInfo of WORKING_ENDPOINTS) {
    const result = await testEndpoint(endpointInfo);
    results.push({ ...result, endpoint: endpointInfo.name });
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Анализируем результаты
  console.log('\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
  console.log('======================');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Успешных тестов: ${successfulTests.length}`);
  console.log(`❌ Неудачных тестов: ${failedTests.length}`);
  
  if (successfulTests.length > 0) {
    console.log('\n🎉 API KEY РАБОЧИЙ!');
    console.log('Рабочие endpoints:');
    successfulTests.forEach(result => {
      console.log(`- ${result.endpoint}`);
    });
  } else {
    console.log('\n😞 API KEY НЕ РАБОТАЕТ');
    console.log('Возможные причины:');
    console.log('- API Key неверный или истек');
    console.log('- API Key неактивен');
    console.log('- Недостаточно прав доступа');
    console.log('- Проблемы с сетью');
  }
  
  // Сохраняем результаты
  require('fs').writeFileSync('heygen-api-key-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Результаты сохранены в heygen-api-key-test-results.json');
}

main().catch(console.error);
