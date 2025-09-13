// Простой тест для проверки улучшенного логгера
import { CustomLoggerService } from './dist/logger/logger.service.js';

const logger = new CustomLoggerService();

console.log('=== Тест улучшенного логгера ===\n');

// Тест 1: Обычный лог
logger.log('Это тестовое сообщение', 'TestContext');

// Тест 2: Debug лог  
logger.debug('Это debug сообщение', 'TestContext');

// Тест 3: Error лог
logger.error('Это error сообщение', 'TestContext');

// Тест 4: Warn лог
logger.warn('Это warn сообщение', 'TestContext');

console.log('\n=== Конец теста ===');
