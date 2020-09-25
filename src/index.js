import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { faSync } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadData, getResults } from './poe_worth.js';

const App = () => {
  const [league, setLeague] = useState('Heist');
  const [min_budget, setMinBudget] = useState('');
  const [max_budget, setMaxBudget] = useState('');
  const [data, setData] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!data || league !== data.league) downloadData(league).then(data => setData(data));
  }, [data, league]);
  useEffect(() => {
    setResults(data ? getResults(data, min_budget, max_budget, league) : []);
  }, [data, min_budget, max_budget, league]);
  const changeLeague = event => {
    setData(null);
    setLeague(event.target.value);
  };

  return (
    <div className="App" style={{'textAlign': 'left'}}>
      <div className="menu" style={{'paddingLeft': '4em'}}>
        <div className="budget" style={{position: 'relative', marginRight: '2em'}}>
          <div className="budget-text">Budget</div>
          <input className="budget-input" placeholder="From" type="Number"
            value={min_budget} onChange={event => setMinBudget(event.target.value)}
          />
          <input className="budget-input" placeholder="To" type="Number"
            value={max_budget} onChange={event => setMaxBudget(event.target.value)}
          />
        </div>
        <div className="league-selector">
          <select value={league} onChange={changeLeague}>
            <option value="Heist">Heist</option>
            <option value="Hardcore Heist">HC Heist</option>
            <option value="Standard">Standard</option>
            <option value="Hardcore">Hardcore</option>
          </select>
        </div>
        <div onClick={() => setData(null)} style={{margin: '0 4em 0 auto'}}>
          <FontAwesomeIcon icon={faSync} size="2x" />
        </div>
      </div>
      <table style={{maxWidth: '900px', margin: '1.5em auto'}} className="table-striped">
        <thead style={{textAlign: 'center'}}>
          <tr>
            <th><span>Name</span></th>
            <th><span>Item</span></th>
            <th><span>Stack</span></th>
            <th><span>Total</span></th>
            <th style={{maxWidth: '60px'}}><span>Item Price</span></th>
            <th style={{maxWidth: '60px'}}><span>Benefit</span></th>
            <th><span>BPC</span></th>
          </tr>
        </thead>
        <tbody>{results.map((c, i) =>
          <tr key={i} style={{cursor: 'pointer'}}
            onClick={() => window.open(c[8], '_blank')}
          >
            <td>
              <img src={require("./images/card.png")} style={{
                height: '32px',
                verticalAlign: 'middle',
                marginRight: '4px',
              }}/>
              {c[0]}
            </td>
            <td>{c[1]}</td>
            <td style={{widtd: '5em'}}>{c[2] + ' x ' + c[3]}</td>
            <td style={{widtd: '5em'}}>{c[4]}</td>
            <td style={{widtd: '5em'}}>{c[5]}</td>
            <td style={{widtd: '5em'}}>{c[6]}</td>
            <td style={{widtd: '5em'}}>{c[7]}</td>
          </tr>
        )}</tbody>
      </table>
    </div>
  );
};

ReactDOM.render(
  <App/>,
  document.getElementById('root'),
);
