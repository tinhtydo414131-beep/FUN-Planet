import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import MyRewardsPanel from './MyRewardsPanel';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RewardsModal = ({ isOpen, onClose }: RewardsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
        <VisuallyHidden>
          <DialogTitle>My Rewards</DialogTitle>
        </VisuallyHidden>
        <MyRewardsPanel onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default RewardsModal;
