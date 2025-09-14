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
    </div>
  );
}

export default App;