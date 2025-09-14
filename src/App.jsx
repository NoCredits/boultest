import { useState } from 'react';
import Boul from './Boul';
import BoulEntity from './BoulEntity';
import SimpleEntityDemo from './SimpleEntityDemo';
import BasicEntityTest from './BasicEntityTest';
import TileDemo from './TileDemo';
import BoulTileProduction from './BoulTileProduction';
import BoulTileWorking from './BoulTileWorking';

function App() {
  const [currentVersion, setCurrentVersion] = useState('original'); // 'original', 'entity', 'demo', 'test', 'tiles', 'production', 'working'

  const renderCurrentVersion = () => {
    switch (currentVersion) {
      case 'entity': return <BoulEntity />;
      case 'demo': return <SimpleEntityDemo />;
      case 'test': return <BasicEntityTest />;
      case 'tiles': return <TileDemo />;
      case 'production': return <BoulTileProduction />;
      case 'working': return <BoulTileWorking />;
      default: return <Boul />;
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1>Boulder Dash Game</h1>
        <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setCurrentVersion('original')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentVersion === 'original' ? '#4CAF50' : '#ddd',
              color: currentVersion === 'original' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Original
          </button>
          <button 
            onClick={() => setCurrentVersion('entity')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentVersion === 'entity' ? '#4CAF50' : '#ddd',
              color: currentVersion === 'entity' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Entity System
          </button>
          <button 
            onClick={() => setCurrentVersion('test')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentVersion === 'test' ? '#4CAF50' : '#ddd',
              color: currentVersion === 'test' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🧪 Basic Test
          </button>
          <button 
            onClick={() => setCurrentVersion('demo')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentVersion === 'demo' ? '#4CAF50' : '#ddd',
              color: currentVersion === 'demo' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ✨ Entity Demo
          </button>
          <button 
            onClick={() => setCurrentVersion('tiles')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentVersion === 'tiles' ? '#4CAF50' : '#ddd',
              color: currentVersion === 'tiles' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🎨 Tile Demo
          </button>
          <button 
            onClick={() => setCurrentVersion('production')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentVersion === 'production' ? '#4CAF50' : '#ddd',
              color: currentVersion === 'production' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🚀 Production
          </button>
          <button 
            onClick={() => setCurrentVersion('working')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentVersion === 'working' ? '#4CAF50' : '#ddd',
              color: currentVersion === 'working' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔧 Working
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Current Version: <strong>
            {currentVersion === 'original' && 'Original (Legacy Grid)'}
            {currentVersion === 'entity' && 'Entity System (Functional)'}
            {currentVersion === 'test' && 'Basic Entity Test'}
            {currentVersion === 'demo' && 'Entity Demo (Enhanced Visuals)'}
            {currentVersion === 'tiles' && 'Tile Class System Demo'}
            {currentVersion === 'production' && 'Production (Tile Classes)'}
            {currentVersion === 'working' && 'Working Copy (Clean Test)'}
          </strong>
        </div>
      </div>
      
      {renderCurrentVersion()}
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>🎮 Version Comparison:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <div>
            <h4>📊 Original:</h4>
            <ul style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <li>Grid-based tiles</li>
              <li>Full game functionality</li>
              <li>Pathfinding system</li>
            </ul>
          </div>
          <div>
            <h4>🔧 Entity System:</h4>
            <ul style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <li>Same as original</li>
              <li>Entity architecture</li>
              <li>All features work</li>
            </ul>
          </div>
          <div>
            <h4>🧪 Basic Test:</h4>
            <ul style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <li>Simple entity rendering</li>
              <li>Debug information</li>
              <li>Fixed patterns</li>
            </ul>
          </div>
          <div>
            <h4>✨ Entity Demo:</h4>
            <ul style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <li>Enhanced visuals</li>
              <li>Dynamic level</li>
              <li>Full entity system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;