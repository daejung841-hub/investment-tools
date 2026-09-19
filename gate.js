/*
 * 세션 인증 게이트 — 이것도 보안이 아니라 무작위 유입을 막기 위한 장치입니다.
 * config.js를 먼저 로드해서 SITE_PASSWORD가 정의된 뒤에 이 파일을 불러와야 합니다.
 * 인증 상태는 sessionStorage에 저장되므로 같은 탭/세션 안에서 다른 도구 페이지로
 * 이동해도 다시 묻지 않지만, 브라우저를 완전히 닫으면 초기화됩니다.
 */
var SITE_AUTH_KEY = 'siteAuthed';

function isSiteAuthed(){
  try { return sessionStorage.getItem(SITE_AUTH_KEY) === '1'; } catch (e) { return false; }
}

function grantSiteAuth(){
  try { sessionStorage.setItem(SITE_AUTH_KEY, '1'); } catch (e) {}
}

// 도구 페이지 최상단에서 호출: 인증 안 됐으면 즉시 랜딩페이지로 되돌려보낸다.
function requireSiteAuth(indexPath){
  if (!isSiteAuthed()){
    location.replace(indexPath);
  }
}
