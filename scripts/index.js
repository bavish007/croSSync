// Vanilla JS version of index page logic
function q(id) { return document.getElementById(id); }
function show(id) { const el = q(id); if (el) el.style.display = 'inherit'; }
function hide(id) { const el = q(id); if (el) el.style.display = 'none'; }
function setText(id, text) { const el = q(id); if (el) el.textContent = text; }

function renderStats(stats) {
  if (!stats) return;
  setText('successful_submissions', stats.solved || 0);
  setText('successful_submissions_school', stats.school || 0);
  setText('successful_submissions_basic', stats.basic || 0);
  setText('successful_submissions_easy', stats.easy || 0);
  setText('successful_submissions_medium', stats.medium || 0);
  setText('successful_submissions_hard', stats.hard || 0);
}

function updateRepoLink(linkedRepo) {
  const el = q('repository_link');
  if (el) {
    el.innerHTML = linkedRepo ? `<a target="_blank" href="https://github.com/${linkedRepo}">${linkedRepo}</a>` : 'No Repository Linked';
  }
}

function linkChoice() {
  const checked = document.querySelector('input[name="radio"]:checked');
  return checked ? checked.value : 'new_repo';
}

function githubRepository() {
  const el = q('repositoryNameTextField');
  return (el && el.value ? el.value : '').trim();
}

function createRepositoryStatusCode(responseText, statusCode, repositoryName) {
  const errorEl = q('error_info');
  const successEl = q('success_acknowledgement');
  if (successEl) successEl.hidden = true;
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.style.lineHeight = '1';
    let msg = `Error creating ${repositoryName} - Try again later!`;
    if (statusCode === 304) msg = `Error creating ${repositoryName} - Unable to modify repository. Try again later!`;
    else if (statusCode === 400) msg = `Error creating ${repositoryName} - Bad POST request, make sure you're not overriding any existing scripts.`;
    else if (statusCode === 401) msg = `Error creating ${repositoryName} - Unauthorized access to repo. Try again later!`;
    else if (statusCode === 422) {
      try {
        const j = JSON.parse(responseText);
        msg = `Error creating ${repositoryName} - ${j.message} - ${j.errors?.[0]?.message || ''}`;
      } catch {}
    }
    errorEl.textContent = msg;
  }
}

function linkRepo(githubAccessToken, repositoryName) {
  const uploadURL = 'https://api.github.com/user/repos';
  const xhttp = new XMLHttpRequest();
  xhttp.addEventListener('readystatechange', function () {
    if (xhttp.readyState === 4) {
      if (xhttp.status === 201) {
  chrome.storage.local.set({ github_LinkedRepository: repositoryName, current_phase: 'solve_and_push' }, () => {
          const successEl = q('success_acknowledgement');
          const errorEl = q('error_info');
          if (successEl) { successEl.textContent = `Repository ${repositoryName} linked successfully!`; successEl.hidden = false; }
          if (errorEl) errorEl.hidden = true;
          show('solve_and_push_phase');
          hide('link_repo_phase');
        });
      } else {
        createRepositoryStatusCode(xhttp.responseText, xhttp.status, repositoryName);
      }
    }
  });
  const data = JSON.stringify({ name: repositoryName, private: true });
  xhttp.open('POST', uploadURL, true);
  xhttp.setRequestHeader('Authorization', `token ${githubAccessToken}`);
  xhttp.setRequestHeader('Accept', 'application/vnd.github.v3+json');
  xhttp.send(data);
}

function showLinkRepo(githubUsername) {
  const username = q('username');
  if (username) { username.textContent = `Hi ${githubUsername},`; username.style.display = 'block'; }
  hide('solve_and_push_phase');
  show('link_repo_phase');

  const linkBtn = q('linkRepositoryButton');
  if (linkBtn && !linkBtn._wired) {
    linkBtn._wired = true;
    linkBtn.addEventListener('click', () => {
      const repositoryName = githubRepository();
      if (!repositoryName) return;
      const isNewRepo = linkChoice() === 'new_repo';
      if (!isNewRepo) {
        chrome.storage.local.set({ github_LinkedRepository: repositoryName, current_phase: 'solve_and_push' }, () => {
          const successEl = q('success_acknowledgement');
          const errorEl = q('error_info');
          if (successEl) { successEl.textContent = `Repository ${repositoryName} linked successfully!`; successEl.hidden = false; }
          if (errorEl) errorEl.hidden = true;
          show('solve_and_push_phase');
          hide('link_repo_phase');
        });
      } else {
        chrome.storage.local.get('githubAccessToken', (token) => {
          const accessToken = token?.githubAccessToken;
          if (accessToken) linkRepo(accessToken, repositoryName);
        });
      }
    });
  }
}

function wireUnlink() {
  const unlinkBtn = q('unlinkRepository');
  if (unlinkBtn && !unlinkBtn._wired) {
    unlinkBtn._wired = true;
    unlinkBtn.addEventListener('click', () => {
      chrome.storage.local.remove(['github_LinkedRepository', 'userStatistics'], () => {
        const errorEl = q('error_info');
        if (errorEl) { errorEl.textContent = 'Repository unlinked successfully!'; errorEl.hidden = false; }
        hide('solve_and_push_phase');
        show('link_repo_phase');
      });
    });
  }
}

function setup() {
  wireUnlink();
  chrome.storage.local.get(['githubAccessToken', 'githubUsername', 'github_LinkedRepository', 'userStatistics', 'current_phase'], (data) => {
    const accessToken = data?.githubAccessToken;
    if (!accessToken) {
      show('link_repo_phase');
      hide('solve_and_push_phase');
      return;
    }

    const username = data?.githubUsername;
    if (username) {
      // If a repo already linked and stats exist, show dashboard
      updateRepoLink(data?.github_LinkedRepository);
      renderStats(data?.userStatistics);
      show('solve_and_push_phase');
      hide('link_repo_phase');
    } else {
      showLinkRepo('there'); // fallback greeting; real user set by background via storage
    }
  });
}

document.addEventListener('DOMContentLoaded', setup);

// Optional: Auth button wiring on this page if any exists
(function(){
  const authBtn = document.getElementById('github-auth-button') || document.getElementById('authentication_button');
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      (window.startGitHubOAuthProcess || {}).githubOAuth?.();
    });
  }
})();