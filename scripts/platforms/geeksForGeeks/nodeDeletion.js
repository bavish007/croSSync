const removeChildScript = `
	(function(){
		var scriptInjectedElement = document.getElementById('extractedUserSolution');
		if (scriptInjectedElement && scriptInjectedElement.parentNode) {
			scriptInjectedElement.parentNode.removeChild(scriptInjectedElement);
		}
	})();
`;

var deleteScript = document.createElement('script');
deleteScript.id = 'deletionScript';
deleteScript.appendChild(document.createTextNode(removeChildScript));

(document.body || document.head || document.documentElement).appendChild(deleteScript);