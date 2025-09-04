#!/usr/bin/env node

/**
 * Скрипт для тестирования доступных аватаров HeyGen
 * Запуск: node test-heygen-avatars.js
 */

const fetch = require('node-fetch');

async function testHeyGenAvatars() {
  const apiKey = process.env.HEYGEN_API_KEY;
  
  if (!apiKey) {
    console.error('❌ HEYGEN_API_KEY не найден в переменных окружения');
    process.exit(1);
  }

  console.log('🔍 Проверяем доступные аватары HeyGen...\n');

  try {
    // Проверяем список аватаров
    const response = await fetch('https://api.heygen.com/v1/avatar.list', {
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    console.log(`📡 Статус ответа: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка получения списка аватаров:', errorText);
      return;
    }

    const result = await response.json();
    console.log('📋 Полный ответ API:', JSON.stringify(result, null, 2));

    const avatars = result.data?.avatars || [];
    console.log(`\n✅ Найдено аватаров: ${avatars.length}`);

    if (avatars.length > 0) {
      console.log('\n📝 Доступные аватары:');
      avatars.forEach((avatar, index) => {
        console.log(`${index + 1}. ID: ${avatar.avatar_id}`);
        console.log(`   Название: ${avatar.avatar_name || 'Не указано'}`);
        console.log(`   Статус: ${avatar.status || 'Не указано'}`);
        console.log('');
      });

      // Тестируем первый аватар
      const firstAvatar = avatars[0];
      console.log(`🧪 Тестируем аватар: ${firstAvatar.avatar_id}`);
      
      const testPayload = {
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: firstAvatar.avatar_id,
              avatar_style: "normal"
            },
            voice: {
              type: "text",
              input_text: "Тестовое сообщение",
              voice_id: "119caed25533477ba63822d5d1552d25",
              speed: 1.0
            }
          }
        ],
        dimension: {
          width: 1280,
          height: 720
        }
      };

      const testResponse = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      console.log(`📡 Тест генерации: ${testResponse.status} ${testResponse.statusText}`);
      
      if (testResponse.ok) {
        const testResult = await testResponse.json();
        console.log('✅ Аватар работает! Результат:', JSON.stringify(testResult, null, 2));
      } else {
        const errorText = await testResponse.text();
        console.log('❌ Ошибка тестирования:', errorText);
      }
    } else {
      console.log('⚠️ Аватары не найдены');
    }

  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
  }
}

// Запускаем тест
testHeyGenAvatars();
