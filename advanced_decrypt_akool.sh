#!/bin/bash

# Advanced AKOOL Webhook Decryption Script
# Продвинутые методы расшифровки

echo "🔓 Advanced AKOOL Webhook Decryption"
echo "===================================="

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

# Установим cryptography если нужно
echo "🔧 Проверяем зависимости..."
python3 -c "import cryptography" 2>/dev/null || {
    echo "📦 Устанавливаем cryptography..."
    pip3 install cryptography
}

echo ""

# Продвинутая расшифровка с Python
python3 -c "
import base64
import binascii
import hashlib
import hmac
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

data_encrypt = '$DATA_ENCRYPT'
signature = '$SIGNATURE'
timestamp = '$TIMESTAMP'
nonce = '$NONCE'

print('🔍 Продвинутые методы расшифровки')
print('================================')

# Метод 1: HMAC с timestamp
print('\\n🔍 Метод 1: HMAC с timestamp')
try:
    # Создаем ключ из timestamp
    key = hashlib.sha256(timestamp.encode()).digest()
    print(f'Key from timestamp: {key.hex()}')
    
    # Декодируем данные
    data_bytes = base64.b64decode(data_encrypt)
    
    # Попробуем HMAC расшифровку
    hmac_obj = hmac.new(key, data_bytes, hashlib.sha256)
    print(f'HMAC: {hmac_obj.hexdigest()}')
    
except Exception as e:
    print(f'❌ HMAC метод не удался: {e}')

# Метод 2: PBKDF2 с nonce
print('\\n🔍 Метод 2: PBKDF2 с nonce')
try:
    # Используем nonce как salt
    salt = bytes.fromhex(nonce)
    password = signature.encode()
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    key = kdf.derive(password)
    print(f'PBKDF2 key: {key.hex()}')
    
    # Декодируем данные
    data_bytes = base64.b64decode(data_encrypt)
    
    # Попробуем AES расшифровку
    iv = data_bytes[:16]
    ciphertext = data_bytes[16:]
    
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted = decryptor.update(ciphertext) + decryptor.finalize()
    
    result = decrypted.decode('utf-8', errors='ignore')
    print(f'PBKDF2 Result: {result}')
    
    # Проверяем JSON
    try:
        json_data = json.loads(result)
        print('✅ JSON парсинг PBKDF2 успешен:')
        print(json.dumps(json_data, indent=2))
    except:
        print('❌ JSON парсинг PBKDF2 не удался')
        
except Exception as e:
    print(f'❌ PBKDF2 метод не удался: {e}')

# Метод 3: Простой XOR с разными ключами
print('\\n🔍 Метод 3: XOR с разными ключами')
try:
    data_bytes = base64.b64decode(data_encrypt)
    
    # Ключ 1: signature
    key1 = bytes.fromhex(signature)
    decrypted1 = bytearray()
    for i in range(len(data_bytes)):
        decrypted1.append(data_bytes[i] ^ key1[i % len(key1)])
    
    result1 = decrypted1.decode('utf-8', errors='ignore')
    print(f'XOR with signature: {result1[:100]}...')
    
    # Ключ 2: nonce повторенный
    key2 = (nonce * (len(data_bytes) // len(nonce) + 1))[:len(data_bytes)]
    key2_bytes = key2.encode()
    decrypted2 = bytearray()
    for i in range(len(data_bytes)):
        decrypted2.append(data_bytes[i] ^ key2_bytes[i % len(key2_bytes)])
    
    result2 = decrypted2.decode('utf-8', errors='ignore')
    print(f'XOR with nonce: {result2[:100]}...')
    
    # Ключ 3: комбинация signature + nonce
    combined_key = signature + nonce
    key3 = (combined_key * (len(data_bytes) // len(combined_key) + 1))[:len(data_bytes)]
    key3_bytes = key3.encode()
    decrypted3 = bytearray()
    for i in range(len(data_bytes)):
        decrypted3.append(data_bytes[i] ^ key3_bytes[i % len(key3_bytes)])
    
    result3 = decrypted3.decode('utf-8', errors='ignore')
    print(f'XOR with combined: {result3[:100]}...')
    
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
    print(f'❌ XOR методы не удались: {e}')

# Метод 4: Анализ паттернов
print('\\n🔍 Метод 4: Анализ паттернов')
try:
    data_bytes = base64.b64decode(data_encrypt)
    
    # Ищем повторяющиеся паттерны
    print(f'Data length: {len(data_bytes)} bytes')
    print(f'First 20 bytes: {data_bytes[:20].hex()}')
    print(f'Last 20 bytes: {data_bytes[-20:].hex()}')
    
    # Ищем возможные JSON маркеры
    json_markers = [b'{', b'[', b'"', b'video', b'status', b'task']
    for marker in json_markers:
        if marker in data_bytes:
            print(f'Found marker {marker}: {data_bytes.find(marker)}')
            
except Exception as e:
    print(f'❌ Анализ паттернов не удался: {e}')

print('\\n🎯 Продвинутая расшифровка завершена!')
"
