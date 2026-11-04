# TABLETNICA: данные и контракт клиента с сервером

Дата исследования: 26 октября 2026; сверка и объединение кода: 4 ноября 2026. Это карта существующей системы и требований к интеграции, а не заявление о готовности всех API.

## Источники и границы достоверности

1. Описание 14 таблиц, предоставленное владельцем проекта 26 октября, — согласованная предметная основа, составленная по models.py, кроме корневого src/models.py.
2. Объединены GitHub master 518afe1 и website-design 71003df (одинаковое содержимое) с локальными исправлениями, сохранёнными в 4683e3c. В объединённом коде используются cell_configs, pillbox_assignments и schedule_times; словарь ниже сохраняет исходные названия из описания владельца.
3. database.sql — отдельная, отличающаяся версия схемы. Его нельзя автоматически применять вместо моделей.
4. Серверная MySQL не изучена напрямую: попытка чтения information_schema завершилась OperationalError 2013. Ни структуру, ни записи серверной БД не меняли. Типы/ограничения ниже не подтверждают фактический DDL сервера.

Для сверки подготовлен [inspect_database_schema.sql](inspect_database_schema.sql): только SELECT метаданных, без персональных записей, хешей паролей или токенов. Выполнить в MySQL-клиенте с доступом к tabletnica и сохранить результаты. Нужны реальные типы, NULL/default, индексы и FK; содержание медицинских записей для проектирования контракта не требуется.

## Полный словарь по описанию владельца

Все id — первичные ключи, создаваемые сервером/БД. Числа в скобках у String — максимальная длина. Nullable ниже указан только там, где явно указан в описании; отсутствие отметки нельзя считать доказательством NOT NULL серверной таблицы. created_at/updated_at, если не оговорено иначе, формирует сервер.

| Таблица | Колонки и смысл |
| --- | --- |
| users | id int; username String(50); password_hash String(255); full_name String(100); role admin/elder_nurse/nurse; active bool; created_at, updated_at datetime. Сотрудники, не пациенты. |
| patients | id int; full_name String(100); room_number, bed_number String(50); status active/archive/discharged; created_at, updated_at datetime. Палата и койка — строки, возможны буквенные обозначения. |
| pillboxes | id int; serial_number String(50); device_token_hash String(255); status available/offline/assigned/maintenance/active/error; last_seen_at, created_at, updated_at datetime. В этой модели нет отдельного названия и модели устройства. |
| cells | id int; pillbox_id FK→pillboxes; cell_number int; status free/configured/active/waiting/opened/missed/completed/error; created_at datetime. cell_number — номер 1–9, не глобальный id ячейки. |
| pillboxes_assignments | id int; pillbox_id FK→pillboxes; patient_id FK→patients; assigned_by FK→users; baseline_weight DECIMAL; status active/completed; assigned_at, unassigned_at datetime. История передач, не поле пациента в устройстве. |
| prescriptions | id int; patient_id FK→patients; entered_by FK→users; source_type paper/import/manual; source_document_number int; prescribed_by String(100); status new/pending_setup/configured/active/paused/completed; created_at, updated_at datetime. prescribed_by — ФИО врача, entered_by — сотрудник, внёсший документ. |
| prescriptions_items | id int; prescription_id FK→prescriptions; drug_name, dosage String(255); quantity DECIMAL; dosage_form String(50); start_date, end_date Date; status new/pending_setup/configured/active/paused/completed; external_drug_id, drug_source String(45); created_at, updated_at datetime. Один документ содержит несколько препаратов. |
| cells_configs | id int; cell_id FK→cells; assignment_id nullable FK→pillboxes_assignments; prescription_item_id FK→prescriptions_items; baseline_weight DECIMAL; status active/configured/completed; configured_at, loaded_at datetime. Историческая загрузка препарата в физическую ячейку. |
| schedules | id BigInteger; schedule_type specific_times/interval; interval_minutes Integer; anchor_at DateTime; start_date, end_date Date; status active/paused/completed. В описании cell_config_id закомментирован; в GitHub от 24 октября FK уже восстановлен. |
| scheduleTimes | id int; schedule_id FK→schedules; time_of_day Time. Несколько строк для нескольких конкретных времён. В GitHub от 24 октября таблица переименована в schedule_times. |
| events | id int; pillbox_id FK→pillboxes; cell_config_id nullable FK→cells_configs; cell_id FK→cells; user_id FK→users; event_type (см. ниже); last_seen_at, created_at, updated_at datetime. В итоговой GitHub-модели 71003df отдельного patient_id нет; историю пациента нужно связывать через конфигурацию и назначение таблетницы. |
| alerts | id int; patient_id nullable FK→patients; pillbox_id nullable FK→pillboxes; event_id nullable FK→events; alert_type content_not_removed/device_offline/device_error/course_completed; priority low/medium/high/critical; status new/viewed/resolved; config_version Integer; created_at, acknowledged_at datetime; acknowledged_by nullable FK→users. |
| devices_configs | id int; pillbox_id FK→pillboxes; config_version Integer; payload JSON; status created/sent/acknowledged/error; sent_at, acknowledged_at datetime. Отправленная версия должна оставаться неизменной для сверки ACK. |
| weight_measurements | id int; event_id FK→events; cell_config_id FK→cells_configs; weight_before, weight_after, weight_delta DECIMAL; content_removed bool; measured_at datetime. Факт удаления содержимого, не доказательство проглатывания препарата. |

