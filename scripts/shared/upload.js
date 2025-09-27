// Shared upload helpers for pushing files to GitHub
(function(){
  let lastDifficulty = '';

  function uploadToGitHubRepository(
    githubAccessToken,
    linkedRepository,
    solution,
    problemTitle,
    uploadFileName,
    sha,
    commitMessage,
  ) {
    const difficulty = lastDifficulty || 'Uncategorized';
    const uploadPathURL = `https://api.github.com/repos/${linkedRepository}/contents/${difficulty}/${problemTitle}/${uploadFileName}`;

    const uploadData = JSON.stringify({ message: commitMessage, content: solution, sha });
    const xhttp = new XMLHttpRequest();
    xhttp.addEventListener('readystatechange', function () {
      if (xhttp.readyState === 4) {
        if (xhttp.status === 200 || xhttp.status === 201) {
          const updatedSha = JSON.parse(xhttp.responseText).content.sha;
          chrome.storage.local.get('userStatistics', (statistics) => {
            let { userStatistics } = statistics;
            if (!userStatistics || typeof userStatistics !== 'object') {
              userStatistics = { solved: 0, school: 0, basic: 0, easy: 0, medium: 0, hard: 0, sha: {} };
            }
            const githubFilePath = problemTitle + uploadFileName;
            if (uploadFileName === 'README.md' && sha === null) {
              userStatistics.solved += 1;
              userStatistics.school += difficulty === 'School' ? 1 : 0;
              userStatistics.basic += difficulty === 'Basic' ? 1 : 0;
              userStatistics.easy += difficulty === 'Easy' ? 1 : 0;
              userStatistics.medium += difficulty === 'Medium' ? 1 : 0;
              userStatistics.hard += difficulty === 'Hard' ? 1 : 0;
            }
            userStatistics.sha[githubFilePath] = updatedSha;
            chrome.storage.local.set({ userStatistics }, () => {
              console.log(`${uploadFileName} - Commit Successful`);
            });
          });
        }
      }
    });
    xhttp.open('PUT', uploadPathURL, true);
    xhttp.setRequestHeader('Authorization', `token ${githubAccessToken}`);
    xhttp.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhttp.send(uploadData);
  }

  function uploadGitHub(
    solution,
    problemName,
    uploadFileName,
    commitMessage,
    problemDifficulty = undefined,
  ) {
    if (problemDifficulty && problemDifficulty !== undefined) {
      lastDifficulty = String(problemDifficulty).trim();
    }
    chrome.storage.local.get('githubAccessToken', (access_token) => {
      const accessToken = access_token.githubAccessToken;
      if (accessToken) {
        chrome.storage.local.get('current_phase', (phase) => {
          const currentPhase = phase.current_phase;
          if (currentPhase === 'solve_and_push') {
            chrome.storage.local.get('github_LinkedRepository', (linkedRepo) => {
              const linkedRepository = linkedRepo.github_LinkedRepository;
              if (linkedRepository) {
                const githubFilePath = problemName + uploadFileName;
                chrome.storage.local.get('userStatistics', (statistics) => {
                  const { userStatistics } = statistics;
                  let sha = null;
                  if (userStatistics && userStatistics.sha && userStatistics.sha[githubFilePath]) {
                    sha = userStatistics.sha[githubFilePath];
                  }
                  uploadToGitHubRepository(
                    accessToken,
                    linkedRepository,
                    solution,
                    problemName,
                    uploadFileName,
                    sha,
                    commitMessage,
                  );
                });
              }
            });
          }
        });
      }
    });
  }

  function convertToKebabCase(uploadFileName) {
    return uploadFileName
      .replace(/[^a-zA-Z0-9\. ]/g, '')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  window.uploadGitHub = uploadGitHub;
  window.convertToKebabCase = convertToKebabCase;
})();
