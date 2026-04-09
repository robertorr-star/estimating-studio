import { useState, useEffect } from 'react';
import { Shield, Star, Clock, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';

const Header = () => {
  const [time, setTime] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
        {/* Left - Logo & Branding */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded border border-primary/30 bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-heading font-bold tracking-wider text-primary uppercase truncate">
                OCD Estimating Studio
              </h1>
              <p className="text-[8px] sm:text-[10px] font-mono text-muted-foreground tracking-widest uppercase truncate">
                Orr Construction & Development
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="hidden md:flex items-center gap-2 ml-4">
            {['DVBE', 'SDVOSB', '184 INF'].map((badge) => (
              <span
                key={badge}
                className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider border border-primary/30 rounded bg-primary/5 text-primary uppercase"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Right - Clock & Status */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' '}
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-success animate-green-pulse" />
            <span className="text-[10px] font-mono text-success uppercase tracking-wider">Online</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border">
            <Star className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-mono text-muted-foreground">CSLB #1028720</span>
          </div>
          {user && (
            <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-3 border-l border-border">
              <span className="text-[10px] sm:text-xs font-mono text-muted-foreground truncate max-w-[60px] sm:max-w-none">
                {user.user_metadata?.display_name || user.email?.split('@')[0]}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSignOut} title="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
