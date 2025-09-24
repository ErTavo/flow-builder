import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import type { EditorNodeData } from '../../types/flow';

interface StartNodeProps {
  data: EditorNodeData;
  selected?: boolean;
}

export const StartNode: React.FC<StartNodeProps> = ({ data, selected }) => {
  const isHighlighted = data.highlighted;
  
  return (
    <Card 
      sx={{ 
        minWidth: 200,
        boxShadow: isHighlighted ? 6 : (selected ? 4 : 2),
        border: isHighlighted ? 3 : (selected ? 2 : 1),
        borderColor: isHighlighted ? '#ff5722' : (selected ? 'primary.main' : 'divider'),
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        animation: isHighlighted ? 'pulse 1.5s ease-in-out infinite' : 'none',
        '@keyframes pulse': {
          '0%': {
            boxShadow: `0 0 0 0 rgba(255, 87, 34, 0.7)`,
          },
          '70%': {
            boxShadow: `0 0 0 10px rgba(255, 87, 34, 0)`,
          },
          '100%': {
            boxShadow: `0 0 0 0 rgba(255, 87, 34, 0)`,
          },
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <PlayArrow color="primary" />
          <Typography variant="h6" component="div" color="primary.main">
            Inicio
          </Typography>
          {data.isEntry && (
            <Chip 
              label="Entry" 
              size="small" 
              color="success" 
              variant="outlined"
            />
          )}
        </div>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {data.label || data.key || 'Nodo de inicio'}
        </Typography>
        {data.key && (
          <Typography variant="caption" color="text.disabled">
            Key: {data.key}
          </Typography>
        )}
      </CardContent>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#1976d2',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
    </Card>
  );
};