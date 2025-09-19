import FlowBuilder from './components/FlowBuilder';
import './App.css';

function App() {
  return (
    <div className="App">
      <FlowBuilder onFlowChange={(flow) => console.log('Flow changed:', flow)} />
    </div>
  );
}

export default App;
