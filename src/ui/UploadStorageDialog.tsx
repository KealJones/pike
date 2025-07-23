import {
  type DialogProps,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { Suspense } from 'react';
import { Upload } from '@mui/icons-material';
import PokemonStorageUploader from './PokemonStorageUploader';
import { useAppStore, usePokemonStorage } from '../AppStore';
import { useDialogs } from '@toolpad/core';

export function UploadStorageDialog({ open, onClose }: DialogProps) {
  const gameMasterPromise = useAppStore((state) => state.gameMasterPromise);
  const setPokemonStorage = usePokemonStorage((state) => state.updatePokemonStorage);
  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTitle>Upload new Pokémon Storage</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Upload a CSV export from Poke Genie
          <Box component="span" sx={{ display: 'none' }}>
            {' '}
            or a JSON export from SpooferPro (it is so much easier).
          </Box>
        </DialogContentText>
        <Suspense fallback={<div>Loading uploader...</div>}>
          <PokemonStorageUploader
            gameMasterPromise={gameMasterPromise}
            setPokemonStorage={(ps) =>{ setPokemonStorage(ps); onClose?.({}, 'escapeKeyDown')} }
          />
        </Suspense>
      </DialogContent>
      <DialogActions>
        <Button onClick={(e) => onClose?.(e, 'escapeKeyDown')}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

export const UploadStorageDialogTrigger = () => {
  const dialogManager = useDialogs();
  return (
    <IconButton onClick={() => dialogManager.open(UploadStorageDialog)}>
      <Upload />
    </IconButton>
  );
};
