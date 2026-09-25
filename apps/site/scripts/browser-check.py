import json, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path('dist').resolve()
OUT=Path('browser-evidence').resolve(); OUT.mkdir(exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kw): super().__init__(*args,directory=str(ROOT),**kw)
    def log_message(self,*args): pass
    def end_headers(self):
        self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.send_header('Referrer-Policy','no-referrer')
        super().end_headers()
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
thread=threading.Thread(target=server.serve_forever,daemon=True); thread.start()
base=f'http://127.0.0.1:{server.server_port}'
checks=[]
def check(name, condition):
    assert condition, name
    checks.append({'check':name,'passed':True})
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width in [390,768,1440]:
        page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
        errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        for route in ['/', '/list-check/', '/request/', '/pricing/', '/sample/', '/coverage/', '/docs/', '/privacy/', '/terms/', '/field-notes/', '/field-notes/rows-are-not-businesses/', '/field-notes/four-dates/']:
            response=page.goto(base+route,wait_until='networkidle')
            check(f'{width} {route} HTTP 200',response.status==200)
            check(f'{width} {route} no horizontal page overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
            check(f'{width} {route} single H1/main',page.locator('h1').count()==1 and page.locator('main').count()==1)
            check(f'{width} {route} labels attached',page.evaluate("Array.from(document.querySelectorAll('input,select,textarea')).every(e => !!document.querySelector(`label[for='${e.id}']`))"))
        page.goto(base+'/',wait_until='networkidle'); page.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
        check(f'{width} no JavaScript exceptions',not errors)
        page.close()
    page=browser.new_page(viewport={'width':1280,'height':900})
    requests=[]; dialogs=[]; page.on('request',lambda r:requests.append({'url':r.url,'method':r.method})); page.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()))
    page.goto(base+'/list-check/',wait_until='networkidle'); requests.clear()
    csv='name,date,phone\nAlpha,2026-09-24,123\n Alpha ,2026-09-24,123\nBeta,invalid,\n"<img src=x onerror=alert(1)>",2026-02-30,\n'
    page.locator('#csv-file').set_input_files({'name':'sample.csv','mimeType':'text/csv','buffer':csv.encode()})
    page.wait_for_function("!document.getElementById('analyze').disabled")
    page.select_option('#date-column','date'); page.click('#analyze')
    check('browser diagnostic reports repeated full row','1 repeated full rows' in page.locator('#diagnostic-result').inner_text())
    check('browser diagnostic reports invalid dates','invalid or not YYYY-MM-DD: 2' in page.locator('#diagnostic-result').inner_text())
    check('no network after file selection and analysis',not requests)
    check('no input execution or injected images',not dialogs and page.locator('#diagnostic-result img').count()==0)
    check('no browser storage',page.evaluate('localStorage.length===0 && sessionStorage.length===0'))
    page.screenshot(path=str(OUT/'diagnostic-verified.png'),full_page=True)
    page.click('#clear'); check('clear removes results/file and disables run',page.locator('#diagnostic-result').inner_text()=='' and page.locator('#csv-file').input_value()=='' and page.locator('#analyze').is_disabled())
    page.locator('#csv-file').set_input_files({'name':'malformed.csv','mimeType':'text/csv','buffer':b'name\n"open'})
    page.wait_for_function("document.getElementById('diagnostic-status').textContent.includes('not closed')")
    check('malformed browser CSV prevents analysis',page.locator('#analyze').is_disabled())
    page.goto(base+'/request/',wait_until='networkidle'); requests.clear()
    for key,value in {'company':'Example Broker','name':'Test Buyer','email':'buyer@example.test','market':'CO','goal':'Review relevant rows'}.items(): page.fill('#'+key,value)
    page.check('#consent'); page.click('#prepare-request')
    check('request draft explicitly unsent','NOT SENT' in page.locator('#request-draft').inner_text())
    check('unconfigured send control hidden',not page.locator('#send-request').is_visible())
    check('draft does not send request',not requests)
    page.press('#company','Enter'); check('enter does not submit data',not requests and page.url==base+'/request/')
    page.click('#clear-request'); check('clear erases private draft',page.locator('#request-draft').inner_text()=='' and page.locator('#email').input_value()=='')
    browser.close()
server.shutdown()
receipt={'runtime':'Python Playwright Chromium against actual local Astro dist; not public deployment','checks':checks,'passed':len(checks)}
(OUT/'browser-receipt.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps({'passed':len(checks),'screenshots':4,'notes':receipt['runtime']}))
