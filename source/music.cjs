const { spawnSync } = require('node:child_process');
const rate=48000,duration=20,samples=rate*duration,bpm=92,beat=60/bpm;
const left=new Float32Array(samples),right=new Float32Array(samples);
const notes=[
  [[220,261.63,329.63,392],[174.61,220,261.63,329.63],[196,246.94,293.66,392],[196,246.94,293.66,369.99]],
  [[220,261.63,329.63,392],[174.61,220,261.63,329.63],[164.81,196,246.94,329.63],[196,246.94,293.66,392]]
].flat();
let seed=19;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1};
function sound(at,length,frequency,gain,type,pan=0){
 const first=Math.floor(at*rate),count=Math.min(Math.floor(length*rate),samples-first);
 for(let sample=0;sample<count;sample++){
  const time=sample/rate,index=first+sample,attack=Math.min(1,time/.035),release=Math.pow(Math.max(0,1-time/length),type==='pad'?1.2:3);
  const phase=2*Math.PI*frequency*time;
  const tone=type==='pad'?(Math.sin(phase)+.22*Math.sin(2*phase+.2)+.07*Math.sin(3*phase))*(.88+.12*Math.sin(time*2.2)):
   type==='pluck'?(Math.sin(phase)+.35*Math.sin(2*phase)+.17*Math.sin(3*phase)+.08*Math.sin(4*phase)):
   Math.sin(phase)+.16*Math.sin(2*phase);
  const value=gain*tone*attack*release;
  left[index]+=value*(1-pan);right[index]+=value*(1+pan);
 }
}
for(let bar=0;bar<8;bar++){
 const start=bar*4*beat,chord=notes[bar];
 for(let note=0;note<4;note++)sound(start,Math.min(4.1*beat,duration-start),chord[note]/2,.025,'pad',(note-1.5)*.13);
 sound(start,Math.min(2.2*beat,duration-start),chord[0]/4,.084,'bass');
 sound(start+2*beat,Math.min(1.8*beat,duration-start-2*beat),chord[0]/4,.054,'bass');
 for(let step=0;step<4;step++){
  const tick=start+step*beat;if(tick>=duration)continue;
  sound(tick+.07,.85,chord[(step+bar)%4],.043,'pluck',step%2?-.2:.2);
  if(step===2)sound(tick+.32,.9,chord[(step+2)%4]*2,.024,'pluck',-.17);
 }
}
for(let step=0;step<duration/beat;step++){
 const start=Math.floor(step*beat*rate);
 for(let sample=0;sample<rate*.12&&start+sample<samples;sample++){
  const time=sample/rate,envelope=Math.exp(-time*37),kick=Math.sin(2*Math.PI*(58*time+46*time*time))*Math.exp(-time*29);
  const hit=(step%4===0||step%4===2)?kick*.042:0;
  const tick=(step%2===1?random()*.0045:random()*.0019)*envelope;
  left[start+sample]+=hit+tick;right[start+sample]+=hit+tick*.78;
 }
}
const echo=Math.floor(.31*rate);
for(let sample=echo;sample<samples;sample++){
 left[sample]+=right[sample-echo]*.065;right[sample]+=left[sample-echo]*.065;
}
const pcm=Buffer.alloc(44+samples*4);
pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(2,22);pcm.writeUInt32LE(rate,24);pcm.writeUInt32LE(rate*4,28);pcm.writeUInt16LE(4,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(samples*4,40);
for(let sample=0;sample<samples;sample++){
 const fade=Math.min(1,sample/(rate*.5),(samples-sample)/(rate*1.1));
 pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,left[sample]*fade))*32767),44+sample*4);
 pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,right[sample]*fade))*32767),46+sample*4);
}
const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'wav', '-i', 'pipe:0', '-c:a', 'flac', '-compression_level', '8', 'assets/music.flac'], { input: pcm });
if (result.status !== 0) throw new Error(`FLAC encode failed: ${result.stderr?.toString() || result.error}`);