event_type: DEVICE_CONNECTED, DEVICE_REBOOT, SYNC_STARTED, SYNC_COMPLETED, CONFIG_ACKNOWLEDGED, DOSE_TAKEN, MISSED_DOSE, CELL_OPENED, ERROR.

Связь пациента с историческим событием должна определяться по сохранённому patient_id либо через cells_configs → pillboxes_assignments. Нельзя брать текущего владельца таблетницы: после передачи другому пациенту история станет неверной.

## Отличия источников, которые нельзя скрывать адаптером

| Область | Описание/models | Старый database.sql | Решение перед подключением |
| --- | --- | --- | --- |
| Активность пользователя | active | is_active | Сверить сервер; SQLAlchemy может явно отобразить имя колонки, API сохраняет active. |
| Устройство | serial_number; нет model/name | serial_num, model_version | Не записывать model/name в serial_number или token. Нужны отдельные согласованные колонки либо отказ от этих полей в реальном режиме. |
| Передачи | pillboxes_assignments, есть baseline_weight | pillbox_assignments, нет этого веса | Проверить назначение обоих baseline_weight; вес ячейки хранить в cells_configs. |
| Документ | prescribed_by String(100), номер int | prescribed_at VARCHAR(100), номер VARCHAR(45) | Основной контракт — prescribed_by. Не считать prescribed_at датой по одному названию. |
| Позиция | prescription_id, dosage 255, dosage_form 50, DECIMAL без precision | prescriptions_id, dosage 50, dosage_form 45, DECIMAL(5,2) | Реальный precision/scale и длины обязательны до настройки окончательных ограничений API. |
| Конфигурация ячейки | cells_configs, cell_id; нет configured_by | cell_configurations, Cell_id, configured_by | Аудит автора настройки сейчас не обеспечен одинаково в источниках. |
| Время | scheduleTimes/schedule_times, schedule_id | schedule_times, schedules_id | Согласовать имя таблицы и FK; регистр значим в некоторых MySQL-окружениях. |
| Конфигурации устройства | devices_configs | device_configs | Сверить фактическое имя. |
| Событие | last_seen_at/created_at/updated_at; в новом GitHub patient_id | event_time/synced_at/payload, нет patient_id | Согласовать время самого события и время синхронизации; не подменять их друг другом. |
| Уведомления | config_version есть | config_version отсутствует | Не требовать колонку, пока сервер не проверен. |

