# Flow Builder - Editor Visual para Bot Controller

Un editor visual avanzado drag & drop para crear y modificar flujos conversacionales JSON compatibles con Bot Controller.

## 🚀 Características Principales

### 🎨 **Editor Visual Intuitivo**
- **Drag & Drop**: Interface completamente visual para construir flujos
- **Detección Automática de Tipos**: Los nodos se clasifican automáticamente según su contenido
- **Vista en Tiempo Real**: Visualización inmediata de cambios y conexiones
- **Auto-Layout**: Organización automática de nodos en estructura de árbol

### 🔷 **Tipos de Nodos Soportados**
- 🟢 **Start**: Punto de entrada del flujo conversacional
- 🔵 **Message**: Envío de mensajes de texto al usuario
- 🟡 **Button**: Mensajes con botones interactivos (máx. 3)
- � **Condition**: Lógica condicional con múltiples transiciones
- � **Script**: Ejecutar código personalizado con parámetros
- 🔗 **Delay**: Pausas temporales en la conversación
- 🔴 **End**: Finalización del flujo

### � **Soporte Completo WhatsApp Business API**
- **Botones Interactivos**: Hasta 3 botones por mensaje
- **Listas Desplegables**: Secciones con múltiples opciones
- **Contenido Multimedia**: Imágenes, videos, audios y documentos
- **Text Templates**: Variables dinámicas y personalización

## ✨ Funcionalidades Avanzadas

### 🔍 **Búsqueda y Navegación**
- **Búsqueda Global**: Encuentra nodos por key, label o tipo
- **Resaltado Visual**: Los nodos encontrados se resaltan con animación pulse
- **Navegación Rápida**: Salto directo a cualquier nodo del flujo
- **Filtrado Inteligente**: Resultados priorizados por relevancia

### � **Gestión de Transiciones Inteligente**
- **Auto-actualización**: Las transiciones se actualizan automáticamente al cambiar nombres
- **Prevención de Pérdida**: Sistema de cambios pendientes evita pérdida de datos
- **Display Limpio**: Visualización clara sin regex complejos
- **Edición Mejorada**: Campos de edición sin conflictos de estado

### 🎯 **Duplicación de Nodos**
- **Copia Completa**: Duplica nodos con todo su contenido y transiciones
- **Posicionamiento Inteligente**: Coloca copias en posiciones óptimas
- **Nombres Únicos**: Genera automáticamente nombres únicos para evitar conflictos
- **Un Clic**: Funcionalidad accesible directamente desde el panel de propiedades

### 🌐 **Configuración Global**
- **Variables Globales**: Define keywords y variables reutilizables
- **Horarios de Negocio**: Configura disponibilidad y mensajes automáticos
- **Panel Unificado**: Interface organizada con pestañas para fácil acceso

### 💾 **Persistencia Automática**
- **Auto-guardado**: El progreso se guarda automáticamente en localStorage
- **Recuperación**: Restaura el trabajo al reabrir la aplicación
- **Limpieza Completa**: Función de reset que limpia todo incluidas business hours
- **Importación Limpia**: Al importar se limpia todo el estado anterior

## 🛠️ Stack Tecnológico

- **React 18** + **TypeScript** - Framework principal con tipado estático
- **ReactFlow (@xyflow/react)** - Editor visual de nodos y conexiones  
- **Material-UI (MUI)** - Componentes de interface modernos
- **Vite** - Build tool ultra-rápido para desarrollo
- **Material Icons** - Iconografía completa y consistente

## 📦 Instalación y Configuración

```bash
# Clonar el repositorio
git clone [repository-url]
cd flow-builder

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# La aplicación se abrirá en: http://localhost:5173
```

## 🎯 Guía de Uso

### 📝 **Creando tu Primer Flujo**

1. **Agregar Nodos**: Usa el botón "Agregar Step" para crear nuevos nodos
2. **Conectar Flujo**: Arrastra desde los conectores para crear transiciones
3. **Configurar Contenido**: Selecciona un nodo para editar sus propiedades
4. **Agregar Transiciones**: Define las reglas de navegación entre nodos
5. **Exportar**: Descarga el JSON compatible con Yumpii Bot Controller

### 🔍 **Usando la Búsqueda**

1. **Abrir Búsqueda**: Haz clic en el ícono de lupa en la toolbar
2. **Buscar**: Escribe el nombre, key o tipo de nodo que buscas
3. **Seleccionar**: Haz clic en un resultado para navegar y resaltar el nodo
4. **Visualización**: El nodo se resalta con borde naranja y animación durante 3 segundos

### 📋 **Configurando Contenido**

#### **Mensajes con Botones**
```json
{
  "type": "button",
  "value": {
    "text": "¿En qué podemos ayudarte?",
    "buttons": [
      {
        "id": "btn_ventas",
        "title": "Ventas"
      },
      {
        "id": "btn_soporte", 
        "title": "Soporte"
      }
    ]
  }
}
```

#### **Listas Desplegables**
```json
{
  "type": "list",
  "value": {
    "bodyText": "Selecciona una opción:",
    "buttonText": "Ver Opciones",
    "sections": [
      {
        "id": "sec_consultas",
        "title": "Consultas Generales",
        "rows": [
          {
            "id": "row_horarios",
            "title": "Horarios",
            "description": "Conoce nuestros horarios de atención"
          }
        ]
      }
    ]
  }
}
```

### 🔗 **Configurando Transiciones**

#### **Transición Simple**
- **Tipo**: `regex`
- **Valor**: `^(si|sí|yes|ok)$`
- **Destino**: `siguiente-estado`

