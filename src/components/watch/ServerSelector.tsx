import { type ReactNode } from "react";
import { Captions, Mic, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Server } from "@/types/anime";

interface ServerSelectorProps {
  servers: Server[];
  activeServerId: string;
  onServerChange: (serverId: string, type: "sub" | "dub") => void;
  currentType: "sub" | "dub";
  onTypeChange: (type: "sub" | "dub") => void;
  loading?: boolean;
  episodeNumber?: number;
}

const slugifyServer = (name?: string) =>
  (name || "").toString().trim().toLowerCase().replace(/\s+/g, "-");

const ServerSelector = ({
  servers,
  activeServerId,
  onServerChange,
  currentType,
  onTypeChange,
  loading = false,
  episodeNumber,
}: ServerSelectorProps) => {
  const subServers = servers.filter((s) => s.type === "sub");
  const dubServers = servers.filter((s) => s.type === "dub");

  const renderServerButtons = (
    serverList: Server[],
    type: "sub" | "dub",
    label: string,
    icon: ReactNode,
    variant: "sub" | "dub"
  ) => {
    if (serverList.length === 0) return null;

    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${
            variant === "sub"
              ? "bg-primary/15 text-primary border-primary/25"
              : "bg-accent/40 text-accent-foreground border-border/40"
          }`}
        >
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {serverList.map((server) => {
            const serverId = slugifyServer(server.server_name || server.serverName);
            const isActive = activeServerId === serverId && currentType === type;
            return (
              <Button
                key={server.data_id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onTypeChange(type);
                  onServerChange(serverId, type);
                }}
                disabled={loading}
                className={`h-8 text-xs transition-all ${
                  isActive
                    ? "shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                    : "hover:border-primary/40"
                }`}
              >
                <Monitor className="h-3 w-3 mr-1.5" />
                {server.server_name || server.serverName || `Server ${server.server_id}`}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-xl p-4 space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        You're watching{" "}
        <span className="text-primary font-semibold">Episode {episodeNumber}</span>.
        If current server doesn't work, please try another one.
      </p>

      <div className="space-y-3">
        {renderServerButtons(subServers, "sub", "SUB", <Captions className="h-4 w-4" />, "sub")}
        {renderServerButtons(dubServers, "dub", "DUB", <Mic className="h-4 w-4" />, "dub")}
      </div>
    </div>
  );
};

export default ServerSelector;
