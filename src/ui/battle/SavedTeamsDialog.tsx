import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getSavedTeams, deleteTeam, updateTeamName, type SavedTeam } from '../../utils/savedTeams';

interface SavedTeamsDialogProps {
  open: boolean;
  onClose: () => void;
  onLoadTeam: (team: SavedTeam) => void;
  targetPlayer: 'player' | 'opponent';
}

export function SavedTeamsDialog({ open, onClose, onLoadTeam, targetPlayer }: SavedTeamsDialogProps) {
  const [teams, setTeams] = useState<SavedTeam[]>(getSavedTeams());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const refreshTeams = () => {
    setTeams(getSavedTeams());
  };

  const handleDelete = (teamId: string) => {
    deleteTeam(teamId);
    refreshTeams();
  };

  const handleStartEdit = (team: SavedTeam) => {
    setEditingId(team.id);
    setEditName(team.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      updateTeamName(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
      refreshTeams();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleLoad = (team: SavedTeam) => {
    onLoadTeam(team);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Load Team for {targetPlayer === 'player' ? 'Player' : 'Opponent'}
      </DialogTitle>
      <DialogContent>
        {teams.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No saved teams yet. Build a team and click "Save Team" to save it.
          </Typography>
        ) : (
          <List>
            {teams.map((team) => (
              <ListItem
                key={team.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemText
                  primary={
                    editingId === team.id ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          size="small"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <IconButton size="small" onClick={handleSaveEdit} color="primary">
                          <CheckIcon />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancelEdit}>
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      team.name
                    )
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {team.pokemon.map((p, idx) => (
                        <Chip
                          key={idx}
                          label={p.speciesName}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleLoad(team)}
                    sx={{ mr: 1 }}
                  >
                    Load
                  </Button>
                  <IconButton
                    edge="end"
                    onClick={() => handleStartEdit(team)}
                    sx={{ mr: 1 }}
                    disabled={editingId !== null}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(team.id)}
                    disabled={editingId !== null}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
