export const DEMO_DATA = {
  teamName: "Цифровой Прорыв",
  sprint: {
    id: "sprint-2-0",
    title: "Релиз 2.0: Глобальное обновление",
    goal: "Завершить интеграцию платежных шлюзов и стабилизировать Push-уведомления",
    totalSP: 154,
    completedSP: 34,
    startDate: "2026-03-01",
    endDate: "2026-03-14"
  },
  members: [
    { id: "m1", name: "Александр В.", role: "Lead Dev", rank: "Guru", xp: 18450, sp: 21, status: "Focus 🧘" },
    { id: "m2", name: "Елена М.", role: "Senior Product", rank: "Guru", xp: 15200, sp: 5, status: "Online 🟢" },
    { id: "m3", name: "Дмитрий К.", role: "Backend", rank: "Master", xp: 12100, sp: 18, status: "Coding 💻" },
    { id: "m4", name: "Ольга П.", role: "QA Lead", rank: "Master", xp: 11300, sp: 12, status: "Online 🟢" },
    { id: "m5", name: "Артем С.", role: "Mobile Dev", rank: "Expert", xp: 8900, sp: 16, status: "Meeting 📞" },
    { id: "m6", name: "Мария Д.", role: "UI/UX Designer", rank: "Expert", xp: 7600, sp: 14, status: "Drawing 🎨" },
    { id: "m7", name: "Игорь Т.", role: "DevOps", rank: "Expert", xp: 6800, sp: 8, status: "Away 🟡" },
    { id: "m8", name: "Никита Р.", role: "Frontend", rank: "Specialist", xp: 4200, sp: 11, status: "Online 🟢" },
    { id: "m9", name: "Анна Г.", role: "Content/Copy", rank: "Specialist", xp: 3500, sp: 7, status: "Writing ✍️" },
    { id: "m10", name: "Сергей Б.", role: "Data Analyst", rank: "Master", xp: 10200, sp: 13, status: "Online 🟢" },
    { id: "m11", name: "Юлия О.", role: "Marketing", rank: "Expert", xp: 7400, sp: 9, status: "Online 🟢" },
    { id: "m12", name: "Константин В.", role: "Tech Support", rank: "Master", xp: 9100, sp: 10, status: "Focus 🧘" }
  ],
  tasks: [
    { id: "t1", title: "[Core] ИИ-ассистент анализа спринтов", status: "backlog", sp: 13, user: null },
    { id: "t2", title: "[Arch] Микросервисы Push", status: "backlog", sp: 8, user: null },
    { id: "t3", title: "[Design] Tokens 2.0", status: "backlog", sp: 5, user: null },
    { id: "t4", title: "[Legal] GDPR комплаенс", status: "backlog", sp: 5, user: null },
    { id: "t5", title: "[API] Public Beta API", status: "backlog", sp: 8, user: null },
    { id: "t6", title: "[Mobile] Offline-режим", status: "backlog", sp: 13, user: null },
    { id: "t7", title: "[Payment] Apple/Google Pay", status: "in_progress", sp: 8, user: "Дмитрий К." },
    { id: "t8", title: "[UI] Анимация 3D-подиума", status: "in_progress", sp: 5, user: "Мария Д." },
    { id: "t9", title: "[Perf] Оптимизация LCP < 1.2s", status: "in_progress", sp: 3, user: "Никита Р." },
    { id: "t10", title: "[Sec] Внедрение 2FA", status: "in_progress", sp: 5, user: "Александр В." },
    { id: "t11", title: "[Analytic] Сквозная Amplitude", status: "in_progress", sp: 3, user: "Сергей Б." },
    { id: "t12", title: "[Refactor] Unit-тесты XP", status: "in_progress", sp: 5, user: "Ольга П." },
    { id: "t13", title: "[Feature] Заморозка стриков", status: "in_progress", sp: 2, user: "Артем С." },
    { id: "t14", title: "[Content] Гайды онбординга", status: "in_progress", sp: 3, user: "Анна Г." },
    { id: "t15", title: "[Fix] Дубли TG уведомлений", status: "review", sp: 2, user: "Ольга П." },
    { id: "t16", title: "[DevOps] CI/CD Staging", status: "review", sp: 5, user: "Игорь Т." },
    { id: "t17", title: "[DB] Индексы PostgreSQL", status: "review", sp: 3, user: "Дмитрий К." },
    { id: "t18", title: "[UX] Доступность A11y", status: "review", sp: 3, user: "Мария Д." },
    { id: "t19", title: "[Legal] Шлюз ФЗ-152", status: "done", sp: 8, user: "Александр В." },
    { id: "t20", title: "[Billing] PDF Счета/Акты", status: "done", sp: 5, user: "Юлия О." },
    { id: "t21", title: "[Auth] Google/Yandex Login", status: "done", sp: 3, user: "Никита Р." },
    { id: "t22", title: "[Marketing] Лендинг «Команда»", status: "done", sp: 5, user: "Юлия О." },
    { id: "t23", title: "[Core] Система RBAC", status: "done", sp: 8, user: "Константин В." },
    { id: "t24", title: "[Social] Рефералка 2.0", status: "done", sp: 5, user: "Анна Г." }
  ],
  burndown: [
    { day: "01.03", ideal: 154, actual: 154 },
    { day: "03.03", ideal: 132, actual: 145 },
    { day: "05.03", ideal: 110, actual: 115 },
    { day: "07.03", ideal: 88, actual: 92 },
    { day: "09.03", ideal: 66, actual: 42 }
  ]
};

export type DemoData = typeof DEMO_DATA;
export type DemoMember = DemoData['members'][number];
export type DemoTask = DemoData['tasks'][number];
