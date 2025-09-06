#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Final AKOOL Webhook Decryption
Финальная расшифровка webhook данных от AKOOL
"""

import base64
import json
import re
import hashlib

def try_decrypt(data_bytes, key, method_name):
    """Попытка расшифровки с одним ключом"""
    try:
        decrypted = bytearray()
        for i in range(len(data_bytes)):
            decrypted.append(data_bytes[i] ^ key[i % len(key)])
        
        text = decrypted.decode('utf-8', errors='ignore')
        
        # Ищем JSON в расшифрованном тексте
        json_patterns = [
            r'\{[^}]*\}',  # Простые объекты
            r'\{.*\}',     # Объекты с вложенностью
            r'\[.*\]',     # Массивы
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, text, re.DOTALL)
            for match in matches:
                try:
                    json_data = json.loads(match)
                    print(f"✅ {method_name} - Valid JSON found:")
                    print(json.dumps(json_data, indent=2))
                    return json_data
                except:
                    pass
        
        # Если JSON не найден, показываем первые 100 символов
        print(f"❌ {method_name} - No valid JSON found: {text[:100]}...")
        return None
        
    except Exception as e:
        print(f"❌ {method_name} - Error: {e}")
        return None

def main():
    print("🔓 Final AKOOL Webhook Decryption")
    print("=================================")
    
    # Данные из webhook
    data_encrypt = "VzUJ0xiILQxxcGD1BC3dEBstjHTCfB8oLTi/JKe0DQBMHiYOX8K7utv1c5z3gIh/SFw/10oYoy1b2HDNEiB3ErogTUi1p+LgZm2CLPmd9RL/puYDQ02CaP+e72+2PhI7S5upOSHW3rNz6g9Alfng4903lNGdPDtwF+1m0LHt9yIfuao7cvJL+PXVQWumSUqj/g0H2B1C4GIEEwEJxroYtQ=="
    signature = "fd9af605124f0d2b386bc80fac11ea0420911142"
    timestamp = "1757189387922"
    nonce = "3243"
    
    print("📊 Webhook Data:")
    print(f"  Data Encrypt: {data_encrypt}")
    print(f"  Signature: {signature}")
    print(f"  Timestamp: {timestamp}")
    print(f"  Nonce: {nonce}")
    print()
    
    try:
        # Декодируем base64
        data_bytes = base64.b64decode(data_encrypt)
        print(f"Data length: {len(data_bytes)} bytes")
        print()
        
        # Создаем все возможные ключи
        keys = []
        
        # Базовые ключи
        keys.append(("Signature hex", bytes.fromhex(signature)))
        keys.append(("Nonce hex", bytes.fromhex(nonce)))
        keys.append(("Timestamp", timestamp.encode()))
        
        # Комбинированные ключи
        keys.append(("Signature + Nonce", (signature + nonce).encode()))
        keys.append(("Timestamp + Nonce", (timestamp + nonce).encode()))
        keys.append(("Signature + Timestamp", (signature + timestamp).encode()))
        
        # Hash ключи
        keys.append(("SHA256(Signature)", hashlib.sha256(signature.encode()).digest()))
        keys.append(("SHA256(Nonce)", hashlib.sha256(nonce.encode()).digest()))
        keys.append(("SHA256(Timestamp)", hashlib.sha256(timestamp.encode()).digest()))
        keys.append(("SHA256(Signature+Nonce)", hashlib.sha256((signature + nonce).encode()).digest()))
        keys.append(("SHA256(Timestamp+Nonce)", hashlib.sha256((timestamp + nonce).encode()).digest()))
        
        # MD5 ключи
        keys.append(("MD5(Signature)", hashlib.md5(signature.encode()).digest()))
        keys.append(("MD5(Nonce)", hashlib.md5(nonce.encode()).digest()))
        keys.append(("MD5(Timestamp)", hashlib.md5(timestamp.encode()).digest()))
        
        # Повторяющиеся ключи
        keys.append(("Signature repeated", (signature * 10).encode()[:32]))
        keys.append(("Nonce repeated", (nonce * 10).encode()[:32]))
        keys.append(("Timestamp repeated", (timestamp * 10).encode()[:32]))
        
        # Ключи из hex
        keys.append(("Signature hex repeated", (signature * 10).encode()[:32]))
        keys.append(("Nonce hex repeated", (nonce * 10).encode()[:32]))
        
        print("🔍 Пробуем все возможные ключи:")
        print("=" * 50)
        
        success = False
        for method_name, key in keys:
            print(f"\n🔑 {method_name}:")
            result = try_decrypt(data_bytes, key, method_name)
            if result:
                success = True
                print(f"🎉 УСПЕХ! Найден JSON с ключом: {method_name}")
                break
        
        if not success:
            print("\n❌ Ни один ключ не сработал")
            print("💡 Возможные причины:")
            print("   - AKOOL использует специальный ключ расшифровки")
            print("   - Алгоритм шифрования отличается от XOR")
            print("   - Нужен ключ из панели AKOOL")
        
        # Дополнительный анализ
        print("\n🔍 Дополнительный анализ:")
        print("=" * 30)
        
        # Анализ hex данных
        hex_data = data_bytes.hex()
        print(f"Hex data: {hex_data}")
        
        # Поиск паттернов
        patterns = {
            '7b': '{',
            '5b': '[',
            '22': '"',
            '766964656f': 'video',
            '737461747573': 'status',
            '7461736b': 'task'
        }
        
        print("\n🔍 Найденные паттерны:")
        for hex_pattern, char in patterns.items():
            pos = hex_data.find(hex_pattern)
            if pos != -1:
                print(f"  {char} ({hex_pattern}) at position {pos}")
                
                # Показываем контекст
                start = max(0, pos - 20)
                end = min(len(hex_data), pos + 40)
                context = hex_data[start:end]
                print(f"    Context: {context}")

    except Exception as e:
        print(f"❌ Общая ошибка: {e}")

    print("\n🎯 Финальная расшифровка завершена!")

if __name__ == "__main__":
    main()
