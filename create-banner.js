const fs = require('fs');
const path = require('path');

// Создаем простое SVG изображение с линией
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
  <!-- Фон -->
  <rect width="400" height="100" fill="#f0f0f0"/>
  
  <!-- Простая линия -->
  <line x1="50" y1="50" x2="350" y2="50" stroke="#333333" stroke-width="2"/>
  
  <!-- Дополнительные декоративные элементы -->
  <circle cx="50" cy="50" r="3" fill="#333333"/>
  <circle cx="350" cy="50" r="3" fill="#333333"/>
</svg>`;

// Создаем папку images если её нет
const imagesDir = path.join(__dirname, 'src', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('📁 Создана папка src/images/');
}

// Сохраняем SVG файл
const svgPath = path.join(imagesDir, 'banner.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('✅ Создан SVG файл:', svgPath);

// Создаем также простой текстовый файл для информации
const infoContent = `# Banner Info

Этот файл содержит минимальный баннер для reply-клавиатуры.

## Как использовать:

1. banner.svg - векторное изображение с простой линией
2. Можно заменить на любое другое изображение (JPG, PNG)
3. Рекомендуемые размеры: 400x100 или больше

## Если нужен JPG:

Можно использовать онлайн конвертер SVG → JPG или добавить свое изображение.
`;

fs.writeFileSync(path.join(imagesDir, 'README.txt'), infoContent);
console.log('📝 Создан файл с информацией');

console.log('\n🎉 Готово! Файлы созданы в src/images/');
console.log('💡 Теперь переименуйте banner.svg в banner.jpg или добавьте свое изображение');
