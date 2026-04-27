import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const GITHUB_OWNER = 'OceanKang01';
const GITHUB_REPO = 'researchanimals';
const FILE_PATH = 'data/watchlist.json';
const BRANCH = 'main';
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${FILE_PATH}`;

export default async function handler(req, res) {
  if (req.method === 'GET' || !req.method) {
    // READ: GitHub raw URL (public, no token needed)
    try {
      const response = await fetch(`${RAW_URL}?t=${Date.now()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ success: true, watchList: data });
      }
    } catch (e) {}

    // Fallback: local file
    try {
      const localPath = join(process.cwd(), FILE_PATH);
      if (existsSync(localPath)) {
        const data = JSON.parse(readFileSync(localPath, 'utf-8'));
        return res.status(200).json({ success: true, watchList: data });
      }
    } catch (e) {}

    return res.status(200).json({ success: true, watchList: [] });
  }

  if (req.method === 'POST') {
    const githubToken = process.env.GITHUB_TOKEN;
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const newWatchList = body?.watchList || [];

    if (!githubToken) {
      // No token: save locally (dev mode) and return success with instructions
      try {
        const { writeFileSync } = await import('fs');
        const localPath = join(process.cwd(), FILE_PATH);
        writeFileSync(localPath, JSON.stringify(newWatchList, null, 2));
        return res.status(200).json({ 
          success: true, 
          message: `Saved ${newWatchList.length} companies locally. Set GITHUB_TOKEN env var for cloud sync.`,
          local: true
        });
      } catch (e) {
        return res.status(200).json({ 
          success: true, 
          message: 'Saved in browser only (no write permission)',
          local: true
        });
      }
    }

    // With token: update GitHub file via API
    try {
      // Get current file SHA
      const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
      const getRes = await fetch(getUrl, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha = null;
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      // Update file
      const content = Buffer.from(JSON.stringify(newWatchList, null, 2)).toString('base64');
      const putBody = {
        message: `관심기업 업데이트 (${newWatchList.length}개)`,
        content,
        branch: BRANCH,
      };
      if (sha) putBody.sha = sha;

      const putRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(putBody)
        }
      );

      if (putRes.ok) {
        return res.status(200).json({ success: true, message: `Saved ${newWatchList.length} companies to server` });
      } else {
        const errData = await putRes.json();
        return res.status(200).json({ success: true, message: 'Saved in browser (server write failed)', local: true });
      }
    } catch (e) {
      return res.status(200).json({ success: true, message: 'Saved in browser only', local: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
