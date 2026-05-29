import { useState } from "react";
import { Mail, MessageCircle, Globe, Shield, Terminal, Zap, Send, ExternalLink, AlertTriangle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const Contact = () => {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message transmitted successfully!");
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 relative overflow-hidden">
      {/* Cyber grid background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.06),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)',
        }} />
      </div>

      {/* Hero */}
      <div className="relative z-10 border-b border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20 rounded-br-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/20 rounded-bl-3xl" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative container max-w-5xl px-4 py-16 md:py-24 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold tracking-widest uppercase">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>COMM://</span> CONTACT.sys
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter"
            style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--primary) / 0.1)' }}>
            <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              OPEN CHANNEL
            </span>
          </h1>

          <p className="text-muted-foreground max-w-lg mx-auto text-sm font-mono">
            {'>'} Establish a direct link with AnyPlay HQ_
            <span className="animate-pulse">|</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 container max-w-5xl px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="border border-primary/15 bg-card/30 backdrop-blur-sm overflow-hidden"
              style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}>
              {/* Header bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-primary/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground tracking-wider ml-2">TRANSMISSION_FORM.tsx</span>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-primary/70 tracking-wider uppercase">{t("contact.name")}</label>
                    <Input
                      placeholder={t("contact.namePlaceholder")}
                      className="bg-background/40 border-primary/15 focus:border-primary/40 rounded-none font-mono text-base md:text-sm placeholder:text-muted-foreground/40"
                      required
                      autoComplete="name"
                      inputMode="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-primary/70 tracking-wider uppercase">{t("contact.email")}</label>
                    <Input
                      type="email"
                      placeholder={t("contact.emailPlaceholder")}
                      className="bg-background/40 border-primary/15 focus:border-primary/40 rounded-none font-mono text-base md:text-sm placeholder:text-muted-foreground/40"
                      required
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-primary/70 tracking-wider uppercase">{t("contact.subject")}</label>
                  <Input
                    placeholder={t("contact.subjectPlaceholder")}
                    className="bg-background/40 border-primary/15 focus:border-primary/40 rounded-none font-mono text-base md:text-sm placeholder:text-muted-foreground/40"
                    required
                    autoComplete="off"
                    inputMode="text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-primary/70 tracking-wider uppercase">{t("contact.message")}</label>
                  <Textarea
                    placeholder={t("contact.messagePlaceholder")}
                    rows={6}
                    className="bg-background/40 border-primary/15 focus:border-primary/40 rounded-none font-mono text-base md:text-sm placeholder:text-muted-foreground/40 resize-none"
                    required
                    autoComplete="off"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-none font-mono uppercase tracking-widest text-xs relative overflow-hidden group h-11"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:from-primary/90 group-hover:to-primary transition-all" />
                  <span className="relative flex items-center gap-2">
                    {sending ? (
                      <><Zap className="h-4 w-4 animate-pulse" /> TRANSMITTING...</>
                    ) : (
                      <><Send className="h-4 w-4" /> TRANSMIT_MESSAGE</>
                    )}
                  </span>
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Discord */}
            <CyberCard
              icon={<MessageCircle className="h-4 w-4" />}
              title="DISCORD_HUB"
              description="Connect with operatives in our encrypted Discord channel."
              action="JOIN_CHANNEL"
              index={1}
            />

            {/* Social */}
            <div className="border border-primary/15 bg-card/30 backdrop-blur-sm p-4 space-y-3"
              style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-mono font-bold tracking-wider uppercase">NETWORKS</h3>
                <div className="flex-1 h-px bg-primary/15" />
                <span className="text-[9px] font-mono text-primary/40">#02</span>
              </div>
              {["Twitter", "Facebook", "Reddit"].map((social) => (
                <button
                  key={social}
                  className="w-full flex items-center justify-between px-3 py-2 border border-primary/10 hover:border-primary/30 bg-background/30 hover:bg-primary/5 text-xs font-mono transition-all group"
                >
                  <span className="text-foreground/80 group-hover:text-primary transition-colors">{social.toUpperCase()}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>

            {/* Report */}
            <CyberCard
              icon={<AlertTriangle className="h-4 w-4" />}
              title="BUG_REPORT"
              description="Found a glitch in the matrix? Report system anomalies here."
              action="FILE_REPORT"
              index={3}
              variant="destructive"
            />

            {/* Status indicator */}
            <div className="border border-primary/10 bg-card/20 p-3 flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_hsl(142_76%_36%/0.5)]" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-30" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-emerald-400 font-bold">ALL SYSTEMS NOMINAL</p>
                <p className="text-[9px] font-mono text-muted-foreground/50">Response time: ~24h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CyberCard = ({
  icon, title, description, action, index, variant = "primary"
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  index: number;
  variant?: "primary" | "destructive";
}) => {
  const isDestructive = variant === "destructive";
  return (
    <div
      className={`border bg-card/30 backdrop-blur-sm p-4 space-y-3 group transition-all ${
        isDestructive ? "border-destructive/15 hover:border-destructive/30" : "border-primary/15 hover:border-primary/30"
      }`}
      style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
    >
      <div className="flex items-center gap-2">
        <span className={isDestructive ? "text-destructive" : "text-primary"}>{icon}</span>
        <h3 className="text-xs font-mono font-bold tracking-wider uppercase">{title}</h3>
        <div className={`flex-1 h-px ${isDestructive ? "bg-destructive/15" : "bg-primary/15"}`} />
        <span className={`text-[9px] font-mono ${isDestructive ? "text-destructive/40" : "text-primary/40"}`}>#{String(index).padStart(2, '0')}</span>
      </div>
      <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">{description}</p>
      <Button
        variant="outline"
        size="sm"
        className={`w-full rounded-none font-mono text-[10px] tracking-widest uppercase transition-all ${
          isDestructive
            ? "border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
            : "border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
        }`}
      >
        {action} <ExternalLink className="h-3 w-3 ml-1.5" />
      </Button>
    </div>
  );
};

export default Contact;
