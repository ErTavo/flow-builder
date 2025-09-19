import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Avatar } from '@mui/material';
import { 
  Message, 
  TouchApp, 
  Route, 
  Code, 
  Schedule 
} from '@mui/icons-material';
import type { EditorNodeData } from '../../types/flow';

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
  const stepColor = getStepColor(data.stepType);
  
  return (
    <Card 
      sx={{ 
        minWidth: 160,
        maxWidth: 180,
        boxShadow: selected ? 3 : 1,
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        background: `linear-gradient(135deg, ${stepColor}15 0%, ${stepColor}08 100%)`,
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Avatar 
            sx={{ 
              bgcolor: stepColor, 
              width: 24, 
              height: 24 
            }}
          >
            {getStepIcon(data.stepType)}
          </Avatar>
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
        
        <Typography variant="caption" color="text.secondary" sx={{ 
          display: 'block', 
          fontSize: '0.75rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getStepLabel(data.stepType)}
        </Typography>
        
        {data.content && data.content.length > 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ 
            display: 'block', 
            fontSize: '0.7rem'
          }}>
            {data.content.length} elemento(s)
          </Typography>
        )}
      </CardContent>
      
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