import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
} from '@mui/material';

export function HowToUseDialog({ open, onClose }: DialogProps) {
  return (
    <Dialog fullWidth open={open} onClose={(e, r) => onClose?.(e, r)}>
      <DialogTitle>How To Use</DialogTitle>
      <DialogContent></DialogContent>
      <DialogActions>
        <Button onClick={(e) => onClose?.(e, 'backdropClick')}>Close me</Button>
      </DialogActions>
    </Dialog>
  );
}
