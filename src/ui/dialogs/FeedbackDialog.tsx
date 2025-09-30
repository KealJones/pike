import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
} from '@mui/material';

export function FeedbackDialog({ open, onClose }: DialogProps) {
  return (
    <Dialog fullWidth open={open} onClose={(e, r) => onClose?.(e, r)}>
      <DialogTitle>Leave Feedback</DialogTitle>
      <DialogContent>
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLScbtAAitxpL5hDJRzGR-QTDv4ZqlLMDMjI-LZJqhjOGnL4xWg/viewform?embedded=true"
          width="640"
          height="451"
          frameBorder={0}
          marginHeight={0}
          marginWidth={0}
        >
          Loading…
        </iframe>
      </DialogContent>
      <DialogActions>
        <Button onClick={(e) => onClose?.(e, 'backdropClick')}>Close me</Button>
      </DialogActions>
    </Dialog>
  );
}