Также локальные правки вводят user_sessions и prescription_item_plans. Это расширения, отсутствующие в предоставленных 14 таблицах. Они НЕ считаются подтверждёнными частями вашей БД. Их нельзя автоматически создавать на сервере или объявлять существующими. Для user_sessions нужно согласовать стратегию сессий; для plans — место хранения расписания до назначения ячейки.

## Правила клиент → API → БД

Клиент передаёт пользовательский ввод и ID выбранных сущностей. Сервер валидирует схему, проверяет права и связи, выполняет транзакцию и возвращает DTO. Нельзя передавать всю ORM-модель в обе стороны.

| Значение | Источник | Правило |
| --- | --- | --- |
| id, created_at, updated_at | БД/сервер | Не доверять значениям из формы. |
| entered_by, assigned_by, acknowledged_by | Серверная сессия | Клиент не может назначить автором другого сотрудника. |
| prescribed_by | Форма назначения | ФИО врача, не user_id. UI doctor_name допускается только как явно поддерживаемый legacy alias. |
| status | Разрешённое действие | Валидация enum и перехода; нельзя отправить произвольный статус ACTIVE. |
| password, device token | Только запрос создания/входа | Сервер хеширует; ни секрет, ни хеш не возвращаются в списке/карточке. |
| baseline_weight, веса, last_seen_at, ACK | Подтверждённая телеметрия/сервер | Браузер не объявляет устройство online и не имитирует ACK в реальном режиме. |
| quantity, вес | Decimal в backend | Precision/scale подтверждаются по серверу. Не округлять молча; отклонять непредставимое значение до INSERT. |
| Date | YYYY-MM-DD | Не превращать дату курса в UTC timestamp. |
| Time | HH:MM[:SS] | Для UI HH:MM; часовой пояс должен быть явно согласован для расписания. |
| Момент времени | ISO 8601 с offset | Backend нормализует по согласованной политике. MySQL DATETIME сам не хранит часовой пояс. |
| пустое необязательное поле | null | Не посылать пустую строку в date/int/FK; mandatory поле не подменять 0. |

Текущий интерфейс показывает московское время. Это политика UI, а не подтверждённая timezone старых записей MySQL. До подключения истории нужно установить, как записаны существующие DATETIME.

## Карта операций

### Пациент

POST /patients/add: `{full_name, room_number, bed_number, status}`. Только эти поля; ID и timestamps возвращает сервер. Значения status по модели: active/discharged/archive. Сейчас frontend поддерживает создание active/discharged, это не отменяет archive в БД. Текущие лимиты формы палаты/койки 20 строже моделей 50; окончательное расширение — после сверки сервера.

Активная койка не должна одновременно занимать двух пациентов, если это правило отделения. Проверка в одном frontend недостаточна: нужен атомарный серверный механизм. Выписка должна учитывать действующие передачи; физическое удаление пациента с историей не является заменой выписки.

### Документ назначения

Канонический запрос реализуемого локального контракта:

```json
{
  "patient_id": 12,
  "prescribed_by": "ФИО врача",
  "items": [{
    "drug_name": "Название препарата",
    "dosage": "100 мг",
    "quantity": 1,
    "start_date": "2026-10-26",
    "end_date": null,
    "comment": "Комментарий",
    "schedule": {"schedule_type": "SPECIFIC_TIME", "specific_times": ["08:00", "20:00"]}
  }]
}
```

POST /frontend/v1/prescriptions в локальном коде атомарно создаёт документ и позиции; /prescriptions/add принимает этот формат для совместимости, сохраняя прежний формат документа. doctor_name — временный alias prescribed_by; разные значения обоих полей одновременно отклоняются. Автор берётся из сессии.

Нельзя устранить 422, просто отбросив items/schedule/comment и отправив только обязательные поля заголовка: это потеря назначения. Номер документа — отдельный пользовательский реквизит; не подставлять вместо него ID пациента, время или выдуманный 0.

