const { chromium } = require('/opt/pwmcp/node_modules/playwright-core');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:'/opt/ms-playwright/chromium-1246/chrome-linux64/chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page = await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await page.goto('file://' + path.resolve('source/design.html'),{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:'artifacts/hero.png'});
  const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-r','30','-movflags','+faststart','/tmp/pepe-silent.mp4'],{stdio:['pipe','inherit','inherit']});
  for(let frame=0;frame<600;frame++){
    await page.evaluate(time=>window.render(time),frame/30);
    const image=await page.screenshot({type:'jpeg',quality:92});
    if(!encoder.stdin.write(image))await new Promise(resolve=>encoder.stdin.once('drain',resolve));
    if(frame%120===0)console.log(`Rendered ${frame}/600`);
  }
  encoder.stdin.end();
  await new Promise((resolve,reject)=>encoder.on('close',code=>code===0?resolve():reject(new Error(`ffmpeg: ${code}`))));
  await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1});
