#!/usr/bin/env node

// Тестовый скрипт для проверки доступных аватаров в HeyGen
const fetch = require('node-fetch');

async function testHeyGenAvatars() {
  const apiKey = process.env.HEYGEN_API_KEY;
  
  if (!apiKey) {
    console.log('❌ HEYGEN_API_KEY не найден в переменных окружения');
    return;
  }

  console.log('🔍 Тестируем HeyGen API для получения доступных аватаров...');
  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);

  // Тестируем разные endpoints
  const endpoints = [
    'https://api.heygen.com/v1/avatar.list',
    'https://api.heygen.com/v2/avatar.list', 
    'https://api.heygen.com/v1/avatars',
    'https://api.heygen.com/v2/avatars',
    'https://api.heygen.com/avatars'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Тестируем: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'X-API-KEY': apiKey,
        },
      });

      console.log(`📊 Статус: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Успешный ответ:');
        console.log(JSON.stringify(data, null, 2));
        
        // Если нашли аватары, показываем их
        if (data.data?.avatars || data.avatars) {
          const avatars = data.data?.avatars || data.avatars;
          console.log(`\n🎭 Найдено аватаров: ${avatars.length}`);
          avatars.slice(0, 5).forEach((avatar, index) => {
            console.log(`  ${index + 1}. ${avatar.avatar_id || avatar.id} - ${avatar.name || 'Без имени'}`);
          });
        }
        break; // Если нашли рабочий endpoint, прекращаем поиск
      } else {
        const errorText = await response.text();
        console.log(`❌ Ошибка: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`💥 Исключение: ${error.message}`);
    }
  }

  // Тестируем создание аватара
  console.log('\n🖼️ Тестируем создание аватара...');
  
  const createEndpoints = [
    'https://api.heygen.com/v1/avatar.create',
    'https://api.heygen.com/v2/avatar/create',
    'https://api.heygen.com/v1/avatar',
    'https://api.heygen.com/v2/avatar'
  ];

  for (const endpoint of createEndpoints) {
    try {
      console.log(`\n📡 Тестируем создание: ${endpoint}`);
      
      const formData = new FormData();
      formData.append('avatar_name', 'test_avatar');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
        },
        body: formData,
      });

      console.log(`📊 Статус: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Создание аватара работает:');
        console.log(JSON.stringify(data, null, 2));
        break;
      } else {
        const errorText = await response.text();
        console.log(`❌ Ошибка: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`💥 Исключение: ${error.message}`);
    }
  }
}

// Запускаем тест
testHeyGenAvatars().catch(console.error);