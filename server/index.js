const express = require("express");
const https = require("https");
const session = require("express-session");
const passport = require("passport");
const SteamSignIn = require("steam-signin");
const dotenv = require("dotenv");
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const axios = require("axios");
const cheerio = require('cheerio');

const getLogPrefix = "GET ---> ";
const postLogPrefix = "POST ---> ";

const instance = axios.create({
    baseURL: 'https://store.steampowered.com',
    withCredentials: true,
});

const BIRTHTIME_TIMESTAMP = '283993201'; 
const MATURE_CONTENT_VALUE = '1';

dotenv.config();

const { SteamOpenIdStrategy } = require("passport-steam-openid");

const realm = process.env.API_URL + ":3000/";
const signIn = new SteamSignIn(realm);

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// allow cross‑origin requests from the React client and forward cookies
app.use(cors({
    origin: 'https://127.0.0.1:5173',
    credentials: true,
}));

app.use(session({
    secret: process.env.SECRET,
    store: new session.MemoryStore(),
    resave: false,
    saveUninitialized: true,
    cookie: {
        // we are running HTTPS in development; require secure cookies
        secure: true,
        httpOnly: false,
        sameSite: 'none',
    }
}));

app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        timeStamp: new Date().toISOString(),
        environment: 'development',
        nodeVersion: process.version,
    });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
  passphrase: 'backlog',
  // Enable HTTP/2 if available
  allowHTTP1: true,
  // Recommended security options
  minVersion: 'TLSv1.2',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    '!DSS',
    '!aNULL',
    '!eNULL',
    '!EXPORT',
    '!DES',
    '!RC4',
    '!3DES',
    '!MD5',
    '!PSK'
  ].join(':'),
  honorCipherOrder: true
};

const PORT = 3000;
const server = https.createServer(sslOptions, app);

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcing shutdown.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const HOST = process.env.HOST || '127.0.0.1';
server.listen(PORT, HOST, () => {
    console.log(`Server is running at https://${HOST}:${PORT}`);
    console.log('Environment:', 'development');
    console.log('Press Ctrl+C to stop the server');
});

passport.use(new SteamOpenIdStrategy({
    returnURL: process.env.API_URL + 'api/v1/auth/steam/return',
    profile: true,
    apiKey: process.env.STEAM_API_KEY,
    maxNonceTimeDelay: 30
}, (req, identifier, profile, done) => {
    console.log('Steam authentication successful. Identifier:', identifier);
    console.log('User profile:', profile);
}));

app.get(`/api/v1/auth/steam`, passport.authenticate('steam-openid'), (req, res) => {
    // This function will not be called as the request will be redirected to Steam for authentication
});

app.get('/api/v1/auth/steam/return', async (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    try {
        console.log("Verifying Steam login...");
        let steamId = await signIn.verifyLogin(req.url);

        const steamid64 = steamId.getSteamID64();
        const response = await axios.get(`https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamid64}&format=json`);

        req.session.user = {
            steamid64,
        };
        // make sure session is persisted before sending the redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
            } else {
                console.log('Steam login verified. User session created:', req.session.user, 'sessionID=', req.sessionID);
                console.log('Session data:', req.session);
            }
            res.redirect('https://127.0.0.1:5173/dashboard');
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('There was an error signing in.');
    }
});

app.get('/', (req, res) => {
    const {user} = req.session;
    res.status(200).send(user);
});

