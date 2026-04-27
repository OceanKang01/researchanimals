import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const GITHUB_OWNER = 'OceanKang01';
const GITHUB_REPO = 'researchanimals';
const FILE_PATH = 'data/watchlist.json';
const BRANCH = 'main';

export default async function handler(req, res) {
  const githubToken = process.env.GITHUB_TOKEN;

  if (req.method === 'GET' || !req.method) {
    // READ: Try GitHub raw first, fallback to local file
    try {
      const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${FILE_PATH}?t=${Date.now()}`;
      const response = await fetch(rawUrl, {
        headers: githubToken ? { 'Authorization': `token ${githubToken}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ success: true, watchList: data });
      }
    } catch (e) {}

    // Fallback: read local file
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
    // WRITE: Update GitHub file via API
    if (!githubToken) {
      // Fallback: write to local file only (dev mode)
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const localPath = join(process.cwd(), FILE_PATH);
        writeFileSync(localPath, JSON.stringify(body.watchList || [], null, 2));
        return res.status(200).json({ success: true, message: 'Saved locally (no GITHUB_TOKEN)' });
      } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
      }
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const newWatchList = body.watchList || [];

      // Get current file SHA (required for update)
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
      const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
      const putBody = {
        message: `관심기업 업데이트 (${newWatchList.length}개)`,
        content,
        branch: BRANCH,
      };
      if (sha) putBody.sha = sha;

      const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

      if (putRes.ok) {
        return res.status(200).json({ success: true, message: `Saved ${newWatchList.length} companies to server` });
      } else {
        const errData = await putRes.json();
        return res.status(500).json({ success: false, error: errData.message });
      }
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
