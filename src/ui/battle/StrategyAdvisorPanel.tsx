/**
 * StrategyAdvisorPanel - Real-time strategy recommendations
 * Shows optimal play suggestions and simulation results
 */

import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Collapse,
  IconButton,
  Stack,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ShieldIcon from '@mui/icons-material/Shield';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BoltIcon from '@mui/icons-material/Bolt';
import { useState, useEffect } from 'react';
import { useBattleStore } from '../../stores/battleStore';
import { getTurnRecommendation, type TurnRecommendation } from '../../utils/pvp/battleStrategy';

export function StrategyAdvisorPanel() {
  const {
    playerTeam,
    opponentTeam,
    currentTurn,
    isActive,
    strategyAdvisor,
    toggleStrategyAdvisor,
    runSimulation,
    findBestStrategy,
  } = useBattleStore();

  const [expanded, setExpanded] = useState(true);
  const [recommendation, setRecommendation] = useState<TurnRecommendation | null>(null);

  // Update recommendation on turn change
  useEffect(() => {
    if (isActive && playerTeam.pokemon.length > 0 && opponentTeam.pokemon.length > 0) {
      const rec = getTurnRecommendation(playerTeam, opponentTeam, currentTurn);
      setRecommendation(rec);
    }
  }, [currentTurn, isActive, playerTeam, opponentTeam]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'fast':
        return <BoltIcon color="primary" />;
      case 'charged':
        return <AutoAwesomeIcon color="secondary" />;
      case 'switch':
        return <SwapHorizIcon color="info" />;
      case 'shield':
        return <ShieldIcon color="warning" />;
      default:
        return <TipsAndUpdatesIcon />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'error';
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        border: strategyAdvisor.enabled ? '2px solid' : '1px solid',
        borderColor: strategyAdvisor.enabled ? 'primary.main' : 'divider',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          bgcolor: strategyAdvisor.enabled ? 'primary.dark' : 'grey.800',
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <TipsAndUpdatesIcon />
          <Typography variant="subtitle1" fontWeight="bold">
            Strategy Advisor
          </Typography>
          <Chip
            label={strategyAdvisor.enabled ? 'ON' : 'OFF'}
            size="small"
            color={strategyAdvisor.enabled ? 'success' : 'default'}
            onClick={toggleStrategyAdvisor}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ color: 'white' }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Current Recommendation */}
          {recommendation && strategyAdvisor.enabled && (
            <Alert
              severity="info"
              icon={getActionIcon(recommendation.action)}
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                Recommended: {recommendation.action.toUpperCase()}
              </Typography>
              <Typography variant="body2">
                {recommendation.explanation}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Typography variant="caption">Confidence:</Typography>
                <LinearProgress
                  variant="determinate"
                  value={recommendation.confidence * 100}
                  color={getConfidenceColor(recommendation.confidence)}
                  sx={{ flex: 1, height: 6, borderRadius: 1 }}
                />
                <Typography variant="caption">
                  {Math.round(recommendation.confidence * 100)}%
                </Typography>
              </Box>
              {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Alternatives: {recommendation.alternatives.join(', ')}
                </Typography>
              )}
            </Alert>
          )}

          {/* Simulation Controls */}
          <Stack direction="row" spacing={1} mb={2}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={runSimulation}
              disabled={!playerTeam.pokemon.length}
            >
              Simulate Battle
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AutoAwesomeIcon />}
              onClick={findBestStrategy}
              disabled={!playerTeam.pokemon.length}
            >
              Find Best Strategy
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Simulation Results */}
          {strategyAdvisor.simulationResult && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Simulation Result
              </Typography>
              
              <Box 
                sx={{ 
                  p: 1.5, 
                  bgcolor: strategyAdvisor.simulationResult.winner === 'player' 
                    ? 'success.dark' 
                    : strategyAdvisor.simulationResult.winner === 'opponent'
                    ? 'error.dark'
                    : 'grey.700',
                  color: 'white',
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Typography variant="h6" textAlign="center">
                  {strategyAdvisor.simulationResult.winner === 'player' 
                    ? '🏆 Victory!' 
                    : strategyAdvisor.simulationResult.winner === 'opponent'
                    ? '❌ Defeat'
                    : '🤝 Draw'}
                </Typography>
                <Typography variant="body2" textAlign="center">
                  Battle Rating: {Math.round(strategyAdvisor.simulationResult.battleRating)}
                </Typography>
              </Box>

              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Turns elapsed:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {strategyAdvisor.simulationResult.turnsElapsed}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Your remaining HP:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {Math.round(strategyAdvisor.simulationResult.playerRemainingHP)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Opponent remaining HP:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {Math.round(strategyAdvisor.simulationResult.opponentRemainingHP)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Your Pokémon remaining:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {strategyAdvisor.simulationResult.playerPokemonRemaining}/3
                  </Typography>
                </Box>
              </Stack>

              {/* Key Moves */}
              {strategyAdvisor.simulationResult.moveSequence.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Key Strategy Points
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {strategyAdvisor.simulationResult.moveSequence
                      .filter(m => m.action === 'charged' || m.action === 'switch' || m.action === 'shield')
                      .slice(0, 10)
                      .map((move, i) => (
                        <ListItem key={i} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {getActionIcon(move.action)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography 
                                variant="body2"
                                color={move.player === 'player' ? 'success.main' : 'error.main'}
                              >
                                Turn {move.turn}: {move.details}
                              </Typography>
                            }
                            secondary={move.recommendation}
                          />
                        </ListItem>
                      ))}
                  </List>
                </Box>
              )}
            </Box>
          )}

          {/* Enable prompt */}
          {!strategyAdvisor.enabled && (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enable Strategy Advisor for real-time recommendations
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={toggleStrategyAdvisor}
                startIcon={<TipsAndUpdatesIcon />}
              >
                Enable Advisor
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
