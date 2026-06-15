const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const options = {
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };
    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error: ' + data.substring(0, 200))); }
      });
    }).on('error', reject).end();
  });
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // TheSportsDB free API - no key required
    const today = new Date().toISOString().split('T')[0];
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Soccer`;

    const data = await get(url);
    const events = data.events || [];

    // Filter only FIFA World Cup matches
    const wcMatches = events.filter(e =>
      e.strLeague && e.strLeague.includes('FIFA World Cup')
    );

    const matches = wcMatches.map(e => ({
      id: e.idEvent,
      homeTeam: e.strHomeTeam,
      awayTeam: e.strAwayTeam,
      homeScore: e.intHomeScore,
      awayScore: e.intAwayScore,
      status: e.strStatus,
      time: e.strTime,
      date: e.dateEvent,
      league: e.strLeague
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ matches, count: matches.length, source: 'thesportsdb', date: today })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message, matches: [] })
    };
  }
};
