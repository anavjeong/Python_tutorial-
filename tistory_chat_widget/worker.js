// Cloudflare Worker for Tistory GPT chat widget
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/api") {
      if (req.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: cors
        });
      }

      try {
        const { turns } = await req.json();
        if (!Array.isArray(turns)) {
          return new Response(JSON.stringify({ error: "turns array is required" }), {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }

        const recentTurns = turns.slice(-10).filter(t => typeof t?.content === "string" && (t.role === "user" || t.role === "assistant"));

        const input = [
          {
            role: "system",
            content: "You are a helpful assistant for a blog. Answer briefly, clearly, and in Korean unless the user asks otherwise."
          },
          ...recentTurns.map(t => ({ role: t.role, content: t.content }))
        ];

        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "chatgpt-4o-latest",
            input
          })
        });

        const data = await response.json();
        const answer =
          data?.output?.[0]?.content?.[0]?.text ||
          data?.output_text ||
          data?.choices?.[0]?.message?.content ||
          "";

        return new Response(JSON.stringify({ answer }), {
          status: 200,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "server_error" }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/w.js") {
      const js = `
        (function(){
          const script = document.currentScript;
          const base = script && script.src ? script.src.replace(/\/w\.js(?:[?#].*)?$/, '') : '';
          const api = (script && script.dataset.api) || (base ? base + '/api' : '/api');
          const root = document.getElementById('wc-root');
          const chat = document.getElementById('wc-chat');
          const input = document.getElementById('wc-q');
          const send = document.getElementById('wc-send');
          if(!root || !chat || !input || !send){
            console.warn('[wc-chat] container markup not found');
            return;
          }

          const turns = [];

          function md(t){
            t = (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            t = t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
                 .replace(/\*(.+?)\*/g,'<em>$1</em>')
                 .replace(/\`([^\`]+?)\`/g,"<code style='background:rgba(0,0,0,.08);padding:2px 6px;border-radius:6px;'>$1</code>")
                 .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
            t = t.replace(/\n{2,}/g,'\n\n').split('\n\n').map(p=>'<p style="margin:8px 0;">'+p.replace(/\n/g,'<br>')+'</p>').join('');
            return t;
          }

          function row(role, html){
            const wrap = document.createElement('div');
            wrap.className = 'row ' + role;
            if(role === 'ai'){
              wrap.innerHTML = '<div class="avatar ai"></div><div class="bubble">'+html+'</div>';
            }else{
              wrap.innerHTML = '<div class="bubble">'+html+'</div><div class="avatar user"></div>';
            }
            return wrap;
          }

          function addUser(txt){
            chat.appendChild(row('user', md(txt)));
            chat.scrollTop = chat.scrollHeight;
          }

          function addSkeleton(){
            const el = document.createElement('div');
            el.className = 'row ai loading';
            el.innerHTML = '<div class="avatar ai"></div><div class="bubble"><div class="sk"><div class="ln"></div><div class="ln"></div><div class="ln" style="width:60%"></div></div></div>';
            chat.appendChild(el);
            chat.scrollTop = chat.scrollHeight;
            return el;
          }

          function replaceAi(el, html){
            el.classList.remove('loading');
            el.querySelector('.bubble').innerHTML = html;
            chat.scrollTop = chat.scrollHeight;
          }

          async function sendToApi(){
            const body = JSON.stringify({ turns: turns.slice(-10) });
            const res = await fetch(api, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body
            });
            if(!res.ok) throw new Error('api_error');
            const json = await res.json();
            return json.answer || '';
          }

          async function sendNow(){
            const text = (input.value || '').trim();
            if(!text) return;
            input.value = '';
            addUser(text);
            turns.push({ role: 'user', content: text });
            const skeleton = addSkeleton();
            send.disabled = true;
            try {
              const answer = await sendToApi();
              turns.push({ role: 'assistant', content: answer });
              replaceAi(skeleton, md(answer || '(결과 없음)'));
            } catch (err) {
              replaceAi(skeleton, '⚠️ 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } finally {
              send.disabled = false;
              if(input){ input.focus(); }
            }
          }

          send.addEventListener('click', function(e){
            e.preventDefault();
            sendNow();
          });

          input.addEventListener('keydown', function(e){
            if(e.key === 'Enter' && !e.shiftKey){
              e.preventDefault();
              sendNow();
            }
          });
        })();
      `;

      return new Response(js, {
        status: 200,
        headers: { ...cors, "Content-Type": "application/javascript; charset=utf-8" }
      });
    }

    const html = `
<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tistory Chat Widget</title>
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12l14-8-4 8 4 8z" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</div>
<script src="${url.origin}/w.js" data-api="${url.origin}/api"></script>
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
</html>
  }
};
