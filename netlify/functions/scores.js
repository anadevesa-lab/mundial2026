const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
      https.get(url, (res) => {
            let data = '';
                  res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                                try { resolve(JSON.parse(data)); }
                                        catch(e) { reject(e); }
                                              });
                                                  }).on('error', reject);
                                                    });
                                                    }

                                                    exports.handler = async () => {
                                                      try {
                                                          const [games, groups] = await Promise.all([
                                                                get('https://worldcup26.ir/get/games'),
                                                                      get('https://worldcup26.ir/get/groups')
                                                                          ]);
                                                                              return {
                                                                                    statusCode: 200,
                                                                                          headers: {
                                                                                                  'Content-Type': 'application/json',
                                                                                                          'Access-Control-Allow-Origin': '*',
                                                                                                                  'Cache-Control': 'public, max-age=60'
                                                                                                                        },
                                                                                                                              body: JSON.stringify({ games, groups })
                                                                                                                                  };
                                                                                                                                    } catch(e) {
                                                                                                                                        return {
                                                                                                                                              statusCode: 500,
                                                                                                                                                    headers: { 'Access-Control-Allow-Origin': '*' },
                                                                                                                                                          body: JSON.stringify({ error: e.message })
                                                                                                                                                              };
                                                                                                                                                                }
                                                                                                                                                                };
