const getCodeScript = `
  try {
    var editor = (window.ace && ace.edit) ? ace.edit("ace-editor") : null;
    var userSolution = editor ? editor.getValue() : '';
    var scriptInjectedElement = document.createElement("pre");
    scriptInjectedElement.textContent = userSolution || '';
    scriptInjectedElement.setAttribute("id","extractedUserSolution");
    scriptInjectedElement.setAttribute("style","color:#fff; white-space: pre-wrap;");
    document.body.appendChild(scriptInjectedElement);
  } catch(e) { console.error('extractCode error', e); }
  `;

  var extractCodeScript = document.createElement('script');
  extractCodeScript.id = 'extractCodeScript';
  extractCodeScript.appendChild(document.createTextNode(getCodeScript));

  (document.body || document.head || document.documentElement).appendChild(extractCodeScript);