// Endpoint to fetch owned games from Steam API with simple pagination.
// Query parameters:
//   length - number of records per page (default 50)
//   page   - 1‑based page index (default 1)
app.get('/api/v1/steam/owned-games', async (req, res) => {
    console.log(`${getLogPrefix}${req.originalUrl}`);
    const {user} = req.session;
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const length = Math.max(1, parseInt(req.query.length, 10) || 50);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    try {
        const steamid64 = user.steamid64;
        const response = await axios.get(
            `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?include_appinfo=true&include_extended_appinfo=true&key=${process.env.STEAM_API_KEY}&steamid=${steamid64}&format=json`,
            {
                headers: {
                'Cookie': `birthtime=${BIRTHTIME_TIMESTAMP}; mature_content=${MATURE_CONTENT_VALUE};`
            }},
        );
        const allGames = (response.data && response.data.response && response.data.response.games) || [];

        if (!allGames.length) {
            console.log("Response data is null or empty, user needs to set their game details to public in order to fetch owned games.");
        }

        const total = allGames.length;
        const start = (page - 1) * length;
        const paginated = allGames.slice(start, start + length);

        res.json({ total, games: paginated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch owned games' });
    }
});

// Endpoint to fetch game pricing information from Steam store page - appIds are expected in the request body
app.post(`/api/v1/steam/games/prices`, async (req, res) => {
    console.log(`${postLogPrefix}${req.originalUrl}`);
    const appIdArray = req.body.appIds || [];
    const split = req.body.page * req.body.perPage;
    try {
        // fetch each page in parallel and build the result array
        const priceData = await Promise.all(
            appIdArray.map(async (game, index) => {
                try {
                    console.log("Fetching price for game:", game);
                    // steamstore often blocks non-browser requests; give a common UA
                    const response = await instance.get(`app/${game}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                                          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                                          'Chrome/120.0.0.0 Safari/537.36',
                            'Cookie': `birthtime=${BIRTHTIME_TIMESTAMP}; mature_content=${MATURE_CONTENT_VALUE};`
                        },
                    });
                    const html = response.data;
                    const $ = cheerio.load(html);

                    const baseSelector = '.game_purchase_price';
                    const discountSelector = '.discount_original_price';

                    let price = "Not Available"; // default when nothing matches
                    if ($(baseSelector).length) {
                        if ($(baseSelector).first().text().trim().toLowerCase().includes('demo')) {
                            price = $(baseSelector).eq(1).text().trim();
                            console.log(`Game ${game} has a demo price:`, price);
                        } else {
                            price = $(baseSelector).first().text().trim();
                        }
                    } else if ($(discountSelector).length) {
                        if ($(baseSelector).first().text().trim().toLowerCase().includes('demo')) {
                            price = $(discountSelector).eq(1).text().trim();
                            console.log(`Game ${game} has a demo price:`, price);
                        } else {
                            price = $(discountSelector).first().text().trim();
                        }
                        price = $(discountSelector).first().text().trim();
                    }

                    if (price !== "Not Available") {
                        // normalize whitespace and case so we reliably detect phrases like
                        // "Free to play", "Free", "free-to-play" etc.
                        const normalized = price
                            .replace(/\u00A0/g, ' ') // non-breaking spaces from HTML
                            .replace(/\s+/g, ' ')
                            .toLowerCase()
                            .trim();

                        if (/\bfree\b/.test(normalized)) {
                            return {
                                place: split + index,
                                appid: game,
                                priceData: 'Free',
                            };
                        }

                        const numericStr = price.replace(/[^0-9,.-]/g, '').replace(/,/g, '.');
                        const parsed = parseFloat(numericStr);
                        if (Number.isFinite(parsed)) {
                            return {
                                place: split + index,
                                appid: game,
                                priceData: parsed,
                            };
                        }

                        // fallback: keep raw string if parsing failed
                        console.warn(`Could not parse price for game ${game}:`, price);
                        return {
                            place: split + index,
                            appid: game,
                            priceData: price,
                        };
                    } else {
                        return {
                            place: split + index,
                            appid: game,
                            priceData: price,
                        };
                    }
                    
                } catch (err) {
                    // log and return placeholder instead of crashing entire request
                    if (err.response) {
                        console.warn(`could not fetch store page for ${game}: ` +
                                     `${err.response.status} ${err.response.statusText}`);
                    } else {
                        console.warn(`could not fetch store page for ${game}:`, err.message);
                    }
                    return {
                        place: split + index,
                        appid: game,
                        priceData: null,
                    };
                }
            })
        );
        console.log("Finished fetching prices:", priceData);
        res.json({ priceData });
    } catch (error) {
        console.error('Failed to fetch game pricing information:', error);
        // if headers already sent just abort
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to fetch game pricing information' });
        }
    }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
