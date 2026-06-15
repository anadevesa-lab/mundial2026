const https = require('https');

function get(url, headers) {
      return new Promise((resolve, reject) => {
              const options = { headers: headers || {} };
              https.get(url, options, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                                    try { resolve(JSON.parse(data)); }
                                    catch(e) { reject(new Error('Parse error: ' + data.substring(0, 200))); }
                        });
              }).on('error', reject);
      });
}

exports.handler = async () => {
      try {
              const API_KEY = process.env.FOOTBALL_API_KEY || '';
              const headers = API_KEY ? { 'X-Auth-Token': API_KEY } : {};

        const data = await get(
                  'https://api.football-data.org/v4/competitions/WC/matches',
                  headers
                );

        return {
                  statusCode: 200,
                  headers: {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*',
                              'Cache-Control': 'public, max-age=60'
                  },
                  body: JSON.stringify(data)
        };
      } catch(e) {
              return {
                        statusCode: 500,
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({ error: e.message })
              };
      }
};
