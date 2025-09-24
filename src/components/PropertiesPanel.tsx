import React, { useState, useEffect, useRef } from 'react';
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
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import type { EditorNode, YumpiiTransition, TextValue, ButtonValue, UrlButtonValue, MediaValue, DocumentValue, ListValue, ListSection } from '../types/flow';
import { generateButtonId, generateListRowId, generateListSectionId } from '../utils/uuid';

// Componente personalizado para textarea con mejor manejo de scroll
interface CustomTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

const CustomTextArea: React.FC<CustomTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  helperText = '',
  required = false,
  minHeight = 120,
  maxHeight = 400
}) => {
  const [focused, setFocused] = useState(false);
  
  return (
    <Box sx={{ mb: 2 }}>
      <Typography 
        variant="body2" 
        color={focused ? 'primary.main' : 'text.secondary'}
        sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 500 }}
      >
        {label}{required && ' *'}
      </Typography>
      <Box
        sx={{
          border: focused ? '2px solid' : '1px solid',
          borderColor: focused ? 'primary.main' : 'rgba(0, 0, 0, 0.23)',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          '&:hover': {
            borderColor: focused ? 'primary.main' : 'rgba(0, 0, 0, 0.87)',
          },
          transition: 'border-color 0.2s ease-in-out',
        }}
      >
        <Box
          component="textarea"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          sx={{
            width: '100%',
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            resize: 'vertical',
            border: 'none',
            outline: 'none',
            padding: '12px',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '0.875rem',
            lineHeight: 1.4375,
            backgroundColor: 'transparent',
            overflow: 'auto',
            '&::placeholder': {
              color: 'rgba(0, 0, 0, 0.6)',
              opacity: 1,
            }
          }}
        />
      </Box>
      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

