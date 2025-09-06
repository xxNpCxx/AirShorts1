#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Alternative Video Retrieval
Альтернативные способы получения видео
"""

import requests
import json

def check_video_status():
    """Проверяем статус видео через API"""
    
    print("🔍 Alternative Video Retrieval")
    print("=============================")
    
    # Данные из webhook
    video_id = "68bc923998275fe7ef5a55ae"  # ID из предыдущих логов
    
    print(f"📊 Video ID: {video_id}")
    print()
    
    # Способ 1: Прямой запрос к AKOOL API
    print("🔍 Способ 1: Прямой запрос к AKOOL API")
    print("=" * 40)
    
    try:
        # Получаем токен
        token_url = "https://api.akool.com/api/v1/oauth/token"
        token_data = {
            "clientId": "your_client_id",
            "clientSecret": "your_client_secret"
        }
        
        print("⚠️  Нужны реальные clientId и clientSecret")
        print("   Получите их в панели AKOOL: https://akool.com")
        print()
        
    except Exception as e:
        print(f"❌ Ошибка API запроса: {e}")
    
    # Способ 2: Проверка через webhook логи
    print("🔍 Способ 2: Анализ webhook логов")
    print("=" * 40)
    
    print("📋 Найденные webhook данные:")
    print("  - Signature: fd9af605124f0d2b386bc80fac11ea0420911142")
    print("  - Timestamp: 1757189387922")
    print("  - Nonce: 3243")
    print("  - Data Encrypt: VzUJ0xiILQxxcGD1BC3dEBstjHTCfB8oLTi/JKe0DQBMHiYOX8K7utv1c5z3gIh/SFw/10oYoy1b2HDNEiB3ErogTUi1p+LgZm2CLPmd9RL/puYDQ02CaP+e72+2PhI7S5upOSHW3rNz6g9Alfng4903lNGdPDtwF+1m0LHt9yIfuao7cvJL+PXVQWumSUqj/g0H2B1C4GIEEwEJxroYtQ==")
    print()
    
    # Способ 3: Рекомендации
    print("🔍 Способ 3: Рекомендации")
    print("=" * 40)
    
    print("💡 Что делать дальше:")
    print("1. 🔑 Получите clientSecret в панели AKOOL")
    print("2. 📧 Обратитесь в поддержку AKOOL за ключом расшифровки")
    print("3. 🔍 Проверьте документацию AKOOL на предмет webhook расшифровки")
    print("4. ⏰ Подождите следующего webhook - возможно, видео еще обрабатывается")
    print()
    
    print("🎯 Альтернативные способы получения видео:")
    print("- Проверьте панель AKOOL на наличие готовых видео")
    print("- Используйте API для получения списка видео")
    print("- Обратитесь в поддержку с video_id для получения ссылки")

if __name__ == "__main__":
    check_video_status()
