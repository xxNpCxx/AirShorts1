/**
 * Тестовый скрипт для исследования Upload endpoints HeyGen API
 * Проверяем все возможные варианты загрузки assets
 */

const { default: fetch } = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

// Тестовые данные
const API_KEY = process.env.HEYGEN_API_KEY || 'your-api-key-here';
const BASE_URL = 'https://api.heygen.com';

// Создаем тестовое изображение (1x1 пиксель)
const createTestImage = () => {
  // Простой PNG 1x1 пиксель в base64
  const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return Buffer.from(pngData, 'base64');
};

// Создаем тестовое аудио (1 секунда тишины)
const createTestAudio = () => {
  // WAV файл 1 секунда тишины
  const wavHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // File size
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6D, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // Format chunk size
    0x01, 0x00, // Audio format (PCM)
    0x01, 0x00, // Number of channels
    0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
    0x88, 0x58, 0x01, 0x00, // Byte rate
    0x02, 0x00, // Block align
    0x10, 0x00, // Bits per sample
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00  // Data size
  ]);
  return wavHeader;
};

// Возможные endpoints для тестирования
const POSSIBLE_ENDPOINTS = [
  // v1 endpoints
  '/v1/upload',
  '/v1/assets',
  '/v1/asset/upload',
  '/v1/file/upload',
  '/v1/media/upload',
  '/v1/image/upload',
  '/v1/audio/upload',
  
  // v2 endpoints
  '/v2/upload',
  '/v2/assets',
  '/v2/asset/upload',
  '/v2/file/upload',
  '/v2/media/upload',
  '/v2/image/upload',
  '/v2/audio/upload',
  
  // Без версии
  '/upload',
  '/assets',
  '/asset/upload',
  '/file/upload',
  '/media/upload',
  '/image/upload',
  '/audio/upload',
  
  // Другие варианты
  '/api/v1/upload',
  '/api/v2/upload',
  '/api/upload',
  '/upload/asset',
  '/upload/file',
  '/upload/media',
];

// Тестируем endpoint
async function testEndpoint(endpoint, fileBuffer, fileType, fileName) {
  try {
    console.log(`\n🔄 Тестируем: ${endpoint}`);
    
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: fileType
    });
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': API_KEY,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log(`📥 Статус: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ УСПЕХ! Ответ:`, JSON.stringify(result, null, 2));
      return { endpoint, success: true, data: result };
    } else {
      const errorText = await response.text();
      console.log(`❌ Ошибка: ${errorText.substring(0, 200)}`);
      return { endpoint, success: false, error: errorText };
    }
  } catch (error) {
    console.log(`❌ Исключение: ${error.message}`);
    return { endpoint, success: false, error: error.message };
  }
}

// Основная функция
async function main() {
  console.log('🔍 ИССЛЕДОВАНИЕ HEYGEN UPLOAD API');
  console.log('=====================================');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Тестируем ${POSSIBLE_ENDPOINTS.length} endpoints...`);
  
  const testImage = createTestImage();
  const testAudio = createTestAudio();
  
  const results = [];
  
  // Тестируем изображения
  console.log('\n📸 ТЕСТИРУЕМ ЗАГРУЗКУ ИЗОБРАЖЕНИЙ:');
  for (const endpoint of POSSIBLE_ENDPOINTS) {
    const result = await testEndpoint(endpoint, testImage, 'image/png', 'test.png');
    results.push({ ...result, type: 'image' });
    
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Тестируем аудио
  console.log('\n🎵 ТЕСТИРУЕМ ЗАГРУЗКУ АУДИО:');
  for (const endpoint of POSSIBLE_ENDPOINTS) {
    const result = await testEndpoint(endpoint, testAudio, 'audio/wav', 'test.wav');
    results.push({ ...result, type: 'audio' });
    
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Анализируем результаты
  console.log('\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
  console.log('======================');
  
  const successfulEndpoints = results.filter(r => r.success);
  const failedEndpoints = results.filter(r => !r.success);
  
  console.log(`✅ Успешных: ${successfulEndpoints.length}`);
  console.log(`❌ Неудачных: ${failedEndpoints.length}`);
  
  if (successfulEndpoints.length > 0) {
    console.log('\n🎉 НАЙДЕНЫ РАБОЧИЕ ENDPOINTS:');
    successfulEndpoints.forEach(result => {
      console.log(`- ${result.endpoint} (${result.type})`);
      console.log(`  Данные: ${JSON.stringify(result.data, null, 2)}`);
    });
  } else {
    console.log('\n😞 РАБОЧИЕ ENDPOINTS НЕ НАЙДЕНЫ');
    console.log('Возможные причины:');
    console.log('- API Key неверный или неактивный');
    console.log('- Upload API недоступен для вашего плана');
    console.log('- Endpoints изменились в новой версии API');
    console.log('- Требуется дополнительная аутентификация');
  }
  
  // Сохраняем результаты в файл
  fs.writeFileSync('heygen-upload-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Результаты сохранены в heygen-upload-test-results.json');
}

// Запускаем тест
main().catch(console.error);
