/**
 * Тест Standard Video API с правильным payload
 */

const { default: fetch } = require('node-fetch');

const API_KEY = process.env.HEYGEN_API_KEY || 'MTdhNzdmMDU5YWMzNDU1N2JjZjA3YjVlNDgyYjAxNTItMTc1NjA3OTE2OQ==';
const BASE_URL = 'https://api.heygen.com';

async function testStandardVideoAPI() {
  try {
    console.log('🎬 ТЕСТ STANDARD VIDEO API');
    console.log('==========================');
    
    // Сначала получим список доступных аватаров
    console.log('\n1️⃣ Получаем список аватаров...');
    
    const avatarResponse = await fetch(`${BASE_URL}/v1/avatar.list`, {
      method: 'GET',
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📥 Avatar List Status: ${avatarResponse.status} ${avatarResponse.statusText}`);
    
    let avatarId = 'Josh'; // Fallback avatar
    
    if (avatarResponse.ok) {
      const avatarData = await avatarResponse.json();
      console.log('✅ Список аватаров получен!');
      console.log('📋 Доступные аватары:', JSON.stringify(avatarData, null, 2));
      
      // Берем первый доступный аватар
      if (avatarData.data && avatarData.data.avatars && avatarData.data.avatars.length > 0) {
        avatarId = avatarData.data.avatars[0].avatar_id;
        console.log(`🎭 Используем аватар: ${avatarId}`);
      }
    } else {
      console.log('⚠️ Не удалось получить список аватаров, используем fallback');
    }
    
    // Теперь тестируем Standard Video API
    console.log('\n2️⃣ Тестируем Standard Video API...');
    
    const videoPayload = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatarId,
            avatar_style: "normal"
          },
          voice: {
            type: "text",
            input_text: "Привет! Это тест HeyGen API с вашим API ключом.",
            voice_id: "119caed25533477ba63822d5d1552d25"
          },
          background: {
            type: "color",
            value: "#FFFFFF"
          }
        }
      ],
      dimension: {
        width: 1280,
        height: 720
      },
      aspect_ratio: "16:9"
    };
    
    console.log('📤 Отправляем payload:', JSON.stringify(videoPayload, null, 2));
    
    const videoResponse = await fetch(`${BASE_URL}/v2/video/generate`, {
      method: 'POST',
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(videoPayload)
    });
    
    console.log(`📥 Video Generate Status: ${videoResponse.status} ${videoResponse.statusText}`);
    
    if (videoResponse.ok) {
      const videoData = await videoResponse.json();
      console.log('🎉 УСПЕХ! Видео создано!');
      console.log('📋 Ответ:', JSON.stringify(videoData, null, 2));
      
      if (videoData.data && videoData.data.video_id) {
        console.log(`🎬 Video ID: ${videoData.data.video_id}`);
        console.log('✅ API Key полностью рабочий!');
        return true;
      }
    } else {
      const errorData = await videoResponse.json();
      console.log('❌ Ошибка создания видео:');
      console.log('📋 Ошибка:', JSON.stringify(errorData, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Исключение:', error.message);
    return false;
  }
}

async function main() {
  const success = await testStandardVideoAPI();
  
  if (success) {
    console.log('\n🎉 РЕЗУЛЬТАТ: API KEY ПОЛНОСТЬЮ РАБОЧИЙ!');
    console.log('✅ Можно создавать видео через Standard Video API');
    console.log('✅ Можно использовать TTS с аватарами');
  } else {
    console.log('\n😞 РЕЗУЛЬТАТ: API KEY ИМЕЕТ ОГРАНИЧЕНИЯ');
    console.log('❌ Не удалось создать видео');
    console.log('❌ Возможно нужен более высокий план');
  }
}

main().catch(console.error);
