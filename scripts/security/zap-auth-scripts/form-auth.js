// ZAP Authentication Script (ECMAScript / Graal.js)
// Purpose: Perform form-based login with optional anti-CSRF token extraction.
// Usage in AF (zap.yaml): set authentication method to "script" and parameters.script to this file path
// and provide script parameters below via the context parameters if desired.
//
// Exposed functions (ZAP contract):
// - getRequiredParamsNames()
// - getOptionalParamsNames()
// - getCredentialsParamsNames()
// - authenticate(helper, paramsValues, credentials)

/* eslint-disable no-undef */

function getRequiredParamsNames() {
  // loginUrl is fetched to extract CSRF if tokenRegex provided
  // loginRequestUrl is POSTed with the request body
  // loginRequestBody is a template, placeholders: {username}, {password}, {token}
  return ['loginUrl', 'loginRequestUrl', 'loginRequestBody'];
}

function getOptionalParamsNames() {
  // tokenRegex: Java regex with a single capture group for CSRF token
  // loggedInIndicatorRegex: optional regex found in the logged-in landing page
  return ['tokenRegex', 'loggedInIndicatorRegex'];
}

function getCredentialsParamsNames() {
  return ['username', 'password'];
}

function authenticate(helper, paramsValues, credentials) {
  var HttpRequestHeader = Java.type('org.parosproxy.paros.network.HttpRequestHeader');
  var HttpHeader = Java.type('org.parosproxy.paros.network.HttpHeader');
  var URI = Java.type('org.apache.commons.httpclient.URI');
  var String = Java.type('java.lang.String');
  var Pattern = Java.type('java.util.regex.Pattern');

  function urlEncoded(s) {
    var URLEncoder = Java.type('java.net.URLEncoder');
    return URLEncoder.encode(String.valueOf(s), 'UTF-8');
  }

  var loginUrl = paramsValues.get('loginUrl');
  var loginRequestUrl = paramsValues.get('loginRequestUrl');
  var bodyTemplate = paramsValues.get('loginRequestBody');
  var tokenRegex = paramsValues.get('tokenRegex');
  var loggedInIndicatorRegex = paramsValues.get('loggedInIndicatorRegex');

  var username = credentials.getParam('username');
  var password = credentials.getParam('password');

  var csrfToken = '';

  if (tokenRegex && tokenRegex.length() > 0 && loginUrl && loginUrl.length() > 0) {
    var preMsg = helper.prepareMessage();
    preMsg.setRequestHeader(
      new HttpRequestHeader(HttpRequestHeader.GET, new URI(loginUrl, false), HttpHeader.HTTP11)
    );
    helper.sendAndReceive(preMsg, true);
    var resp = preMsg.getResponseBody().toString();
    var p = Pattern.compile(tokenRegex);
    var m = p.matcher(resp);
    if (m.find()) {
      csrfToken = m.group(1);
    }
  }

  var requestBody = String.valueOf(bodyTemplate)
    .replace('{username}', urlEncoded(username))
    .replace('{password}', urlEncoded(password))
    .replace('{token}', urlEncoded(csrfToken));

  var msg = helper.prepareMessage();
  msg.setRequestHeader(
    new HttpRequestHeader(
      HttpRequestHeader.POST,
      new URI(loginRequestUrl, false),
      HttpHeader.HTTP11
    )
  );
  msg.getRequestHeader().setHeader(HttpHeader.CONTENT_TYPE, 'application/x-www-form-urlencoded');
  msg.setRequestBody(new String(requestBody));
  msg.getRequestHeader().setContentLength(msg.getRequestBody().length());

  // Follow redirects (true) to land on the authenticated page
  helper.sendAndReceive(msg, true);

  if (loggedInIndicatorRegex && loggedInIndicatorRegex.length() > 0) {
    try {
      var matcher = Pattern.compile(loggedInIndicatorRegex).matcher(
        msg.getResponseBody().toString()
      );
      if (!matcher.find()) {
        // Not necessarily an error; AF exitStatus will handle gates. We keep this for operator visibility.
        // print can go to ZAP output panel.
        print('ZAP auth script: loggedInIndicatorRegex not found in response.');
      }
    } catch (e) {
      print('ZAP auth script: regex evaluation error: ' + e);
    }
  }

  return msg;
}
