(function () {
  var requestEventName = "nav-debug-hint-target-request";
  var responseEventName = "nav-debug-hint-target-response";

  function requestDebug(selector) {
    var requestId = "req-" + Date.now() + "-" + Math.random().toString(36).slice(2);

    return new Promise(function (resolve) {
      function onResponse(event) {
        if (!(event instanceof CustomEvent)) {
          return;
        }

        if (!event.detail || event.detail.requestId !== requestId) {
          return;
        }

        window.removeEventListener(responseEventName, onResponse);
        resolve(event.detail.result || null);
      }

      window.addEventListener(responseEventName, onResponse);
      window.dispatchEvent(
        new CustomEvent(requestEventName, {
          detail: {
            requestId: requestId,
            selector: selector
          }
        })
      );

      setTimeout(function () {
        window.removeEventListener(responseEventName, onResponse);
        resolve({ timeout: true });
      }, 1200);
    });
  }

  window.navDebug = {
    hintTarget: function (selector) {
      return requestDebug(selector);
    }
  };
})();