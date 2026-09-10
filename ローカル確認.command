#!/bin/bash
# -------------------------------------------------------------
# 日本語教育ポータル ローカル確認スクリプト
# 空きポート（8000, 8001, 8002...）を自動検出して起動します
# -------------------------------------------------------------

cd "$(dirname "$0")"

echo "========================================================"
echo "  🌸 にほんご学習ポータル ローカルサーバー起動"
echo "========================================================"

# Pythonスクリプトで空きポートを自動探索して起動
python3 -c "
import http.server
import socketserver
import webbrowser
import threading
import time
import sys

def run_server():
    # 8000から順に空きポートを探す
    httpd = None
    selected_port = None
    for port in range(8000, 8050):
        try:
            httpd = socketserver.TCPServer(('127.0.0.1', port), http.server.SimpleHTTPRequestHandler)
            selected_port = port
            break
        except OSError:
            continue

    if not httpd:
        print('エラー: 利用可能なポートが見つかりませんでした。')
        sys.exit(1)

    url = f'http://localhost:{selected_port}'
    print(f'✓ サーバーが起動しました: {url}')
    print('✓ ブラウザを自動で開きます...')
    print('========================================================')
    print('終了するには、このウィンドウで [Ctrl + C] を押してください。')
    print('========================================================')

    # 0.5秒後にブラウザを自動起動
    def open_browser():
        time.sleep(0.5)
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nサーバーを停止しました。')
        httpd.shutdown()

run_server()
"
