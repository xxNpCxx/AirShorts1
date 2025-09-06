#!/bin/bash

# Simple AKOOL Webhook Decryption Script
# Простые методы расшифровки без внешних зависимостей

echo "🔓 Simple AKOOL Webhook Decryption"
echo "=================================="

# Данные из webhook
DATA_ENCRYPT="VzUJ0xiILQxxcGD1BC3dEBstjHTCfB8oLTi/JKe0DQBMHiYOX8K7utv1c5z3gIh/SFw/10oYoy1b2HDNEiB3ErogTUi1p+LgZm2CLPmd9RL/puYDQ02CaP+e72+2PhI7S5upOSHW3rNz6g9Alfng4903lNGdPDtwF+1m0LHt9yIfuao7cvJL+PXVQWumSUqj/g0H2B1C4GIEEwEJxroYtQ=="
SIGNATURE="fd9af605124f0d2b386bc80fac11ea0420911142"
TIMESTAMP="1757189387922"
NONCE="3243"

echo "📊 Webhook Data:"
echo "  Data Encrypt: $DATA_ENCRYPT"
echo "  Signature: $SIGNATURE"
echo "  Timestamp: $TIMESTAMP"
echo "  Nonce: $NONCE"
echo ""

# Простая расшифровка с Python (встроенные библиотеки)
python3 -c "
import base64
import binascii
import hashlib
import json

data_encrypt = '$DATA_ENCRYPT'
signature = '$SIGNATURE'
timestamp = '$TIMESTAMP'
nonce = '$NONCE'

print('🔍 Простые методы расшифровки')
print('============================')

# Метод 1: Base64 + поиск JSON
print('\\n🔍 Метод 1: Base64 декодирование')
try:
    data_bytes = base64.b64decode(data_encrypt)
    print(f'Data length: {len(data_bytes)} bytes')
    
    # Пробуем разные кодировки
    for encoding in ['utf-8', 'latin-1', 'ascii']:
        try:
            result = data_bytes.decode(encoding, errors='ignore')
            print(f'{encoding}: {result[:100]}...')
            
            # Ищем JSON маркеры
            if '{' in result or '[' in result:
                print(f'Found JSON markers in {encoding}')
                try:
                    json_data = json.loads(result)
                    print('✅ JSON парсинг успешен:')
                    print(json.dumps(json_data, indent=2))
                except:
                    pass
        except:
            pass
            
except Exception as e:
    print(f'❌ Base64 декодирование не удалось: {e}')

# Метод 2: XOR с разными ключами
print('\\n🔍 Метод 2: XOR расшифровка')
try:
    data_bytes = base64.b64decode(data_encrypt)
    
    # Ключ 1: signature
    key1 = bytes.fromhex(signature)
    decrypted1 = bytearray()
    for i in range(len(data_bytes)):
        decrypted1.append(data_bytes[i] ^ key1[i % len(key1)])
    
    result1 = decrypted1.decode('utf-8', errors='ignore')
    print(f'XOR with signature: {result1[:100]}...')
    
    # Ключ 2: nonce
    key2 = bytes.fromhex(nonce)
    decrypted2 = bytearray()
    for i in range(len(data_bytes)):
        decrypted2.append(data_bytes[i] ^ key2[i % len(key2)])
    
    result2 = decrypted2.decode('utf-8', errors='ignore')
    print(f'XOR with nonce: {result2[:100]}...')
    
    # Ключ 3: timestamp (первые 16 байт)
    timestamp_bytes = timestamp.encode()[:16]
    decrypted3 = bytearray()
    for i in range(len(data_bytes)):
        decrypted3.append(data_bytes[i] ^ timestamp_bytes[i % len(timestamp_bytes)])
    
    result3 = decrypted3.decode('utf-8', errors='ignore')
    print(f'XOR with timestamp: {result3[:100]}...')
    
    # Проверяем JSON для каждого результата
    for i, result in enumerate([result1, result2, result3], 1):
        try:
            json_data = json.loads(result)
            print(f'✅ JSON парсинг XOR {i} успешен:')
            print(json.dumps(json_data, indent=2))
            break
        except:
            pass
            
except Exception as e:
    print(f'❌ XOR расшифровка не удалась: {e}')

# Метод 3: Анализ hex данных
print('\\n🔍 Метод 3: Анализ hex данных')
try:
    data_bytes = base64.b64decode(data_encrypt)
    hex_data = data_bytes.hex()
    
    print(f'Hex data: {hex_data[:100]}...')
    
    # Ищем повторяющиеся паттерны
    patterns = ['7b', '5b', '22', '766964656f', '737461747573', '7461736b']
    for pattern in patterns:
        if pattern in hex_data:
            print(f'Found pattern {pattern} at position {hex_data.find(pattern)}')
            
except Exception as e:
    print(f'❌ Анализ hex не удался: {e}')

# Метод 4: Попытка с hash ключами
print('\\n🔍 Метод 4: Hash ключи')
try:
    data_bytes = base64.b64decode(data_encrypt)
    
    # Создаем ключи из hash
    key1 = hashlib.sha256(signature.encode()).digest()
    key2 = hashlib.sha256(nonce.encode()).digest()
    key3 = hashlib.sha256(timestamp.encode()).digest()
    
    for i, key in enumerate([key1, key2, key3], 1):
        decrypted = bytearray()
        for j in range(len(data_bytes)):
            decrypted.append(data_bytes[j] ^ key[j % len(key)])
        
        result = decrypted.decode('utf-8', errors='ignore')
        print(f'Hash key {i}: {result[:100]}...')
        
        # Проверяем JSON
        try:
            json_data = json.loads(result)
            print(f'✅ JSON парсинг hash key {i} успешен:')
            print(json.dumps(json_data, indent=2))
            break
        except:
            pass
            
except Exception as e:
    print(f'❌ Hash ключи не удались: {e}')

print('\\n🎯 Простая расшифровка завершена!')
print('Если ни один метод не сработал, данные могут быть зашифрованы с помощью специального ключа от AKOOL.')
"
