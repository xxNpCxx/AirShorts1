#!/usr/bin/env python3
"""
Расширенный тестовый скрипт с диагностикой ошибки 1015 AKOOL
Включает автоматические retry, проверку параметров и детальную диагностику
"""

import os
import sys
import json
import time
import requests
import argparse
from typing import Optional, Dict, Any, List
from pathlib import Path
import tempfile
import logging
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('akool_diagnostics.log')
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
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

class AkoolDiagnostics:
    """Класс для диагностики ошибок AKOOL API"""
    
    def __init__(self):
        # AKOOL конфигурация
        self.client_id = "mrj0kTxsc6LoKCEJX2oyyA=="
        self.client_secret = "J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF"
        self.base_url = "https://openapi.akool.com/api/open/v3"
        self.access_token = None
        
        # Retry настройки
        self.max_retries = 5
        self.base_delay = 2
        self.max_delay = 30
        self.status_check_attempts = 10
        self.status_delay = 5
        
        # Временные файлы
        self.temp_dir = tempfile.mkdtemp(prefix='akool_diagnostics_')
        logger.info(f"Временная директория: {self.temp_dir}")
    
    def log(self, message: str, level: str = "INFO"):
        """Логирование с цветами"""
        color_map = {
            "INFO": Colors.BLUE,
            "SUCCESS": Colors.GREEN,
            "ERROR": Colors.RED,
            "WARNING": Colors.YELLOW,
            "DEBUG": Colors.CYAN,
            "INFO_SPECIAL": Colors.PURPLE
        }
        color = color_map.get(level, Colors.NC)
        print(f"{color}[{level}]{Colors.NC} {message}")
        logger.info(f"[{level}] {message}")
    
    def get_access_token(self) -> bool:
        """Получение API токена AKOOL"""
        self.log("🔑 Получение API токена AKOOL...")
        
        try:
            response = requests.post(
                f"{self.base_url}/getToken",
                json={
                    "clientId": self.client_id,
                    "clientSecret": self.client_secret
                },
                timeout=10
            )
            
            self.log(f"Ответ getToken: {response.text}", "DEBUG")
            
            data = response.json()
            if data.get('code') == 1000 and data.get('token'):
                self.access_token = data['token']
                self.log("✅ API токен AKOOL получен успешно", "SUCCESS")
                return True
            else:
                self.log(f"❌ Ошибка получения токена. Код: {data.get('code')}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Ошибка при получении токена: {e}", "ERROR")
            return False
    
    def check_account_limits(self) -> bool:
        """Проверка квот и лимитов аккаунта"""
        self.log("📊 Проверка квот и лимитов аккаунта...")
        
        if not self.access_token:
            self.log("❌ Сначала нужно получить токен", "ERROR")
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/user/info",
                headers={"Authorization": f"Bearer {self.access_token}"},
                timeout=10
            )
            
            self.log(f"Ответ user/info: {response.text}", "DEBUG")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 1000:
                    remaining_quota = data.get('data', {}).get('remaining_quota', 'unknown')
                    total_quota = data.get('data', {}).get('total_quota', 'unknown')
                    
                    self.log(f"Квоты аккаунта: {remaining_quota} / {total_quota}", "INFO")
                    
                    if remaining_quota != 'unknown' and remaining_quota < 1:
                        self.log("⚠️ Квота аккаунта исчерпана!", "WARNING")
                        return False
                    
                    self.log("✅ Квоты аккаунта в порядке", "SUCCESS")
                    return True
                else:
                    self.log(f"⚠️ Не удалось проверить квоты. Код: {data.get('code')}", "WARNING")
                    return True  # Продолжаем, так как это не критично
            else:
                self.log(f"⚠️ Ошибка проверки квот. Статус: {response.status_code}", "WARNING")
                return True
                
        except Exception as e:
            self.log(f"⚠️ Ошибка проверки квот: {e}", "WARNING")
            return True  # Продолжаем, так как это не критично
    
    def validate_request_parameters(self, talking_photo_url: str, audio_url: str, webhook_url: str = None) -> bool:
        """Валидация параметров запроса"""
        self.log("🔍 Валидация параметров запроса...")
        
        errors = []
        
        # Проверка URL изображения
        if not talking_photo_url:
            errors.append("URL изображения не указан")
        elif not talking_photo_url.startswith(('http://', 'https://')):
            errors.append("URL изображения должен начинаться с http:// или https://")
        
        # Проверка URL аудио
        if not audio_url:
            errors.append("URL аудио не указан")
        elif not audio_url.startswith(('http://', 'https://')):
            errors.append("URL аудио должен начинаться с http:// или https://")
        
        # Проверка webhook URL
        if webhook_url and not webhook_url.startswith(('http://', 'https://')):
            errors.append("Webhook URL должен начинаться с http:// или https://")
        
        if errors:
            self.log("❌ Ошибки валидации параметров:", "ERROR")
            for error in errors:
                self.log(f"  - {error}", "ERROR")
            return False
        
        self.log("✅ Параметры запроса валидны", "SUCCESS")
        return True
    
    def analyze_error_1015(self, code: str, msg: str, full_response: str) -> None:
        """Анализ ошибки 1015"""
        self.log(f"🔍 Анализ ошибки {code}...")
        
        if code == "1015":
            self.log("📋 Диагностика ошибки 1015:", "WARNING")
            self.log("  1. Проверьте параметры запроса - URL файлов должны быть доступны", "WARNING")
            self.log("  2. Подождите и повторите - сервер может быть перегружен", "WARNING")
            self.log("  3. Проверьте квоты аккаунта - возможно, исчерпан лимит", "WARNING")
            self.log("  4. Обратитесь в поддержку AKOOL с логами", "WARNING")
            self.log("  5. Попробуйте изменить формат/качество видео", "WARNING")
            
            # Создаем отчет для поддержки
            self.create_support_report(code, msg, full_response)
        elif code == "1001":
            self.log("❌ Ошибка аутентификации - проверьте CLIENT_ID и CLIENT_SECRET", "ERROR")
        elif code == "2001":
            self.log("❌ Ошибка формата запроса - проверьте JSON структуру", "ERROR")
        else:
            self.log(f"❓ Неизвестная ошибка {code} - обратитесь в поддержку", "WARNING")
    
    def create_support_report(self, code: str, msg: str, full_response: str) -> None:
        """Создание отчета для поддержки"""
        report_file = os.path.join(self.temp_dir, f"akool_error_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("=== ОТЧЕТ ОБ ОШИБКЕ AKOOL API ===\n")
            f.write(f"Время: {datetime.now()}\n")
            f.write(f"Код ошибки: {code}\n")
            f.write(f"Сообщение: {msg}\n\n")
            
            f.write("=== ПАРАМЕТРЫ ЗАПРОСА ===\n")
            f.write(f"Client ID: {self.client_id}\n")
            f.write(f"Base URL: {self.base_url}\n")
            f.write("Endpoint: /content/video/createbytalkingphoto\n\n")
            
            f.write("=== ОТВЕТ API ===\n")
            f.write(f"{full_response}\n\n")
            
            f.write("=== СИСТЕМНАЯ ИНФОРМАЦИЯ ===\n")
            f.write(f"Python версия: {sys.version}\n")
            f.write(f"OS: {os.name}\n")
            f.write(f"Requests версия: {requests.__version__}\n\n")
            
            f.write("=== РЕКОМЕНДАЦИИ ===\n")
            f.write("1. Проверьте доступность URL файлов\n")
            f.write("2. Убедитесь, что файлы в поддерживаемом формате\n")
            f.write("3. Проверьте размер файлов (рекомендуется < 100MB)\n")
            f.write("4. Попробуйте повторить запрос через несколько минут\n")
            f.write("5. Обратитесь в поддержку AKOOL с этим отчетом\n\n")
            
            f.write("=== КОНТАКТЫ ПОДДЕРЖКИ ===\n")
            f.write("Email: support@akool.com\n")
            f.write("Документация: https://docs.akool.com/\n")
        
        self.log(f"📄 Отчет для поддержки создан: {report_file}", "INFO")
        self.log("Отправьте этот файл в поддержку AKOOL для диагностики", "INFO")
    
    def create_talking_photo_with_retry(self, talking_photo_url: str, audio_url: str, webhook_url: str = None) -> bool:
        """Создание Talking Photo с retry логикой"""
        self.log("🎭 Создание Talking Photo с retry логикой...")
        
        # Валидация параметров
        if not self.validate_request_parameters(talking_photo_url, audio_url, webhook_url):
            return False
        
        # Проверка квот
        if not self.check_account_limits():
            return False
        
        attempt = 1
        delay = self.base_delay
        
        while attempt <= self.max_retries:
            self.log(f"🔄 Попытка {attempt}/{self.max_retries} создания Talking Photo...")
            
            try:
                payload = {
                    "talking_photo_url": talking_photo_url,
                    "audio_url": audio_url
                }
                
                if webhook_url:
                    payload["webhookUrl"] = webhook_url
                
                response = requests.post(
                    f"{self.base_url}/content/video/createbytalkingphoto",
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "Content-Type": "application/json"
                    },
                    json=payload,
                    timeout=30
                )
                
                self.log(f"Ответ create talking photo (попытка {attempt}): {response.text}", "DEBUG")
                
                if response.status_code == 200:
                    data = response.json()
                    code = str(data.get('code', ''))
                    task_id = data.get('data', {}).get('task_id')
                    msg = data.get('msg', '')
                    
                    if code == "1000" and task_id:
                        self.log(f"✅ Запрос на создание Talking Photo отправлен успешно. Task ID: {task_id}", "SUCCESS")
                        return True
                    elif code == "1015":
                        self.log(f"⚠️ Ошибка 1015: {msg}", "WARNING")
                        self.log(f"🔄 Повтор через {delay} секунд...", "WARNING")
                        
                        if attempt < self.max_retries:
                            time.sleep(delay)
                            delay = min(delay * 2, self.max_delay)
                        else:
                            self.analyze_error_1015(code, msg, response.text)
                            return False
                    else:
                        self.log(f"❌ Ошибка создания Talking Photo. Код: {code}", "ERROR")
                        self.log(f"Сообщение: {msg}", "ERROR")
                        self.analyze_error_1015(code, msg, response.text)
                        return False
                else:
                    self.log(f"❌ HTTP ошибка: {response.status_code}", "ERROR")
                    return False
                    
            except Exception as e:
                self.log(f"❌ Ошибка при создании Talking Photo: {e}", "ERROR")
                return False
            
            attempt += 1
        
        self.log(f"❌ Не удалось создать Talking Photo после {self.max_retries} попыток", "ERROR")
        return False
    
    def check_video_status_with_retry(self, task_id: str) -> bool:
        """Проверка статуса видео с retry"""
        self.log(f"🔍 Проверка статуса видео с retry логикой (Task ID: {task_id})...")
        
        if not self.access_token:
            self.log("❌ Нужен токен AKOOL", "ERROR")
            return False
        
        attempt = 1
        
        while attempt <= self.status_check_attempts:
            self.log(f"🔄 Проверка статуса {attempt}/{self.status_check_attempts}...")
            
            try:
                response = requests.get(
                    f"{self.base_url}/content/video/getvideostatus?task_id={task_id}",
                    headers={"Authorization": f"Bearer {self.access_token}"},
                    timeout=10
                )
                
                self.log(f"Ответ video status (попытка {attempt}): {response.text}", "DEBUG")
                
                if response.status_code == 200:
                    data = response.json()
                    code = str(data.get('code', ''))
                    status = str(data.get('data', {}).get('status', ''))
                    video_url = data.get('data', {}).get('video_url', '')
                    
                    if code == "1000":
                        if status == "2":
                            self.log(f"⏳ Видео обрабатывается... (статус: {status})", "INFO")
                            if attempt < self.status_check_attempts:
                                time.sleep(self.status_delay)
                        elif status == "3":
                            self.log(f"🎉 Видео готово! URL: {video_url}", "SUCCESS")
                            return True
                        elif status == "4":
                            self.log(f"❌ Ошибка обработки видео (статус: {status})", "ERROR")
                            return False
                        else:
                            self.log(f"❓ Неизвестный статус: {status}", "WARNING")
                    else:
                        self.log(f"❌ Ошибка проверки статуса видео. Код: {code}", "ERROR")
                        msg = data.get('msg', '')
                        if msg:
                            self.log(f"Сообщение: {msg}", "ERROR")
                else:
                    self.log(f"❌ HTTP ошибка: {response.status_code}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Ошибка при проверке статуса: {e}", "ERROR")
            
            attempt += 1
        
        self.log("⚠️ Превышено максимальное количество проверок статуса", "WARNING")
        return False
    
    def test_different_formats(self) -> None:
        """Тестирование различных форматов"""
        self.log("🧪 Тестирование различных форматов и параметров...")
        
        test_cases = [
            {"photo": "https://example.com/test_photo.jpg", "audio": "https://example.com/test_audio.mp3", "quality": "720p"},
            {"photo": "https://example.com/test_photo.png", "audio": "https://example.com/test_audio.wav", "quality": "1080p"},
            {"photo": "https://example.com/test_photo.jpeg", "audio": "https://example.com/test_audio.m4a", "quality": "480p"},
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            self.log(f"🔄 Тестирование {i}: {test_case['quality']} качество", "INFO")
            self.log(f"Фото: {test_case['photo']}, Аудио: {test_case['audio']}", "DEBUG")
    
    def cleanup(self):
        """Очистка временных файлов"""
        self.log("🧹 Очищаю временные файлы...")
        try:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
            self.log("✅ Временные файлы удалены", "SUCCESS")
        except Exception as e:
            self.log(f"⚠️ Ошибка при очистке: {e}", "WARNING")
    
    def run_diagnostics(self) -> bool:
        """Запуск полной диагностики"""
        self.log("🚀 Расширенная диагностика AKOOL API с анализом ошибки 1015", "INFO_SPECIAL")
        
        # Получение токена
        if not self.get_access_token():
            self.log("❌ Не удалось получить токен AKOOL. Прерываю диагностику.", "ERROR")
            return False
        
        # Тестирование различных форматов
        self.test_different_formats()
        
        # Создание Talking Photo с retry
        talking_photo_url = "https://example.com/test_photo.jpg"
        audio_url = "https://example.com/test_audio.mp3"
        webhook_url = "https://webhook.site/your-unique-id"
        
        if self.create_talking_photo_with_retry(talking_photo_url, audio_url, webhook_url):
            self.log("✅ Talking Photo создан успешно", "SUCCESS")
            return True
        else:
            self.log("❌ Не удалось создать Talking Photo после всех попыток", "ERROR")
            return False

def main():
    """Основная функция"""
    parser = argparse.ArgumentParser(description='Диагностика ошибок AKOOL API')
    parser.add_argument('--verbose', '-v', action='store_true', help='Подробный вывод')
    parser.add_argument('--max-retries', type=int, default=5, help='Максимальное количество попыток')
    parser.add_argument('--base-delay', type=int, default=2, help='Базовая задержка между попытками (секунды)')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    diagnostics = AkoolDiagnostics()
    diagnostics.max_retries = args.max_retries
    diagnostics.base_delay = args.base_delay
    
    try:
        success = diagnostics.run_diagnostics()
        if success:
            diagnostics.log("🎉 Диагностика завершена успешно!", "SUCCESS")
        else:
            diagnostics.log("❌ Диагностика завершена с ошибками", "ERROR")
            sys.exit(1)
    finally:
        diagnostics.cleanup()

if __name__ == "__main__":
    main()
