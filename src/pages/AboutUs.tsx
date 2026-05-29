import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Crown, Heart, User, ExternalLink, Sparkles, DollarSign, Users, Zap, Shield, Terminal, Cpu, CircuitBoard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  bio: string | null;
  user_id: string | null;
}

interface Donation {
  id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  message: string | null;
  created_at: string;
  profile?: { username: string | null; avatar_url: string | null };
}

const AboutUs = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [glitchText, setGlitchText] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: teamData }, { data: donationData }] = await Promise.all([
        supabase.from("team_members").select("*").order("display_order"),
        supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setTeam(teamData || []);
      if (donationData && donationData.length > 0) {
        const userIds = [...new Set(donationData.filter((d: any) => d.user_id).map((d: any) => d.user_id))];
        const { data: profiles } = userIds.length > 0
          ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
          : { data: [] };
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        setDonations(donationData.map((d: any) => ({ ...d, profile: d.user_id ? profileMap.get(d.user_id) : null })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleDonate = () => {
    toast("Stripe donation coming soon!");
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 relative overflow-hidden">
      {/* Cyber grid background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.06),transparent_50%)]" />
        {/* Scanline effect */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)',
        }} />
      </div>

      {/* Hero */}
      <div className="relative z-10 overflow-hidden border-b border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent" />
        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20 rounded-br-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/20 rounded-bl-3xl" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative container max-w-5xl px-4 py-20 md:py-28 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold tracking-widest uppercase">
            <Terminal className="h-3.5 w-3.5" />
            <span className="animate-pulse">SYS://</span> ABOUT_US.exe
          </div>

          <h1 className={`text-4xl md:text-6xl font-black tracking-tighter transition-all ${glitchText ? 'translate-x-0.5 text-primary' : ''}`}
            style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--primary) / 0.1)' }}>
            <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              THE CREW
            </span>
          </h1>

          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base font-mono">
            {'>'} A rogue squad of developers & anime lovers building the future of streaming_
            <span className="animate-pulse">|</span>
          </p>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-6 pt-4">
            {[
              { label: "UPTIME", value: "99.9%" },
              { label: "STREAMS", value: "∞" },
              { label: "SQUAD", value: String(team.length || "...") },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl md:text-2xl font-black text-primary font-mono">{value}</p>
                <p className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase font-mono">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 container max-w-5xl px-4 py-10 space-y-14">
        {/* Team Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
            <Cpu className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black tracking-tight uppercase font-mono">Operators</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-primary/10 bg-card/40 rounded-none p-6 animate-pulse space-y-3">
                  <div className="w-20 h-20 rounded-full bg-muted mx-auto" />
                  <div className="h-4 bg-muted rounded w-24 mx-auto" />
                </div>
              ))}
            </div>
          ) : team.length === 0 ? (
            <div className="border border-dashed border-primary/20 bg-card/30 p-12 text-center space-y-4">
              <div className="relative inline-block">
                <Users className="h-12 w-12 text-primary/30 mx-auto" />
                <Zap className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-muted-foreground text-sm font-mono">// team_data.loading = false; members.length === 0</p>
              <p className="text-xs text-muted-foreground">Operator profiles initializing soon...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {team.map((member, i) => (
                <div
                  key={member.id}
                  className="group relative border border-primary/10 hover:border-primary/40 bg-card/40 hover:bg-card/70 backdrop-blur-sm p-6 text-center space-y-3 transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
                >
                  {/* Corner accents */}
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/30 group-hover:border-primary/60 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/30 group-hover:border-primary/60 transition-colors" />

                  {/* Rank number */}
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-primary/40 group-hover:text-primary/70">
                    #{String(i + 1).padStart(2, '0')}
                  </div>

                  <div className="relative mx-auto w-20 h-20">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                        loading="lazy"
                        width={80}
                        height={80}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                        <User className="h-8 w-8 text-primary/60" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card border border-primary/40 flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary)/0.3)]" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
                      <Crown className="h-3 w-3 text-primary" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm tracking-wide">{member.name}</h3>
                    <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 mt-1 rounded-none font-mono uppercase tracking-wider">
                      {member.role}
                    </Badge>
                  </div>

                  {member.bio && <p className="text-[11px] text-muted-foreground line-clamp-2 font-mono">{member.bio}</p>}

                  {member.user_id && (
                    <Link to={`/user/${member.user_id}`} className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-mono transition-colors">
                      ACCESS_PROFILE <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Donation Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-destructive rounded-full shadow-[0_0_10px_hsl(var(--destructive)/0.5)]" />
              <Heart className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-black tracking-tight uppercase font-mono">Fund the Mission</h2>
            </div>
            <Button
              onClick={handleDonate}
              className="gap-2 rounded-none font-mono uppercase tracking-wider text-xs relative overflow-hidden group"
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:from-primary/90 group-hover:to-primary transition-all" />
              <span className="relative flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> INJECT_FUNDS
              </span>
            </Button>
          </div>

          <div className="border border-primary/10 bg-card/30 backdrop-blur-sm p-4 font-mono text-xs text-muted-foreground">
            <span className="text-primary">{'>'}</span> Help keep AnyPlay alive. Your credits fund servers, development & the anime revolution.
            <span className="animate-pulse">_</span>
          </div>

          {donations.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-primary/70 tracking-widest uppercase flex items-center gap-2">
                <CircuitBoard className="h-3.5 w-3.5" /> Transaction Log
              </h3>
              <div className="border border-primary/10 bg-card/30 divide-y divide-primary/5">
                {donations.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors group">
                    <span className="text-[9px] font-mono text-muted-foreground/50 w-6">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {d.user_id ? (
                      <Link to={`/user/${d.user_id}`} className="shrink-0">
                        {d.profile?.avatar_url ? (
                          <img 
                            src={d.profile.avatar_url} 
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/20 group-hover:ring-primary/50 transition-all" 
                            loading="lazy"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                            <User className="h-3.5 w-3.5 text-primary/60" />
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {d.user_id ? (
                          <Link to={`/user/${d.user_id}`} className="text-xs font-mono font-bold text-primary hover:underline truncate">
                            {d.profile?.username || "ANON_USER"}
                          </Link>
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground">ANON_USER</span>
                        )}
                        <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 rounded-none font-mono">
                          +${(d.amount / 100).toFixed(2)}
                        </Badge>
                      </div>
                      {d.message && <p className="text-[10px] text-muted-foreground/70 truncate font-mono">// {d.message}</p>}
                    </div>
                    <span className="text-[9px] text-muted-foreground/40 font-mono shrink-0">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-primary/15 bg-card/20 p-10 text-center space-y-3">
              <Heart className="h-8 w-8 text-primary/20 mx-auto" />
              <p className="text-sm text-muted-foreground font-mono">// No transactions logged yet</p>
              <p className="text-xs text-muted-foreground/60 font-mono">Be the first operator to fund the mission</p>
            </div>
          )}
        </section>

        {/* Footer tagline */}
        <div className="text-center pt-6 border-t border-primary/10">
          <p className="text-[10px] font-mono text-muted-foreground/40 tracking-widest uppercase">
            AnyPlay © {new Date().getFullYear()} // All systems nominal // Built with 💜
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
