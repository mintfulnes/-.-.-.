export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  number: number;
  text: string;
  type: 'single' | 'multiple' | 'scale';
  options: QuestionOption[];
  isMultiple?: boolean;
}

export const SURVEY_QUESTIONS: Question[] = [
  {
    id: 'q1',
    number: 1,
    text: 'Як часто ви бачите мистецький контент у соціальних мережах?',
    type: 'single',
    options: [
      { value: 'а', label: 'щодня' },
      { value: 'б', label: 'кілька разів на тиждень' },
      { value: 'в', label: 'рідко' },
      { value: 'г', label: 'майже ніколи' }
    ]
  },
  {
    id: 'q2',
    number: 2,
    text: 'На якій платформі ви найчастіше зустрічаєте мистецтво?',
    type: 'single',
    options: [
      { value: 'а', label: 'Instagram' },
      { value: 'б', label: 'TikTok' },
      { value: 'в', label: 'Pinterest' },
      { value: 'г', label: 'YouTube' },
      { value: 'д', label: 'інша' }
    ]
  },
  {
    id: 'q3',
    number: 3,
    text: 'Який вид мистецтва привертає вашу увагу найбільше?',
    type: 'multiple',
    isMultiple: true,
    options: [
      { value: 'а', label: 'живопис' },
      { value: 'б', label: 'фотографія' },
      { value: 'в', label: 'цифрове мистецтво' },
      { value: 'г', label: 'ілюстрація' },
      { value: 'д', label: 'стріт-арт' },
      { value: 'е', label: 'скульптура' },
      { value: 'є', label: 'дизайн' }
    ]
  },
  {
    id: 'q4',
    number: 4,
    text: 'Що найчастіше змушує вас зупинитися на мистецькій публікації?',
    type: 'multiple',
    isMultiple: true,
    options: [
      { value: 'а', label: 'яскраве зображення' },
      { value: 'б', label: 'незвичайний сюжет' },
      { value: 'в', label: 'музика' },
      { value: 'г', label: 'короткий формат' },
      { value: 'д', label: 'історія створення' },
      { value: 'е', label: 'популярність автора' },
      { value: 'є', label: 'рекомендація алгоритму' }
    ]
  },
  {
    id: 'q5',
    number: 5,
    text: 'Чи дізнавалися ви про художника саме через соціальні мережі?',
    type: 'single',
    options: [
      { value: 'а', label: 'так' },
      { value: 'б', label: 'ні' },
      { value: 'в', label: 'не пам\'ятаю' }
    ]
  },
  {
    id: 'q6',
    number: 6,
    text: 'Чи виникало у вас бажання відвідати музей, галерею або виставку після побаченого контенту?',
    type: 'single',
    options: [
      { value: 'а', label: 'так' },
      { value: 'б', label: 'ні' },
      { value: 'в', label: 'іноді' }
    ]
  },
  {
    id: 'q7',
    number: 7,
    text: 'Наскільки ефективними є соціальні мережі для популяризації мистецтва?',
    type: 'scale',
    options: [
      { value: '1', label: '1 — Зовсім неефективні' },
      { value: '2', label: '2 — Низька ефективність' },
      { value: '3', label: '3 — Помірна ефективність' },
      { value: '4', label: '4 — Досить ефективні' },
      { value: '5', label: '5 — Надзвичайно ефективні' }
    ]
  },
  {
    id: 'q8',
    number: 8,
    text: 'Чи достатньо вам інформації в соціальній мережі для розуміння змісту мистецького твору?',
    type: 'single',
    options: [
      { value: 'а', label: 'так' },
      { value: 'б', label: 'переважно так' },
      { value: 'в', label: 'переважно ні' },
      { value: 'г', label: 'ні' }
    ]
  },
  {
    id: 'q9',
    number: 9,
    text: 'Чи впливає кількість лайків і переглядів на вашу оцінку твору?',
    type: 'single',
    options: [
      { value: 'а', label: 'сильно впливає' },
      { value: 'б', label: 'дещо впливає' },
      { value: 'в', label: 'майже не впливає' },
      { value: 'г', label: 'зовсім не впливає' }
    ]
  },
  {
    id: 'q10',
    number: 10,
    text: 'Чи погоджуєтеся ви з твердженням "У соціальних мережах мистецтво часто сприймається поверхово"?',
    type: 'single',
    options: [
      { value: 'а', label: 'повністю погоджуюся' },
      { value: 'б', label: 'скоріше погоджуюся' },
      { value: 'в', label: 'скоріше не погоджуюся' },
      { value: 'г', label: 'не погоджуюся' }
    ]
  }
];
