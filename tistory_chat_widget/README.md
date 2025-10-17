# Tistory GPT Chat Widget

이 디렉터리는 티스토리(Tistory) 블로그에 붙일 수 있는 GPT 채팅 위젯을 Cloudflare Workers 위에서 동작하도록 구성한 예제입니다.

## 구성 요소

- `worker.js`: Cloudflare Workers에 업로드할 전체 코드입니다. `/` 요청에는 위젯 샘플 HTML을, `/w.js` 요청에는 클라이언트 스크립트를, `/api` 요청에는 OpenAI API와 통신하는 엔드포인트를 제공합니다.
- 위젯은 OpenAI `responses` API (`chatgpt-4o-latest` 모델)를 사용합니다. Workers의 환경 변수 `OPENAI_API_KEY`를 필수로 설정해야 합니다.

## 배포 방법

1. Cloudflare Dashboard에서 Workers를 생성합니다.
2. 생성한 Worker에 `worker.js` 내용을 붙여넣거나 `wrangler` CLI로 배포합니다.
3. Worker의 "Settings → Variables" 섹션에서 `OPENAI_API_KEY` 값을 등록합니다.
4. Worker가 배포되면 다음과 같은 세 개의 엔드포인트가 동시에 동작합니다.
   - `https://<worker-subdomain>/` : 샘플 위젯 페이지 (티스토리에 붙여넣을 HTML 참고용)
   - `https://<worker-subdomain>/w.js` : 위젯 동작을 담당하는 스크립트
   - `https://<worker-subdomain>/api` : OpenAI API 프록시

## 티스토리에 붙여넣기

1. 티스토리 글 편집기에서 **HTML 편집** 모드로 전환합니다.
2. 아래 예시처럼 Worker에서 제공하는 HTML과 스타일을 붙여넣습니다. `YOUR_WORKER_DOMAIN`은 Cloudflare Worker의 도메인(예: `https://my-chat-worker.username.workers.dev`)으로 바꿔주세요.

