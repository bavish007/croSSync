// GraphQL queries for fetching LeetCode submission data
window.LEETCODE_GET_SUBMISSION_DETAILS_QUERY = `
query submissionDetails($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    runtime
    runtimeDisplay
    memory
    memoryDisplay
    code
    timestamp
    statusCode
    user {
      username
    }
    lang {
      name
      verboseName
    }
    question {
      questionId
      acRate
      difficulty
      frontendQuestionId: questionFrontendId
      title
      titleSlug
      topicTags {
        name
      }
    }
  }
}
`;

window.LEETCODE_GET_ALL_SUBMISSIONS_QUERY = `
query submissionList($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String!, $lang: Int, $status: Int) {
  questionSubmissionList(
  offset: $offset
  limit: $limit
  lastKey: $lastKey
  questionSlug: $questionSlug
  lang: $lang
  status: $status
  ) {
    lastKey
    hasNext
    submissions {
      id
      title
      statusDisplay
      lang
      langName
      runtime
      timestamp
      url
      isPending
      memory
    }
  }
}
`;

// This function performs a fetch from the PAGE context to ensure cookies are sent
const LEETCODE_GRAPHQL_API_URL = 'https://leetcode.com/graphql';

window.leetCodeClient = (query, variables) => {
  return new Promise((resolve) => {
    const messageId = `croSSync_leetcode_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    function onMessage(event) {
      if (event.source !== window) return;
      const data = event.data || {};
      if (data && data.source === 'croSSync' && data.messageId === messageId) {
        window.removeEventListener('message', onMessage);
        resolve(data.error ? null : data.data);
      }
    }

    window.addEventListener('message', onMessage);

    const script = document.createElement('script');
    script.textContent = `(() => {
      const messageId = ${JSON.stringify(messageId)};
      fetch(${JSON.stringify(LEETCODE_GRAPHQL_API_URL)}, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: ${JSON.stringify(query)}, variables: ${JSON.stringify(variables)} })
      })
      .then(r => r.json())
      .then(json => { window.postMessage({ source: 'croSSync', messageId, data: json.data }, '*'); })
      .catch(err => { window.postMessage({ source: 'croSSync', messageId, error: String(err) }, '*'); });
    })();`;
    (document.documentElement || document.head || document.body).appendChild(script);
    // Clean up the injected script node
    script.remove();
  });
};