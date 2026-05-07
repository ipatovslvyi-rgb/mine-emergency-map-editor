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

## Важно
Лицензионные ключи проверяются на сервере — работают в любой оболочке (.exe, APK, браузер).
