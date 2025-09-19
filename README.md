# Flow Builder - Visual Editor for Bot Controller

Un editor visual drag & drop para crear y modificar flujos conversacionales JSON para Bot Controller.

## 🚀 Características

- **Editor Visual Drag & Drop**: Crea flujos conversacionales de manera intuitiva
- **Tipos de Nodos Soportados**:
  - 🟢 **Start**: Punto de inicio del flujo
  - 🔵 **Message**: Envío de mensajes al usuario
  - 🟡 **Condition**: Lógica condicional y bifurcaciones
  - 🟣 **Action**: Acciones como llamadas API, webhooks, delays
  - 🔴 **End**: Finalización del flujo
  - 📝 **Input**: Captura de datos del usuario
  - 📋 **Menu**: Opciones múltiples para el usuario

- **Funcionalidades del Editor**:
  - Conectar nodos con transiciones
  - Panel de propiedades para configurar cada nodo
  - Importar/Exportar JSON compatible con Bot Controller
  - Vista previa en tiempo real del flujo
  - Minimap para navegación en flujos grandes

## 🛠️ Tecnologías Utilizadas

- **React 18** + **TypeScript** - Frontend framework
- **React Flow** - Editor visual de flujos
- **Tailwind CSS** - Estilos y diseño
- **Vite** - Build tool y desarrollo
- **Lucide React** - Iconos

## 📦 Instalación y Uso

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en el navegador: http://localhost:5173
```

## 🎯 Cómo Usar el Editor

### Crear un Nuevo Flujo

1. **Agregar Nodos**: Usa la barra de herramientas superior para agregar diferentes tipos de nodos
2. **Conectar Nodos**: Arrastra desde los puntos de conexión para crear transiciones
3. **Configurar Propiedades**: Haz clic en un nodo para editar sus propiedades en el panel lateral
4. **Exportar**: Usa el botón "Export" para descargar el JSON del flujo

### Importar Flujo Existente

1. Haz clic en "Import" en la barra de herramientas
2. Selecciona un archivo JSON compatible con Bot Controller
3. El flujo se cargará automáticamente en el editor

## 📋 Estructura del JSON

El editor genera/consume JSON compatible con el formato de Bot Controller:

```json
{
  "id": "flow-unique-id",
  "name": "Mi Flujo Conversacional", 
  "states": [
    {
      "id": "start-1",
      "name": "Inicio",
      "type": "start"
    }
  ],
  "transitions": [
    {
      "id": "transition-1", 
      "from": "start-1",
      "to": "message-1"
    }
  ]
}
```

## 🔧 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

## 📁 Estructura del Proyecto

```
flow-builder/
├── src/
│   ├── components/
│   │   ├── nodes/          # Componentes de nodos
│   │   ├── FlowBuilder.tsx # Componente principal
│   │   ├── Toolbar.tsx     # Barra de herramientas
│   │   └── PropertiesPanel.tsx # Panel de propiedades
│   ├── types/
│   │   └── flow.ts         # Definiciones de tipos
│   ├── App.tsx
│   └── main.tsx
├── public/
└── package.json
```

---

**Desarrollado para Bot Controller** 🤖✨