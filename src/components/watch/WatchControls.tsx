import {
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface WatchControlsProps {
  autoPlay: boolean;
  setAutoPlay: (value: boolean) => void;
  autoNext: boolean;
  setAutoNext: (value: boolean) => void;
  autoSkip: boolean;
  setAutoSkip: (value: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

const WatchControls = ({
  autoPlay,
  setAutoPlay,
  autoNext,
  setAutoNext,
  autoSkip,
  setAutoSkip,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: WatchControlsProps) => {
  return (
    <div className="flex items-center justify-between glass-panel rounded-xl px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Switch id="auto-play" checked={autoPlay} onCheckedChange={setAutoPlay} className="scale-[0.65]" />
          <Label htmlFor="auto-play" className="text-[11px] text-muted-foreground cursor-pointer whitespace-nowrap">Auto Play</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="auto-next" checked={autoNext} onCheckedChange={setAutoNext} className="scale-[0.65]" />
          <Label htmlFor="auto-next" className="text-[11px] text-muted-foreground cursor-pointer whitespace-nowrap">Auto Next</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="auto-skip" checked={autoSkip} onCheckedChange={setAutoSkip} className="scale-[0.65] data-[state=checked]:bg-primary" />
          <Label htmlFor="auto-skip" className={`text-[11px] cursor-pointer whitespace-nowrap ${autoSkip ? "text-primary" : "text-muted-foreground"}`}>Auto Skip</Label>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={!hasPrev} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40">
          <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />Prev
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext} disabled={!hasNext} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40">
          Next<ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
};

export default WatchControls;
