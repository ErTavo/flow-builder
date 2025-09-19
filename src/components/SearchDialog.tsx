import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import type { EditorNode } from '../types/flow';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  nodes: EditorNode[];
  onSelectNode: (nodeId: string) => void;
}

interface SearchResult {
  node: EditorNode;
  matchType: 'key' | 'label' | 'type';
}

const SearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onClose,
  nodes,
  onSelectNode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    nodes.forEach(node => {
      // Buscar por key (prioridad alta)
      if (node.data.key.toLowerCase().includes(term)) {
        results.push({ node, matchType: 'key' });
        return;
      }

      // Buscar por label (prioridad media)
      if (node.data.label && node.data.label.toLowerCase().includes(term)) {
        results.push({ node, matchType: 'label' });
        return;
      }

      // Buscar por tipo (prioridad baja)
      if (typeof node.data.type === 'string' && node.data.type.toLowerCase().includes(term)) {
        results.push({ node, matchType: 'type' });
      }
    });

    // Ordenar resultados por relevancia
    results.sort((a, b) => {
      const priority = { key: 3, label: 2, type: 1 };
      return priority[b.matchType] - priority[a.matchType];
    });

    setSearchResults(results.slice(0, 10)); // Limitar a 10 resultados
  }, [searchTerm, nodes]);

  const handleSelectResult = (result: SearchResult) => {
    onSelectNode(result.node.id);
    onClose();
    setSearchTerm('');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setSearchResults([]);
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'key': return 'primary';
      case 'label': return 'secondary';
      case 'type': return 'default';
      default: return 'default';
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'key': return 'Key';
      case 'label': return 'Label';
      case 'type': return 'Type';
      default: return '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '20%',
          margin: 0,
          maxHeight: '60vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SearchIcon color="primary" />
            <Typography variant="h6">Buscar Step</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <TextField
          fullWidth
          placeholder="Buscar por key, label o tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
        />

        {searchTerm && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {searchResults.length === 0 
                ? 'No se encontraron resultados' 
                : `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} encontrado${searchResults.length !== 1 ? 's' : ''}`
              }
            </Typography>
          </Box>
        )}

        <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
          {searchResults.map((result) => (
            <ListItem key={result.node.id} disablePadding>
              <ListItemButton
                onClick={() => handleSelectResult(result)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2" component="span">
                        {result.node.data.key}
                      </Typography>
                      <Chip
                        label={getMatchTypeLabel(result.matchType)}
                        size="small"
                        color={getMatchTypeColor(result.matchType) as 'primary' | 'secondary' | 'default'}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {result.node.data.label || 'Sin label'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tipo: {typeof result.node.data.type === 'string' ? result.node.data.type : 'unknown'}
                      </Typography>
                    </Box>
                  }
                />
                <NavigateNextIcon color="action" />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {!searchTerm && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Escribe para buscar steps por key, label o tipo
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;