import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Paper,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import type { GlobalKeyword } from '../types/flow';

interface GlobalsPanelProps {
  globals: GlobalKeyword[];
  onUpdateGlobals: (globals: GlobalKeyword[]) => void;
  availableStates?: string[];
}

export const GlobalsPanel: React.FC<GlobalsPanelProps> = ({
  globals,
  onUpdateGlobals,
  availableStates = []
}) => {
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editingGlobal, setEditingGlobal] = useState<GlobalKeyword | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState('');

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingGlobal({
      keywords: [],
      stateKey: availableStates[0] || ''
    });
    setKeywordsInput('');
  };

  const handleEdit = (index: number) => {
    setIsEditing(index);
    setEditingGlobal(globals[index]);
    setKeywordsInput(globals[index].keywords.join(', '));
  };

  const handleSave = () => {
    if (!editingGlobal?.stateKey || !keywordsInput.trim()) {
      return;
    }

    // Convert comma-separated string to array and filter empty
    const filteredKeywords = keywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    if (!filteredKeywords.length) {
      return;
    }

    const globalToSave = {
      ...editingGlobal,
      keywords: filteredKeywords
    };

    const newGlobals = [...globals];
    if (isAddingNew) {
      newGlobals.push(globalToSave);
    } else if (isEditing !== null) {
      newGlobals[isEditing] = globalToSave;
    }

    onUpdateGlobals(newGlobals);
    handleCancel();
  };

  const handleCancel = () => {
    setIsEditing(null);
    setEditingGlobal(null);
    setIsAddingNew(false);
    setKeywordsInput('');
  };

  const handleDelete = (index: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta palabra clave global?')) {
      const newGlobals = globals.filter((_, i) => i !== index);
      onUpdateGlobals(newGlobals);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Palabras Clave Globales
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Las palabras clave globales permiten al usuario navegar a estados específicos desde cualquier punto del flujo.
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
          disabled={isAddingNew || isEditing !== null}
          sx={{ mb: 2, alignSelf: 'flex-start' }}
          size="small"
        >
          Agregar Global
        </Button>

        {/* Scrollable content area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          maxHeight: 'calc(100vh - 300px)' // Adjust based on your layout
        }}>
          {globals.length === 0 && !isAddingNew ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 100,
              color: 'text.secondary' 
            }}>
              <Typography variant="body2">
                No hay palabras clave globales configuradas
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ p: 0 }}>
              {globals.map((global, index) => (
                <React.Fragment key={index}>
                  {isEditing === index ? (
                    <ListItem sx={{ display: 'block', bgcolor: 'action.hover', p: 2 }}>
                      <TextField
                        label="Palabras Clave"
                        value={keywordsInput}
                        onChange={(e) => setKeywordsInput(e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                        helperText="Separa múltiples palabras con comas"
                        placeholder="Ej: menu, ayuda, salir"
                      />
                      
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Estado Destino</InputLabel>
                        <Select
                          value={editingGlobal?.stateKey || ''}
                          onChange={(e) => setEditingGlobal(prev => 
                            prev ? { ...prev, stateKey: e.target.value } : null
                          )}
                          label="Estado Destino"
                        >
                          {availableStates.map(state => (
                            <MenuItem key={state} value={state}>{state}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Stack direction="row" spacing={1}>
                        <Button
                          onClick={handleSave}
                          variant="contained"
                          startIcon={<SaveIcon />}
                          size="small"
                          color="primary"
                        >
                          Guardar
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          size="small"
                        >
                          Cancelar
                        </Button>
                      </Stack>
                    </ListItem>
                  ) : (
                    <ListItem divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                            {global.keywords.map((keyword, kidx) => (
                              <Chip 
                                key={kidx} 
                                label={keyword} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                              />
                            ))}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            → {global.stateKey}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={0}>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEdit(index)}
                            size="small"
                            disabled={isEditing !== null || isAddingNew}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDelete(index)}
                            size="small"
                            disabled={isEditing !== null || isAddingNew}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  )}
                  {index < globals.length - 1 && <Divider />}
                </React.Fragment>
              ))}

              {/* Add new form */}
              {isAddingNew && (
                <ListItem sx={{ display: 'block', bgcolor: 'primary.50', p: 2 }}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'transparent', border: '2px dashed', borderColor: 'primary.main' }}>
                    <TextField
                      label="Palabras Clave"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                      helperText="Separa múltiples palabras con comas"
                      placeholder="Ej: menu, ayuda, salir"
                      autoFocus
                    />
                    
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Estado Destino</InputLabel>
                      <Select
                        value={editingGlobal?.stateKey || ''}
                        onChange={(e) => setEditingGlobal(prev => 
                          prev ? { ...prev, stateKey: e.target.value } : null
                        )}
                        label="Estado Destino"
                      >
                        <MenuItem value="">Seleccionar estado...</MenuItem>
                        {availableStates.map(state => (
                          <MenuItem key={state} value={state}>{state}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Stack direction="row" spacing={1}>
                      <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        size="small"
                        color="primary"
                        disabled={!keywordsInput.trim() || !editingGlobal?.stateKey}
                      >
                        Guardar
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        size="small"
                      >
                        Cancelar
                      </Button>
                    </Stack>
                  </Paper>
                </ListItem>
              )}
            </List>
          )}
        </Box>

        {globals.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Total: {globals.length} palabra{globals.length !== 1 ? 's' : ''} clave{globals.length !== 1 ? 's' : ''} global{globals.length !== 1 ? 'es' : ''}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};