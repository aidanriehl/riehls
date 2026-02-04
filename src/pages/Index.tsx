import { ReelsFeed } from '@/components/ReelsFeed';
import { BottomNav } from '@/components/BottomNav';

const Index = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Header with enhanced gradient */}
      <header className="absolute top-0 left-0 right-0 z-40">
        <div className="absolute inset-0 h-24 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-center h-16 pt-2">
          <h1 className="text-xl font-bold tracking-wide" style={{ fontSize: '1.35rem' }}>riehls</h1>
        </div>
      </header>
      <ReelsFeed />
      <BottomNav />
    </div>
  );
};

export default Index;
