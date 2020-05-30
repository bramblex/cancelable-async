import React, { useState, useRef } from 'react';
import { cancelable } from './cancelable-async'

const defaultValue = `
for (let i=0; i < 10; i++) {
  await (new Promise(resolve => setTimeout(resolve, 1e3)));
  console.log(i);
}
`;

function App() {
  const [content, setContent] = useState(defaultValue);
  const [finalCode, setFinalCode] = useState('');
  const cancelRef = useRef<() => void>();
  const [logs, setLogs] = useState<string[]>([]);

  return (
    <div>
      <h1>Cancelable Async</h1>
      <hr />
      <h2>Async Function:</h2>
      <div>
        {'async function() {'}
        <textarea
          value={content}
          onChange={ev => setContent(ev.target.value)}
          style={{
            width: 'calc(100% - 2em)',
            marginLeft: '2em',
            height: '200px',
          }}
        />
        {'}'}
      </div>
      <div>
        <button
          onClick={async () => {
            setLogs([]);
            const console = {
              log(...contents: string[]) {
                setLogs(old => old.concat(contents));
              }
            };
            const funcCode = cancelable(`async function __func__ (){ ${content} }`);

            setFinalCode(funcCode);

            const [func, cancel] = eval(funcCode);
            cancelRef.current = cancel;
            try {
              await func();
              console.log('=== End ===');
            } catch (error) {
              if (error.message === 'Cancel') {
                console.log('=== Cancel ===');
              }
            }
          }}
        >Run</button>
        <button
          onClick={() => cancelRef.current && cancelRef.current()}
        >Cancel</button>
      </div>
      <h2>Compiled Code:</h2>
      <pre>
        {finalCode}
      </pre>
      <h2>Console:</h2>
      <div>
        {logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
}

export default App;
