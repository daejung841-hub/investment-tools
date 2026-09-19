"""
python -m http.server의 캐시 문제를 피하기 위한 로컬 테스트용 서버.
모든 응답에 Cache-Control: no-store를 붙여, 브라우저가 이전 버전의
.html/.js 파일을 캐싱해서 "코드를 고쳤는데 화면이 그대로"인 상황을 방지한다.
실행: python nocache_server.py [포트, 기본 8791] [서빙할 디렉터리, 생략 시 현재 위치]
"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
    if len(sys.argv) > 2:
        os.chdir(sys.argv[2])
    HTTPServer(("", port), NoCacheHandler).serve_forever()