interface PropertiesPanelProps {
  node: EditorNode | null;
  onUpdateNode: (nodeId: string, updates: Partial<EditorNode['data']>) => void;
  onDeleteNode: (nodeId: string) => void;
  availableStates: Array<{ key: string; label: string }>;
  onSyncTransitions: () => void;
  currentEntryNodeKey?: string; // Añadido para saber cuál es el nodo de inicio actual
  onUpdateAllTransitions?: (oldKey: string, newKey: string) => void; // Nueva función para actualizar transiciones
  onDuplicateNode?: (nodeId: string) => void; // Nueva función para duplicar nodos
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  node,
  onUpdateNode,
  onDeleteNode,
  availableStates,
  onSyncTransitions,
  currentEntryNodeKey,
  onUpdateAllTransitions,
  onDuplicateNode,
}) => {
  const [localData, setLocalData] = useState(node?.data || null);
  const [originalData, setOriginalData] = useState(node?.data || null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const currentNodeIdRef = useRef<string | null>(null);
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
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [editingTransitionIndex, setEditingTransitionIndex] = useState<number | null>(null);
  const [simpleTransitionModalOpen, setSimpleTransitionModalOpen] = useState(false);
  const [simpleEditingTransitionIndex, setSimpleEditingTransitionIndex] = useState<number | null>(null);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editingContentIndex, setEditingContentIndex] = useState<number | null>(null);
  const [newContent, setNewContent] = useState({
    type: 'text' as 'text' | 'button' | 'url_button' | 'list' | 'image' | 'audio' | 'video' | 'document',
    text: '',
    url: '',
    caption: '',
    filename: '',
    buttons: [] as { id: string; title: string }[],
    // Para botones y url_button
    bodyText: '',
    footerText: '',
    hasHeader: false,
    headerText: '',
    headerUrl: '',
    headerType: 'text' as 'text' | 'image' | 'video' | 'document',
    // Para url_button específicamente
    urlButtonLabel: '',
    // Para listas
    sections: [] as Array<{
      id: string;
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    listBodyText: '',
    listButtonText: 'Ver opciones',
    listFooterText: '',
    listHeaderText: ''
  });
  const [scriptConfig, setScriptConfig] = useState({
    script: '',
    endpoint: '',
    method: 'POST',
    headers: '{}',
    body: '{}',
    targetState: ''
  });



  // Función para actualizar transiciones cuando cambia el nombre de un step
  const updateTransitionsAfterRename = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !onUpdateAllTransitions) return;
    
    // Llamar función del padre para actualizar todas las transiciones
    onUpdateAllTransitions(oldKey, newKey);
  };

  // useEffect para detectar cambios en los datos
  useEffect(() => {
    const checkChanges = () => {
      if (!originalData || !localData) return false;
      return JSON.stringify(originalData) !== JSON.stringify(localData);
    };
    setHasUnsavedChanges(checkChanges());
  }, [localData, originalData]);

  // useEffect para manejar el beforeunload cuando hay cambios pendientes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    console.log('useEffect disparado - node cambió');
    console.log('node.id actual:', node?.id);
    console.log('currentNodeIdRef.current:', currentNodeIdRef.current);
    console.log('node.data.key:', node?.data?.key);
    
    // Solo actualizar cuando realmente cambia el nodo seleccionado
    if (node?.id !== currentNodeIdRef.current) {
      console.log('Cambiando de nodo - reseteando localData');
      currentNodeIdRef.current = node?.id || null;
      setLocalData(node?.data || null);
      setOriginalData(node?.data || null);
      setHasUnsavedChanges(false);
    } else {
      console.log('Mismo nodo - no reseteando localData');
    }
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
    console.log(`Cambiando ${String(field)}:`, value);
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    console.log('Nuevo localData:', newData);
    // No llamar onUpdateNode aquí - solo actualizar cuando se sincronice
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este nodo?')) {
      onDeleteNode(node.id);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicateNode) {
      onDuplicateNode(node.id);
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
    
    // Convertir 'contains' a regex automáticamente
    let transitionType = newTransition.type;
    let transitionValue = newTransition.value;
    
    if (newTransition.type === 'contains') {
      transitionType = 'regex';
      // Generar regex pattern similar al del JSON
      const keywords = newTransition.value.toLowerCase().split(/\s+/);
      const variations = [
        newTransition.value, // Versión original
        newTransition.value.toLowerCase(), // Versión lowercase
        ...keywords.filter(word => word.length > 2) // Palabras individuales
      ];
      // Escapar caracteres especiales de regex y crear el patrón
      const escapedVariations = variations.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      transitionValue = `^(${escapedVariations.join('|')})$`;
    }

    const updatedTransitions: YumpiiTransition[] = [...currentTransitions, {
      type: transitionType as 'auto' | 'contains' | 'exact' | 'script' | 'regex',
      value: transitionValue,
      next: newTransition.targetState,
      delay: newTransition.condition ? parseInt(newTransition.condition) : 2,
      position: currentTransitions.length // Nueva posición al final
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
    
    // Cerrar modal si estaba abierto
    setTransitionModalOpen(false);
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

  // Nueva función para editar cualquier tipo de transición
  const handleEditTransition = (index: number) => {
    const transition = localData.transitions?.[index];
    if (transition) {
      setEditingTransitionIndex(index);
      
      // Si es script o auto con params, usar el modal de script
      if ((transition.type === 'script' || transition.type === 'auto') && transition.params) {
        handleEditScriptTransition(index);
        return;
      }
      
      // Para otros tipos, cargar en el formulario normal
      setNewTransition({
        type: transition.type,
        value: transition.value || '',
        targetState: transition.next || '',
        condition: transition.value || '',
        useScript: false
      });
      setTransitionModalOpen(true);
    }
  };

  // Función para edición simple de transición (solo destino y delay)
  const handleSimpleEditTransition = (index: number) => {
    const transition = localData.transitions?.[index];
    if (transition) {
      setSimpleEditingTransitionIndex(index);
      setNewTransition({
        type: transition.type,
        value: transition.value || '',
        targetState: transition.next || '',
        condition: transition.value || '',
        useScript: false
      });
      setSimpleTransitionModalOpen(true);
    }
  };

  // Función para actualizar transición simple (solo destino y delay)
  const handleUpdateSimpleTransition = () => {
    if (!localData.transitions || simpleEditingTransitionIndex === null) return;
    
    if (!newTransition.targetState) {
      alert('Por favor selecciona el estado de destino');
      return;
    }

    const updatedTransitions = [...localData.transitions];
    const currentTransition = updatedTransitions[simpleEditingTransitionIndex];
    
    // Solo actualizar next y delay, mantener todo lo demás igual
    updatedTransitions[simpleEditingTransitionIndex] = {
      ...currentTransition,
      next: newTransition.targetState,
      delay: parseInt(newTransition.condition) || undefined
    };

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
    
    // Cerrar modal
    setSimpleTransitionModalOpen(false);
    setSimpleEditingTransitionIndex(null);
  };

  // Función para reordenar transiciones
  const handleReorderTransitions = (startIndex: number, endIndex: number) => {
    if (!localData.transitions) return;
    
    const result = Array.from(localData.transitions);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Actualizar las posiciones
    const updatedTransitions = result.map((transition, index) => ({
      ...transition,
      position: index
    }));
    
    setLocalData({
      ...localData,
      transitions: updatedTransitions
    });
  };

  // Función para mover transición hacia arriba
  const handleMoveTransitionUp = (index: number) => {
    if (index > 0) {
      handleReorderTransitions(index, index - 1);
    }
  };

  // Función para mover transición hacia abajo
  const handleMoveTransitionDown = (index: number) => {
    if (localData.transitions && index < localData.transitions.length - 1) {
      handleReorderTransitions(index, index + 1);
    }
  };

  // Función para generar descripción legible de transiciones
  const getTransitionDisplayText = (transition: YumpiiTransition) => {
    switch (transition.type) {
      case 'regex':
        return 'Expresión regular';
      case 'contains':
        return `Contiene: "${transition.value}"`;
      case 'exact':
        return `Texto exacto: "${transition.value}"`;
      case 'auto':
        return 'Automática';
      case 'script':
        return 'Script personalizado';
      default:
        return transition.value ? `${transition.type}: "${transition.value}"` : `Transición ${transition.type}`;
    }
  };

  // Función para actualizar transición editada
  const handleUpdateTransition = () => {
    if (!localData.transitions || editingTransitionIndex === null) return;
    
    if (!newTransition.targetState) {
      alert('Por favor selecciona el estado de destino');
      return;
    }

    // Verificar valor requerido para ciertos tipos
    if (!newTransition.value && ['contains', 'exact', 'regex'].includes(newTransition.type)) {
      alert('Por favor completa el valor de la transición');
      return;
    }

    const currentTransitions = [...localData.transitions];
    
    // Convertir 'contains' a regex automáticamente
    let transitionType = newTransition.type;
    let transitionValue = newTransition.value;
    
    if (newTransition.type === 'contains') {
      transitionType = 'regex';
      const keywords = newTransition.value.toLowerCase().split(/\s+/);
      const variations = [
        newTransition.value,
        newTransition.value.toLowerCase(),
        ...keywords.filter(word => word.length > 2)
      ];
      const escapedVariations = variations.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      transitionValue = `^(${escapedVariations.join('|')})$`;
    }

    // Actualizar la transición en el índice especificado
    currentTransitions[editingTransitionIndex] = {
      ...currentTransitions[editingTransitionIndex],
      type: transitionType as 'auto' | 'contains' | 'exact' | 'script' | 'regex',
      value: transitionValue,
      next: newTransition.targetState,
      delay: newTransition.condition ? parseInt(newTransition.condition) : (currentTransitions[editingTransitionIndex].delay || 0),
      position: currentTransitions[editingTransitionIndex].position || editingTransitionIndex
    };

    const newData = { ...localData, transitions: currentTransitions };
    setLocalData(newData);
    onUpdateNode(node.id, { transitions: currentTransitions });

    // Reset form and close modal
    setNewTransition({
      type: 'contains',
      value: '',
      targetState: '',
      condition: '',
      useScript: false
    });
    setEditingTransitionIndex(null);
    setTransitionModalOpen(false);
  };

  const handleAddContent = () => {
    setEditingContentIndex(null);
    setNewContent({
      type: 'text',
      text: '',
      url: '',
      caption: '',
      filename: '',
      buttons: [],
      bodyText: '',
      footerText: '',
      hasHeader: false,
      headerText: '',
      headerUrl: '',
      headerType: 'text',
      urlButtonLabel: '',
      sections: [],
      listBodyText: '',
      listButtonText: 'Ver opciones',
      listFooterText: '',
      listHeaderText: ''
    });
    setContentModalOpen(true);
  };

  const handleEditContent = (index: number) => {
    const content = localData.content?.[index];
    if (content) {
      setEditingContentIndex(index);
      
      // Reset new content with current content data
      const hasExistingHeader = ['button', 'url_button'].includes(content.type) && 
        (content.value as ButtonValue | UrlButtonValue).header && 
        ((content.value as ButtonValue | UrlButtonValue).header?.text || (content.value as ButtonValue | UrlButtonValue).header?.url);
      
      setNewContent({
        type: content.type,
        text: content.type === 'text' ? (content.value as TextValue).text || '' : '',
        url: ['image', 'audio', 'video', 'document', 'url_button'].includes(content.type) ? (content.value as MediaValue | DocumentValue | UrlButtonValue).url || '' : '',
        caption: (content.value as MediaValue).caption || '',
        filename: content.type === 'document' ? (content.value as DocumentValue).filename || '' : '',
        buttons: content.type === 'button' ? (content.value as ButtonValue).buttons || [] : [],
        // Campos para botones y url_button
        bodyText: ['button', 'url_button'].includes(content.type) ? (content.value as ButtonValue | UrlButtonValue).bodyText || '' : '',
        footerText: ['button', 'url_button'].includes(content.type) ? (content.value as ButtonValue | UrlButtonValue).footerText || '' : '',
        hasHeader: !!hasExistingHeader,
        headerText: ['button', 'url_button'].includes(content.type) ? (content.value as ButtonValue | UrlButtonValue).header?.text || '' : '',
        headerUrl: ['button', 'url_button'].includes(content.type) ? (content.value as ButtonValue | UrlButtonValue).header?.url || '' : '',
        headerType: (['button', 'url_button'].includes(content.type) ? (content.value as ButtonValue | UrlButtonValue).header?.type || 'text' : 'text') as 'text' | 'image' | 'video' | 'document',
        // Campo específico para url_button
        urlButtonLabel: content.type === 'url_button' ? (content.value as UrlButtonValue).label || '' : '',
        // Campos para listas
        sections: content.type === 'list' ? (content.value as ListValue).sections || [] : [],
        listBodyText: content.type === 'list' ? (content.value as ListValue).bodyText || '' : '',
        listButtonText: content.type === 'list' ? (content.value as ListValue).buttonText || 'Ver opciones' : 'Ver opciones',
        listFooterText: content.type === 'list' ? (content.value as ListValue).footerText || '' : '',
        listHeaderText: content.type === 'list' ? (content.value as ListValue).header?.text || '' : ''
      });
      
      setContentModalOpen(true);
    }
  };

  const handleSaveContent = () => {
    try {
      // Validar campos requeridos
      if (newContent.type === 'list') {
        if (!newContent.listBodyText.trim()) {
          alert('El texto del cuerpo es requerido para las listas');
          return;
        }
        if (!newContent.listButtonText.trim()) {
          alert('El texto del botón es requerido para las listas');
          return;
        }
        if (newContent.sections.length === 0) {
          alert('Debe agregar al menos una sección a la lista');
          return;
        }
        for (const section of newContent.sections) {
          if (!section.title.trim()) {
            alert('Todas las secciones deben tener un título');
            return;
          }
          if (section.rows.length === 0) {
            alert('Cada sección debe tener al menos una opción');
            return;
          }
          for (const row of section.rows) {
            if (!row.title.trim()) {
              alert('Todas las opciones deben tener un título');
              return;
            }
          }
        }
      }

      if (newContent.type === 'url_button') {
        if (!newContent.bodyText.trim()) {
          alert('El texto del cuerpo es requerido para los botones URL');
          return;
        }
        if (!newContent.url.trim()) {
          alert('La URL es requerida para los botones URL');
          return;
        }
        if (!newContent.urlButtonLabel.trim()) {
          alert('La etiqueta del botón es requerida para los botones URL');
          return;
        }
      }

      if (newContent.type === 'button') {
        if (newContent.buttons.length === 0) {
          alert('Debe agregar al menos un botón');
          return;
        }
        for (const button of newContent.buttons) {
          if (!button.title.trim()) {
            alert('Todos los botones deben tener un título');
            return;
          }
        }
      }

      const currentContent = localData.content || [];
      
      let contentValue: TextValue | ButtonValue | UrlButtonValue | MediaValue | DocumentValue | ListValue;
      
      switch (newContent.type) {
        case 'text':
          contentValue = { text: newContent.text };
          break;
        case 'button':
          contentValue = {
            buttons: newContent.buttons,
            bodyText: newContent.bodyText,
            footerText: newContent.footerText,
            header: newContent.hasHeader ? {
              type: newContent.headerType,
              text: newContent.headerText,
              url: newContent.headerUrl
            } : undefined,
            caption: '' // Mantenemos caption por compatibilidad
          };
          break;
        case 'url_button':
          contentValue = {
            url: newContent.url,
            label: newContent.urlButtonLabel,
            bodyText: newContent.bodyText,
            footerText: newContent.footerText,
            header: newContent.hasHeader ? {
              type: newContent.headerType,
              text: newContent.headerText,
              url: newContent.headerUrl
            } : undefined
          };
          break;
        case 'list':
          contentValue = {
            sections: newContent.sections,
            header: newContent.listHeaderText ? { 
              type: 'text',
              text: newContent.listHeaderText
            } : undefined,
            bodyText: newContent.listBodyText,
            footerText: newContent.listFooterText || undefined,
            buttonText: newContent.listButtonText
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
        buttons: [],
        bodyText: '',
        footerText: '',
        hasHeader: false,
        headerText: '',
        headerUrl: '',
        headerType: 'text',
        urlButtonLabel: '',
        sections: [],
        listBodyText: '',
        listButtonText: 'Ver opciones',
        listFooterText: '',
        listHeaderText: ''
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Botón para duplicar nodo */}
              {onDuplicateNode && (
                <IconButton 
                  color="primary" 
                  onClick={handleDuplicate}
                  size="small"
                  title="Duplicar nodo"
                >
                  <CopyIcon />
                </IconButton>
              )}
              {/* Botón para eliminar nodo */}
              <IconButton 
                color="error" 
                onClick={handleDelete}
                size="small"
                title="Eliminar nodo"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
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
              label="Key (Identificador único)"
              value={localData.key || ''}
              onChange={(e) => {
                // Actualizar key y label juntos en una sola operación
                const newValue = e.target.value;
                const newData = { ...localData, key: newValue, label: newValue };
                setLocalData(newData);
                console.log('Actualizando key y label:', newValue);
              }}
              fullWidth
              size="small"
              helperText="Identificador único del estado en el flujo"
            />

            {node.type === 'step' && (
              // Mostrar el checkbox solo si:
              // 1. No hay estado de inicio seleccionado, O
              // 2. Este nodo es el estado de inicio actual (para poder desmarcarlo)
              (!currentEntryNodeKey || localData.key === currentEntryNodeKey) && (
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
              )
            )}

            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={(localData.transition_delay || 0) === -1}
                    onChange={(e) => handleChange('transition_delay', e.target.checked ? -1 : 0)}
                  />
                }
                label="¿Esperar input del usuario?"
              />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                {(localData.transition_delay || 0) === -1 
                  ? 'El step esperará respuesta del usuario antes de continuar'
                  : 'El step continuará automáticamente sin esperar respuesta'
                }
              </Typography>
            </Box>

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
                              {content.type === 'text' && (content.value as TextValue).text ? 
                                `"${(content.value as TextValue).text.substring(0, 30)}${(content.value as TextValue).text.length > 30 ? '...' : ''}"` :
                              content.type === 'button' ? 
                                `${((content.value as ButtonValue).buttons || []).length} botones` :
                              content.type === 'list' ? 
                                `Lista: ${((content.value as ListValue).sections || []).reduce((total: number, section: ListSection) => total + (section.rows || []).length, 0)} opciones` :
                              ['image', 'audio', 'video', 'document'].includes(content.type) ? 
                                (content.value as MediaValue | DocumentValue).url || '(sin URL)' :
                                '(contenido)'}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {(content.value as MediaValue).caption && `Caption: ${(content.value as MediaValue).caption}`}
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
                    onClick={() => {
                      setEditingTransitionIndex(null);
                      setTransitionModalOpen(true);
                    }}
                    startIcon={<AddIcon />}
                    size="small"
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Agregar Transición
                  </Button>


                </Box>

                <Divider sx={{ my: 2 }} />

                {localData.transitions && localData.transitions.length > 0 ? (
                  <List dense>
                    {localData.transitions
                      .sort((a, b) => (a.position || 0) - (b.position || 0)) // Ordenar por posición
                      .map((transition, index) => (
                      <ListItem key={index} divider sx={{ py: 1.5 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          width: '100%',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          {/* Contenido de la transición */}
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" component="div" sx={{ 
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {getTransitionDisplayText(transition)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{
                              display: 'block',
                              mt: 0.25
                            }}>
                              → {transition.next}
                              {transition.delay && ` (delay: ${transition.delay}s)`}
                            </Typography>
                          </Box>
                          
                          {/* Controles - Mejor organizados */}
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 0.5, 
                            alignItems: 'center',
                            flexShrink: 0
                          }}>
                            {/* Controles de reordenamiento - Verticales y más visibles */}
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              gap: 0.25,
                              mr: 0.5
                            }}>
                              <IconButton
                                size="small"
                                onClick={() => handleMoveTransitionUp(index)}
                                disabled={index === 0}
                                sx={{ 
                                  p: 0.5,
                                  bgcolor: 'action.hover',
                                  borderRadius: '4px',
                                  '&:hover': { bgcolor: 'action.selected' }
                                }}
                              >
                                <ArrowUpIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleMoveTransitionDown(index)}
                                disabled={index === localData.transitions.length - 1}
                                sx={{ 
                                  p: 0.5,
                                  bgcolor: 'action.hover',
                                  borderRadius: '4px',
                                  '&:hover': { bgcolor: 'action.selected' }
                                }}
                              >
                                <ArrowDownIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            
                            {/* Botones de acción */}
                            {transition.type === 'script' ? (
                              // Para transiciones script: botón para editar solo destino y delay
                              <IconButton
                                aria-label="edit-simple"
                                onClick={() => handleSimpleEditTransition(index)}
                                size="small"
                                color="primary"
                                sx={{ 
                                  bgcolor: 'primary.light',
                                  color: 'primary.contrastText',
                                  '&:hover': { bgcolor: 'primary.main' }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            ) : (
                              // Para otras transiciones: botón normal de edición completa
                              <IconButton
                                aria-label="edit"
                                onClick={() => handleEditTransition(index)}
                                size="small"
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                            
                            {/* Botón para script: editar código completo */}
                            {transition.type === 'script' && (
                              <IconButton
                                aria-label="edit-script"
                                onClick={() => handleEditTransition(index)}
                                size="small"
                                color="secondary"
                                sx={{ 
                                  bgcolor: 'secondary.light',
                                  color: 'secondary.contrastText',
                                  '&:hover': { bgcolor: 'secondary.main' }
                                }}
                              >
                                <CodeIcon />
                              </IconButton>
                            )}
                            
                            {/* Botón de eliminar */}
                            <IconButton
                              aria-label="delete"
                              onClick={() => handleDeleteTransition(index)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
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

            {/* Advertencia de cambios pendientes */}
            {hasUnsavedChanges && (
              <Box sx={{ 
                p: 2, 
                mb: 2, 
                backgroundColor: 'warning.light', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.main'
              }}>
                <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 500 }}>
                  ⚠️ Hay cambios sin sincronizar
                </Typography>
                <Typography variant="caption" color="warning.dark">
                  Los cambios no se reflejarán en el canvas hasta sincronizar
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              onClick={() => {
                console.log('Sincronizando cambios...');
                console.log('Original key:', originalData?.key);
                console.log('Nueva key:', localData?.key);
                
                // Guardar referencias antes de las actualizaciones
                const oldKey = originalData?.key || '';
                const newKey = localData?.key || '';
                const shouldUpdateTransitions = oldKey !== newKey && oldKey;
                
                // 1. Si el key cambió, actualizar transiciones de otros nodos PRIMERO
                if (shouldUpdateTransitions) {
                  console.log('Actualizando transiciones de otros nodos...');
                  updateTransitionsAfterRename(oldKey, newKey);
                }
                
                // 2. Actualizar el nodo actual con todos los cambios locales
                if (localData) {
                  const updates = {
                    key: localData.key,
                    label: localData.label,
                    isEntry: localData.isEntry,
                    content: localData.content,
                    transitions: localData.transitions,
                    transition_delay: localData.transition_delay
                  };
                  console.log('Actualizando nodo con:', updates);
                  onUpdateNode(node.id, updates);
                }
                
                // 3. Sincronizar el canvas
                onSyncTransitions();
                
                // 4. Actualizar datos originales después de sincronizar
                setTimeout(() => {
                  setOriginalData({ ...localData });
                  setHasUnsavedChanges(false);
                }, 100); // Pequeño delay para asegurar que las actualizaciones se procesen
              }}
              size="medium"
              fullWidth
              sx={{ 
                mt: hasUnsavedChanges ? 1 : 3, 
                mb: 2,
                backgroundColor: hasUnsavedChanges ? 'warning.main' : 'primary.main',
                color: hasUnsavedChanges ? 'warning.contrastText' : 'primary.contrastText',
                '&:hover': {
                  backgroundColor: hasUnsavedChanges ? 'warning.dark' : 'primary.dark',
                }
              }}
            >
              {hasUnsavedChanges ? '⚠️ Sincronizar Cambios Pendientes' : 'Sincronizar Estado con Canvas'}
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

            <CustomTextArea
              label="Headers (JSON)"
              value={scriptConfig.headers}
              onChange={(value) => setScriptConfig({ 
                ...scriptConfig, 
                headers: value 
              })}
              helperText='Headers en formato JSON (ej: {"Content-Type": "application/json"})'
              placeholder='{"Content-Type": "application/json"}'
              minHeight={100}
              maxHeight={300}
            />

            <CustomTextArea
              label="Body (JSON)"
              value={scriptConfig.body}
              onChange={(value) => setScriptConfig({ 
                ...scriptConfig, 
                body: value 
              })}
              helperText="Cuerpo de la petición en formato JSON"
              placeholder='{"key": "value"}'
              minHeight={120}
              maxHeight={500}
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

      {/* Modal para edición general de transiciones */}
      <Dialog 
        open={transitionModalOpen} 
        onClose={() => {
          setTransitionModalOpen(false);
          setEditingTransitionIndex(null);
          setNewTransition({
            type: 'contains',
            value: '',
            targetState: '',
            condition: '',
            useScript: false
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTransitionIndex !== null ? 'Editar' : 'Agregar'} Transición
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
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
              </Select>
            </FormControl>

            {/* Solo mostrar campo valor si no es auto */}
            {newTransition.type !== 'auto' && (
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
              label="Delay (segundos)"
              type="number"
              value={newTransition.condition}
              onChange={(e) => setNewTransition({ 
                ...newTransition, 
                condition: e.target.value 
              })}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              helperText="Retraso en segundos (opcional, por defecto 2)"
              placeholder="2"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setTransitionModalOpen(false);
              setEditingTransitionIndex(null);
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={editingTransitionIndex !== null ? handleUpdateTransition : handleAddTransition}
            variant="contained"
            color="primary"
          >
            {editingTransitionIndex !== null ? 'Actualizar' : 'Agregar'} Transición
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal simple para editar solo destino y delay */}
      <Dialog 
        open={simpleTransitionModalOpen} 
        onClose={() => {
          setSimpleTransitionModalOpen(false);
          setSimpleEditingTransitionIndex(null);
          setNewTransition({
            type: 'contains',
            value: '',
            targetState: '',
            condition: '',
            useScript: false
          });
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Editar Transición - Destino y Delay
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
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
                />
              )}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Delay (segundos)"
              type="number"
              value={newTransition.condition}
              onChange={(e) => setNewTransition({ ...newTransition, condition: e.target.value })}
              fullWidth
              size="small"
              helperText="Tiempo de espera antes de ejecutar la transición (opcional)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setSimpleTransitionModalOpen(false);
              setSimpleEditingTransitionIndex(null);
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateSimpleTransition}
            variant="contained"
            color="primary"
          >
            Actualizar
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
                  type: e.target.value as 'text' | 'button' | 'url_button' | 'image' | 'audio' | 'video' | 'document' | 'list'
                })}
                label="Tipo de Contenido"
              >
                <MenuItem value="text">Texto</MenuItem>
                <MenuItem value="button">Botones</MenuItem>
                <MenuItem value="url_button">Botón URL</MenuItem>
                <MenuItem value="list">Lista</MenuItem>
                <MenuItem value="image">Imagen</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="document">Documento</MenuItem>
              </Select>
            </FormControl>

            {newContent.type === 'text' && (
              <CustomTextArea
                label="Texto"
                value={newContent.text}
                onChange={(value) => setNewContent({ 
                  ...newContent, 
                  text: value 
                })}
                helperText="Contenido del mensaje de texto"
                required={false}
                minHeight={120}
                maxHeight={500}
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
                {/* Campos del mensaje con botones */}
                <CustomTextArea
                  label="Texto del cuerpo"
                  value={newContent.bodyText}
                  onChange={(value) => setNewContent({ ...newContent, bodyText: value })}
                  helperText="Texto principal del mensaje con botones"
                  minHeight={100}
                  maxHeight={400}
                />
                
                <TextField
                  label="Texto del pie (opcional)"
                  value={newContent.footerText}
                  onChange={(e) => setNewContent({ ...newContent, footerText: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newContent.hasHeader}
                      onChange={(e) => setNewContent({ 
                        ...newContent, 
                        hasHeader: e.target.checked,
                        // Limpiar campos de header si se deshabilita
                        headerText: e.target.checked ? newContent.headerText : '',
                        headerUrl: e.target.checked ? newContent.headerUrl : '',
                        headerType: e.target.checked ? newContent.headerType : 'text'
                      })}
                    />
                  }
                  label="¿Agregar encabezado?"
                  sx={{ mb: 2 }}
                />

                {newContent.hasHeader && (
                  <>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Tipo de encabezado</InputLabel>
                      <Select
                        value={newContent.headerType}
                        onChange={(e) => setNewContent({ ...newContent, headerType: e.target.value as 'text' | 'image' | 'video' | 'document' })}
                        label="Tipo de encabezado"
                      >
                        <MenuItem value="text">Texto</MenuItem>
                        <MenuItem value="image">Imagen</MenuItem>
                        <MenuItem value="video">Video</MenuItem>
                        <MenuItem value="document">Documento</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Texto del encabezado"
                      value={newContent.headerText}
                      onChange={(e) => setNewContent({ ...newContent, headerText: e.target.value })}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      label="URL del encabezado"
                      value={newContent.headerUrl}
                      onChange={(e) => setNewContent({ ...newContent, headerUrl: e.target.value })}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </>
                )}

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Botones:
                </Typography>
                
                {newContent.buttons.map((button, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                    <TextField
                      label="ID (Auto-generado)"
                      value={button.id}
                      disabled
                      size="small"
                      sx={{ flex: 1, '& .MuiInputBase-input': { color: 'text.secondary' } }}
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
                      required
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
                    if (newContent.buttons.length >= 3) {
                      alert('Máximo 3 botones permitidos');
                      return;
                    }
                    setNewContent({ 
                      ...newContent, 
                      buttons: [...newContent.buttons, { id: generateButtonId(), title: '' }] 
                    });
                  }}
                  startIcon={<AddIcon />}
                  size="small"
                  disabled={newContent.buttons.length >= 3}
                >
                  Agregar Botón {newContent.buttons.length >= 3 && '(Máximo 3)'}
                </Button>
              </Box>
            )}

            {newContent.type === 'url_button' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main' }}>
                  Configuración de Botón URL
                </Typography>

                <CustomTextArea
                  label="Texto del cuerpo"
                  value={newContent.bodyText}
                  onChange={(value) => setNewContent({ ...newContent, bodyText: value })}
                  helperText="Texto principal del mensaje con botón URL"
                  required={true}
                  minHeight={100}
                  maxHeight={400}
                />

                <TextField
                  label="URL del botón *"
                  value={newContent.url}
                  onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  placeholder="https://ejemplo.com"
                  required
                />

                <TextField
                  label="Etiqueta del botón *"
                  value={newContent.urlButtonLabel}
                  onChange={(e) => setNewContent({ ...newContent, urlButtonLabel: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  placeholder="Visitar sitio web"
                  required
                />

                <TextField
                  label="Texto del pie (opcional)"
                  value={newContent.footerText}
                  onChange={(e) => setNewContent({ ...newContent, footerText: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newContent.hasHeader}
                      onChange={(e) => setNewContent({ 
                        ...newContent, 
                        hasHeader: e.target.checked,
                        // Limpiar campos de header si se deshabilita
                        headerText: e.target.checked ? newContent.headerText : '',
                        headerUrl: e.target.checked ? newContent.headerUrl : '',
                        headerType: e.target.checked ? newContent.headerType : 'text'
                      })}
                    />
                  }
                  label="¿Agregar encabezado?"
                  sx={{ mb: 2 }}
                />

                {newContent.hasHeader && (
                  <>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Tipo de encabezado</InputLabel>
                      <Select
                        value={newContent.headerType}
                        onChange={(e) => setNewContent({ ...newContent, headerType: e.target.value as 'text' | 'image' | 'video' | 'document' })}
                        label="Tipo de encabezado"
                      >
                        <MenuItem value="text">Texto</MenuItem>
                        <MenuItem value="image">Imagen</MenuItem>
                        <MenuItem value="video">Video</MenuItem>
                        <MenuItem value="document">Documento</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Texto del encabezado"
                      value={newContent.headerText}
                      onChange={(e) => setNewContent({ ...newContent, headerText: e.target.value })}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      label="URL del encabezado"
                      value={newContent.headerUrl}
                      onChange={(e) => setNewContent({ ...newContent, headerUrl: e.target.value })}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </>
                )}
              </Box>
            )}

            {newContent.type === 'list' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main' }}>
                  Configuración de Lista
                </Typography>

                <CustomTextArea
                  label="Texto del cuerpo (Body Text)"
                  value={newContent.listBodyText}
                  onChange={(value) => setNewContent({ ...newContent, listBodyText: value })}
                  helperText="Texto principal que aparecerá antes de las opciones"
                  required={true}
                  minHeight={80}
                  maxHeight={300}
                />
                
                <TextField
                  label="Texto del botón (Button Text) *"
                  value={newContent.listButtonText}
                  onChange={(e) => setNewContent({ ...newContent, listButtonText: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                  required
                  placeholder="Ver opciones"
                  helperText="Texto que aparecerá en el botón de la lista"
                />

                <TextField
                  label="Texto del pie (Footer Text)"
                  value={newContent.listFooterText || ''}
                  onChange={(e) => setNewContent({ ...newContent, listFooterText: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Texto opcional que aparece al final de la lista"
                />

                <TextField
                  label="Texto del encabezado (Header Text)"
                  value={newContent.listHeaderText || ''}
                  onChange={(e) => setNewContent({ ...newContent, listHeaderText: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Texto opcional del encabezado"
                />

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Secciones:
                </Typography>
                
                {newContent.sections.map((section, sectionIndex) => (
                  <Box key={sectionIndex} sx={{ border: '1px solid #ddd', p: 2, mb: 2, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                      <TextField
                        label="ID Sección (Auto-generado)"
                        value={section.id}
                        disabled
                        size="small"
                        sx={{ flex: 1, '& .MuiInputBase-input': { color: 'text.secondary' } }}
                      />
                      <TextField
                        label="Título de Sección *"
                        value={section.title}
                        onChange={(e) => {
                          const updatedSections = [...newContent.sections];
                          updatedSections[sectionIndex] = { ...section, title: e.target.value };
                          setNewContent({ ...newContent, sections: updatedSections });
                        }}
                        size="small"
                        sx={{ flex: 2 }}
                        required
                      />
                      <IconButton
                        onClick={() => {
                          const updatedSections = newContent.sections.filter((_, i) => i !== sectionIndex);
                          setNewContent({ ...newContent, sections: updatedSections });
                        }}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                      Opciones:
                    </Typography>

                    {section.rows.map((row, rowIndex) => (
                      <Box key={rowIndex} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', ml: 2 }}>
                        <TextField
                          label="ID (Auto-generado)"
                          value={row.id}
                          disabled
                          size="small"
                          sx={{ flex: 1, '& .MuiInputBase-input': { color: 'text.secondary' } }}
                        />
                        <TextField
                          label="Título *"
                          value={row.title}
                          onChange={(e) => {
                            const updatedSections = [...newContent.sections];
                            updatedSections[sectionIndex].rows[rowIndex] = { ...row, title: e.target.value };
                            setNewContent({ ...newContent, sections: updatedSections });
                          }}
                          size="small"
                          sx={{ flex: 2 }}
                          required
                        />
                        <TextField
                          label="Descripción"
                          value={row.description || ''}
                          onChange={(e) => {
                            const updatedSections = [...newContent.sections];
                            updatedSections[sectionIndex].rows[rowIndex] = { ...row, description: e.target.value };
                            setNewContent({ ...newContent, sections: updatedSections });
                          }}
                          size="small"
                          sx={{ flex: 2 }}
                          helperText="Opcional"
                        />
                        <IconButton
                          onClick={() => {
                            const updatedSections = [...newContent.sections];
                            updatedSections[sectionIndex].rows = section.rows.filter((_, i) => i !== rowIndex);
                            setNewContent({ ...newContent, sections: updatedSections });
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
                        const updatedSections = [...newContent.sections];
                        updatedSections[sectionIndex].rows.push({ 
                          id: generateListRowId(), 
                          title: '', 
                          description: '' 
                        });
                        setNewContent({ ...newContent, sections: updatedSections });
                      }}
                      startIcon={<AddIcon />}
                      size="small"
                      sx={{ ml: 2, mt: 1 }}
                    >
                      Agregar Opción
                    </Button>
                  </Box>
                ))}
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    setNewContent({ 
                      ...newContent, 
                      sections: [...newContent.sections, { 
                        id: generateListSectionId(), 
                        title: '', 
                        rows: [] 
                      }] 
                    });
                  }}
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Agregar Sección
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