const https = require('https');

function get(url, headers) {
          return new Promise((resolve, reject) => {
                      const opts = new URL(url);
                      const options = {
                                    hostname: opts.hostname,
                                    path: opts.pathname + opts.search,
                                    method: 'GET',
                                    headers: headers || {}
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

exports.handler = async () => {
          try {
                      const API_KEY = process.env.RAPIDAPI_KEY || '';

            const data = await get(
                          'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
                    {
                                    'x-apisports-key': API_KEY
                    }
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
