import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import { 
  Box, 
  Paper, 
  Drawer, 
  Tabs, 
  Tab, 
  Alert,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Public as PublicIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';

import { StartNode } from './nodes/StartNode';
import { StepNode } from './nodes/StepNode';
import { EndNode } from './nodes/EndNode';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { GlobalsPanel } from './GlobalsPanel';
import { BusinessHoursPanel } from './BusinessHoursPanel';
import SearchDialog from './SearchDialog';

import type { 
  EditorNode, 
  EditorEdge, 
  EditorFlow,
  YumpiiFlow,
  GlobalKeyword,
  BusinessHour,
  TextValue 
} from '../types/flow';

// Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const nodeTypes = {
  start: StartNode,
  step: StepNode,
  end: EndNode,
};

const initialNodes: EditorNode[] = [];

interface FlowBuilderProps {
  onFlowChange?: (flow: EditorFlow) => void;
}

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ onFlowChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<EditorNode | null>(null);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [globals, setGlobals] = useState<GlobalKeyword[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);

  // localStorage utility functions
  const saveToLocalStorage = useCallback((
    nodesToSave: EditorNode[], 
    edgesToSave: EditorEdge[], 
    globalsToSave: GlobalKeyword[],
    businessHoursToSave: BusinessHour[],
    selectedNodeToSave: EditorNode | null
  ) => {
    try {
      const flowData = {
        nodes: nodesToSave,
        edges: edgesToSave,
        globals: globalsToSave,
        businessHours: businessHoursToSave,
        selectedNode: selectedNodeToSave,
        timestamp: Date.now()
      };
      localStorage.setItem('flowBuilder_progress', JSON.stringify(flowData));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);

  const loadFromLocalStorage = useCallback((): {
    nodes: EditorNode[], 
    edges: EditorEdge[], 
    globals: GlobalKeyword[],
    businessHours: BusinessHour[],
    selectedNode: EditorNode | null
  } | null => {
    try {
      const savedData = localStorage.getItem('flowBuilder_progress');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Validate data structure
        if (parsed.nodes && parsed.edges && parsed.globals !== undefined) {
          return {
            nodes: parsed.nodes,
            edges: parsed.edges,
            globals: parsed.globals,
            businessHours: parsed.businessHours || [],
            selectedNode: parsed.selectedNode || null
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return null;
  }, []);

  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem('flowBuilder_progress');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, []);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setNodes(savedData.nodes);
      setEdges(savedData.edges);
      setGlobals(savedData.globals);
      setBusinessHours(savedData.businessHours);
      if (savedData.selectedNode) {
        setSelectedNode(savedData.selectedNode);
      }
    }
  }, [loadFromLocalStorage, setNodes, setEdges]);

  // Auto-save when data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToLocalStorage(nodes, edges, globals, businessHours, selectedNode);
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, globals, businessHours, selectedNode, saveToLocalStorage]);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge: EditorEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'default',
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as EditorNode);
    setActiveTab(0); // Switch to Properties tab
    setRightDrawerOpen(true);
  }, []);

  // Search functionality
  const handleOpenSearch = useCallback(() => {
    setSearchDialogOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchDialogOpen(false);
  }, []);

  const handleSelectNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Select the node in state
      setSelectedNode(node as EditorNode);
      setActiveTab(0); // Switch to Properties tab
      setRightDrawerOpen(true);
      
      // Store the node ID for the NavigationHelper component
      setNavigationTarget(nodeId);
    }
  }, [nodes]);

  const addNode = useCallback(() => {
    const newNode: EditorNode = {
      id: `step-${Date.now()}`,
      type: 'step',
      position: { 
        x: Math.random() * 400 + 200, 
        y: Math.random() * 400 + 200 
      },
      data: {
        label: 'Nuevo Estado',
        key: `estado-${Date.now()}`,
        stepType: 'message',
        content: [],
        transitions: [],
        transition_delay: 0,
        isEntry: false,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const updateNode = useCallback((nodeId: string, updates: Partial<EditorNode['data']>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Si este nodo se marca como entry, desmarcar todos los demás
          if (updates.isEntry === true) {
            // Desmarcar todos los otros nodos como entry
            nds.forEach((otherNode) => {
              if (otherNode.id !== nodeId && otherNode.data.isEntry) {
                otherNode.data = { ...otherNode.data, isEntry: false };
              }
            });
          }
          return { ...node, data: { ...node.data, ...updates } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const syncTransitionsToCanvas = useCallback(() => {
    // Update node types based on current state
    const updatedNodes = nodes.map((node) => {
      let newType: 'start' | 'step' | 'end' = node.type;
      
      // Determine correct type based on isEntry and transitions
      if (node.data.isEntry) {
        newType = 'start';
      } else if (!node.data.transitions || node.data.transitions.length === 0) {
        newType = 'end';
      } else {
        newType = 'step';
      }
      
      return newType !== node.type ? { ...node, type: newType } : node;
    });
    
    // Update nodes if any type changed
    if (updatedNodes.some((node, index) => node.type !== nodes[index].type)) {
      setNodes(updatedNodes);
    }
    
    // Recreate edges based on current node transitions
    const newEdges: EditorEdge[] = [];
    
    updatedNodes.forEach((node) => {
      if (node.data.transitions) {
        node.data.transitions.forEach((transition, index) => {
          const targetNodeId = updatedNodes.find(n => n.data.key === transition.next)?.id;
          if (targetNodeId) {
            newEdges.push({
              id: `edge-${node.id}-${targetNodeId}-${index}`,
              source: node.id,
              target: targetNodeId,
              label: `${transition.type}: ${transition.value || 'auto'}`,
              type: 'default',
            });
          }
        });
      }
    });
    
    setEdges(newEdges);
  }, [nodes, setEdges, setNodes]);

  // Auto-layout function using dagre
  const applyAutoLayout = useCallback((nodesToLayout: EditorNode[], edgesToLayout: EditorEdge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ 
      rankdir: 'TB', // Top to Bottom
      nodesep: 100,   // Space between nodes horizontally
      ranksep: 150,   // Space between levels vertically
    });

    // Add nodes to dagre graph
    nodesToLayout.forEach((node) => {
      dagreGraph.setNode(node.id, { 
        width: 200, 
        height: 100 
      });
    });

    // Add edges to dagre graph
    edgesToLayout.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply calculated positions
    const layoutedNodes = nodesToLayout.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
      };
    });

    return layoutedNodes;
  }, []);

  const importYumpiiFlow = useCallback((jsonData: string) => {
    try {
      const yumpiiFlow: YumpiiFlow = JSON.parse(jsonData);
      
      if (!yumpiiFlow.structure) {
        throw new Error('El archivo no tiene la estructura de válida');
      }

      // Convert states to editor nodes
      const convertedNodes: EditorNode[] = yumpiiFlow.structure.states.map((state, index) => {
        const isEntry = state.key === yumpiiFlow.structure.entry;
        const nodeType = isEntry ? 'start' : 
                        state.transitions.length === 0 ? 'end' : 'step';
        
        // Determine step type for step nodes
        let stepType: 'message' | 'button' | 'condition' | 'script' | 'delay' = 'message';
        if (state.content.length > 0) {
          const contentType = state.content[0].type;
          stepType = contentType === 'button' ? 'button' : 'message';
        }

        return {
          id: `node-${state.key}`,
          type: nodeType,
          position: { 
            x: (index % 5) * 250 + 100, 
            y: Math.floor(index / 5) * 200 + 100 
          },
          data: {
            label: state.content.length > 0 && state.content[0].type === 'text' 
              ? (state.content[0].value as TextValue)?.text?.substring(0, 50) || state.key
              : state.key,
            key: state.key,
            stepType: nodeType === 'step' ? stepType : undefined,
            content: state.content,
            transitions: state.transitions,
            transition_delay: state.transition_delay,
            isEntry,
          },
        };
      });

      // Convert transitions to edges
      const convertedEdges: EditorEdge[] = [];
      yumpiiFlow.structure.states.forEach((state) => {
        state.transitions.forEach((transition, index) => {
          if (transition.next) {
            convertedEdges.push({
              id: `edge-${state.key}-${transition.next}-${index}`,
              source: `node-${state.key}`,
              target: `node-${transition.next}`,
              label: transition.type,
            });
          }
        });
      });

      // Apply auto-layout to organize nodes in tree structure
      const layoutedNodes = applyAutoLayout(convertedNodes, convertedEdges);

      setNodes(layoutedNodes);
      setEdges(convertedEdges);
      setGlobals(yumpiiFlow.structure.globals || []);
      setBusinessHours(yumpiiFlow.structure.business_hours || []);
      setImportError(null);

      // Notify parent component
      if (onFlowChange) {
        onFlowChange({
          nodes: layoutedNodes,
          edges: convertedEdges,
          yumpiiData: yumpiiFlow,
        });
      }

    } catch (error) {
      console.error('Error importing flow:', error);
      setImportError(error instanceof Error ? error.message : 'Error desconocido al importar el archivo');
    }
  }, [setNodes, setEdges, onFlowChange, applyAutoLayout]);

  const exportYumpiiFlow = useCallback((): YumpiiFlow => {
    // Convert editor nodes back to format
    const yumpiiStates = nodes.map((node) => ({
      key: node.data.key,
      content: node.data.content || [],
      transitions: node.data.transitions || [],
      transition_delay: node.data.transition_delay || 0,
    }));

    const entryNode = nodes.find(node => node.data.isEntry);
    
    return {
      structure: {
        entry: entryNode?.data.key || 'init',
        states: yumpiiStates,
        default: {
          text: 'Lo siento, no comprendo lo que me enviaste. 😔\nIntentémoslo de nuevo o escribe *menú* para volver a comenzar...',
        },
        globals,
        business_hours: businessHours,
      },
    };
  }, [nodes, globals, businessHours]);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length > 0) {
      const layoutedNodes = applyAutoLayout(nodes, edges);
      setNodes(layoutedNodes);
    }
  }, [nodes, edges, applyAutoLayout, setNodes]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw',
        bgcolor: 'grey.50',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
        {/* Toolbar - Siempre visible en la parte superior */}
        <Box sx={{ 
          flexShrink: 0,
          zIndex: 1300,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
          <Toolbar
            onAddNode={addNode}
            onImportFlow={importYumpiiFlow}
            onExportFlow={() => exportYumpiiFlow()}
            onTogglePanel={() => setRightDrawerOpen(!rightDrawerOpen)}
            onAutoLayout={handleAutoLayout}
            onOpenSearch={handleOpenSearch}
            onClearProgress={() => {
              clearLocalStorage();
              setNodes([]);
              setEdges([]);
              setGlobals([]);
              setSelectedNode(null);
              setActiveTab(0);
            }}
          />
        </Box>

        {/* Contenido principal */}
        <Box sx={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0
        }}>
          {/* Main Flow Area - Ocupa toda la vista disponible */}
          <Box sx={{ 
            flex: 1, 
            position: 'relative',
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0
          }}>

          {/* Import Error Alert */}
          {importError && (
            <Alert 
              severity="error" 
              onClose={() => setImportError(null)}
              sx={{ 
                position: 'absolute', 
                top: 20, 
                left: 20, 
                right: rightDrawerOpen ? 440 : 20, // Deja espacio si el drawer está abierto
                zIndex: 1000 
              }}
            >
              {importError}
            </Alert>
          )}

          {/* React Flow - Ocupa toda la vista */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            style={{ 
              height: '100%', 
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <NavigationHelper
              targetNodeId={navigationTarget}
              nodes={nodes as EditorNode[]}
              onNavigated={() => setNavigationTarget(null)}
            />
          </ReactFlow>
        </Box>

        {/* Right Drawer with Properties and Globals - Flotante sobre el canvas */}
        <Drawer
          anchor="right"
          open={rightDrawerOpen}
          variant="persistent"
          sx={{
            width: 0, // No afecta el layout principal
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 400,
              boxSizing: 'border-box',
              position: 'fixed',
              top: 64, // Debajo del toolbar
              height: 'calc(100vh - 64px)',
              zIndex: 1200,
              backgroundColor: 'background.paper',
              boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <Paper square sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab 
                icon={<SettingsIcon />} 
                label="Propiedades" 
                iconPosition="start"
              />
              <Tab 
                icon={<PublicIcon />} 
                label="Globales" 
                iconPosition="start"
              />
              <Tab 
                icon={<ScheduleIcon />} 
                label="Business Hours" 
                iconPosition="start"
              />
            </Tabs>
            
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              {activeTab === 0 && (
                <PropertiesPanel
                  node={selectedNode}
                  onUpdateNode={updateNode}
                  onDeleteNode={deleteNode}
                  availableStates={nodes.map(n => ({ 
                    key: n.data.key as string, 
                    label: n.data.label 
                  }))}
                  onSyncTransitions={syncTransitionsToCanvas}
                />
              )}
              
              {activeTab === 1 && (
                <GlobalsPanel
                  globals={globals}
                  onUpdateGlobals={setGlobals}
                />
              )}
              
              {activeTab === 2 && (
                <BusinessHoursPanel
                  businessHours={businessHours}
                  onUpdateBusinessHours={setBusinessHours}
                  availableStates={nodes as EditorNode[]}
                />
              )}
            </Box>
          </Paper>
        </Drawer>
        </Box>
      </Box>

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={handleCloseSearch}
        nodes={nodes as EditorNode[]}
        onSelectNode={handleSelectNode}
      />
    </ThemeProvider>
  );
};

export default FlowBuilder;

// Helper component to handle navigation within ReactFlow context
const NavigationHelper: React.FC<{ 
  targetNodeId: string | null; 
  nodes: EditorNode[]; 
  onNavigated: () => void 
}> = ({ targetNodeId, nodes, onNavigated }) => {
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    if (targetNodeId) {
      const node = nodes.find(n => n.id === targetNodeId);
      if (node) {
        // Center the view on the selected node
        reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2 });
        onNavigated();
      }
    }
  }, [targetNodeId, nodes, reactFlowInstance, onNavigated]);

  return null; // This component doesn't render anything
};