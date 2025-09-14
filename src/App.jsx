import { useState } from 'react';
import Boul from './Boul';
import TileDemo from './TileDemo';
import BoulTileEnhanced from './BoulTileEnhanced';

function App() {
  const [currentVersion, setCurrentVersion] = useState('enhanced'); // 'original', 'tiles', 'enhanced'

  const renderCurrentVersion = () => {
    switch (currentVersion) {
      case 'tiles': return <TileDemo />;
      case 'enhanced': return <BoulTileEnhanced />;
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
            📊 Original
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
            onClick={() => setCurrentVersion('enhanced')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentVersion === 'enhanced' ? '#4CAF50' : '#ddd',
              color: currentVersion === 'enhanced' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ✨ Enhanced Game
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Current Version: <strong>
            {currentVersion === 'original' && 'Original Boulder Dash (Preserved)'}
            {currentVersion === 'tiles' && 'Tile Class System Demo'}
            {currentVersion === 'enhanced' && 'Enhanced Game with Tile Classes'}
          </strong>
        </div>
      </div>
      
      {renderCurrentVersion()}
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>🎮 Boulder Dash Versions:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
          <div>
            <h4>📊 Original:</h4>
            <ul style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <li>✅ Full game functionality</li>
              <li>✅ Grid-based rendering</li>
              <li>✅ Pathfinding system</li>
              <li>✅ Original graphics & starfield</li>
              <li>🛡️ Preserved as reference</li>
            </ul>
          </div>
          <div>
            <h4>🎨 Tile Demo:</h4>
            <ul style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <li>✅ Object-oriented tile classes</li>
              <li>✅ Separated entity logic</li>
              <li>✅ Enhanced graphics showcase</li>
              <li>✅ Clean architecture demo</li>
              <li>🧪 Development sandbox</li>
            </ul>
          </div>
          <div>
            <h4>✨ Enhanced Game:</h4>
            <ul style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <li>🎯 Production-ready version</li>
              <li>✅ Tile-based OOP architecture</li>
              <li>✅ Enhanced visuals & animations</li>
              <li>✅ Animated directional player</li>
              <li>✅ All original features + more</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
          <strong>🚀 Recommended:</strong> Use <em>"Enhanced Game"</em> for the full experience with object-oriented tile classes, 
          enhanced graphics, animated player, and all the improvements while preserving the original gameplay.
        </div>
      </div>
    </div>
  );
}

export default App;