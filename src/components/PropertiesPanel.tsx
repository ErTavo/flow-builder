import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Sync as SyncIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { EditorNode, YumpiiTransition, Content, TextValue, ButtonValue, MediaValue, DocumentValue } from '../types/flow';

interface PropertiesPanelProps {
  node: EditorNode | null;
  onUpdateNode: (nodeId: string, updates: Partial<EditorNode['data']>) => void;
  onDeleteNode: (nodeId: string) => void;
  availableStates: Array<{ key: string; label: string }>;
  onSyncTransitions: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  node,
  onUpdateNode,
  onDeleteNode,
  availableStates,
  onSyncTransitions,
}) => {
  const [localData, setLocalData] = useState(node?.data || null);
  const [newTransition, setNewTransition] = useState({
    type: 'contains',
    value: '',
    targetState: '',
    condition: '',
    useScript: false
  });
  const [newVariable, setNewVariable] = useState({
    name: '',
    value: ''
  });
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [editingTransitionIndex, setEditingTransitionIndex] = useState<number | null>(null);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editingContentIndex, setEditingContentIndex] = useState<number | null>(null);
  const [newContent, setNewContent] = useState({
    type: 'text' as 'text' | 'button' | 'image' | 'audio' | 'video' | 'document',
    text: '',
    url: '',
    caption: '',
    filename: '',
    buttons: [] as { id: string; title: string }[]
  });
  const [scriptConfig, setScriptConfig] = useState({
    script: '',
    endpoint: '',
    method: 'POST',
    headers: '{}',
    body: '{}',
    targetState: ''
  });

  useEffect(() => {
    setLocalData(node?.data || null);
  }, [node]);

  if (!node || !localData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Selecciona un nodo para ver sus propiedades
        </Typography>
      </Box>
    );
  }

  const handleChange = (field: keyof typeof localData, value: unknown) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdateNode(node.id, { [field]: value });
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este nodo?')) {
      onDeleteNode(node.id);
    }
  };

  const handleAddTransition = () => {
    if (!newTransition.targetState) {
      alert('Por favor selecciona el estado de destino');
      return;
    }

    // Verificar valor requerido para ciertos tipos
    if (!newTransition.value && ['contains', 'exact', 'regex'].includes(newTransition.type)) {
      alert('Por favor completa el valor de la transición');
      return;
    }

    // Si es tipo script o auto con script, abrir modal para configuración avanzada
    if (newTransition.type === 'script' || (newTransition.type === 'auto' && newTransition.useScript)) {
      setScriptConfig({
        ...scriptConfig,
        targetState: newTransition.targetState
      });
      setScriptModalOpen(true);
      return;
    }

    const currentTransitions = localData.transitions || [];
    const updatedTransitions: YumpiiTransition[] = [...currentTransitions, {
      type: newTransition.type as 'auto' | 'contains' | 'exact' | 'script' | 'regex',
      value: newTransition.value,
      next: newTransition.targetState,
      delay: newTransition.condition ? parseInt(newTransition.condition) : undefined
    }];

    const newData = { ...localData, transitions: updatedTransitions };
    setLocalData(newData);
    onUpdateNode(node.id, { transitions: updatedTransitions });

    // Reset form
    setNewTransition({
      type: 'contains',
      value: '',
      targetState: '',
      condition: '',
      useScript: false
    });
  };

  const handleDeleteTransition = (index: number) => {
    const currentTransitions = localData.transitions || [];
    const updatedTransitions = currentTransitions.filter((_, i) => i !== index);
    
    const newData = { ...localData, transitions: updatedTransitions };
    setLocalData(newData);
    onUpdateNode(node.id, { transitions: updatedTransitions });
  };

  const handleAddVariable = () => {
    if (!newVariable.name || !newVariable.value) {
      alert('Por favor completa el nombre y valor de la variable');
      return;
    }

    const currentVariables = localData.variable_replace || {};
    const updatedVariables = {
      ...currentVariables,
      [newVariable.name]: newVariable.value
    };

    const newData = { ...localData, variable_replace: updatedVariables };
    setLocalData(newData);
    onUpdateNode(node.id, { variable_replace: updatedVariables });

    // Reset form
    setNewVariable({
      name: '',
      value: ''
    });
  };

  const handleDeleteVariable = (variableName: string) => {
    const currentVariables = localData.variable_replace || {};
    const updatedVariables = { ...currentVariables };
    delete updatedVariables[variableName];
    
    const newData = { ...localData, variable_replace: updatedVariables };
    setLocalData(newData);
    onUpdateNode(node.id, { variable_replace: updatedVariables });
  };

  const handleSaveScriptTransition = () => {
    try {
      const currentTransitions = localData.transitions || [];
      
      // Parse JSON strings
      const headers = JSON.parse(scriptConfig.headers);
      const body = JSON.parse(scriptConfig.body);
      
      // Determinar el tipo: si venimos de una transición auto con script, usar 'auto', sino 'script'
      const transitionType = newTransition.type === 'auto' && newTransition.useScript ? 'auto' : 'script';
      
      const scriptTransition: YumpiiTransition = {
        type: transitionType,
        next: scriptConfig.targetState,
        params: {
          script: scriptConfig.script,
          params: {
            body: body,
            method: scriptConfig.method,
            headers: headers,
            endpoint: scriptConfig.endpoint
          }
        },
        variable_replace: {}
      };

      let updatedTransitions;
      if (editingTransitionIndex !== null) {
        // Editing existing transition
        updatedTransitions = [...currentTransitions];
        updatedTransitions[editingTransitionIndex] = scriptTransition;
      } else {
        // Adding new transition
        updatedTransitions = [...currentTransitions, scriptTransition];
      }

      const newData = { ...localData, transitions: updatedTransitions };
      setLocalData(newData);
      onUpdateNode(node.id, { transitions: updatedTransitions });

      // Reset forms and close modal
      setScriptModalOpen(false);
      setEditingTransitionIndex(null);
      setScriptConfig({
        script: '',
        endpoint: '',
        method: 'POST',
        headers: '{}',
        body: '{}',
        targetState: ''
      });
      setNewTransition({
        type: 'contains',
        value: '',
        targetState: '',
        condition: '',
        useScript: false
      });
    } catch (error: unknown) {
      console.error('Error in script configuration:', error);
      alert('Error en la configuración JSON. Por favor verifica el formato.');
    }
  };

  const handleEditScriptTransition = (index: number) => {
    const transition = localData.transitions?.[index];
    if (transition && (transition.type === 'script' || transition.type === 'auto') && transition.params) {
      setEditingTransitionIndex(index);
      setScriptConfig({
        script: transition.params.script || '',
        endpoint: transition.params.params?.endpoint || '',
        method: transition.params.params?.method || 'POST',
        headers: JSON.stringify(transition.params.params?.headers || {}, null, 2),
        body: JSON.stringify(transition.params.params?.body || {}, null, 2),
        targetState: transition.next || ''
      });
      setScriptModalOpen(true);
    }
  };

  const handleAddContent = () => {
    setEditingContentIndex(null);
    setNewContent({
      type: 'text',
      text: '',
      url: '',
      caption: '',
      filename: '',
      buttons: []
    });
    setContentModalOpen(true);
  };

  const handleEditContent = (index: number) => {
    const content = localData.content?.[index];
    if (content) {
      setEditingContentIndex(index);
      
      // Reset new content with current content data
      setNewContent({
        type: content.type,
        text: content.type === 'text' ? (content.value as any).text || '' : '',
        url: ['image', 'audio', 'video', 'document'].includes(content.type) ? (content.value as any).url || '' : '',
        caption: (content.value as any).caption || '',
        filename: content.type === 'document' ? (content.value as any).filename || '' : '',
        buttons: content.type === 'button' ? (content.value as any).buttons || [] : []
      });
      
      setContentModalOpen(true);
    }
  };

  const handleSaveContent = () => {
    try {
      const currentContent = localData.content || [];
      
      let contentValue: any;
      
      switch (newContent.type) {
        case 'text':
          contentValue = { text: newContent.text };
          break;
        case 'button':
          contentValue = {
            buttons: newContent.buttons,
            header: { url: '', text: '', type: 'text' },
            bodyText: '',
            footerText: ''
          };
          break;
        case 'image':
        case 'audio':
        case 'video':
          contentValue = { url: newContent.url, caption: newContent.caption };
          break;
        case 'document':
          contentValue = { 
            url: newContent.url, 
            caption: newContent.caption,
            filename: newContent.filename 
          };
          break;
        default:
          contentValue = {};
      }
      
      const newContentItem = {
        type: newContent.type,
        value: contentValue
      };

      let updatedContent;
      if (editingContentIndex !== null) {
        // Editing existing content
        updatedContent = [...currentContent];
        updatedContent[editingContentIndex] = newContentItem;
      } else {
        // Adding new content
        updatedContent = [...currentContent, newContentItem];
      }

      const newData = { ...localData, content: updatedContent };
      setLocalData(newData);
      onUpdateNode(node.id, { content: updatedContent });

      // Reset and close modal
      setContentModalOpen(false);
      setEditingContentIndex(null);
      setNewContent({
        type: 'text',
        text: '',
        url: '',
        caption: '',
        filename: '',
        buttons: []
      });
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error al guardar el contenido');
    }
  };

  const handleDeleteContent = (index: number) => {
    const currentContent = localData.content || [];
    const updatedContent = currentContent.filter((_, i) => i !== index);
    
    const newData = { ...localData, content: updatedContent };
    setLocalData(newData);
    onUpdateNode(node.id, { content: updatedContent });
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="div">
              Propiedades del Nodo
            </Typography>
            <IconButton 
              color="error" 
              onClick={handleDelete}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>

          <Chip 
            label={node.type.toUpperCase()} 
            color={node.type === 'start' ? 'primary' : node.type === 'end' ? 'error' : 'secondary'}
            size="small"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Etiqueta"
              value={localData.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              fullWidth
              size="small"
            />

            <TextField
              label="Key (Identificador único)"
              value={localData.key || ''}
              onChange={(e) => handleChange('key', e.target.value)}
              fullWidth
              size="small"
              helperText="Identificador único del estado en el flujo"
            />

            {node.type === 'step' && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localData.isEntry || false}
                    onChange={(e) => handleChange('isEntry', e.target.checked)}
                    color="primary"
                  />
                }
                label="Es el estado de inicio del bot"
                sx={{ 
                  mt: 1,
                  p: 1,
                  border: localData.isEntry ? '1px solid' : '1px solid transparent',
                  borderColor: localData.isEntry ? 'primary.main' : 'transparent',
                  borderRadius: 1,
                  backgroundColor: localData.isEntry ? 'primary.light' : 'transparent',
                  '& .MuiFormControlLabel-label': {
                    color: localData.isEntry ? 'primary.dark' : 'text.primary',
                    fontWeight: localData.isEntry ? 600 : 400,
                  }
                }}
              />
            )}

            {node.type === 'step' && (
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Paso</InputLabel>
                <Select
                  value={localData.stepType || 'message'}
                  onChange={(e) => handleChange('stepType', e.target.value)}
                  label="Tipo de Paso"
                >
                  <MenuItem value="message">Mensaje</MenuItem>
                  <MenuItem value="button">Botones</MenuItem>
                  <MenuItem value="condition">Condición</MenuItem>
                  <MenuItem value="script">Script</MenuItem>
                  <MenuItem value="delay">Retraso</MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              label="Retraso de Transición (segundos)"
              type="number"
              value={localData.transition_delay || 0}
              onChange={(e) => handleChange('transition_delay', parseInt(e.target.value) || 0)}
              fullWidth
              size="small"
              helperText="-1 para esperar input del usuario, 0+ para auto-transición"
            />

            {node.type === 'start' && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Este nodo {localData.isEntry ? 'ES' : 'NO ES'} el punto de entrada del flujo
                </Typography>
                <Button
                  variant={localData.isEntry ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handleChange('isEntry', !localData.isEntry)}
                  sx={{ mt: 1 }}
                >
                  {localData.isEntry ? 'Quitar como Entry' : 'Marcar como Entry'}
                </Button>
              </Box>
            )}

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Contenido: {localData.content?.length || 0} elemento(s)
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={handleAddContent}
              >
                Agregar Contenido
              </Button>
            </Box>

            {/* Lista de contenido existente */}
            {localData.content && localData.content.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <List dense>
                  {localData.content.map((content, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={content.type} 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                            />
                            <Typography variant="body2" component="span">
                              {content.type === 'text' && (content.value as any).text ? 
                                `"${(content.value as any).text.substring(0, 30)}${(content.value as any).text.length > 30 ? '...' : ''}"` :
                              content.type === 'button' ? 
                                `${((content.value as any).buttons || []).length} botones` :
                              ['image', 'audio', 'video', 'document'].includes(content.type) ? 
                                (content.value as any).url || '(sin URL)' :
                                '(contenido)'}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {(content.value as any).caption && `Caption: ${(content.value as any).caption}`}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEditContent(index)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteContent(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Variables ({Object.keys(localData.variable_replace || {}).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Agregar nueva variable:
                  </Typography>
                  
                  <TextField
                    label="Nombre de Variable"
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({ 
                      ...newVariable, 
                      name: e.target.value 
                    })}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                    helperText="Nombre de la variable (ej: customer_name)"
                  />

                  <TextField
                    label="Valor de Variable"
                    value={newVariable.value}
                    onChange={(e) => setNewVariable({ 
                      ...newVariable, 
                      value: e.target.value 
                    })}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                    helperText="Valor que se reemplazará"
                  />

                  <Button
                    variant="contained"
                    onClick={handleAddVariable}
                    startIcon={<AddIcon />}
                    size="small"
                    fullWidth
                  >
                    Agregar Variable
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {localData.variable_replace && Object.keys(localData.variable_replace).length > 0 ? (
                  <List dense>
                    {Object.entries(localData.variable_replace).map(([name, value]) => (
                      <ListItem key={name} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={name} 
                                size="small" 
                                color="secondary" 
                                variant="outlined" 
                              />
                              <Typography variant="body2" component="span">
                                {String(value)}
                              </Typography>
                            </Box>
                          }
                          secondary={`Variable: ${name} = ${value}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteVariable(name)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay variables configuradas
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Transiciones ({localData.transitions?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Agregar nueva transición:
                  </Typography>
                  
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Tipo de Transición</InputLabel>
                    <Select
                      value={newTransition.type}
                      onChange={(e) => setNewTransition({ 
                        ...newTransition, 
                        type: e.target.value 
                      })}
                      label="Tipo de Transición"
                    >
                      <MenuItem value="contains">Contains</MenuItem>
                      <MenuItem value="exact">Exact</MenuItem>
                      <MenuItem value="regex">Regex</MenuItem>
                      <MenuItem value="auto">Auto</MenuItem>
                      <MenuItem value="script">Script</MenuItem>
                    </Select>
                  </FormControl>

                  {newTransition.type === 'auto' && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newTransition.useScript}
                          onChange={(e) => setNewTransition({ 
                            ...newTransition, 
                            useScript: e.target.checked 
                          })}
                        />
                      }
                      label="Usar script para transición auto"
                      sx={{ mb: 2 }}
                    />
                  )}

                  {/* Solo mostrar campo valor si no es script y si no es auto con script */}
                  {newTransition.type !== 'script' && !(newTransition.type === 'auto' && newTransition.useScript) && (
                    <TextField
                      label="Valor/Patrón"
                      value={newTransition.value}
                      onChange={(e) => setNewTransition({ 
                        ...newTransition, 
                        value: e.target.value 
                      })}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                      helperText="Texto a buscar, patrón regex, o condición"
                    />
                  )}

                  <Autocomplete
                    options={availableStates}
                    getOptionLabel={(option) => `${option.key} - ${option.label}`}
                    value={availableStates.find(state => state.key === newTransition.targetState) || null}
                    onChange={(_, newValue) => setNewTransition({ 
                      ...newTransition, 
                      targetState: newValue?.key || '' 
                    })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Estado Destino"
                        size="small"
                        helperText="Selecciona el estado al que debe dirigirse"
                      />
                    )}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="Delay (opcional)"
                    type="number"
                    value={newTransition.condition}
                    onChange={(e) => setNewTransition({ 
                      ...newTransition, 
                      condition: e.target.value 
                    })}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                    helperText="Retraso en segundos (opcional)"
                  />

                  <Button
                    variant="contained"
                    onClick={handleAddTransition}
                    startIcon={<AddIcon />}
                    size="small"
                    fullWidth
                  >
                    Agregar Transición
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {localData.transitions && localData.transitions.length > 0 ? (
                  <List dense>
                    {localData.transitions.map((transition, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={transition.type} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                              />
                              <Typography variant="body2" component="span">
                                {transition.value || '(sin valor)'}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              → {transition.next}
                              {transition.delay && ` (delay: ${transition.delay}s)`}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {(transition.type === 'script' || (transition.type === 'auto' && transition.params)) && (
                              <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() => handleEditScriptTransition(index)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteTransition(index)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay transiciones configuradas
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Button
              variant="contained"
              onClick={onSyncTransitions}
              startIcon={<SyncIcon />}
              size="medium"
              fullWidth
              sx={{ 
                mt: 3, 
                mb: 2,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            >
              Sincronizar Estado con Canvas
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Modal para configuración de transiciones Script */}
      <Dialog 
        open={scriptModalOpen} 
        onClose={() => setScriptModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTransitionIndex !== null ? 'Editar' : 'Configurar'} Transición Script
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Script Name"
              value={scriptConfig.script}
              onChange={(e) => setScriptConfig({ 
                ...scriptConfig, 
                script: e.target.value 
              })}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              helperText="Nombre del script a ejecutar (ej: yumpii-bot-middleware-prod-executeEndpoint)"
            />

            <TextField
              label="Endpoint URL"
              value={scriptConfig.endpoint}
              onChange={(e) => setScriptConfig({ 
                ...scriptConfig, 
                endpoint: e.target.value 
              })}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              helperText="URL del endpoint a llamar"
            />

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>HTTP Method</InputLabel>
              <Select
                value={scriptConfig.method}
                onChange={(e) => setScriptConfig({ 
                  ...scriptConfig, 
                  method: e.target.value 
                })}
                label="HTTP Method"
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Headers (JSON)"
              value={scriptConfig.headers}
              onChange={(e) => setScriptConfig({ 
                ...scriptConfig, 
                headers: e.target.value 
              })}
              fullWidth
              multiline
              rows={3}
              size="small"
              sx={{ mb: 2 }}
              helperText={`Headers en formato JSON (ej: {"Content-Type": "application/json"})`}
            />

            <TextField
              label="Body (JSON)"
              value={scriptConfig.body}
              onChange={(e) => setScriptConfig({ 
                ...scriptConfig, 
                body: e.target.value 
              })}
              fullWidth
              multiline
              rows={3}
              size="small"
              sx={{ mb: 2 }}
              helperText="Cuerpo de la petición en formato JSON"
            />

            <Autocomplete
              options={availableStates}
              getOptionLabel={(option) => `${option.key} - ${option.label}`}
              value={availableStates.find(state => state.key === scriptConfig.targetState) || null}
              onChange={(_, newValue) => setScriptConfig({ 
                ...scriptConfig, 
                targetState: newValue?.key || '' 
              })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Estado Destino"
                  size="small"
                  helperText="Estado al que dirigirse después del script"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setScriptModalOpen(false)}
            color="secondary"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveScriptTransition}
            variant="contained"
            color="primary"
          >
            Guardar Transición Script
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para edición de contenido */}
      <Dialog 
        open={contentModalOpen} 
        onClose={() => setContentModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingContentIndex !== null ? 'Editar' : 'Agregar'} Contenido
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Tipo de Contenido</InputLabel>
              <Select
                value={newContent.type}
                onChange={(e) => setNewContent({ 
                  ...newContent, 
                  type: e.target.value as any
                })}
                label="Tipo de Contenido"
              >
                <MenuItem value="text">Texto</MenuItem>
                <MenuItem value="button">Botones</MenuItem>
                <MenuItem value="image">Imagen</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="document">Documento</MenuItem>
              </Select>
            </FormControl>

            {newContent.type === 'text' && (
              <TextField
                label="Texto"
                value={newContent.text}
                onChange={(e) => setNewContent({ 
                  ...newContent, 
                  text: e.target.value 
                })}
                fullWidth
                multiline
                rows={3}
                size="small"
                sx={{ mb: 2 }}
                helperText="Contenido del mensaje de texto"
              />
            )}

            {['image', 'audio', 'video', 'document'].includes(newContent.type) && (
              <>
                <TextField
                  label="URL"
                  value={newContent.url}
                  onChange={(e) => setNewContent({ 
                    ...newContent, 
                    url: e.target.value 
                  })}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  helperText="URL del archivo"
                />
                
                <TextField
                  label="Caption"
                  value={newContent.caption}
                  onChange={(e) => setNewContent({ 
                    ...newContent, 
                    caption: e.target.value 
                  })}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  helperText="Texto descriptivo (opcional)"
                />

                {newContent.type === 'document' && (
                  <TextField
                    label="Nombre del archivo"
                    value={newContent.filename}
                    onChange={(e) => setNewContent({ 
                      ...newContent, 
                      filename: e.target.value 
                    })}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                    helperText="Nombre del archivo (opcional)"
                  />
                )}
              </>
            )}

            {newContent.type === 'button' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Botones:
                </Typography>
                
                {newContent.buttons.map((button, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                    <TextField
                      label="ID"
                      value={button.id}
                      onChange={(e) => {
                        const updatedButtons = [...newContent.buttons];
                        updatedButtons[index] = { ...button, id: e.target.value };
                        setNewContent({ ...newContent, buttons: updatedButtons });
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Título"
                      value={button.title}
                      onChange={(e) => {
                        const updatedButtons = [...newContent.buttons];
                        updatedButtons[index] = { ...button, title: e.target.value };
                        setNewContent({ ...newContent, buttons: updatedButtons });
                      }}
                      size="small"
                      sx={{ flex: 2 }}
                    />
                    <IconButton
                      onClick={() => {
                        const updatedButtons = newContent.buttons.filter((_, i) => i !== index);
                        setNewContent({ ...newContent, buttons: updatedButtons });
                      }}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    setNewContent({ 
                      ...newContent, 
                      buttons: [...newContent.buttons, { id: '', title: '' }] 
                    });
                  }}
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Agregar Botón
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setContentModalOpen(false)}
            color="secondary"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveContent}
            variant="contained"
            color="primary"
          >
            {editingContentIndex !== null ? 'Actualizar' : 'Agregar'} Contenido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};