В 14 таблицах отсутствует прямой путь от prescriptions_items к schedules до создания cells_configs. Поэтому сохранение расписания на этапе документа требует согласованного изменения схемы либо переноса выбора расписания на этап загрузки ячейки. Локальная prescription_item_plans — предложенное решение этой проблемы, а не существующая серверная таблица. Комментарий препарата также не имеет колонки в описанной модели.

### Регистрация таблетницы

В подтверждённой модели есть serial_number, device_token_hash и status, но нет device_id (названия) и model. Сейчас форма поддерживает эти поля в mocks. До реального POST нужно согласовать хранение названия/модели. Не терять введённые значения молча.

Регистрация должна атомарно создать устройство и девять cells с номерами 1–9. Сервер проверяет уникальность serial_number и пары (pillbox_id, cell_number). Новое устройство не является assigned/active без связанной передачи и конфигурации. Реальный online вычисляется из связи, не из галочки деморежима.

### Передача, настройка и заполнение

1. Передача: клиент выбирает pillbox_id и patient_id; сервер проверяет активного пациента и отсутствие другой активной передачи, блокирует конкурирующие изменения, пишет pillboxes_assignments и обновляет status устройства одной транзакцией.
2. Настройка: номер ячейки в URL не равен cell_id. Сервер находит cells по pillbox_id + cell_number, сверяет принадлежность препарата пациенту через документ и передачу, затем создаёт конфигурацию.
3. Конкретные времена: SPECIFIC_TIME из UI → specific_times в БД; каждое время → отдельная строка schedule_times. INTERVAL → interval + положительный interval_minutes + anchor_at. Не сохранять одновременно два режима как действующие.
4. Подтверждение: версия devices_configs назначается сервером; payload содержит снимок всех 9 ячеек. created ≠ sent ≠ acknowledged. Реальное измерение веса не заменяется вычислением по дозировке.
5. Освобождение: физическая cells остаётся; историческая конфигурация и события сохраняются. Удаление ячейки или старого назначения не является очисткой содержимого.

### История и уведомления

DTO истории объединяет events + weight_measurements + cells_configs + передачу. occurred_at нельзя произвольно брать из last_seen_at: назначение полей времени должно быть подтверждено.

DOSE_TAKEN может отображаться как COLLECTED («препарат забран»), MISSED_DOSE — как NOT_COLLECTED. Это UI-термины, не новые значения enum БД. Точный смысл событий должен совпадать с прошивкой.

Для уведомлений UI reviewed → БД viewed; resolved — отдельное состояние, не синоним просмотра. UI severity warning/error не равен priority low/medium/high/critical: нужна явная таблица отображения, исходный priority сохраняется. Generic device_error нельзя автоматически называть WEIGHT_ERROR без сведений о типе ошибки. description формируется из доступных событий/контекста; такой колонки в alerts нет.

## Что проверять контрактными тестами

- Реальный JSON формы проходит backend-схему; неправильные значения дают 422 с указанием поля.
- Две позиции и оба режима расписания сохраняются и читаются отдельным GET без потери данных.
- При ошибке второй позиции не остаётся заголовок или первая позиция; автор определяется сервером.
- DTO не содержит password_hash/device_token_hash/session token.
- Проверяются 401/403, отсутствующие записи 404, конфликты 409, nullable и enum.
- Конкурентная передача/занятие койки проверяются на MySQL, а не только в mocks.
- Тесты на SQLite и компиляция DDL не доказывают совместимость с живым MySQL-дампом.

## Порядок дальнейшей интеграции

Получить metadata сервера → сверить с этой картой и новыми GitHub-коммитами → согласовать недостающие поля/связи → подготовить проверяемые миграции на копии БД → реализовать DTO/операции и контрактные тесты → включать экраны в API-режиме по мере готовности. Новые таблицы и изменения серверной схемы не применять автоматически.
