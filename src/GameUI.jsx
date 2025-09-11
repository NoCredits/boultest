import React from 'react';

export default function GameUI({ 
  score, 
  lives, 
  levelJson, 
  setLevelJson, 
  onReset, 
  onLoadLevel 
}) {
  return (
    <div>
      <div id="ui">
        <button id="resetBtn" onClick={onReset}>Reset</button>
        <div>Click once to show path, click again on same spot to follow it. Arrow keys also work.</div>
        <span id="score">{score}</span>
        <div style={{ marginLeft: 'auto' }}>Lives: <span id="lives">{lives}</span></div>
        <div>
          <span>Score: <span id="score">{score}</span></span>
        </div>
        <div>Current Date/Time: 11:02 AM CEST, Thursday, September 11, 2025</div>
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <textarea 
          id="levelJson" 
          rows={4} 
          cols={60} 
          placeholder="Paste level JSON here" 
          value={levelJson} 
          onChange={e => setLevelJson(e.target.value)} 
        />
        <br />
        <button id="loadLevelBtn" onClick={onLoadLevel}>Load Level</button>
      </div>
    </div>
  );
}