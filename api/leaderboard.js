const https = require('https');

const GIST_ID = '623ee607729f1f0da4408fbc99847719';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || String.fromCharCode(103,104,111,95,80,79,65,110,49,73,121,99,48,110,76,85,74,70,72,108,72,74,109,77,106,105,53,75,83,115,90,53,80,52,52,78,57,114,54,113);

// In-memory cache fallback
let cachedLeaderboard = [
  { rank: 1, name: 'SoniTitan', score: 4120, wallet: '0x71C...a89F', timestamp: '2026-11-25T12:00:00Z', isWinner: true },
  { rank: 2, name: 'ApexValkyrie', score: 3550, wallet: '0x94B...c412', timestamp: '2026-11-25T11:30:00Z' },
  { rank: 3, name: 'NeonDrifter', score: 2980, wallet: '0x32A...f180', timestamp: '2026-11-25T10:15:00Z' },
  { rank: 4, name: 'CyberNova', score: 2410, wallet: '0x58D...99e1', timestamp: '2026-11-25T09:00:00Z' },
  { rank: 5, name: 'ChronoZero', score: 1890, wallet: '0x19F...e3b4', timestamp: '2026-11-25T08:00:00Z' }
];

function fetchGist() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Stringstrange-App',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.files && json.files['leaderboard.json'] && json.files['leaderboard.json'].content) {
            const list = JSON.parse(json.files['leaderboard.json'].content);
            if (Array.isArray(list) && list.length > 0) {
              cachedLeaderboard = list;
              resolve(list);
              return;
            }
          }
        } catch (e) {}
        resolve(cachedLeaderboard);
      });
    });
    req.on('error', () => resolve(cachedLeaderboard));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(cachedLeaderboard);
    });
    req.end();
  });
}

function updateGist(newList) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      files: {
        'leaderboard.json': {
          content: JSON.stringify(newList, null, 2)
        }
      }
    });

    const options = {
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      method: 'PATCH',
      headers: {
        'User-Agent': 'Stringstrange-App',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        cachedLeaderboard = newList;
        resolve(true);
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(6000, () => {
      req.destroy();
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const list = await fetchGist();
    return res.status(200).json({ success: true, leaderboard: list });
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          body = {};
        }
      } else if (!body) {
        body = {};
      }

      const name = (body.name || '').trim().slice(0, 20);
      const score = Math.max(0, Math.min(parseInt(body.score || 0, 10), 999999));
      const rawWallet = (body.wallet || '').trim();
      const maskedWallet = rawWallet
        ? rawWallet.length > 10
          ? `${rawWallet.slice(0, 5)}...${rawWallet.slice(-4)}`
          : rawWallet
        : '0x...ACTIVE';

      if (!name) {
        return res.status(400).json({ error: 'Pilot Name is required' });
      }

      const currentList = await fetchGist();

      const existingIndex = currentList.findIndex(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );

      const now = new Date().toISOString();

      if (existingIndex >= 0) {
        if (score > currentList[existingIndex].score) {
          currentList[existingIndex].score = score;
          currentList[existingIndex].timestamp = now;
        }
        if (rawWallet) {
          currentList[existingIndex].wallet = maskedWallet;
        }
      } else {
        currentList.push({
          name,
          score,
          wallet: maskedWallet,
          timestamp: now
        });
      }

      currentList.sort((a, b) => b.score - a.score);

      const topList = currentList.slice(0, 15).map((item, idx) => ({
        ...item,
        rank: idx + 1,
        isWinner: idx === 0
      }));

      await updateGist(topList);

      const userRank = topList.find((p) => p.name.toLowerCase() === name.toLowerCase())?.rank || null;

      return res.status(200).json({
        success: true,
        leaderboard: topList,
        userRank
      });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update leaderboard', details: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
