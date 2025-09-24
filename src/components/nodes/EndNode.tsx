import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { Stop } from '@mui/icons-material';
import type { EditorNodeData } from '../../types/flow';

interface EndNodeProps {
  data: EditorNodeData;
  selected?: boolean;
}

export const EndNode: React.FC<EndNodeProps> = ({ data, selected }) => {
  const isHighlighted = data.highlighted;
  
  return (
    <Card 
      sx={{ 
        minWidth: 200,
        boxShadow: isHighlighted ? 6 : (selected ? 4 : 2),
        border: isHighlighted ? 3 : (selected ? 2 : 1),
        borderColor: isHighlighted ? '#ff5722' : (selected ? 'error.main' : 'divider'),
        background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
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
          <Stop color="error" />
          <Typography variant="h6" component="div" color="error.main">

          </Typography>
          <Chip 
            label="End" 
            size="small" 
            color="error" 
            variant="outlined"
          />
        </div>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {data.label || data.key || 'Nodo final'}
        </Typography>
        {data.key && (
          <Typography variant="caption" color="text.disabled">
            Key: {data.key}
          </Typography>
        )}
        {data.content && data.content.length > 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
            Mensaje de despedida configurado
          </Typography>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#d32f2f',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
    </Card>
  );
};