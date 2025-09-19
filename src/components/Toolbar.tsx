import React, { useRef } from 'react';
import {
  AppBar,
  Toolbar as MuiToolbar,
  Typography,
  Button,
  Box,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Route,
  FileUpload,
  FileDownload,
  Settings,
  DeleteSweep,
  AccountTree,
  Search,
} from '@mui/icons-material';
import type { YumpiiFlow } from '../types/flow';

interface ToolbarProps {
  onAddNode: () => void;
  onImportFlow: (jsonData: string) => void;
  onExportFlow: () => YumpiiFlow;
  onTogglePanel: () => void;
  onClearProgress?: () => void;
  onAutoLayout?: () => void;
  onOpenSearch?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  onImportFlow,
  onExportFlow,
  onTogglePanel,
  onClearProgress,
  onAutoLayout,
  onOpenSearch,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          onImportFlow(content);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    const flow = onExportFlow();
    const dataStr = JSON.stringify(flow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `flow-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <AppBar 
      position="static" 
      color="default" 
      elevation={2}
      sx={{ 
        zIndex: 1300,
        backgroundColor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <MuiToolbar sx={{ gap: 2, minHeight: '64px !important' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, color: 'primary.main', fontWeight: 600 }}>
          Flow Builder
        </Typography>
        
        <Divider orientation="vertical" flexItem />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1, color: 'text.secondary' }}>
            Agregar Estado:
          </Typography>
          <Tooltip title="Agregar nuevo estado">
            <Button 
              onClick={() => onAddNode()}
              startIcon={<Route />}
              variant="contained"
              size="small"
            >
              Nuevo Estado
            </Button>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Importar flujo desde JSON">
            <Button 
              variant="outlined" 
              startIcon={<FileUpload />}
              onClick={handleImport}
              size="small"
            >
              Import
            </Button>
          </Tooltip>
          
          <Tooltip title="Exportar flujo a JSON">
            <Button 
              variant="outlined" 
              startIcon={<FileDownload />}
              onClick={handleExport}
              size="small"
            >
              Export
            </Button>
          </Tooltip>
          
          {onAutoLayout && (
            <Tooltip title="Reorganizar nodos automáticamente en estructura de árbol">
              <Button 
                variant="outlined" 
                startIcon={<AccountTree />}
                onClick={onAutoLayout}
                size="small"
                color="secondary"
              >
                Auto Layout
              </Button>
            </Tooltip>
          )}

          {onOpenSearch && (
            <Tooltip title="Buscar step por key">
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={onOpenSearch}
                size="small"
                color="info"
              >
                Buscar
              </Button>
            </Tooltip>
          )}
        </Box>
        
        {onClearProgress && (
          <>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Limpiar progreso guardado y empezar desde cero">
              <Button 
                variant="outlined" 
                startIcon={<DeleteSweep />}
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres limpiar todo el progreso guardado?')) {
                    onClearProgress();
                  }
                }}
                size="small"
                color="warning"
              >
                Limpiar
              </Button>
            </Tooltip>
          </>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Tooltip title="Toggle Panel">
          <Button 
            variant="outlined" 
            startIcon={<Settings />}
            onClick={onTogglePanel}
            size="small"
          >
            Panel
          </Button>
        </Tooltip>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </MuiToolbar>
    </AppBar>
  );
};