import { ReelsFeed } from '@/components/ReelsFeed';
import { BottomNav } from '@/components/BottomNav';

const Index = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-center h-16 pt-2">
        <h1 className="text-xl font-bold tracking-wide" style={{ fontSize: '1.35rem' }}>riehls</h1>
      </header>
      <ReelsFeed />
      <BottomNav />
    </div>
  );
};

export default Index;
