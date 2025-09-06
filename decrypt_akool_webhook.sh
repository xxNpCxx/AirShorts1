#!/bin/bash

# AKOOL Webhook Decryption Script
# Попытка расшифровки зашифрованных данных от AKOOL

echo "🔓 AKOOL Webhook Decryption Script"
echo "=================================="

# Данные из webhook (замените на реальные)
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

# Метод 1: Base64 декодирование
echo "🔍 Метод 1: Base64 декодирование"
echo "================================"
echo "$DATA_ENCRYPT" | base64 -d 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Base64 декодирование успешно"
    echo ""
else
    echo "❌ Base64 декодирование не удалось"
    echo ""
fi

# Метод 2: Попытка JSON парсинга
echo "🔍 Метод 2: JSON парсинг Base64"
echo "==============================="
DECODED_BASE64=$(echo "$DATA_ENCRYPT" | base64 -d 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "Decoded: $DECODED_BASE64"
    echo "$DECODED_BASE64" | jq . 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ JSON парсинг успешен"
    else
        echo "❌ JSON парсинг не удался"
    fi
else
    echo "❌ Base64 декодирование не удалось"
fi
echo ""

# Метод 3: XOR с nonce
echo "🔍 Метод 3: XOR с nonce"
echo "======================="
python3 -c "
import base64
import binascii

data_encrypt = '$DATA_ENCRYPT'
nonce = '$NONCE'

try:
    # Декодируем base64
    data_bytes = base64.b64decode(data_encrypt)
    print(f'Data length: {len(data_bytes)} bytes')
    
    # Конвертируем nonce в hex
    nonce_bytes = bytes.fromhex(nonce)
    print(f'Nonce length: {len(nonce_bytes)} bytes')
    
    # XOR расшифровка
    decrypted = bytearray()
    for i in range(len(data_bytes)):
        decrypted.append(data_bytes[i] ^ nonce_bytes[i % len(nonce_bytes)])
    
    result = decrypted.decode('utf-8', errors='ignore')
    print(f'XOR Result: {result}')
    
    # Попробуем JSON парсинг
    import json
    try:
        json_data = json.loads(result)
        print('✅ JSON парсинг XOR результата успешен:')
        print(json.dumps(json_data, indent=2))
    except:
        print('❌ JSON парсинг XOR результата не удался')
        
except Exception as e:
    print(f'❌ XOR расшифровка не удалась: {e}')
"
echo ""

# Метод 4: Попытка с signature как ключ
echo "🔍 Метод 4: Signature как ключ"
echo "=============================="
python3 -c "
import base64
import binascii
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

data_encrypt = '$DATA_ENCRYPT'
signature = '$SIGNATURE'
nonce = '$NONCE'

try:
    # Конвертируем signature в ключ
    key = bytes.fromhex(signature)
    print(f'Key length: {len(key)} bytes')
    
    # Конвертируем nonce в IV
    iv = bytes.fromhex(nonce)
    print(f'IV length: {len(iv)} bytes')
    
    # Декодируем данные
    data_bytes = base64.b64decode(data_encrypt)
    print(f'Data length: {len(data_bytes)} bytes')
    
    # Попробуем AES расшифровку
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted = decryptor.update(data_bytes) + decryptor.finalize()
    
    result = decrypted.decode('utf-8', errors='ignore')
    print(f'AES Result: {result}')
    
    # Попробуем JSON парсинг
    import json
    try:
        json_data = json.loads(result)
        print('✅ JSON парсинг AES результата успешен:')
        print(json.dumps(json_data, indent=2))
    except:
        print('❌ JSON парсинг AES результата не удался')
        
except Exception as e:
    print(f'❌ AES расшифровка не удалась: {e}')
"
echo ""

# Метод 5: Простая замена символов
echo "🔍 Метод 5: Простая замена символов"
echo "=================================="
python3 -c "
import base64
import string

data_encrypt = '$DATA_ENCRYPT'

try:
    # Декодируем base64
    data_bytes = base64.b64decode(data_encrypt)
    print(f'Data length: {len(data_bytes)} bytes')
    
    # Пробуем разные кодировки
    encodings = ['utf-8', 'latin-1', 'cp1252', 'ascii']
    
    for encoding in encodings:
        try:
            result = data_bytes.decode(encoding, errors='ignore')
            print(f'{encoding}: {result[:100]}...')
            
            # Проверяем на JSON
            import json
            try:
                json_data = json.loads(result)
                print(f'✅ JSON парсинг {encoding} успешен:')
                print(json.dumps(json_data, indent=2))
                break
            except:
                pass
        except:
            pass
            
except Exception as e:
    print(f'❌ Замена символов не удалась: {e}')
"
echo ""

echo "🎯 Расшифровка завершена!"
echo "Если ни один метод не сработал, проверьте документацию AKOOL для правильного ключа расшифровки."
