#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Extract JSON from AKOOL Webhook
Извлечение JSON из зашифрованных данных
"""

import base64
import json
import re

def main():
    print("🔍 Extract JSON from AKOOL Webhook")
    print("==================================")
    
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
        
        # Конвертируем в hex для анализа
        hex_data = data_bytes.hex()
        print(f"Hex data: {hex_data[:100]}...")
        
        # Ищем JSON маркеры
        json_markers = {
            '7b': '{',  # {
            '5b': '[',  # [
            '22': '"',  # "
            '766964656f': 'video',
            '737461747573': 'status',
            '7461736b': 'task'
        }
        
        print("\n🔍 Поиск JSON маркеров:")
        for hex_marker, char in json_markers.items():
            pos = hex_data.find(hex_marker)
            if pos != -1:
                print(f"Found {char} ({hex_marker}) at position {pos}")
        
        # Попробуем извлечь JSON разными способами
        print("\n🔍 Попытки извлечения JSON:")
        
        # Способ 1: Поиск JSON в разных кодировках
        for encoding in ['utf-8', 'latin-1', 'ascii']:
            try:
                text = data_bytes.decode(encoding, errors='ignore')
                print(f"\n{encoding} encoding:")
                print(f"Text: {text[:200]}...")
                
                # Ищем JSON объекты
                json_patterns = [
                    r'\{[^}]*\}',  # Простые объекты
                    r'\{.*\}',     # Объекты с вложенностью
                    r'\[.*\]',     # Массивы
                ]
                
                for pattern in json_patterns:
                    matches = re.findall(pattern, text, re.DOTALL)
                    for match in matches:
                        print(f"Found JSON pattern: {match[:100]}...")
                        try:
                            json_data = json.loads(match)
                            print("✅ Valid JSON found:")
                            print(json.dumps(json_data, indent=2))
                            break
                        except:
                            pass
                            
            except Exception as e:
                print(f"❌ {encoding} encoding failed: {e}")
        
        # Способ 2: XOR с разными ключами и поиск JSON
        print("\n🔍 XOR + JSON поиск:")
        
        keys = [
            bytes.fromhex(signature),
            bytes.fromhex(nonce),
            timestamp.encode(),
            (signature + nonce).encode(),
            (timestamp + nonce).encode()
        ]
        
        for i, key in enumerate(keys):
            try:
                decrypted = bytearray()
                for j in range(len(data_bytes)):
                    decrypted.append(data_bytes[j] ^ key[j % len(key)])
                
                text = decrypted.decode('utf-8', errors='ignore')
                print(f"\nXOR key {i+1}: {text[:100]}...")
                
                # Ищем JSON в расшифрованном тексте
                json_patterns = [
                    r'\{[^}]*\}',
                    r'\{.*\}',
                    r'\[.*\]',
                ]
                
                for pattern in json_patterns:
                    matches = re.findall(pattern, text, re.DOTALL)
                    for match in matches:
                        print(f"Found JSON in XOR {i+1}: {match[:100]}...")
                        try:
                            json_data = json.loads(match)
                            print("✅ Valid JSON found in XOR:")
                            print(json.dumps(json_data, indent=2))
                            break
                        except:
                            pass
                            
            except Exception as e:
                print(f"❌ XOR key {i+1} failed: {e}")
        
        # Способ 3: Поиск по hex паттернам
        print("\n🔍 Hex pattern search:")
        
        # Ищем возможные JSON строки в hex
        hex_patterns = [
            '7b22',  # {"
            '227b',  # "{
            '5b22',  # ["
            '227d',  # "}
            '227d',  # "}
        ]
        
        for pattern in hex_patterns:
            pos = hex_data.find(pattern)
            if pos != -1:
                print(f"Found hex pattern {pattern} at position {pos}")
                
                # Извлекаем окружающие данные
                start = max(0, pos - 20)
                end = min(len(hex_data), pos + 100)
                context = hex_data[start:end]
                print(f"Context: {context}")
                
                # Пробуем декодировать как hex
                try:
                    hex_bytes = bytes.fromhex(context)
                    text = hex_bytes.decode('utf-8', errors='ignore')
                    print(f"Decoded: {text}")
                except:
                    pass

    except Exception as e:
        print(f"❌ Общая ошибка: {e}")

    print("\n🎯 Извлечение JSON завершено!")

if __name__ == "__main__":
    main()
