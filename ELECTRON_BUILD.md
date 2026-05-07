# Сборка .exe через Electron

## Требования
- Node.js 18+
- Windows (для сборки .exe)

## Установка зависимостей

```bash
npm install --save-dev electron electron-builder
```

## Сборка

### Шаг 1 — собрать фронтенд с относительными путями
```bash
npx vite build --config vite.electron.config.ts
```

### Шаг 2 — упаковать в .exe
```bash
npx electron-builder --config electron-builder.json --win
```

Готовый установщик будет в папке `dist-electron/`.

## Или одной командой (после добавления в package.json)
```bash
npm run build:electron
```

## Структура файлов Electron
- `electron/main.js` — главный процесс (запуск окна)
- `electron/preload.js` — мост между Electron и React
- `electron-builder.json` — конфиг упаковки
- `vite.electron.config.ts` — Vite конфиг с base: './'

## Автообновление

При каждом запуске `.exe` автоматически проверяет обновления на сервере.
Если вышла новая версия — пользователь увидит диалог с кнопкой "Скачать".

### Как выпустить обновление:
1. Собери новый `.exe`
2. Загрузи его куда-нибудь (Google Drive, Яндекс.Диск, свой сайт)
3. В файле `backend/license/index.py` обнови две строки:
   ```python
   CURRENT_VERSION = "1.1.0"        # новая версия
   DOWNLOAD_URL = "https://..."     # ссылка на скачивание нового .exe
   ```
4. Сохрани — платформа автоматически задеплоит изменения

Пользователи при следующем запуске старого `.exe` получат уведомление.

## Важно
Лицензионные ключи проверяются на сервере — работают в любой оболочке (.exe, APK, браузер).