const https = require('https');

// Map English team names (TheSportsDB) → Portuguese (LOCAL_MATCHES)
const EN_TO_PT = {
    'Mexico': 'México',
    'South Africa': 'África do Sul',
    'South Korea': 'Coreia do Sul',
    'Czechia': 'Rep. Checa',
    'Czech Republic': 'Rep. Checa',
    'Canada': 'Canadá',
    'Bosnia and Herzegovina': 'Bósnia-Herz.',
    'Bosnia-Herzegovina': 'Bósnia-Herz.',
    'Bosnia & Herzegovina': 'Bósnia-Herz.',
    'Qatar': 'Qatar',
    'Switzerland': 'Suíça',
    'Brazil': 'Brasil',
    'Morocco': 'Marrocos',
    'Haiti': 'Haiti',
    'Scotland': 'Escócia',
    'United States': 'EUA',
    'USA': 'EUA',
    'Paraguay': 'Paraguai',
    'Australia': 'Austrália',
    'Turkey': 'Turquia',
    'Türkiye': 'Turquia',
    'Germany': 'Alemanha',
    'Curacao': 'Curaçau',
    'Curaçao': 'Curaçau',
    'Ivory Coast': 'C. do Marfim',
    "Cote d'Ivoire": 'C. do Marfim',
    'Ecuador': 'Equador',
    'Netherlands': 'Países Baixos',
    'Japan': 'Japão',
    'Sweden': 'Suécia',
    'Tunisia': 'Tunísia',
    'Belgium': 'Bélgica',
    'Egypt': 'Egipto',
    'Iran': 'Irão',
    'New Zealand': 'Nova Zelândia',
    'Spain': 'Espanha',
    'Cape Verde': 'Cabo Verde',
    'Saudi Arabia': 'A. Saudita',
    'Uruguay': 'Uruguai',
    'France': 'França',
    'Senegal': 'Senegal',
    'Iraq': 'Iraque',
    'Norway': 'Noruega',
    'Argentina': 'Argentina',
    'Algeria': 'Argélia',
    'Austria': 'Áustria',
    'Jordan': 'Jordânia',
    'Portugal': 'Portugal',
    'DR Congo': 'RD Congo',
    'Democratic Republic of Congo': 'RD Congo',
    'Uzbekistan': 'Uzbequistão',
    'Colombia': 'Colômbia',
    'England': 'Inglaterra',
    'Croatia': 'Croácia',
    'Ghana': 'Gana',
    'Panama': 'Panamá',
};

function translateTeam(name) {
    // Try exact match first
    if (EN_TO_PT[name]) {
        return EN_TO_PT[name];
    }
    // Try case-insensitive match
    for (const [key, value] of Object.entries(EN_TO_PT)) {
        if (key.toLowerCase() === name.toLowerCase()) {
            return value;
        }
    }
    // Return original if no match found
    console.warn(`⚠️ Team name not found in mapping: "${name}"`);
    return name;
}

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

      console.log(`📡 Fetching World Cup matches for ${today}...`);
      const data = await get(url);
          const events = data.events || [];

      // Filter only FIFA World Cup matches
      const wcMatches = events.filter(e =>
              e.strLeague && e.strLeague.includes('FIFA World Cup')
                                          );

      const matches = wcMatches.map(e => ({
              id: e.idEvent,
              homeTeam: translateTeam(e.strHomeTeam),
              awayTeam: translateTeam(e.strAwayTeam),
              homeScore: e.intHomeScore,
              awayScore: e.intAwayScore,
              status: e.strStatus,
              time: e.strTime,
              date: e.dateEvent,
              league: e.strLeague
      }));

      console.log(`✅ Found ${matches.length} World Cup match(es) for ${today}`);
      if (matches.length > 0) {
          matches.forEach(m => {
              console.log(`   🏟️  ${m.homeTeam} vs ${m.awayTeam} - ${m.status}`);
          });
      }

      return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                  matches, 
                  count: matches.length, 
                  source: 'thesportsdb', 
                  date: today,
                  timestamp: new Date().toISOString()
              })
      };
    } catch(e) {
          console.error('❌ API Error:', e.message);
          return {
                  statusCode: 200,
                  headers,
                  body: JSON.stringify({ 
                      matches: [], 
                      count: 0, 
                      error: e.message,
                      timestamp: new Date().toISOString()
                  })
          };
    }
};
