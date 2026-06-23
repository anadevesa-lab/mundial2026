const https = require('https');

// Map English team names (TheSportsDB) → Portuguese (LOCAL_MATCHES)
const EN_TO_PT = {
    'Mexico': 'México', 'South Africa': 'África do Sul', 'South Korea': 'Coreia do Sul',
    'Czechia': 'Rep. Checa', 'Czech Republic': 'Rep. Checa', 'Canada': 'Canadá',
    'Bosnia and Herzegovina': 'Bósnia-Herz.', 'Bosnia-Herzegovina': 'Bósnia-Herz.',
    'Bosnia & Herzegovina': 'Bósnia-Herz.', 'Qatar': 'Qatar', 'Switzerland': 'Suíça',
    'Brazil': 'Brasil', 'Morocco': 'Marrocos', 'Haiti': 'Haiti', 'Scotland': 'Escócia',
    'United States': 'EUA', 'USA': 'EUA', 'Paraguay': 'Paraguai', 'Australia': 'Austrália',
    'Turkey': 'Turquia', 'Türkiye': 'Turquia', 'Germany': 'Alemanha', 'Curacao': 'Curaçau',
    'Curaçao': 'Curaçau', 'Ivory Coast': 'C. do Marfim', "Cote d'Ivoire": 'C. do Marfim',
    'Ecuador': 'Equador', 'Netherlands': 'Países Baixos', 'Japan': 'Japão', 'Sweden': 'Suécia',
    'Tunisia': 'Tunísia', 'Belgium': 'Bélgica', 'Egypt': 'Egipto', 'Iran': 'Irão',
    'New Zealand': 'Nova Zelândia', 'Spain': 'Espanha', 'Cape Verde': 'Cabo Verde',
    'Saudi Arabia': 'A. Saudita', 'Uruguay': 'Uruguai', 'France': 'França', 'Senegal': 'Senegal',
    'Iraq': 'Iraque', 'Norway': 'Noruega', 'Argentina': 'Argentina', 'Algeria': 'Argélia',
    'Austria': 'Áustria', 'Jordan': 'Jordânia', 'Portugal': 'Portugal', 'DR Congo': 'RD Congo',
    'Democratic Republic of Congo': 'RD Congo', 'Uzbekistan': 'Uzbequistão', 'Colombia': 'Colômbia',
    'England': 'Inglaterra', 'Croatia': 'Croácia', 'Ghana': 'Gana', 'Panama': 'Panamá',
};

function translateTeam(name) {
    if (EN_TO_PT[name]) return EN_TO_PT[name];
    for (const [key, value] of Object.entries(EN_TO_PT)) {
        if (key.toLowerCase() === name.toLowerCase()) return value;
    }
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
        // Um único pedido para TODOS os jogos do Mundial 2026
        // idLeague 4429 = FIFA World Cup · chave gratuita atual: 123 (a antiga "/3/" estava a falhar)
        const url = `https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=4429&s=2026`;
        const data = await get(url);

        if (!data.events) {
            console.warn('⚠️ Resposta sem "events":', JSON.stringify(data).substring(0, 300));
        }

        const events = data.events || [];

        const matches = events.map(e => ({
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

        console.log(`✅ Encontrados ${matches.length} jogo(s) do Mundial no total`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                matches,
                count: matches.length,
                source: 'thesportsdb',
                timestamp: new Date().toISOString()
            })
        };
    } catch(e) {
        console.error('❌ Erro na API:', e.message);
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
