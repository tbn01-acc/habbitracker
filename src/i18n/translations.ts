export type Language = 'ru' | 'en' | 'es';

export const translations = {
  ru: {
    // Pomodoro time tracking
    assignTimeToTask: 'Привязать время к задаче',
    pomodoroSessionCompleted: 'Сессия Помодоро завершена',
    skip: 'Пропустить',
    assign: 'Привязать',
    
    // Greetings
    goodNight: 'Доброй ночи',
    goodMorning: 'Доброе утро',
    goodAfternoon: 'Добрый день',
    goodEvening: 'Добрый вечер',
    
    // Stats
    completedToday: 'Сегодня выполнено',
    greatJob: '🎉 Отличная работа!',
    streak: 'Серия',
    week: 'Неделя',
    habits: 'Привычки',
    
    // Views
    calendar: 'Календарь',
    progress: 'Прогресс',
    myHabits: 'Мои привычки',
    
    // Empty state
    startBuilding: 'Начните формировать привычки',
    createFirst: 'Создайте свою первую привычку и начните путь к лучшей версии себя',
    createHabit: 'Создать привычку',
    
    // Dialog
    newHabit: 'Новая привычка',
    editHabit: 'Редактировать привычку',
    habitName: 'Название привычки',
    habitNamePlaceholder: 'Например: Читать книгу',
    icon: 'Иконка',
    color: 'Цвет',
    targetDays: 'Целевые дни',
    save: 'Сохранить',
    cancel: 'Отмена',
    
    // Delete dialog
    deleteHabit: 'Удалить привычку?',
    deleteDescription: 'Привычка будет удалена вместе со всей историей. Это действие нельзя отменить.',
    delete: 'Удалить',
    
    // Days (short)
    sun: 'Вс',
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',
    sat: 'Сб',
    
    // Period
    days7: '7 дней',
    days14: '14 дней',
    days30: 'Месяц',
    
    // Share
    inviteFriend: 'Пригласить',
    share: 'Поделиться',
    linkCopied: 'Ссылка скопирована!',
    shareTitle: 'HabitFlow - Трекер привычек',
    shareText: 'Отслеживай свои привычки вместе со мной!',
    
    // Calendar
    habit: 'Привычка',
    noHabitsToShow: 'Нет привычек для отображения',
    
    // Progress
    dailyProgress: 'Ежедневный прогресс',
    completedTasks: 'Выполнено',
    averageCompletion: 'Среднее выполнение',
    totalCompleted: 'Всего выполнено',
    
    // Language
    language: 'Язык',
    
    // Habit card
    thisWeek: 'на этой неделе',
    edit: 'Редактировать',

    // Dashboard
    yourDay: 'Твой день',
    habitsDone: 'Выполнено привычек',
    tasksDone: 'Выполнено задач',
    financeBalance: 'Баланс операций',
    exercisesDone: 'Выполнено упражнений',
    todoToday: 'Сделать сегодня',
    recoveryDay: 'Восстановительный день - займитесь другими делами',
    completed: 'выполнено',
    toDo: 'сделать',
    habitsLabel: 'Привычек',
    tasksLabel: 'Задач',
    operationsLabel: 'Операций',
    exercisesLabel: 'Упражнений',
    home: 'Домой',
    profile: 'Профиль',
    profileSettings: 'Настройки профиля',
    guest: 'Гость',
    profileDescription: 'Войдите в аккаунт для синхронизации данных между устройствами',

    // Navigation
    tasks: 'Задачи',
    finance: 'Финансы',
    fitness: 'Фитнес',
    new: 'Новая',
    task: 'Задача',
    transaction: 'Операция',
    workout: 'Тренировка',

    // Tasks
    taskTracker: 'Трекер задач',
    startTasks: 'Начните планировать задачи',
    createFirstTask: 'Создайте свою первую задачу и организуйте свой день',
    createTask: 'Создать задачу',
    newTask: 'Новая задача',
    editTask: 'Редактировать задачу',
    deleteTask: 'Удалить задачу?',
    deleteTaskDescription: 'Задача будет удалена. Это действие нельзя отменить.',
    taskName: 'Название задачи',
    taskNamePlaceholder: 'Например: Позвонить врачу',
    dueDate: 'Срок выполнения',
    priority: 'Приоритет',
    priorityLow: 'Низкий',
    priorityMedium: 'Средний',
    priorityHigh: 'Высокий',
    overdue: 'Просрочено',
    today: 'Сегодня',
    statusNotStarted: 'Не начато',
    statusInProgress: 'В процессе',
    statusDone: 'Готово',
    status: 'Статус',
    filters: 'Фильтры',
    clearFilters: 'Сбросить',
    tagsLabel: 'Теги',
    totalTasks: 'Всего задач',
    completionRate: 'Выполнено',
    byCategory: 'По категориям',
    byPriority: 'По приоритету',
    byStatus: 'По статусу',
    uncategorized: 'Без категории',
    noTasksForDay: 'Нет задач',
    addCategory: 'Добавить категорию',
    addTag: 'Добавить тег',
    taskSettings: 'Настройки задач',
    categoriesLabel: 'Категории',
    noCategoriesYet: 'Категорий пока нет',
    noTagsYet: 'Тегов пока нет',
    categoryNamePlaceholder: 'Название категории',
    tagNamePlaceholder: 'Название тега',
    overdueTasksNotification: 'Просроченные задачи',
    overdueTasksCount: 'У вас {count} просроченных задач',
    highPriorityNotification: 'Важные задачи на сегодня',
    highPriorityCount: '{count} задач с высоким приоритетом',
    recurrence: 'Повторение',
    recurrenceNone: 'Нет',
    recurrenceDaily: 'Ежедневно',
    recurrenceWeekly: 'Еженедельно',
    recurrenceMonthly: 'Ежемесячно',
    reminder: 'Напоминание',
    reminderEnabled: 'Вкл',
    reminderDisabled: 'Выкл',
    
    // Subtasks and attachments
    subtasks: 'Подзадачи',
    addSubtask: 'Добавить подзадачу',
    subtaskPlaceholder: 'Название подзадачи',
    taskNotes: 'Заметки',
    notesPlaceholder: 'Добавьте заметки к задаче...',
    attachments: 'Вложения',
    addNote: 'Заметка',
    addFile: 'Файл',
    noteTitle: 'Заголовок',
    noteContent: 'Содержание',
    downloadFile: 'Скачать файл',
    
    // Notification settings
    notificationSettings: 'Настройки уведомлений',
    advanceNotification: 'Уведомлять заранее',
    minutes5: '5 мин',
    minutes15: '15 мин',
    minutes30: '30 мин',
    hour1: '1 час',
    hours2: '2 часа',
    day1: '1 день',
    
    // Renamed trackers
    myTasks: 'Мои задачи',
    myFinance: 'Мои финансы',
    myFitness: 'Мой фитнес',
    
    // Productivity stats
    productivity: 'Продуктивность',
    productivityStats: 'Статистика продуктивности',
    productivityTrend: 'Тренд продуктивности',
    activityByDay: 'Активность по дням',
    activityDistribution: 'Распределение активности',
    planned: 'запланировано',
    average: 'в среднем',
    month: 'Месяц',
    quarter: 'Квартал',
    year: 'Год',
    growthVsPrevious: 'к прошлому периоду',
    
    // Achievements
    achievements: 'Достижения',
    achievementsEarned: 'достижений получено',
    months1: '1 месяц',
    months3: '3 месяца',
    months6: '6 месяцев',
    months12: '12 месяцев',
    newAchievement: 'Новое достижение!',
    achievementUnlocked: 'Вы получили награду',
    shareAchievement: 'Поделиться достижением',
    
    // Settings
    habitSettings: 'Настройки привычек',
    financeSettings: 'Настройки финансов',
    fitnessSettings: 'Настройки фитнеса',

    // Finance
    financeTracker: 'Трекер финансов',
    startFinance: 'Начните отслеживать финансы',
    createFirstTransaction: 'Создайте свою первую операцию',
    createTransaction: 'Создать операцию',
    income: 'Доход',
    expense: 'Расход',
    amount: 'Сумма',
    category: 'Категория',
    yesterday: 'Вчера',
    noTransactionsForDay: 'Нет операций',
    balanceDynamics: 'Динамика баланса',
    expenseByCategory: 'Расходы по категориям',
    noExpensesForPeriod: 'Нет расходов за период',
    transactions: 'Операции',

    // Fitness
    fitnessTracker: 'Фитнес трекер',
    startFitness: 'Начните тренироваться',
    createFirstWorkout: 'Создайте свою первую тренировку',
    createWorkout: 'Создать тренировку',
    exercises: 'Упражнения',
    sets: 'Подходы',
    reps: 'Повторения',
    duration: 'Длительность',
    scheduledDays: 'Дни тренировок',
    workoutsCount: 'тренировок',
    deleteWorkout: 'Удалить тренировку?',
    deleteWorkoutDescription: 'Тренировка будет удалена. Это действие нельзя отменить.',
    exerciseCompleted: 'Упражнение выполнено',
    notStarted: 'Не начато',
    inProgress: 'В процессе',
    exercisesCount: 'Упражнений',
    total: 'всего',
    totalSets: 'Всего подходов',
    setsCompleted: 'выполнено',
    dailyActivity: 'Активность по дням',
    exerciseCategories: 'Категории упражнений',
    exerciseCategoriesLabel: 'Упражнения',
    addExerciseCategory: 'Добавить категорию упражнений',
    exerciseCategoryPlaceholder: 'Название категории',
    noExerciseCategoriesYet: 'Категорий упражнений пока нет',
    weight: 'Вес (кг)',
    targetSets: 'Цель подходов',
    targetReps: 'Цель повторений',
    workoutHistory: 'История тренировок',
    noWorkoutsForDay: 'Нет тренировок за этот день',
    set: 'Подход',
    exportData: 'Данные экспортированы',
    exportHistory: 'Экспорт истории',
    exportWorkouts: 'Экспорт тренировок',
    
    // Rest Timer
    restTimer: 'Таймер отдыха',
    timerDuration: 'Длительность таймера',
    seconds: 'секунд',
    
    // Weight Progress
    weightProgress: 'Прогресс по весам',
    noWeightData: 'Нет данных о весах',
    startLoggingWeights: 'Начните записывать веса в тренировках',
    selectExercise: 'Выберите упражнение',
    maxWeight: 'Макс. вес',
    avgWeight: 'Средний вес',
    totalVolume: 'Общий объём',
    noDataForExercise: 'Нет данных для этого упражнения',
    selectExerciseToSeeProgress: 'Выберите упражнение для просмотра прогресса',
    
    // Workout Templates
    workoutTemplates: 'Шаблоны тренировок',
    myTemplates: 'Мои шаблоны',
    saveAsTemplate: 'Сохранить как шаблон',
    noTemplatesYet: 'Шаблонов пока нет',
    saveWorkoutAsTemplate: 'Сохраните тренировку как шаблон для быстрого копирования',
    templateSaved: 'Шаблон сохранён',
    workoutCreatedFromTemplate: 'Тренировка создана из шаблона',
    selectWorkout: 'Выберите тренировку',
    templateName: 'Название шаблона',
    templateNamePlaceholder: 'Например: Моя силовая',
    saveTemplate: 'Сохранить шаблон',

    // Share Workout
    shareWorkout: 'Поделиться тренировкой',
    shareWorkoutInvite: 'Присоединяйся к тренировкам в HabitFlow!',
    myResults: 'Мои результаты',
    copied: 'Скопировано',
    copyToClipboard: 'Копировать',
    copyFailed: 'Не удалось скопировать',
    inviteFriendToApp: 'Пригласить в приложение',
    setsCount: 'подходов',

    // Calendar Planning
    schedulingMode: 'Режим планирования',
    byWeekdays: 'По дням недели',
    bySpecificDates: 'На конкретные даты',
    scheduledDates: 'Запланированные даты',
    addDate: 'Добавить дату',
    noScheduledDates: 'Нет запланированных дат',

    // Auth
    signIn: 'Войти',
    signUp: 'Регистрация',
    welcomeBack: 'С возвращением!',
    createAccount: 'Создайте аккаунт',
    orContinueWith: 'или продолжить с',
    displayName: 'Имя пользователя',
    displayNamePlaceholder: 'Ваше имя',
    password: 'Пароль',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?',
    error: 'Ошибка',
    success: 'Успешно',
    invalidEmail: 'Введите корректный email',
    passwordTooShort: 'Пароль должен быть не менее 6 символов',
    invalidCredentials: 'Неверный email или пароль',
    emailAlreadyRegistered: 'Этот email уже зарегистрирован',
    checkEmail: 'Проверьте почту для подтверждения',
    signOut: 'Выйти',
    
    // Services
    services: 'Сервисы',
    myServices: 'Мои сервисы',
    pomodoroTimer: 'Помодоро',
    timeTracker: 'Учёт времени',
    notes: 'Заметки',
    currencyRates: 'Курсы валют',
    dateCalculator: 'Калькулятор дат',
    habitCounters: 'Счётчики',
    randomDecision: 'Генератор решений',
    worldTime: 'Мировое время',
    checklists: 'Чек-листы',
    unitConverter: 'Конвертер',
    
    // Pomodoro
    work: 'Работа',
    shortBreak: 'Короткий перерыв',
    longBreak: 'Длинный перерыв',
    sessionsToday: 'Сессий сегодня',
    pomodorosCompleted: 'Помодоро выполнено',
    pomodoroSettings: 'Настройки Помодоро',
    workDuration: 'Длительность работы',
    shortBreakDuration: 'Короткий перерыв',
    longBreakDuration: 'Длинный перерыв',
    sessionsBeforeLongBreak: 'Сессий до длинного перерыва',
    autoStartBreaks: 'Автозапуск перерывов',
    autoStartPomodoros: 'Автозапуск помодоро',
    
    // Time Tracker
    selectTask: 'Выберите задачу',
    noActiveTasks: 'Нет активных задач',
    wholeTask: 'Вся задача',
    stop: 'Стоп',
    start: 'Старт',
    todayTime: 'Сегодня',
    noTimeEntriesYet: 'Записей ещё нет',
    
    // Notes
    noNotesYet: 'Заметок пока нет',
    createNote: 'Создать заметку',
    editNote: 'Редактировать',
    newNote: 'Новая заметка',
    
    // Currency
    currencyInfo: 'Данные от ЦБ РФ',
    updated: 'Обновлено',
    
    // Date Calculator
    startDate: 'Начальная дата',
    endDate: 'Конечная дата',
    daysBetween: 'Дней между датами',
    addDays: 'Добавить дней',
    resultDate: 'Результат',
    
    // Habit Counters
    water: 'Вода',
    steps: 'Шаги',
    cups: 'стаканов',
    goal: 'Цель',
    resetCounter: 'Сбросить',
    
    // Random Decision
    addOption: 'Добавить вариант',
    optionPlaceholder: 'Вариант...',
    decide: 'Решить!',
    result: 'Результат',
    noOptions: 'Добавьте варианты',
    
    // World Time
    addTimezone: 'Добавить часовой пояс',
    selectTimezone: 'Выберите часовой пояс',
    
    // Checklists
    noChecklistsYet: 'Чек-листов пока нет',
    createChecklist: 'Создать чек-лист',
    checklistName: 'Название чек-листа',
    addItem: 'Добавить пункт',
    resetChecklist: 'Сбросить',
    
    // Unit Converter
    length: 'Длина',
    mass: 'Масса',
    temperature: 'Температура',
    from: 'Из',
    to: 'В',
    
    // Export
    exportToPdf: 'Экспорт в PDF',
    exportToCsv: 'Экспорт в CSV',
    exportSuccess: 'Данные экспортированы',
    
    // Time Tracker in Tasks
    startTimer: 'Запустить таймер',
    stopTimer: 'Остановить',
    timeSpent: 'Затрачено времени',
    timeByTask: 'Время по задачам',
    totalTimeSpent: 'Всего затрачено',
    noTimeData: 'Нет данных о времени',
    
    // Dashboard widgets
    widgetSettings: 'Настройки виджетов',
    quickAccess: 'Быстрый доступ',
    allServices: 'Все сервисы',
    avgPerDay: 'В среднем/день',
    topTask: 'Топ задача',
    pause: 'Пауза',
    
    // Notifications
    habitsReminder: 'Привычки на сегодня',
    habitsToComplete: 'привычек ждут выполнения',
    streakCelebration: 'Отличная серия!',
    longestStreak: 'Лучшая серия',
    days: 'дней',
    dataSynced: 'Данные синхронизированы',
    syncSuccess: 'Все данные успешно сохранены в облако',
    syncError: 'Ошибка синхронизации',
    syncFailed: 'Не удалось синхронизировать данные',
    syncData: 'Синхронизировать',
    lastSync: 'Последняя синхронизация',
    
    // Finance widget
    balance: 'Баланс',
    
    // Sync history
    syncHistory: 'История синхронизации',
    syncStats: 'Статистика синхронизации',
    totalSyncs: 'Всего синхронизаций',
    habitsCount: 'Привычек',
    tasksCount: 'Задач',
    transactionsCount: 'Транзакций',
    noSyncHistory: 'Нет истории синхронизации',
    syncedItems: 'Синхронизировано элементов',
  },
  en: {
    // Pomodoro time tracking
    assignTimeToTask: 'Assign time to task',
    pomodoroSessionCompleted: 'Pomodoro session completed',
    skip: 'Skip',
    assign: 'Assign',
    
    // Greetings
    goodNight: 'Good night',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    
    // Stats
    completedToday: 'Completed today',
    greatJob: '🎉 Great job!',
    streak: 'Streak',
    week: 'Week',
    habits: 'Habits',
    
    // Views
    calendar: 'Calendar',
    progress: 'Progress',
    myHabits: 'My habits',
    
    // Empty state
    startBuilding: 'Start building habits',
    createFirst: 'Create your first habit and start the journey to a better you',
    createHabit: 'Create habit',
    
    // Dialog
    newHabit: 'New habit',
    editHabit: 'Edit habit',
    habitName: 'Habit name',
    habitNamePlaceholder: 'E.g.: Read a book',
    icon: 'Icon',
    color: 'Color',
    targetDays: 'Target days',
    save: 'Save',
    cancel: 'Cancel',
    
    // Delete dialog
    deleteHabit: 'Delete habit?',
    deleteDescription: 'The habit will be deleted along with all history. This action cannot be undone.',
    delete: 'Delete',
    
    // Days (short)
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    
    // Period
    days7: '7 days',
    days14: '14 days',
    days30: 'Month',
    
    // Share
    inviteFriend: 'Invite',
    share: 'Share',
    linkCopied: 'Link copied!',
    shareTitle: 'HabitFlow - Habit Tracker',
    shareText: 'Track your habits with me!',
    
    // Calendar
    habit: 'Habit',
    noHabitsToShow: 'No habits to display',
    
    // Progress
    dailyProgress: 'Daily progress',
    completedTasks: 'Completed',
    averageCompletion: 'Average completion',
    totalCompleted: 'Total completed',
    
    // Language
    language: 'Language',
    
    // Habit card
    thisWeek: 'this week',
    edit: 'Edit',

    // Dashboard
    yourDay: 'Your Day',
    habitsDone: 'Habits Done',
    tasksDone: 'Tasks Done',
    financeBalance: 'Finance Balance',
    exercisesDone: 'Exercises Done',
    todoToday: 'To Do Today',
    recoveryDay: 'Recovery Day - Focus on other activities',
    completed: 'completed',
    toDo: 'to do',
    habitsLabel: 'Habits',
    tasksLabel: 'Tasks',
    operationsLabel: 'Operations',
    exercisesLabel: 'Exercises',
    home: 'Home',
    profile: 'Profile',
    profileSettings: 'Profile Settings',
    guest: 'Guest',
    profileDescription: 'Sign in to sync your data across devices',

    // Navigation
    tasks: 'Tasks',
    finance: 'Finance',
    fitness: 'Fitness',
    new: 'New',
    task: 'Task',
    transaction: 'Transaction',
    workout: 'Workout',

    // Tasks
    taskTracker: 'Task Tracker',
    startTasks: 'Start planning tasks',
    createFirstTask: 'Create your first task and organize your day',
    createTask: 'Create task',
    newTask: 'New task',
    editTask: 'Edit task',
    deleteTask: 'Delete task?',
    deleteTaskDescription: 'The task will be deleted. This action cannot be undone.',
    taskName: 'Task name',
    taskNamePlaceholder: 'E.g.: Call the doctor',
    dueDate: 'Due date',
    priority: 'Priority',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    overdue: 'Overdue',
    today: 'Today',
    statusNotStarted: 'Not Started',
    statusInProgress: 'In Progress',
    statusDone: 'Done',
    status: 'Status',
    filters: 'Filters',
    clearFilters: 'Clear',
    tagsLabel: 'Tags',
    totalTasks: 'Total Tasks',
    completionRate: 'Completion Rate',
    byCategory: 'By Category',
    byPriority: 'By Priority',
    byStatus: 'By Status',
    uncategorized: 'Uncategorized',
    noTasksForDay: 'No tasks',
    addCategory: 'Add Category',
    addTag: 'Add Tag',
    taskSettings: 'Task Settings',
    categoriesLabel: 'Categories',
    noCategoriesYet: 'No categories yet',
    noTagsYet: 'No tags yet',
    categoryNamePlaceholder: 'Category name',
    tagNamePlaceholder: 'Tag name',
    overdueTasksNotification: 'Overdue Tasks',
    overdueTasksCount: 'You have {count} overdue tasks',
    highPriorityNotification: 'Important tasks today',
    highPriorityCount: '{count} high priority tasks',
    recurrence: 'Recurrence',
    recurrenceNone: 'None',
    recurrenceDaily: 'Daily',
    recurrenceWeekly: 'Weekly',
    recurrenceMonthly: 'Monthly',
    reminder: 'Reminder',
    reminderEnabled: 'On',
    reminderDisabled: 'Off',
    
    // Subtasks and attachments
    subtasks: 'Subtasks',
    addSubtask: 'Add subtask',
    subtaskPlaceholder: 'Subtask name',
    taskNotes: 'Notes',
    notesPlaceholder: 'Add notes to task...',
    attachments: 'Attachments',
    addNote: 'Note',
    addFile: 'File',
    noteTitle: 'Title',
    noteContent: 'Content',
    downloadFile: 'Download file',
    
    // Notification settings
    notificationSettings: 'Notification Settings',
    advanceNotification: 'Notify in advance',
    minutes5: '5 min',
    minutes15: '15 min',
    minutes30: '30 min',
    hour1: '1 hour',
    hours2: '2 hours',
    day1: '1 day',
    
    // Renamed trackers
    myTasks: 'My Tasks',
    myFinance: 'My Finance',
    myFitness: 'My Fitness',
    
    // Productivity stats
    productivity: 'Productivity',
    productivityStats: 'Productivity Statistics',
    productivityTrend: 'Productivity Trend',
    activityByDay: 'Activity by Day',
    activityDistribution: 'Activity Distribution',
    planned: 'planned',
    average: 'average',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
    growthVsPrevious: 'vs previous period',
    
    // Achievements
    achievements: 'Achievements',
    achievementsEarned: 'achievements earned',
    months1: '1 month',
    months3: '3 months',
    months6: '6 months',
    months12: '12 months',
    newAchievement: 'New achievement!',
    achievementUnlocked: 'Achievement unlocked',
    shareAchievement: 'Share achievement',
    
    // Settings
    habitSettings: 'Habit Settings',
    financeSettings: 'Finance Settings',
    fitnessSettings: 'Fitness Settings',

    // Finance
    financeTracker: 'Finance Tracker',
    startFinance: 'Start tracking finances',
    createFirstTransaction: 'Create your first transaction',
    createTransaction: 'Create transaction',
    income: 'Income',
    expense: 'Expense',
    amount: 'Amount',
    category: 'Category',
    yesterday: 'Yesterday',
    noTransactionsForDay: 'No transactions',
    balanceDynamics: 'Balance Dynamics',
    expenseByCategory: 'Expenses by Category',
    noExpensesForPeriod: 'No expenses for period',
    transactions: 'Transactions',

    // Fitness
    fitnessTracker: 'Fitness Tracker',
    startFitness: 'Start training',
    createFirstWorkout: 'Create your first workout',
    createWorkout: 'Create workout',
    exercises: 'Exercises',
    sets: 'Sets',
    reps: 'Reps',
    duration: 'Duration',
    scheduledDays: 'Scheduled days',
    workoutsCount: 'workouts',
    deleteWorkout: 'Delete workout?',
    deleteWorkoutDescription: 'The workout will be deleted. This action cannot be undone.',
    exerciseCompleted: 'Exercise completed',
    notStarted: 'Not started',
    inProgress: 'In progress',
    exercisesCount: 'Exercises',
    total: 'total',
    totalSets: 'Total sets',
    setsCompleted: 'completed',
    dailyActivity: 'Daily activity',
    exerciseCategories: 'Exercise categories',
    exerciseCategoriesLabel: 'Exercises',
    addExerciseCategory: 'Add exercise category',
    exerciseCategoryPlaceholder: 'Category name',
    noExerciseCategoriesYet: 'No exercise categories yet',
    weight: 'Weight (kg)',
    targetSets: 'Target sets',
    targetReps: 'Target reps',
    workoutHistory: 'Workout History',
    noWorkoutsForDay: 'No workouts for this day',
    set: 'Set',
    exportData: 'Data exported',
    exportHistory: 'Export history',
    exportWorkouts: 'Export workouts',
    
    // Rest Timer
    restTimer: 'Rest Timer',
    timerDuration: 'Timer duration',
    seconds: 'seconds',
    
    // Weight Progress
    weightProgress: 'Weight Progress',
    noWeightData: 'No weight data',
    startLoggingWeights: 'Start logging weights in your workouts',
    selectExercise: 'Select exercise',
    maxWeight: 'Max weight',
    avgWeight: 'Avg weight',
    totalVolume: 'Total volume',
    noDataForExercise: 'No data for this exercise',
    selectExerciseToSeeProgress: 'Select an exercise to see progress',
    
    // Workout Templates
    workoutTemplates: 'Workout Templates',
    myTemplates: 'My Templates',
    saveAsTemplate: 'Save as Template',
    noTemplatesYet: 'No templates yet',
    saveWorkoutAsTemplate: 'Save a workout as a template for quick copying',
    templateSaved: 'Template saved',
    workoutCreatedFromTemplate: 'Workout created from template',
    selectWorkout: 'Select workout',
    templateName: 'Template name',
    templateNamePlaceholder: 'E.g.: My strength workout',
    saveTemplate: 'Save template',

    // Share Workout
    shareWorkout: 'Share Workout',
    shareWorkoutInvite: 'Join my workouts on HabitFlow!',
    myResults: 'My Results',
    copied: 'Copied',
    copyToClipboard: 'Copy to clipboard',
    copyFailed: 'Failed to copy',
    inviteFriendToApp: 'Invite to app',
    setsCount: 'sets',

    // Calendar Planning
    schedulingMode: 'Scheduling mode',
    byWeekdays: 'By weekdays',
    bySpecificDates: 'By specific dates',
    scheduledDates: 'Scheduled dates',
    addDate: 'Add date',
    noScheduledDates: 'No scheduled dates',

    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    welcomeBack: 'Welcome back!',
    createAccount: 'Create an account',
    orContinueWith: 'or continue with',
    displayName: 'Display Name',
    displayNamePlaceholder: 'Your name',
    password: 'Password',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    error: 'Error',
    success: 'Success',
    invalidEmail: 'Enter a valid email',
    passwordTooShort: 'Password must be at least 6 characters',
    invalidCredentials: 'Invalid email or password',
    emailAlreadyRegistered: 'This email is already registered',
    checkEmail: 'Check your email for confirmation',
    signOut: 'Sign Out',
    
    // Services
    services: 'Services',
    myServices: 'My Services',
    pomodoroTimer: 'Pomodoro',
    timeTracker: 'Time Tracker',
    notes: 'Notes',
    currencyRates: 'Currency Rates',
    dateCalculator: 'Date Calculator',
    habitCounters: 'Counters',
    randomDecision: 'Decision Maker',
    worldTime: 'World Time',
    checklists: 'Checklists',
    unitConverter: 'Converter',
    
    // Pomodoro
    work: 'Work',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    sessionsToday: 'Sessions today',
    pomodorosCompleted: 'Pomodoros completed',
    pomodoroSettings: 'Pomodoro Settings',
    workDuration: 'Work duration',
    shortBreakDuration: 'Short break',
    longBreakDuration: 'Long break',
    sessionsBeforeLongBreak: 'Sessions before long break',
    autoStartBreaks: 'Auto-start breaks',
    autoStartPomodoros: 'Auto-start pomodoros',
    
    // Time Tracker
    selectTask: 'Select task',
    noActiveTasks: 'No active tasks',
    wholeTask: 'Whole task',
    stop: 'Stop',
    start: 'Start',
    todayTime: 'Today',
    noTimeEntriesYet: 'No entries yet',
    
    // Notes
    noNotesYet: 'No notes yet',
    createNote: 'Create note',
    editNote: 'Edit',
    newNote: 'New note',
    
    // Currency
    currencyInfo: 'Data from Central Bank',
    updated: 'Updated',
    
    // Date Calculator
    startDate: 'Start date',
    endDate: 'End date',
    daysBetween: 'Days between',
    addDays: 'Add days',
    resultDate: 'Result',
    
    // Habit Counters
    water: 'Water',
    steps: 'Steps',
    cups: 'cups',
    goal: 'Goal',
    resetCounter: 'Reset',
    
    // Random Decision
    addOption: 'Add option',
    optionPlaceholder: 'Option...',
    decide: 'Decide!',
    result: 'Result',
    noOptions: 'Add options',
    
    // World Time
    addTimezone: 'Add timezone',
    selectTimezone: 'Select timezone',
    
    // Checklists
    noChecklistsYet: 'No checklists yet',
    createChecklist: 'Create checklist',
    checklistName: 'Checklist name',
    addItem: 'Add item',
    resetChecklist: 'Reset',
    
    // Unit Converter
    length: 'Length',
    mass: 'Mass',
    temperature: 'Temperature',
    from: 'From',
    to: 'To',
    
    // Export
    exportToPdf: 'Export to PDF',
    exportToCsv: 'Export to CSV',
    exportSuccess: 'Data exported',
    
    // Time Tracker in Tasks
    startTimer: 'Start timer',
    stopTimer: 'Stop',
    timeSpent: 'Time spent',
    timeByTask: 'Time by task',
    totalTimeSpent: 'Total time spent',
    noTimeData: 'No time data',
    
    // Dashboard widgets
    widgetSettings: 'Widget Settings',
    quickAccess: 'Quick Access',
    allServices: 'All Services',
    avgPerDay: 'Avg/day',
    topTask: 'Top task',
    pause: 'Pause',
    
    // Notifications
    habitsReminder: 'Habits for today',
    habitsToComplete: 'habits waiting to be completed',
    streakCelebration: 'Great streak!',
    longestStreak: 'Longest streak',
    days: 'days',
    dataSynced: 'Data synced',
    syncSuccess: 'All data saved to cloud',
    syncError: 'Sync error',
    syncFailed: 'Failed to sync data',
    syncData: 'Sync',
    lastSync: 'Last sync',
    
    // Finance widget
    balance: 'Balance',
    
    // Sync history
    syncHistory: 'Sync history',
    syncStats: 'Sync statistics',
    totalSyncs: 'Total syncs',
    habitsCount: 'Habits',
    tasksCount: 'Tasks',
    transactionsCount: 'Transactions',
    noSyncHistory: 'No sync history',
    syncedItems: 'Synced items',
  },
  es: {
    // Pomodoro time tracking
    assignTimeToTask: 'Asignar tiempo a tarea',
    pomodoroSessionCompleted: 'Sesión Pomodoro completada',
    skip: 'Omitir',
    assign: 'Asignar',
    
    // Greetings
    goodNight: 'Buenas noches',
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    
    // Stats
    completedToday: 'Completado hoy',
    greatJob: '🎉 ¡Excelente trabajo!',
    streak: 'Racha',
    week: 'Semana',
    habits: 'Hábitos',
    
    // Views
    calendar: 'Calendario',
    progress: 'Progreso',
    myHabits: 'Mis hábitos',
    
    // Empty state
    startBuilding: 'Comienza a crear hábitos',
    createFirst: 'Crea tu primer hábito y comienza el camino hacia una mejor versión de ti',
    createHabit: 'Crear hábito',
    
    // Dialog
    newHabit: 'Nuevo hábito',
    editHabit: 'Editar hábito',
    habitName: 'Nombre del hábito',
    habitNamePlaceholder: 'Ej: Leer un libro',
    icon: 'Icono',
    color: 'Color',
    targetDays: 'Días objetivo',
    save: 'Guardar',
    cancel: 'Cancelar',
    
    // Delete dialog
    deleteHabit: '¿Eliminar hábito?',
    deleteDescription: 'El hábito se eliminará junto con todo el historial. Esta acción no se puede deshacer.',
    delete: 'Eliminar',
    
    // Days (short)
    sun: 'Dom',
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mié',
    thu: 'Jue',
    fri: 'Vie',
    sat: 'Sáb',
    
    // Period
    days7: '7 días',
    days14: '14 días',
    days30: 'Mes',
    
    // Share
    inviteFriend: 'Invitar',
    share: 'Compartir',
    linkCopied: '¡Enlace copiado!',
    shareTitle: 'HabitFlow - Rastreador de hábitos',
    shareText: '¡Rastrea tus hábitos conmigo!',
    
    // Calendar
    habit: 'Hábito',
    noHabitsToShow: 'No hay hábitos para mostrar',
    
    // Progress
    dailyProgress: 'Progreso diario',
    completedTasks: 'Completado',
    averageCompletion: 'Completación promedio',
    totalCompleted: 'Total completado',
    
    // Language
    language: 'Idioma',
    
    // Habit card
    thisWeek: 'esta semana',
    edit: 'Editar',

    // Dashboard
    yourDay: 'Tu Día',
    habitsDone: 'Hábitos Completados',
    tasksDone: 'Tareas Completadas',
    financeBalance: 'Balance Financiero',
    exercisesDone: 'Ejercicios Completados',
    todoToday: 'Por Hacer Hoy',
    recoveryDay: 'Día de Recuperación - Enfócate en otras actividades',
    completed: 'completado',
    toDo: 'por hacer',
    habitsLabel: 'Hábitos',
    tasksLabel: 'Tareas',
    operationsLabel: 'Operaciones',
    exercisesLabel: 'Ejercicios',
    home: 'Inicio',
    profile: 'Perfil',
    profileSettings: 'Configuración del perfil',
    guest: 'Invitado',
    profileDescription: 'Inicia sesión para sincronizar tus datos entre dispositivos',

    // Navigation
    tasks: 'Tareas',
    finance: 'Finanzas',
    fitness: 'Fitness',
    new: 'Nueva',
    task: 'Tarea',
    transaction: 'Transacción',
    workout: 'Entrenamiento',

    // Tasks
    taskTracker: 'Rastreador de Tareas',
    startTasks: 'Comienza a planificar tareas',
    createFirstTask: 'Crea tu primera tarea y organiza tu día',
    createTask: 'Crear tarea',
    newTask: 'Nueva tarea',
    editTask: 'Editar tarea',
    deleteTask: '¿Eliminar tarea?',
    deleteTaskDescription: 'La tarea será eliminada. Esta acción no se puede deshacer.',
    taskName: 'Nombre de la tarea',
    taskNamePlaceholder: 'Ej: Llamar al médico',
    dueDate: 'Fecha límite',
    priority: 'Prioridad',
    priorityLow: 'Baja',
    priorityMedium: 'Media',
    priorityHigh: 'Alta',
    overdue: 'Vencida',
    today: 'Hoy',
    statusNotStarted: 'No iniciada',
    statusInProgress: 'En progreso',
    statusDone: 'Completada',
    status: 'Estado',
    filters: 'Filtros',
    clearFilters: 'Limpiar',
    tagsLabel: 'Etiquetas',
    totalTasks: 'Total de tareas',
    completionRate: 'Tasa de finalización',
    byCategory: 'Por categoría',
    byPriority: 'Por prioridad',
    byStatus: 'Por estado',
    uncategorized: 'Sin categoría',
    noTasksForDay: 'Sin tareas',
    addCategory: 'Añadir categoría',
    addTag: 'Añadir etiqueta',
    taskSettings: 'Configuración de tareas',
    categoriesLabel: 'Categorías',
    noCategoriesYet: 'Aún no hay categorías',
    noTagsYet: 'Aún no hay etiquetas',
    categoryNamePlaceholder: 'Nombre de categoría',
    tagNamePlaceholder: 'Nombre de etiqueta',
    overdueTasksNotification: 'Tareas vencidas',
    overdueTasksCount: 'Tienes {count} tareas vencidas',
    highPriorityNotification: 'Tareas importantes hoy',
    highPriorityCount: '{count} tareas de alta prioridad',
    recurrence: 'Repetición',
    recurrenceNone: 'Ninguna',
    recurrenceDaily: 'Diario',
    recurrenceWeekly: 'Semanal',
    recurrenceMonthly: 'Mensual',
    reminder: 'Recordatorio',
    reminderEnabled: 'Act',
    reminderDisabled: 'Des',
    
    // Subtasks and attachments
    subtasks: 'Subtareas',
    addSubtask: 'Añadir subtarea',
    subtaskPlaceholder: 'Nombre de subtarea',
    taskNotes: 'Notas',
    notesPlaceholder: 'Añadir notas a la tarea...',
    attachments: 'Adjuntos',
    addNote: 'Nota',
    addFile: 'Archivo',
    noteTitle: 'Título',
    noteContent: 'Contenido',
    downloadFile: 'Descargar archivo',
    
    // Notification settings
    notificationSettings: 'Configuración de notificaciones',
    advanceNotification: 'Notificar con anticipación',
    minutes5: '5 min',
    minutes15: '15 min',
    minutes30: '30 min',
    hour1: '1 hora',
    hours2: '2 horas',
    day1: '1 día',
    
    // Renamed trackers
    myTasks: 'Mis Tareas',
    myFinance: 'Mis Finanzas',
    myFitness: 'Mi Fitness',
    
    // Productivity stats
    productivity: 'Productividad',
    productivityStats: 'Estadísticas de productividad',
    productivityTrend: 'Tendencia de productividad',
    activityByDay: 'Actividad por día',
    activityDistribution: 'Distribución de actividad',
    planned: 'planificado',
    average: 'promedio',
    month: 'Mes',
    quarter: 'Trimestre',
    year: 'Año',
    growthVsPrevious: 'vs período anterior',
    
    // Achievements
    achievements: 'Logros',
    achievementsEarned: 'logros obtenidos',
    months1: '1 mes',
    months3: '3 meses',
    months6: '6 meses',
    months12: '12 meses',
    newAchievement: '¡Nuevo logro!',
    achievementUnlocked: 'Logro desbloqueado',
    shareAchievement: 'Compartir logro',
    
    // Settings
    habitSettings: 'Configuración de Hábitos',
    financeSettings: 'Configuración de Finanzas',
    fitnessSettings: 'Configuración de Fitness',

    // Finance
    financeTracker: 'Rastreador de Finanzas',
    startFinance: 'Comienza a rastrear finanzas',
    createFirstTransaction: 'Crea tu primera transacción',
    createTransaction: 'Crear transacción',
    income: 'Ingreso',
    expense: 'Gasto',
    amount: 'Monto',
    category: 'Categoría',
    yesterday: 'Ayer',
    noTransactionsForDay: 'Sin transacciones',
    balanceDynamics: 'Dinámica del Balance',
    expenseByCategory: 'Gastos por Categoría',
    noExpensesForPeriod: 'Sin gastos en el período',
    transactions: 'Transacciones',

    // Fitness
    fitnessTracker: 'Rastreador de Fitness',
    startFitness: 'Comienza a entrenar',
    createFirstWorkout: 'Crea tu primer entrenamiento',
    createWorkout: 'Crear entrenamiento',
    exercises: 'Ejercicios',
    sets: 'Series',
    reps: 'Repeticiones',
    duration: 'Duración',
    scheduledDays: 'Días programados',
    workoutsCount: 'entrenamientos',
    deleteWorkout: '¿Eliminar entrenamiento?',
    deleteWorkoutDescription: 'El entrenamiento será eliminado. Esta acción no se puede deshacer.',
    exerciseCompleted: 'Ejercicio completado',
    notStarted: 'No iniciado',
    inProgress: 'En progreso',
    exercisesCount: 'Ejercicios',
    total: 'total',
    totalSets: 'Total de series',
    setsCompleted: 'completadas',
    dailyActivity: 'Actividad diaria',
    exerciseCategories: 'Categorías de ejercicios',
    exerciseCategoriesLabel: 'Ejercicios',
    addExerciseCategory: 'Añadir categoría de ejercicio',
    exerciseCategoryPlaceholder: 'Nombre de categoría',
    noExerciseCategoriesYet: 'Aún no hay categorías de ejercicios',
    weight: 'Peso (kg)',
    targetSets: 'Series objetivo',
    targetReps: 'Repeticiones objetivo',
    workoutHistory: 'Historial de entrenamientos',
    noWorkoutsForDay: 'Sin entrenamientos para este día',
    set: 'Serie',
    exportData: 'Datos exportados',
    exportHistory: 'Exportar historial',
    exportWorkouts: 'Exportar entrenamientos',
    
    // Rest Timer
    restTimer: 'Temporizador de descanso',
    timerDuration: 'Duración del temporizador',
    seconds: 'segundos',
    
    // Weight Progress
    weightProgress: 'Progreso de peso',
    noWeightData: 'Sin datos de peso',
    startLoggingWeights: 'Comienza a registrar pesos en tus entrenamientos',
    selectExercise: 'Seleccionar ejercicio',
    maxWeight: 'Peso máx.',
    avgWeight: 'Peso prom.',
    totalVolume: 'Volumen total',
    noDataForExercise: 'Sin datos para este ejercicio',
    selectExerciseToSeeProgress: 'Selecciona un ejercicio para ver el progreso',
    
    // Workout Templates
    workoutTemplates: 'Plantillas de entrenamiento',
    myTemplates: 'Mis plantillas',
    saveAsTemplate: 'Guardar como plantilla',
    noTemplatesYet: 'Aún no hay plantillas',
    saveWorkoutAsTemplate: 'Guarda un entrenamiento como plantilla para copiar rápidamente',
    templateSaved: 'Plantilla guardada',
    workoutCreatedFromTemplate: 'Entrenamiento creado desde plantilla',
    selectWorkout: 'Seleccionar entrenamiento',
    templateName: 'Nombre de plantilla',
    templateNamePlaceholder: 'Ej: Mi fuerza',
    saveTemplate: 'Guardar plantilla',

    // Share Workout
    shareWorkout: 'Compartir entrenamiento',
    shareWorkoutInvite: '¡Únete a mis entrenamientos en HabitFlow!',
    myResults: 'Mis resultados',
    copied: 'Copiado',
    copyToClipboard: 'Copiar al portapapeles',
    copyFailed: 'Error al copiar',
    inviteFriendToApp: 'Invitar a la app',
    setsCount: 'series',

    // Calendar Planning
    schedulingMode: 'Modo de planificación',
    byWeekdays: 'Por días de la semana',
    bySpecificDates: 'Por fechas específicas',
    scheduledDates: 'Fechas programadas',
    addDate: 'Añadir fecha',
    noScheduledDates: 'Sin fechas programadas',

    // Auth
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    welcomeBack: '¡Bienvenido de nuevo!',
    createAccount: 'Crea una cuenta',
    orContinueWith: 'o continuar con',
    displayName: 'Nombre de usuario',
    displayNamePlaceholder: 'Tu nombre',
    password: 'Contraseña',
    noAccount: '¿No tienes cuenta?',
    hasAccount: '¿Ya tienes cuenta?',
    error: 'Error',
    success: 'Éxito',
    invalidEmail: 'Introduce un email válido',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    invalidCredentials: 'Email o contraseña incorrectos',
    emailAlreadyRegistered: 'Este email ya está registrado',
    checkEmail: 'Revisa tu correo para confirmar',
    signOut: 'Cerrar sesión',
    
    // Services
    services: 'Servicios',
    myServices: 'Mis Servicios',
    pomodoroTimer: 'Pomodoro',
    timeTracker: 'Cronómetro',
    notes: 'Notas',
    currencyRates: 'Tipos de cambio',
    dateCalculator: 'Calculadora de fechas',
    habitCounters: 'Contadores',
    randomDecision: 'Generador de decisiones',
    worldTime: 'Hora mundial',
    checklists: 'Listas de control',
    unitConverter: 'Convertidor',
    
    // Pomodoro
    work: 'Trabajo',
    shortBreak: 'Descanso corto',
    longBreak: 'Descanso largo',
    sessionsToday: 'Sesiones hoy',
    pomodorosCompleted: 'Pomodoros completados',
    pomodoroSettings: 'Configuración Pomodoro',
    workDuration: 'Duración del trabajo',
    shortBreakDuration: 'Descanso corto',
    longBreakDuration: 'Descanso largo',
    sessionsBeforeLongBreak: 'Sesiones antes del descanso largo',
    autoStartBreaks: 'Iniciar descansos automáticamente',
    autoStartPomodoros: 'Iniciar pomodoros automáticamente',
    
    // Time Tracker
    selectTask: 'Seleccionar tarea',
    noActiveTasks: 'Sin tareas activas',
    wholeTask: 'Toda la tarea',
    stop: 'Parar',
    start: 'Iniciar',
    todayTime: 'Hoy',
    noTimeEntriesYet: 'Sin entradas aún',
    
    // Notes
    noNotesYet: 'Sin notas aún',
    createNote: 'Crear nota',
    editNote: 'Editar',
    newNote: 'Nueva nota',
    
    // Currency
    currencyInfo: 'Datos del Banco Central',
    updated: 'Actualizado',
    
    // Date Calculator
    startDate: 'Fecha inicial',
    endDate: 'Fecha final',
    daysBetween: 'Días entre fechas',
    addDays: 'Añadir días',
    resultDate: 'Resultado',
    
    // Habit Counters
    water: 'Agua',
    steps: 'Pasos',
    cups: 'vasos',
    goal: 'Meta',
    resetCounter: 'Reiniciar',
    
    // Random Decision
    addOption: 'Añadir opción',
    optionPlaceholder: 'Opción...',
    decide: '¡Decidir!',
    result: 'Resultado',
    noOptions: 'Añade opciones',
    
    // World Time
    addTimezone: 'Añadir zona horaria',
    selectTimezone: 'Seleccionar zona horaria',
    
    // Checklists
    noChecklistsYet: 'Sin listas de control aún',
    createChecklist: 'Crear lista de control',
    checklistName: 'Nombre de la lista',
    addItem: 'Añadir elemento',
    resetChecklist: 'Reiniciar',
    
    // Unit Converter
    length: 'Longitud',
    mass: 'Masa',
    temperature: 'Temperatura',
    from: 'De',
    to: 'A',
    
    // Export
    exportToPdf: 'Exportar a PDF',
    exportToCsv: 'Exportar a CSV',
    exportSuccess: 'Datos exportados',
    
    // Time Tracker in Tasks
    startTimer: 'Iniciar temporizador',
    stopTimer: 'Parar',
    timeSpent: 'Tiempo dedicado',
    timeByTask: 'Tiempo por tarea',
    totalTimeSpent: 'Tiempo total',
    noTimeData: 'Sin datos de tiempo',
    
    // Dashboard widgets
    widgetSettings: 'Configuración de widgets',
    quickAccess: 'Acceso rápido',
    allServices: 'Todos los servicios',
    avgPerDay: 'Prom/día',
    topTask: 'Tarea principal',
    pause: 'Pausa',
    
    // Notifications
    habitsReminder: 'Hábitos para hoy',
    habitsToComplete: 'hábitos esperando ser completados',
    streakCelebration: '¡Gran racha!',
    longestStreak: 'Mejor racha',
    days: 'días',
    dataSynced: 'Datos sincronizados',
    syncSuccess: 'Todos los datos guardados en la nube',
    syncError: 'Error de sincronización',
    syncFailed: 'No se pudieron sincronizar los datos',
    syncData: 'Sincronizar',
    lastSync: 'Última sincronización',
    
    // Finance widget
    balance: 'Saldo',
    
    // Sync history
    syncHistory: 'Historial de sincronización',
    syncStats: 'Estadísticas de sincronización',
    totalSyncs: 'Total de sincronizaciones',
    habitsCount: 'Hábitos',
    tasksCount: 'Tareas',
    transactionsCount: 'Transacciones',
    noSyncHistory: 'Sin historial de sincronización',
    syncedItems: 'Elementos sincronizados',
  },
} as const;

export type TranslationKey = keyof typeof translations.ru;
