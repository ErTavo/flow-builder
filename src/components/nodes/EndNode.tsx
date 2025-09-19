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
  return (
    <Card 
      sx={{ 
        minWidth: 200,
        boxShadow: selected ? 4 : 2,
        border: selected ? 2 : 1,
        borderColor: selected ? 'error.main' : 'divider',
        background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Stop color="error" />
          <Typography variant="h6" component="div" color="error.main">
            Fin
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