```html
<style>
#wc-root{--bg:#f6f7f8;--fg:#0f1115;--ln:rgba(15,17,21,.08);--ac:#137fec;--ac2:#4aa3ff;--bubble-ai:#ffffff;--bubble-user:linear-gradient(135deg,var(--ac),var(--ac2));--shadow:0 18px 50px rgba(19,91,236,.08);max-width:720px;margin:24px auto;padding:0 16px;font-family:'Inter','Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:var(--fg);}
#wc-root *{box-sizing:border-box;font-family:inherit;}
#wc-root .wc-card{background:#ffffff;border-radius:22px;padding:24px;border:1px solid var(--ln);box-shadow:0 24px 60px rgba(16,25,34,.08);display:flex;flex-direction:column;gap:20px;}
#wc-root .wc-header{display:flex;flex-direction:column;gap:6px;}
#wc-root .wc-header h1{margin:0;font-size:20px;font-weight:600;}
#wc-root .wc-header p{margin:0;color:#4b5563;font-size:14px;line-height:1.6;}
#wc-root .chat{display:flex;flex-direction:column;gap:16px;max-height:60vh;overflow:auto;padding:4px 4px 0;}
#wc-root .row{display:flex;gap:12px;align-items:flex-start;}
#wc-root .row.ai .bubble{background:var(--bubble-ai);border:1px solid var(--ln);color:var(--fg);}
#wc-root .row.user{justify-content:flex-end;}
#wc-root .row.user .bubble{background:var(--bubble-user);color:#fff;}
#wc-root .bubble{padding:12px 14px;border-radius:18px;border-top-left-radius:10px;max-width:78%;line-height:1.65;box-shadow:var(--shadow);}
#wc-root .row.user .bubble{border-top-left-radius:18px;border-top-right-radius:10px;box-shadow:0 12px 30px rgba(19,91,236,.22);}
#wc-root .avatar{width:36px;height:36px;border-radius:50%;flex:0 0 auto;background-size:cover;background-position:center;}
#wc-root .avatar.ai{background-image:url('https://static-00.iconduck.com/assets.00/bot-icon-2048x2048-s9n2d4qg.png');background-color:#e2e8f0;}
#wc-root .avatar.user{background-image:url('https://static-00.iconduck.com/assets.00/user-icon-256x256-xyq5ptf3.png');background-color:#dbeafe;}
#wc-root .controls{position:sticky;bottom:0;}
#wc-root .form{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:999px;background:#ffffff;border:1px solid var(--ln);box-shadow:0 20px 60px rgba(16,25,34,.08);}
#wc-root .input{flex:1;border:0;outline:0;background:transparent;color:var(--fg);font-size:15px;padding:0 12px;}
#wc-root .input::placeholder{color:#9ca3af;}
#wc-root .send{width:42px;height:42px;border:0;border-radius:999px;cursor:pointer;background:linear-gradient(135deg,var(--ac),var(--ac2));color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px rgba(19,91,236,.28);}
#wc-root .send:disabled{opacity:.6;cursor:not-allowed;box-shadow:none;}
#wc-root .send svg{width:18px;height:18px;}
#wc-root .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
#wc-root .sk{display:grid;gap:8px;}
#wc-root .sk .ln{height:12px;border-radius:6px;background:linear-gradient(90deg,rgba(15,17,21,.1),rgba(15,17,21,.04),rgba(15,17,21,.1));animation:a 1.4s infinite;background-size:200% 100%;}
@keyframes a{0%{background-position:-150px 0}100%{background-position:150px 0;}}
@media (max-width:640px){#wc-root{padding:0 12px;}#wc-root .wc-card{padding:20px;}#wc-root .bubble{max-width:88%;}}
</style>
<div id="wc-root">
  <div class="wc-card">
    <div class="wc-header">
      <h1>무엇이든 물어보세요</h1>
      <p>이 블로그와 관련된 질문에 대해 AI가 빠르게 답변해 드립니다.</p>
    </div>
    <div id="wc-chat" class="chat" role="log" aria-live="polite"></div>
    <div class="controls">
      <form class="form" onsubmit="return false;">
        <label for="wc-q" class="sr-only">질문 입력</label>
        <input id="wc-q" class="input" placeholder="질문을 입력하세요" autocomplete="off">
        <button id="wc-send" class="send" aria-label="Send">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12l14-8-4 8 4 8z"></path>
          </svg>
        </button>
      </form>
    </div>
  </div>
</div>
<script src="https://YOUR_WORKER_DOMAIN/w.js" data-api="https://YOUR_WORKER_DOMAIN/api"></script>
<script>
  (function(){
    const chat = document.getElementById('wc-chat');
    if(chat && !chat.dataset.ready){
      chat.dataset.ready = '1';
      const hello = document.createElement('div');
      hello.className = 'row ai';
      hello.innerHTML = '<div class="avatar ai"></div><div class="bubble">안녕하세요! 무엇이든 물어보세요. 이 창 안에서 대화가 이어집니다. 🙂</div>';
      chat.appendChild(hello);
    }
  })();
</script>
```


3. 저장 후 글을 미리보기하여 채팅 위젯이 정상 동작하는지 확인합니다.

## 주요 동작 방식

- 프론트엔드 스크립트는 질문과 답변을 `turns` 배열에 누적하며, 매 요청마다 최근 10개의 발화를 그대로 API로 전달하므로 같은 세션 안에서 대화 문맥이 유지됩니다.
- API 요청이 실패하면 사용자에게 한국어로 네트워크 오류 메시지를 출력합니다.
- 기본적으로 모든 텍스트는 한국어로 답변하도록 시스템 프롬프트가 설정되어 있습니다.

필요에 따라 CSS, 아바타 이미지, 시스템 프롬프트, 허용 Origin 등을 자유롭게 수정할 수 있습니다.
