import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/checkin";
import { HeartHandshake } from "lucide-react";

export function DisclaimerDialog({
  open,
  onAcknowledge,
}: {
  open: boolean;
  onAcknowledge: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm rounded-3xl [&>button:last-child]:hidden">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-accent">
            <HeartHandshake className="h-5 w-5 text-primary" strokeWidth={1.6} />
          </div>
          <DialogTitle className="text-xl">Before you start</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
        <Button onClick={onAcknowledge} className="mt-2 w-full">
          I understand
        </Button>
      </DialogContent>
    </Dialog>
  );
}
