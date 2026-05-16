import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronRight, BookOpen, Mail, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  getHelpContent,
  findArticle,
  getAllArticles,
  type HelpArticle,
  type HelpSection,
} from '@/content/help/articles';
import { HelpMarkdown } from '@/components/help/HelpMarkdown';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const FEEDBACK_KEY = 'topfocus_help_feedback';

interface HelpProps {
  embedded?: boolean;
}

export default function Help({ embedded = false }: HelpProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const location = useLocation();

  const sections = useMemo<HelpSection[]>(() => getHelpContent(isRu ? 'ru' : 'en'), [isRu]);
  const allArticles = useMemo(() => getAllArticles(sections), [sections]);

  const [query, setQuery] = useState('');
  const [activeSlug, setActiveSlug] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || sections[0]?.articles[0]?.slug || '';
  });

  // Sync URL hash with active article
  useEffect(() => {
    if (activeSlug && window.location.hash.replace('#', '') !== activeSlug) {
      window.history.replaceState(null, '', `#${activeSlug}`);
    }
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSlug]);

  // Listen for hash changes (deep links from "?" buttons elsewhere)
  useEffect(() => {
    const onHash = () => {
      const slug = window.location.hash.replace('#', '');
      if (slug && allArticles.some((a) => a.slug === slug)) setActiveSlug(slug);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [allArticles]);

  const contentRef = useRef<HTMLDivElement>(null);

  const found = findArticle(sections, activeSlug);
  const article = found?.article ?? sections[0].articles[0];
  const sectionOf = found?.section ?? sections[0];

  // Search results
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.tldr.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q)
    );
  }, [query, allArticles]);

  const handleFeedback = (slug: string, positive: boolean) => {
    try {
      const raw = localStorage.getItem(FEEDBACK_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[slug] = positive ? 'up' : 'down';
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(map));
    } catch {
      /* no-op */
    }
    toast({
      title: positive
        ? isRu ? 'Спасибо за отзыв!' : 'Thanks for the feedback!'
        : isRu ? 'Спасибо, мы улучшим эту статью' : 'Thanks, we will improve this article',
    });
  };

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background pb-24'}>
      {/* Hero */}
      <div className="border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isRu ? 'Помощь' : 'Help center'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Все возможности ТопФокус — пошагово и с примерами'
                  : 'All TopFocus features — step by step'}
              </p>
            </div>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isRu ? 'Поиск по справке...' : 'Search articles...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-card/70 backdrop-blur"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => setActiveSlug('about')}>
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              {isRu ? 'С чего начать' : 'Start here'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveSlug('troubleshoot-notifs')}>
              {isRu ? 'Решение проблем' : 'Troubleshooting'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/profile')}>
              <Mail className="w-3.5 h-3.5 mr-1" />
              {isRu ? 'Связаться с поддержкой' : 'Contact support'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ScrollArea className="lg:h-[calc(100vh-7rem)] pr-2">
            <nav className="space-y-4">
              {sections.map((s) => (
                <div key={s.id}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <span>{s.emoji}</span>
                    <span>{s.title}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {s.articles.map((a) => (
                      <li key={a.slug}>
                        <button
                          onClick={() => setActiveSlug(a.slug)}
                          aria-current={a.slug === activeSlug ? 'page' : undefined}
                          className={cn(
                            'w-full text-left text-sm px-2 py-1.5 rounded-sm transition-colors',
                            'hover:bg-muted/60',
                            a.slug === activeSlug
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground'
                          )}
                        >
                          {a.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Content */}
        <main ref={contentRef} className="min-w-0">
          {filtered ? (
            <Card className="border-border/50">
              <CardContent className="pt-5">
                <h2 className="text-base font-semibold mb-3">
                  {isRu ? 'Результаты поиска' : 'Search results'} · {filtered.length}
                </h2>
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Ничего не найдено. Попробуйте другое слово.' : 'Nothing found.'}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {filtered.map((a) => (
                      <li key={a.slug}>
                        <button
                          onClick={() => { setActiveSlug(a.slug); setQuery(''); }}
                          className="w-full text-left p-3 rounded-sm hover:bg-muted/60 border border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">{a.sectionTitle}</Badge>
                            <span className="font-medium text-sm">{a.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{a.tldr}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : (
            <Article
              article={article}
              sectionTitle={sectionOf.title}
              sections={sections}
              onSelect={setActiveSlug}
              onFeedback={handleFeedback}
              isRu={isRu}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function Article({
  article,
  sectionTitle,
  sections,
  onSelect,
  onFeedback,
  isRu,
}: {
  article: HelpArticle;
  sectionTitle: string;
  sections: HelpSection[];
  onSelect: (slug: string) => void;
  onFeedback: (slug: string, positive: boolean) => void;
  isRu: boolean;
}) {
  // Resolve related articles
  const related = (article.related ?? [])
    .map((slug) => {
      const r = findArticle(sections, slug);
      return r ? r.article : null;
    })
    .filter(Boolean) as HelpArticle[];

  return (
    <article className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{isRu ? 'Помощь' : 'Help'}</span>
        <ChevronRight className="w-3 h-3" />
        <span>{sectionTitle}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{article.title}</span>
      </div>

      <h1 className="text-2xl font-bold text-foreground">{article.title}</h1>

      {/* TL;DR */}
      <div className="rounded-sm border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">TL;DR</div>
        <p className="text-sm text-foreground">{article.tldr}</p>
      </div>

      {/* Body */}
      <div className="prose-sm max-w-none">
        <HelpMarkdown source={article.body} />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {isRu ? 'Связанные статьи' : 'Related articles'}
          </div>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <button
                key={r.slug}
                onClick={() => onSelect(r.slug)}
                className="text-xs px-2.5 py-1.5 rounded-sm border border-border/60 bg-card hover:bg-muted/60 transition-colors"
              >
                {r.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="pt-4 border-t border-border/50 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {isRu ? 'Эта статья была полезна?' : 'Was this helpful?'}
        </span>
        <Button size="sm" variant="outline" onClick={() => onFeedback(article.slug, true)}>
          <ThumbsUp className="w-3.5 h-3.5 mr-1" />
          {isRu ? 'Да' : 'Yes'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onFeedback(article.slug, false)}>
          <ThumbsDown className="w-3.5 h-3.5 mr-1" />
          {isRu ? 'Нет' : 'No'}
        </Button>
      </div>
    </article>
  );
}