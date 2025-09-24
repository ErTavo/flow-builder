import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Avatar, Box } from '@mui/material';
import { 
  Message, 
  TouchApp, 
  Route, 
  Code, 
  Schedule 
} from '@mui/icons-material';
import type { EditorNodeData } from '../../types/flow';

const hasScript = (data: EditorNodeData): boolean => {
  // Verificar si el stepType es script
  if (data.stepType === 'script') {
    return true;
  }
  
  // Verificar si alguna transición tiene tipo script
  if (data.transitions) {
    return data.transitions.some(transition => 
      transition.type === 'script' || 
      (transition.params && 'script' in transition.params)
    );
  }
  
  return false;
};

const detectStepType = (data: EditorNodeData): string => {
  // Si tiene múltiples transiciones, es una condición
  if (data.transitions && data.transitions.length > 1) {
    return 'condition';
  }
  
  // Si tiene delay configurado (mayor a 0), es un delay
  if (data.transition_delay && data.transition_delay > 0) {
    return 'delay';
  }
  
  // Detectar según el contenido
  if (data.content && data.content.length > 0) {
    let hasButtons = false;
    let hasLists = false;
    let hasMedia = false;
    let hasText = false;
    
    for (const content of data.content) {
      // Detectar botones
      if (content.type === 'button' || content.type === 'url_button') {
        hasButtons = true;
      }
      // Detectar listas
      else if (content.type === 'list') {
        hasLists = true;
      }
      // Detectar contenido multimedia
      else if (['image', 'audio', 'video', 'document'].includes(content.type)) {
        hasMedia = true;
      }
      // Detectar texto
      else if (content.type === 'text') {
        hasText = true;
      }
    }
    
    // Prioridad: botones > listas > multimedia > texto
    if (hasButtons) return 'button';
    if (hasLists) return 'button'; // Las listas también son interactivas como botones
    if (hasMedia) return 'message'; // Media files son mensajes
    if (hasText) return 'message'; // Texto simple son mensajes
  }
  
  // Si no tiene contenido pero tiene transiciones, podría ser condición
  if (data.transitions && data.transitions.length === 1) {
    // Una sola transición podría ser un paso intermedio o condición
    return 'condition';
  }
  
  // Por defecto es mensaje
  return 'message';
};

interface StepNodeProps {
  data: EditorNodeData;
  selected?: boolean;
}

const getStepIcon = (stepType?: string) => {
  switch (stepType) {
    case 'message': return <Message />;
    case 'button': return <TouchApp />;
    case 'condition': return <Route />;
    case 'script': return <Code />;
    case 'delay': return <Schedule />;
    default: return <Message />;
  }
};

const getStepColor = (stepType?: string) => {
  switch (stepType) {
    case 'message': return '#4caf50';
    case 'button': return '#ff9800';
    case 'condition': return '#2196f3';
    case 'script': return '#9c27b0';
    case 'delay': return '#607d8b';
    default: return '#4caf50';
  }
};

const getStepLabel = (stepType?: string) => {
  switch (stepType) {
    case 'message': return 'Mensaje';
    case 'button': return 'Botones';
    case 'condition': return 'Condición';
    case 'script': return 'Script';
    case 'delay': return 'Retraso';
    default: return 'Paso';
  }
};

export const StepNode: React.FC<StepNodeProps> = ({ data, selected }) => {
  // Detectar si es un step "Fin"
  const isEndStep = data.key?.toLowerCase().includes('fin');
  // Detectar automáticamente el tipo de step según su contenido
  const autoDetectedType = detectStepType(data);
  // Detectar si tiene script
  const hasScriptCode = hasScript(data);
  const stepColor = isEndStep ? '#f44336' : getStepColor(autoDetectedType); // Rojo para steps "Fin"
  const isHighlighted = data.highlighted;
  
  return (
    <Card 
      sx={{ 
        minWidth: 160,
        maxWidth: 180,
        boxShadow: selected ? 3 : 1,
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        background: `linear-gradient(135deg, ${stepColor}15 0%, ${stepColor}08 100%)`,
        position: 'relative' // Para posicionar el badge de script
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {!isEndStep && (
            <Avatar 
              sx={{ 
                bgcolor: stepColor, 
                width: 24, 
                height: 24 
              }}
            >
              {getStepIcon(autoDetectedType)}
            </Avatar>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" component="div" sx={{ 
              color: stepColor, 
              fontWeight: 600,
              fontSize: '0.9rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {data.key || 'sin-key'}
            </Typography>
          </div>
        </div>
        
        {!isEndStep && (
          <Typography variant="caption" color="text.secondary" sx={{ 
            display: 'block', 
            fontSize: '0.75rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {getStepLabel(autoDetectedType)}
          </Typography>
        )}
        
        {!isEndStep && data.content && data.content.length > 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ 
            display: 'block', 
            fontSize: '0.7rem'
          }}>
            {data.content.length} elemento(s)
          </Typography>
        )}
      </CardContent>
      
      {/* Badge de script */}
      {hasScriptCode && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: '#9c27b0',
            color: 'white',
            borderRadius: 1,
            px: 0.5,
            py: 0.2,
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            boxShadow: 1,
            zIndex: 1
          }}
        >
          {'</>'}
        </Box>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: stepColor,
          width: 10,
          height: 10,
          border: '2px solid white',
        }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: stepColor,
          width: 10,
          height: 10,
          border: '2px solid white',
        }}
      />
    </Card>
  );
};