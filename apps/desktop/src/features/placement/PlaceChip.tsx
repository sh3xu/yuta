import { Button } from '@yuta/ui';
import { useCompanionStore } from '../../stores/companion-store';

export function PlaceChip() {
  const place = useCompanionStore((state) => state.placeCompanion);

  return (
    <Button
      type="button"
      size="sm"
      data-yuta-hit="ui"
      className="h-8 w-full rounded-full"
      onClick={() => void place()}
    >
      Place here
    </Button>
  );
}
