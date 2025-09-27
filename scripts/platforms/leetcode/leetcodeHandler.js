// Uses globals provided by geeksForGeeks.js and leetcodeApi.js
const leetcodeHandler = {
  async getSubmission(questionSlug) {
    const leetcode_session = (await chrome.storage.sync.get('leetcode_session'))?.[
      'leetcode_session'
    ];

    if (!leetcode_session) {
      return null;
    }

    const allSubmissions = await window.leetCodeClient(window.LEETCODE_GET_ALL_SUBMISSIONS_QUERY, {
      questionSlug,
      limit: 20,
      offset: 0,
      lastKey: null,
      status: 10,
    }, leetcode_session);

    if (!allSubmissions?.questionSubmissionList?.submissions?.[0]?.id) {
      console.log('No question submissions were found for this problem');
      return null;
    }

  const latestSubmissionId = allSubmissions?.questionSubmissionList?.submissions?.[0].id;
  const result = await window.leetCodeClient(window.LEETCODE_GET_SUBMISSION_DETAILS_QUERY, { submissionId: latestSubmissionId }, leetcode_session);

    if (!result?.submissionDetails) return null;

    return result.submissionDetails;
  },
  
  async handleSubmission(submission) {
    const now = new Date();
    const submissionDate = new Date(submission.timestamp * 1000);
    const diff = now.getTime() - submissionDate.getTime();
    const diffInMinutes = Math.floor(diff / 1000 / 60);

    // Validate submission's timestamp to ignore old submissions
    if (diffInMinutes > 1) {
      console.log('Submission is older than 1 minute, ignoring.');
      return;
    }

    const problemTitle = submission.question.titleSlug;
    const problemDifficulty = submission.question.difficulty;
    const solution = submission.code;
    const solutionLanguage = submission.lang.name;
    const problemStatement = `<h2><a href="https://leetcode.com/problems/${problemTitle}/">${problemTitle}</a></h2><h3>Difficulty Level: ${problemDifficulty}</h3><hr><h3>Problem Statement</h3><div>${submission.question.content}</div>`;

    // Upload the README.md file
    window.uploadGitHub(
      btoa(unescape(encodeURIComponent(problemStatement))),
      problemTitle,
      'README.md',
      'Create README - croSSync',
      problemDifficulty,
    );
    
    // Upload the solution file
    window.uploadGitHub(
      btoa(unescape(encodeURIComponent(solution))),
      problemTitle,
      window.convertToKebabCase(problemTitle + "." + solutionLanguage),
      'Added Solution - croSSync',
      problemDifficulty,
    );
  }
};

// Listen for messages from background when a submission completes
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request?.type === 'get-submission') {
    try {
      chrome.runtime.sendMessage({ type: 'set-fire-icon' });
      const { questionSlug } = request.data || {};
      if (!questionSlug) return;
      const submission = await leetcodeHandler.getSubmission(questionSlug);
      if (submission) {
        await leetcodeHandler.handleSubmission(submission);
      }
    } catch (e) {
      console.error('Error handling LeetCode submission', e);
    }
  }
});