#### **Transición de Script**
- **Tipo**: `script`  
- **Parámetros**: `{ "script": "validar-usuario.js" }`
- **Delay**: `0` (milisegundos)

### 🌍 **Configuración Global**

#### **Variables Globales**
```json
{
  "keyword": "empresa",
  "value": "Mi Empresa S.A.",
  "type": "string"
}
```

#### **Horarios de Negocio**
```json
{
  "day": "monday",
  "start_time": "09:00",
  "end_time": "18:00",
  "timezone": "America/Mexico_City"
}
```
## 💡 **Funcionalidades Destacadas**

### 🔥 **Duplicación de Nodos**
Duplica cualquier nodo con un solo clic manteniendo todo su contenido:
- ✅ Contenido completo (textos, botones, listas)
- ✅ Transiciones configuradas
- ✅ Configuraciones de delay y parámetros
- ✅ Nombres únicos automáticos para evitar conflictos

### 🎨 **Resaltado Visual en Búsqueda**
Cuando buscas un nodo, se resalta visualmente en el canvas:
- 🟠 **Borde naranja** intenso (#ff5722)
- ✨ **Animación pulse** con efecto de sombra expandiéndose
- ⏱️ **Duración**: 3 segundos de resaltado automático
- 📍 **Navegación directa** al nodo encontrado

### 🔄 **Auto-actualización de Referencias**
Las transiciones se mantienen actualizadas automáticamente:
- 🔗 Cuando cambias el nombre de un step, todas las transiciones que apuntan a él se actualizan
- ⚠️ Sistema de "cambios pendientes" previene pérdida de datos
- 🔒 No puedes salir del panel si hay cambios sin sincronizar

### 🧹 **Limpieza Completa**
El botón "Limpiar" y la función de importar eliminan todo:
- 🗑️ Todos los nodos y conexiones
- 🌐 Variables globales
- ⏰ Configuraciones de horarios de negocio
- 💾 Datos guardados en localStorage

## 📊 **Formato de Salida (Yumpii JSON)**

El editor genera JSON compatible con Yumpii Bot Controller:

```json
{
  "structure": {
    "entry": "inicio",
    "states": [
      {
        "key": "inicio",
        "content": [
          {
            "type": "text",
            "value": {
              "text": "¡Hola! Bienvenido a nuestro asistente virtual."
            }
          }
        ],
        "transitions": [
          {
            "type": "regex",
            "value": "^(continuar|siguiente|ok)$",
            "next": "menu-principal"
          }
        ],
        "transition_delay": 0
      }
    ],
    "default": {
      "text": "Lo siento, no entendí tu mensaje."
    },
    "globals": [
      {
        "keyword": "empresa",
        "value": "Mi Empresa S.A.",
        "type": "string"
      }
    ],
    "business_hours": [
      {
        "day": "monday",
        "start_time": "09:00", 
        "end_time": "18:00",
        "timezone": "America/Mexico_City"
      }
    ]
  }
}
```

## � **Scripts de Desarrollo**

```bash
# Desarrollo
npm run dev      # Servidor con hot-reload en puerto 5173

# Producción  
npm run build    # Compilar para producción
npm run preview  # Preview del build de producción

# Utilidades
npm run lint     # Revisar código con ESLint
npm run type-check # Verificar tipos de TypeScript
```

## 📁 **Arquitectura del Proyecto**

```
flow-builder/
├── src/
│   ├── components/
│   │   ├── nodes/              # Nodos del editor
│   │   │   ├── StartNode.tsx   # Nodo de inicio
│   │   │   ├── StepNode.tsx    # Nodos de pasos
│   │   │   └── EndNode.tsx     # Nodos de finalización
│   │   ├── FlowBuilder.tsx     # Editor principal
│   │   ├── Toolbar.tsx         # Barra de herramientas
│   │   ├── PropertiesPanel.tsx # Panel de propiedades
│   │   ├── GlobalsPanel.tsx    # Panel de variables globales
│   │   ├── BusinessHoursPanel.tsx # Panel de horarios
│   │   └── SearchDialog.tsx    # Diálogo de búsqueda
│   ├── types/
│   │   └── flow.ts             # Tipos TypeScript
│   ├── utils/
│   │   └── uuid.ts             # Utilidades para IDs únicos
│   ├── App.tsx                 # Componente raíz
│   └── main.tsx               # Punto de entrada
├── flowexample.json           # Archivo de ejemplo
├── tailwind.config.js         # Configuración de Tailwind
├── tsconfig.json             # Configuración TypeScript
└── vite.config.ts            # Configuración de Vite
```

## 🎯 **Casos de Uso**

### 📞 **Flujo de Atención al Cliente**
- Saludo inicial con opciones
- Menús de navegación por departamentos
- Formularios de contacto
- Transferencia a agentes humanos

### 🛒 **Flujo de Ventas**
- Catálogo de productos con listas
- Proceso de cotización
- Confirmación de pedidos
- Seguimiento de envíos

### 📋 **Encuestas y Formularios**
- Recolección de datos paso a paso
- Validación de respuestas con scripts
- Confirmaciones y agradecimientos
- Exportación de resultados

### 🤖 **Asistente Virtual Inteligente**
- Respuestas automáticas por horarios
- Escalamiento a humanos
- Base de conocimiento con FAQs
- Personalización por tipo de usuario

---

## 🤝 **Contribución**

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`) 
5. Abre un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la licencia MIT - ver el archivo LICENSE para detalles.

---

**Desarrollado con ❤️ para Yumpii Bot Controller** 🤖✨

**Made by ErTavo** © 2025
