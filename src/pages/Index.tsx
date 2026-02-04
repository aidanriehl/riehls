import { ReelsFeed } from '@/components/ReelsFeed';
import { BottomNav } from '@/components/BottomNav';

const Index = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <ReelsFeed />
      <BottomNav />
    </div>
  );
};

export default Index;
