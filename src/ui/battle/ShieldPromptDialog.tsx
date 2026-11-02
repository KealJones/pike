/**
 * ShieldPromptDialog - Modal prompt for shield decision
 * Appears when opponent uses a charged move and player has shields
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningIcon from '@mui/icons-material/Warning';
import { useBattleStore } from '../../stores/battleStore';

export function ShieldPromptDialog() {
  const { shieldPrompt, playerRespondToShield } = useBattleStore();

  if (!shieldPrompt.isActive || !shieldPrompt.incomingMove || !shieldPrompt.analysis) {
    return null;
  }

  const { incomingMove, attacker, defender, analysis } = shieldPrompt;

  const damagePercent = Math.round((analysis.damageIfNotShielded / (defender?.maxHP || 1)) * 100);
  const hpAfterDamage = Math.max(0, (defender?.currentHP || 0) - analysis.damageIfNotShielded);

  return (
    <Dialog
      open={shieldPrompt.isActive}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: analysis.wouldFaintWithoutShield ? '3px solid' : '1px solid',
          borderColor: analysis.wouldFaintWithoutShield ? 'error.main' : 'divider',
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: 'error.dark', color: 'white', py: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon />
          <Typography variant="h6">Incoming Charged Attack!</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Attack Info */}
        <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {attacker?.speciesName} is using:
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5" fontWeight="bold">
              {incomingMove.name}
            </Typography>
            <Chip 
              label={incomingMove.type} 
              size="small" 
              color="primary"
              sx={{ textTransform: 'capitalize' }}
            />
            <Chip 
              label={`${incomingMove.power} power`} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Paper>

        {/* Damage Preview */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Damage if not shielded: <strong>{analysis.damageIfNotShielded} HP ({damagePercent}%)</strong>
          </Typography>
          
          {/* HP Bar Preview */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current HP: {defender?.currentHP}/{defender?.maxHP}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(defender?.currentHP || 0) / (defender?.maxHP || 1) * 100}
              color="success"
              sx={{ height: 10, borderRadius: 1, mb: 0.5 }}
            />
            
            <Typography variant="caption" color="text.secondary">
              HP after hit: {hpAfterDamage}/{defender?.maxHP}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={hpAfterDamage / (defender?.maxHP || 1) * 100}
              color={hpAfterDamage === 0 ? 'error' : 'warning'}
              sx={{ height: 10, borderRadius: 1 }}
            />
          </Box>
        </Box>

        {/* Shield Info */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ShieldIcon color="info" />
          <Typography>
            Shields remaining: <strong>{defender?.shields || 0}</strong>
          </Typography>
        </Box>

        {/* AI Recommendation */}
        <Alert 
          severity={analysis.shouldShield ? 'warning' : 'info'}
          icon={<ShieldIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Strategy Recommendation:
          </Typography>
          <Typography variant="body2">
            {analysis.reason}
          </Typography>
        </Alert>

        {/* Critical Warning */}
        {analysis.wouldFaintWithoutShield && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography fontWeight="bold">
              ⚠️ {defender?.speciesName} will faint if you don't shield!
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 2 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => playerRespondToShield(false)}
          color="error"
          sx={{ flex: 1, py: 1.5 }}
        >
          Don't Shield
          <Typography variant="caption" display="block">
            Take {analysis.damageIfNotShielded} damage
          </Typography>
        </Button>
        
        <Button
          variant="contained"
          size="large"
          onClick={() => playerRespondToShield(true)}
          disabled={(defender?.shields || 0) <= 0}
          startIcon={<ShieldIcon />}
          sx={{ flex: 1, py: 1.5 }}
        >
          Use Shield
          <Typography variant="caption" display="block">
            Take only {analysis.damageIfShielded} damage
          </Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
