#!/usr/bin/env python3
"""
Детальный тестовый скрипт для проверки AKOOL + ELEVENLABS интеграции
Тестирует весь процесс создания видео с клонированием голоса
"""

import os
import sys
import json
import time
import base64
import requests
import argparse
from typing import Optional, Dict, Any
from pathlib import Path
import tempfile
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('test_video_creation.log')
    ]
)
logger = logging.getLogger(__name__)

class Colors:
    """Цвета для консольного вывода"""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    BLUE = '\033[0;34m'
    YELLOW = '\033[1;33m'
    PURPLE = '\033[0;35m'
    NC = '\033[0m'  # No Color

class VideoCreationTester:
    """Класс для тестирования создания видео с клонированием голоса"""
    
    def __init__(self):
        # AKOOL конфигурация
        self.akool_client_id = "mrj0kTxsc6LoKCEJX2oyyA=="
        self.akool_client_secret = "J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF"
        self.akool_base_url = "https://openapi.akool.com/api/open/v3"
        self.akool_access_token = None
        
        # ElevenLabs конфигурация
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY', '')
        self.elevenlabs_base_url = "https://api.elevenlabs.io/v1"
        self.elevenlabs_voice_id = None
        
        # Тестовые данные
        self.test_text = "Привет! Это тестовое сообщение для проверки работы клонирования голоса."
        self.test_photo_path = None
        self.test_audio_path = None
        self.generated_audio_path = None
        self.akool_task_id = None
        
        # Временные файлы
        self.temp_dir = tempfile.mkdtemp(prefix='video_test_')
        logger.info(f"Временная директория: {self.temp_dir}")
    
    def log(self, message: str, level: str = "INFO"):
        """Логирование с цветами"""
        color_map = {
            "INFO": Colors.BLUE,
            "SUCCESS": Colors.GREEN,
            "ERROR": Colors.RED,
            "WARNING": Colors.YELLOW,
            "INFO_SPECIAL": Colors.PURPLE
        }
        color = color_map.get(level, Colors.NC)
        print(f"{color}[{level}]{Colors.NC} {message}")
        logger.info(f"[{level}] {message}")
    
    def check_dependencies(self) -> bool:
        """Проверка зависимостей"""
        self.log("🔍 Проверяю зависимости...")
        
        try:
            import requests
            import json
            self.log("✅ Все Python зависимости найдены", "SUCCESS")
            return True
        except ImportError as e:
            self.log(f"❌ Отсутствует зависимость: {e}", "ERROR")
            return False
    
    def get_akool_token(self) -> bool:
        """Получение API токена AKOOL"""
        self.log("🔑 Получение API токена AKOOL...")
        
        try:
            response = requests.post(
                f"{self.akool_base_url}/getToken",
                json={
                    "clientId": self.akool_client_id,
                    "clientSecret": self.akool_client_secret
                },
                timeout=10
            )
            
            self.log(f"Ответ getToken: {response.text}")
            
            data = response.json()
            if data.get('code') == 1000 and data.get('token'):
                self.akool_access_token = data['token']
                self.log("✅ API токен AKOOL получен успешно", "SUCCESS")
                return True
            else:
                self.log(f"❌ Ошибка получения токена. Код: {data.get('code')}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Ошибка при получении токена: {e}", "ERROR")
            return False
    
    def check_elevenlabs_key(self) -> bool:
        """Проверка ElevenLabs API ключа"""
        self.log("🔑 Проверка ElevenLabs API ключа...")
        
        if not self.elevenlabs_api_key:
            self.log("⚠️ ELEVENLABS_API_KEY не установлен", "WARNING")
            return False
        
        try:
            response = requests.get(
                f"{self.elevenlabs_base_url}/voices",
                headers={"xi-api-key": self.elevenlabs_api_key},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'voices' in data:
                    self.log("✅ ElevenLabs API ключ валиден", "SUCCESS")
                    return True
            
            self.log(f"❌ ElevenLabs API ключ невалиден. Статус: {response.status_code}", "ERROR")
            return False
            
        except Exception as e:
            self.log(f"❌ Ошибка проверки ElevenLabs API: {e}", "ERROR")
            return False
    
    def create_test_audio(self) -> bool:
        """Создание тестового аудио файла"""
        self.log("🎵 Создание тестового аудио файла...")
        
        try:
            # Создаем минимальный WAV файл
            self.test_audio_path = os.path.join(self.temp_dir, "test_audio.wav")
            
            # Простой WAV заголовок + тишина
            wav_header = bytearray([
                0x52, 0x49, 0x46, 0x46,  # "RIFF"
                0x24, 0x00, 0x00, 0x00,  # File size - 8
                0x57, 0x41, 0x56, 0x45,  # "WAVE"
                0x66, 0x6D, 0x74, 0x20,  # "fmt "
                0x10, 0x00, 0x00, 0x00,  # fmt chunk size
                0x01, 0x00,              # Audio format (PCM)
                0x01, 0x00,              # Number of channels
                0x44, 0xAC, 0x00, 0x00,  # Sample rate (44100)
                0x88, 0x58, 0x01, 0x00,  # Byte rate
                0x02, 0x00,              # Block align
                0x10, 0x00,              # Bits per sample
                0x64, 0x61, 0x74, 0x61,  # "data"
                0x00, 0x00, 0x00, 0x00   # Data size
            ])
            
            with open(self.test_audio_path, 'wb') as f:
                f.write(wav_header)
                # Добавляем немного тишины
                f.write(b'\x00' * 1000)
            
            self.log("✅ Тестовое аудио создано", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"❌ Ошибка создания тестового аудио: {e}", "ERROR")
            return False
    
    def create_test_image(self) -> bool:
        """Создание тестового изображения"""
        self.log("🖼️ Создание тестового изображения...")
        
        try:
            self.test_photo_path = os.path.join(self.temp_dir, "test_image.jpg")
            
            # Создаем минимальный JPEG файл
            jpeg_data = bytes([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
                0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
                0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
                0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
                0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
                0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x14,
                0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02,
                0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xAA, 0xFF, 0xD9
            ])
            
            with open(self.test_photo_path, 'wb') as f:
                f.write(jpeg_data)
            
            self.log("✅ Тестовое изображение создано", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"❌ Ошибка создания тестового изображения: {e}", "ERROR")
            return False
    
    def clone_voice_elevenlabs(self) -> bool:
        """Клонирование голоса через ElevenLabs"""
        if not self.elevenlabs_api_key:
            self.log("⚠️ Пропускаю клонирование голоса - API ключ не установлен", "WARNING")
            return False
        
        self.log("🎤 Клонирование голоса через ElevenLabs...")
        
        try:
            with open(self.test_audio_path, 'rb') as audio_file:
                files = {
                    'files': ('voice_sample.wav', audio_file, 'audio/wav')
                }
                data = {
                    'name': f'TestVoice_{int(time.time())}',
                    'description': 'Test voice for integration testing'
                }
                
                response = requests.post(
                    f"{self.elevenlabs_base_url}/voices/add",
                    headers={"xi-api-key": self.elevenlabs_api_key},
                    files=files,
                    data=data,
                    timeout=30
                )
            
            self.log(f"Ответ ElevenLabs voice clone: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if 'voice_id' in data:
                    self.elevenlabs_voice_id = data['voice_id']
                    self.log(f"✅ Голос клонирован успешно. Voice ID: {self.elevenlabs_voice_id}", "SUCCESS")
                    return True
            
            self.log(f"❌ Ошибка клонирования голоса. Статус: {response.status_code}", "ERROR")
            return False
            
        except Exception as e:
            self.log(f"❌ Ошибка клонирования голоса: {e}", "ERROR")
            return False
    
    def create_audio_with_voice(self) -> bool:
        """Создание аудио с клонированным голосом"""
        if not self.elevenlabs_api_key or not self.elevenlabs_voice_id:
            self.log("⚠️ Пропускаю создание аудио - API ключ или Voice ID не установлены", "WARNING")
            return False
        
        self.log("🗣️ Создание аудио с клонированным голосом...")
        
        try:
            payload = {
                "text": self.test_text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            response = requests.post(
                f"{self.elevenlabs_base_url}/text-to-speech/{self.elevenlabs_voice_id}",
                headers={
                    "xi-api-key": self.elevenlabs_api_key,
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                self.generated_audio_path = os.path.join(self.temp_dir, "generated_audio.mp3")
                with open(self.generated_audio_path, 'wb') as f:
                    f.write(response.content)
                
                self.log("✅ Аудио с клонированным голосом создано успешно", "SUCCESS")
                return True
            else:
                self.log(f"❌ Ошибка создания аудио. Статус: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Ошибка создания аудио: {e}", "ERROR")
            return False
    
    def create_talking_photo_akool(self) -> bool:
        """Создание Talking Photo через AKOOL"""
        if not self.akool_access_token:
            self.log("❌ Сначала нужно получить токен AKOOL", "ERROR")
            return False
        
        self.log("🎭 Создание Talking Photo через AKOOL...")
        
        try:
            # Используем тестовые URL (в реальном проекте это были бы загруженные URL)
            talking_photo_url = "https://example.com/test_photo.jpg"
            audio_url = "https://example.com/test_audio.mp3"
            webhook_url = "https://webhook.site/your-unique-id"
            
            payload = {
                "talking_photo_url": talking_photo_url,
                "audio_url": audio_url,
                "webhookUrl": webhook_url
            }
            
            response = requests.post(
                f"{self.akool_base_url}/content/video/createbytalkingphoto",
                headers={
                    "Authorization": f"Bearer {self.akool_access_token}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30
            )
            
            self.log(f"Ответ AKOOL create talking photo: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 1000 and data.get('data', {}).get('task_id'):
                    self.akool_task_id = data['data']['task_id']
                    self.log(f"✅ Запрос на создание Talking Photo отправлен. Task ID: {self.akool_task_id}", "SUCCESS")
                    return True
            
            self.log(f"❌ Ошибка создания Talking Photo. Код: {data.get('code')}", "ERROR")
            return False
            
        except Exception as e:
            self.log(f"❌ Ошибка создания Talking Photo: {e}", "ERROR")
            return False
    
    def check_akool_video_status(self) -> bool:
        """Проверка статуса видео AKOOL"""
        if not self.akool_access_token or not self.akool_task_id:
            self.log("❌ Нужны токен AKOOL и Task ID", "ERROR")
            return False
        
        self.log(f"🔍 Проверка статуса видео AKOOL (Task ID: {self.akool_task_id})...")
        
        try:
            response = requests.get(
                f"{self.akool_base_url}/content/video/getvideostatus?task_id={self.akool_task_id}",
                headers={"Authorization": f"Bearer {self.akool_access_token}"},
                timeout=10
            )
            
            self.log(f"Ответ AKOOL video status: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 1000:
                    status = data.get('data', {}).get('status')
                    video_url = data.get('data', {}).get('video_url')
                    
                    self.log(f"✅ Статус видео: {status}", "SUCCESS")
                    
                    if status == 3:  # completed
                        self.log(f"🎉 Видео готово! URL: {video_url}", "SUCCESS")
                    elif status == 2:  # processing
                        self.log("⏳ Видео обрабатывается...", "INFO")
                    elif status == 4:  # error
                        self.log("❌ Ошибка обработки видео", "ERROR")
                    
                    return True
            
            self.log(f"❌ Ошибка проверки статуса видео. Код: {data.get('code')}", "ERROR")
            return False
            
        except Exception as e:
            self.log(f"❌ Ошибка проверки статуса видео: {e}", "ERROR")
            return False
    
    def test_full_process(self) -> bool:
        """Тестирование полного процесса"""
        self.log("🚀 Начинаю тестирование полного процесса создания видео с клонированием голоса", "INFO_SPECIAL")
        
        steps = [
            ("Получение токена AKOOL", self.get_akool_token),
            ("Проверка ElevenLabs API", self.check_elevenlabs_key),
            ("Создание тестового аудио", self.create_test_audio),
            ("Создание тестового изображения", self.create_test_image),
        ]
        
        # Выполняем обязательные шаги
        for step_name, step_func in steps:
            self.log(f"=== {step_name} ===", "INFO_SPECIAL")
            if not step_func():
                if "AKOOL" in step_name:
                    self.log(f"❌ Критическая ошибка в шаге: {step_name}", "ERROR")
                    return False
                else:
                    self.log(f"⚠️ Пропускаю шаг: {step_name}", "WARNING")
        
        # Опциональные шаги
        if self.elevenlabs_api_key:
            self.log("=== Клонирование голоса ===", "INFO_SPECIAL")
            if self.clone_voice_elevenlabs():
                self.log("=== Создание аудио с клонированным голосом ===", "INFO_SPECIAL")
                self.create_audio_with_voice()
            else:
                self.log("⚠️ Клонирование голоса недоступно, используем тестовое аудио", "WARNING")
        
        # Создание Talking Photo
        self.log("=== Создание Talking Photo через AKOOL ===", "INFO_SPECIAL")
        if self.create_talking_photo_akool():
            self.log("=== Проверка статуса видео ===", "INFO_SPECIAL")
            self.check_akool_video_status()
        else:
            self.log("❌ Не удалось создать Talking Photo", "ERROR")
            return False
        
        self.log("🎉 Тестирование завершено!", "SUCCESS")
        return True
    
    def cleanup(self):
        """Очистка временных файлов"""
        self.log("🧹 Очищаю временные файлы...")
        try:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
            self.log("✅ Временные файлы удалены", "SUCCESS")
        except Exception as e:
            self.log(f"⚠️ Ошибка при очистке: {e}", "WARNING")

def main():
    """Основная функция"""
    parser = argparse.ArgumentParser(description='Тестирование AKOOL + ELEVENLABS интеграции')
    parser.add_argument('-k', '--elevenlabs-key', help='ElevenLabs API ключ')
    parser.add_argument('--akool-only', action='store_true', help='Тестировать только AKOOL')
    parser.add_argument('--elevenlabs-only', action='store_true', help='Тестировать только ElevenLabs')
    parser.add_argument('--verbose', '-v', action='store_true', help='Подробный вывод')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    tester = VideoCreationTester()
    
    if args.elevenlabs_key:
        tester.elevenlabs_api_key = args.elevenlabs_key
    
    try:
        if args.elevenlabs_only:
            tester.log("=== РЕЖИМ: Только ElevenLabs ===", "INFO_SPECIAL")
            if not tester.check_elevenlabs_key():
                sys.exit(1)
            if not tester.create_test_audio():
                sys.exit(1)
            if not tester.clone_voice_elevenlabs():
                sys.exit(1)
            if not tester.create_audio_with_voice():
                sys.exit(1)
            tester.log("✅ Тестирование ElevenLabs завершено", "SUCCESS")
            
        elif args.akool_only:
            tester.log("=== РЕЖИМ: Только AKOOL ===", "INFO_SPECIAL")
            if not tester.get_akool_token():
                sys.exit(1)
            if not tester.create_test_audio():
                sys.exit(1)
            if not tester.create_test_image():
                sys.exit(1)
            if not tester.create_talking_photo_akool():
                sys.exit(1)
            tester.check_akool_video_status()
            tester.log("✅ Тестирование AKOOL завершено", "SUCCESS")
            
        else:
            if not tester.test_full_process():
                sys.exit(1)
                
    finally:
        tester.cleanup()

if __name__ == "__main__":
    main()
