import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { PublicProfileView } from '@/components/profile/PublicProfileView';
import { UserFeed } from '@/components/profile/UserFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Image } from 'lucide-react';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'feed'>('profile');

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-2 py-2 pb-24">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Профиль не найден</h2>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-2 py-1 pb-24">
        {/* Back button + Tabs in one row */}
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'profile' | 'feed')} className="flex-1">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs h-8">
                <User className="h-3.5 w-3.5" />
                Профиль
              </TabsTrigger>
              <TabsTrigger value="feed" className="flex items-center gap-1.5 text-xs h-8">
                <Image className="h-3.5 w-3.5" />
                Публикации
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'profile' | 'feed')}>
          <TabsContent value="profile" className="mt-0">
            <PublicProfileView userId={userId} />
          </TabsContent>

          <TabsContent value="feed" className="mt-0">
            <UserFeed userId={userId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
