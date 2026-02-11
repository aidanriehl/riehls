import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Creator {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const Following = () => {
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreator = async () => {
      const { data: adminId } = await supabase.rpc('get_admin_user_id');
      if (adminId) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', adminId)
          .maybeSingle();
        if (data) setCreator(data);
      }
      setLoading(false);
    };
    fetchCreator();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center h-14 px-4 border-b border-border bg-background">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold ml-2">Following</h1>
      </header>

      {/* Following List */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : creator ? (
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/creator')}
          >
            <UserAvatar
              src={creator.avatar_url}
              name={creator.display_name || creator.username}
              className="w-12 h-12"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm truncate">
                  {creator.username || 'aidan'}
                </span>
                <span className="text-xs text-primary">✓</span>
              </div>
              <span className="text-sm text-muted-foreground truncate block">
                {creator.display_name || 'Aidan Riehl'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-sm font-semibold"
            >
              Following
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Following;
