import { ParagraphItem } from '../types';

const PARAGRAPHS_STORAGE_KEY = 'active_recall_paragraphs_v1';

export const DEFAULT_PARAGRAPHS: ParagraphItem[] = [
  {
    id: 'p-music-society',
    title: 'Vai trò của Âm nhạc trong Xã hội',
    topic: 'Art & Culture',
    content: 'There is ongoing debate over whether music functions as an indispensable pillar of society or merely serves as a means of personal entertainment. While some people regard music as a simple leisure activity, I firmly believe that its cultural and economic contributions render it a cornerstone of modern life.',
    translation_vi: 'Hiện đang có nhiều tranh luận về việc liệu âm nhạc đóng vai trò như một trụ cột không thể thiếu của xã hội hay chỉ đơn thuần là một phương tiện giải trí cá nhân. Trong khi một số người coi âm nhạc như một hoạt động giải trí đơn thuần, tôi tin chắc rằng những đóng góp về văn hóa và kinh tế của nó khiến nó trở thành nền tảng của cuộc sống hiện đại.',
    keywords: [
      'ongoing', 'debate', 'functions', 'indispensable', 'pillar',
      'society', 'merely', 'serves', 'means', 'personal',
      'entertainment', 'regard', 'leisure', 'activity',
      'firmly', 'believe', 'cultural', 'economic', 'contributions',
      'render', 'cornerstone', 'modern'
    ],
    difficulty: 'medium',
    created_at: new Date().toISOString(),
    last_practiced: null,
    best_score: null,
    practice_count: 0
  },
  {
    id: 'p-ai-workforce',
    title: 'Trí tuệ nhân tạo và Tương lai việc làm',
    topic: 'Technology & Work',
    content: 'The rapid evolution of artificial intelligence has sparked intense debate concerning the future of the global workforce. Although some argue that automation will inevitably eliminate millions of conventional jobs, proponents maintain that it will generate unprecedented employment opportunities and elevate workplace productivity.',
    translation_vi: 'Sự phát triển nhanh chóng của trí tuệ nhân tạo đã làm dấy lên những tranh luận gay gắt liên quan đến tương lai của lực lượng lao động toàn cầu. Mặc dù một số người cho rằng tự động hóa sẽ không thể tránh khỏi việc loại bỏ hàng triệu công việc truyền thống, những người ủng hộ lại khẳng định rằng nó sẽ tạo ra những cơ hội việc làm chưa từng có và nâng cao năng suất tại nơi làm việc.',
    keywords: [
      'evolution', 'artificial', 'intelligence', 'sparked', 'concerning',
      'workforce', 'automation', 'inevitably', 'eliminate', 'conventional',
      'proponents', 'maintain', 'generate', 'unprecedented', 'opportunities',
      'elevate', 'productivity'
    ],
    difficulty: 'hard',
    created_at: new Date().toISOString(),
    last_practiced: null,
    best_score: null,
    practice_count: 0
  },
  {
    id: 'p-climate-energy',
    title: 'Biến đổi khí hậu và Năng lượng bền vững',
    topic: 'Environment',
    content: 'Combating global climate change demands a decisive transition from fossil fuels to sustainable energy sources. By investing substantially in renewable infrastructure such as solar and wind power, governments can mitigate catastrophic ecological damage while fostering long-term economic resilience.',
    translation_vi: 'Cuộc chiến chống biến đổi khí hậu toàn cầu đòi hỏi một sự chuyển đổi dứt khoát từ nhiên liệu hóa thạch sang các nguồn năng lượng bền vững. Bằng cách đầu tư đáng kể vào cơ sở hạ tầng tái tạo như năng lượng mặt trời và gió, các chính phủ có thể giảm thiểu thiệt hại sinh thái thảm khốc đồng thời thúc đẩy khả năng phục hồi kinh tế lâu dài.',
    keywords: [
      'combating', 'climate', 'demands', 'decisive', 'transition',
      'fossil', 'sustainable', 'investing', 'substantially', 'infrastructure',
      'mitigate', 'catastrophic', 'ecological', 'fostering', 'resilience'
    ],
    difficulty: 'medium',
    created_at: new Date().toISOString(),
    last_practiced: null,
    best_score: null,
    practice_count: 0
  },
  {
    id: 'p-education-skills',
    title: 'Giáo dục Đại học và Kỹ năng thực tế',
    topic: 'Education',
    content: 'A recurring question in modern education is whether academic curricula should prioritize theoretical knowledge or practical vocational training. A balanced pedagogical approach that integrates theoretical comprehension with hands-on experience equips graduates with the versatile capabilities necessary to thrive in an unpredictable job market.',
    translation_vi: 'Một câu hỏi lặp đi lặp lại trong giáo dục hiện đại là liệu chương trình giảng dạy học thuật nên ưu tiên kiến thức lý thuyết hay đào tạo nghề thực hành. Phương pháp sư phạm cân bằng kết hợp hiểu biết lý thuyết với trải nghiệm thực hành sẽ trang bị cho sinh viên tốt nghiệp những năng lực linh hoạt cần thiết để phát triển trong một thị trường việc làm khó lường.',
    keywords: [
      'recurring', 'curricula', 'prioritize', 'theoretical', 'vocational',
      'pedagogical', 'integrates', 'comprehension', 'hands-on',
      'equips', 'graduates', 'versatile', 'capabilities', 'unpredictable'
    ],
    difficulty: 'hard',
    created_at: new Date().toISOString(),
    last_practiced: null,
    best_score: null,
    practice_count: 0
  }
];

export function loadParagraphs(): ParagraphItem[] {
  try {
    const raw = localStorage.getItem(PARAGRAPHS_STORAGE_KEY);
    if (!raw) {
      saveParagraphs(DEFAULT_PARAGRAPHS);
      return DEFAULT_PARAGRAPHS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveParagraphs(DEFAULT_PARAGRAPHS);
      return DEFAULT_PARAGRAPHS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load paragraphs:', err);
    return DEFAULT_PARAGRAPHS;
  }
}

export function saveParagraphs(items: ParagraphItem[]): void {
  try {
    localStorage.setItem(PARAGRAPHS_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save paragraphs:', err);
  }
}

export function addParagraph(item: Omit<ParagraphItem, 'id' | 'created_at' | 'last_practiced' | 'best_score' | 'practice_count'>): ParagraphItem {
  const list = loadParagraphs();
  const newItem: ParagraphItem = {
    ...item,
    id: 'para-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString(),
    last_practiced: null,
    best_score: null,
    practice_count: 0
  };
  list.unshift(newItem);
  saveParagraphs(list);
  return newItem;
}

export function updateParagraph(updated: ParagraphItem): void {
  const list = loadParagraphs();
  const idx = list.findIndex(p => p.id === updated.id);
  if (idx !== -1) {
    list[idx] = updated;
    saveParagraphs(list);
  }
}

export function deleteParagraph(id: string): void {
  const list = loadParagraphs();
  const filtered = list.filter(p => p.id !== id);
  saveParagraphs(filtered);
}

export function recordParagraphPractice(id: string, scorePercentage: number): void {
  const list = loadParagraphs();
  const idx = list.findIndex(p => p.id === id);
  if (idx !== -1) {
    const item = list[idx];
    const prevBest = item.best_score || 0;
    list[idx] = {
      ...item,
      last_practiced: new Date().toISOString(),
      best_score: Math.max(prevBest, scorePercentage),
      practice_count: (item.practice_count || 0) + 1
    };
    saveParagraphs(list);
  }
}
