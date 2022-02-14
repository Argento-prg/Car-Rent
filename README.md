#1 установка зависимостей
npm i

#2 запуск БД PostgreSQL, создание БД по настройкам из файла ./src/db/connection.ts

#3 сброс таблиц БД через файл ./schema/init_down.sql

#4 создание таблиц БД через файл ./schema/init_up.sql

#5 заполнение таблиц константными значениями через файла ./schema/set_constants.sql

#6 сборка проекта
npm run build

#7 запуск приложения
npm run start:prod


