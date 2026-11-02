/**
 * BattleLog - Displays battle events
 */

import { Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import { useBattleStore } from '../../stores/battleStore';
import { useEffect, useRef } from 'react';

export function BattleLog() {
  const battleLog = useBattleStore((state) => state.battleLog);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  return (
    <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Battle Log
      </Typography>
      <List dense>
        {battleLog.map((event, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={event.message}
              secondary={`Turn ${event.turn}`}
              primaryTypographyProps={{
                variant: 'body2',
                color:
                  event.type === 'fainted'
                    ? 'error'
                    : event.type === 'buff-applied'
                      ? 'success.main'
                      : 'text.primary',
              }}
              secondaryTypographyProps={{
                variant: 'caption',
              }}
            />
          </ListItem>
        ))}
        <div ref={logEndRef} />
      </List>
    </Paper>
  );
}
