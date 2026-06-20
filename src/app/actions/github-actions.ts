'use server';

/**
 * @fileOverview Server actions for GitHub repository integration with folder support.
 */

export async function uploadToGithub(fileName: string, base64Content: string, subfolder: string = 'general') {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = 'main';

  if (!token || !owner || !repo) {
    throw new Error('GitHub configuration missing in environment variables');
  }

  // Clean filename and structure path into folders
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '-');
  const cleanSubfolder = subfolder.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const path = `motorcycles/${cleanSubfolder}/${Date.now()}-${cleanFileName}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Upload motorcycle asset: ${path}`,
        content: base64Content,
        branch: branch,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload to GitHub');
    }

    // Return the raw content URL which is publicly accessible
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  } catch (error: any) {
    console.error('GitHub Upload Error:', error);
    throw new Error(error.message || 'Error uploading file to GitHub');
  }
}
