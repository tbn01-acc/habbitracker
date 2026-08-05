import { Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { IdeasBoard } from '@/components/services/IdeasBoard';

export default function Ideas() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <PageHeader
          showTitle
          icon={<Lightbulb className="w-5 h-5 text-primary" />}
          iconBgClass="bg-primary/20"
          title="Мои идеи"
          subtitle="Оценка реалистичности и декомпозиция"
        />
        <div className="mt-6">
          <IdeasBoard />
        </div>
      </div>
    </div>
  );
}
