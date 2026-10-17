'use strict';
require('dotenv').config();
const {Telegraf}=require('telegraf');
const {getTrainer,allTrainers,save}=require('./store');
const {findSpecies,randomSpecies}=require('./species');
const {makePokemon,chooseStarter,getTeam,setTeam,fightWild}=require('./game');
const {infectTrainer,scavenge,useAntidote,curePokemon}=require('./zombie');
const token=process.env.BOT_TOKEN;
if(!token || token==='replace_me') { console.error('BOT_TOKEN is missing. Copy .env.example to .env and set your Telegram token.'); process.exit(1); }
const bot=new Telegraf(token);
const SPAWN_MS=Math.max(10,Number(process.env.SPAWN_SECONDS)||30)*1000;
const spawns=new Map();
function nameOf(ctx) { const u=ctx.from||{}; return [u.first_name,u.last_name].filter(Boolean).join(' ')||u.username||'Trainer'; }
async function get(ctx) { return getTrainer(ctx.from.id,nameOf(ctx)); }
function listPokemon(t) {
  if(!t.pokemon.length) return 'No Pokémon yet. Choose a starter with /starter bulbasaur.';
  return t.pokemon.map((p,i)=>(i+1)+'. '+(p.infected?'🧟 ':'')+p.name+' — '+p.hp+'/'+p.maxHp+' HP'+(p.infected?' (INFECTED)':'')).join('\n');
}
bot.start(async ctx=>{ await get(ctx); await ctx.reply('Welcome to PokePlague, '+nameOf(ctx)+'!\nCatch Pokémon, battle, and survive the outbreak.\nChoose /starter bulbasaur, /starter charmander, or /starter squirtle.\nUse /help for commands.'); });
bot.command('help',ctx=>ctx.reply('PokePlague commands\n/profile — trainer stats\n/starter NAME — choose starter\n/pokemon — collection\n/team — view team; /team Pikachu, Eevee to set it\n/spawn — spawn a Pokémon; guess its name to claim\n/battle — fight a wild Pokémon\n/heal — heal injured Pokémon\n/infection — outbreak status\n/scavenge — search for supplies (30-minute cooldown)\n/antidote — reduce trainer infection\n/curepokemon NAME — cure an infected Pokémon\n/leaderboard — top trainers'));
bot.command('profile',async ctx=>{const t=await get(ctx);await ctx.reply('Trainer: '+t.name+'\nLevel: '+t.level+' | XP: '+t.xp+'\nCoins: '+t.coins+'\nPokémon: '+t.pokemon.length+'\nTeam: '+(getTeam(t).map(p=>p.name).join(', ')||'None')+'\nSupplies: '+t.items.supplies+' | Antidotes: '+t.items.antidotes+'\nInfection: '+t.infection+'%');});
bot.command('starter',async ctx=>{const t=await get(ctx);const r=chooseStarter(t,ctx.message.text.split(/\s+/).slice(1).join(' '));if(!r.ok)return ctx.reply(r.message);await save();await ctx.reply(r.pokemon.name+' joined your team! +50 coins. Use /spawn to find more Pokémon.');});
bot.command('pokemon',async ctx=>{const t=await get(ctx);await ctx.reply('Your collection ('+t.pokemon.length+')\n'+listPokemon(t));});
bot.command('team',async ctx=>{const t=await get(ctx);const arg=ctx.message.text.replace(/^\/team(?:@\w+)?\s*/i,'').trim();if(!arg)return ctx.reply('Active team:\n'+(getTeam(t).map(p=>p.name+' — '+p.hp+'/'+p.maxHp+' HP').join('\n')||'No team selected.')+'\nSet team: /team Pikachu, Eevee');const r=setTeam(t,arg.split(',').map(x=>x.trim()).filter(Boolean));if(!r.ok)return ctx.reply(r.message);await save();await ctx.reply('Team updated: '+r.team.map(p=>p.name).join(', '));});
bot.command('spawn',async ctx=>{
 const chat=ctx.chat.id; const previous=spawns.get(chat);
 if(previous && previous.expiresAt>Date.now()) return ctx.reply('A Pokémon is already spawning here. Guess its name before the timer ends.');
 if(previous && previous.timer)clearTimeout(previous.timer);
 const p=randomSpecies();const msg=await ctx.reply('🌿 A wild Pokémon appeared!\nRarity: '+(p.hp+p.attack>170?'Rare':p.hp+p.attack>120?'Uncommon':'Common')+'\nTime limit: '+Math.round(SPAWN_MS/1000)+' seconds\nGuess its name to claim it!');
 const spawn={species:p,messageId:msg.message_id,expiresAt:Date.now()+SPAWN_MS,claimed:false,timer:null};
 spawn.timer=setTimeout(async()=>{if(spawns.get(chat)!==spawn||spawn.claimed)return;spawns.delete(chat);try{await ctx.telegram.editMessageText(chat,spawn.messageId,undefined,'⌛ The Pokémon escaped! It was '+p.name+'. Use /spawn to try again.');}catch{}},SPAWN_MS);
 spawns.set(chat,spawn);
});
bot.on('text',async ctx=>{
 const guess=ctx.message.text.trim();if(!guess||guess.startsWith('/'))return;
 const chat=ctx.chat.id;const s=spawns.get(chat);if(!s||s.claimed||s.expiresAt<Date.now())return;
 const found=findSpecies(guess);if(!found||found.name!==s.species.name)return;
 s.claimed=true;clearTimeout(s.timer);spawns.delete(chat);
 const t=await get(ctx);const p=makePokemon(s.species,'wild');t.pokemon.push(p);if(t.team.length<3)t.team.push(p.uid);t.coins+=10;await save();
 try{await ctx.telegram.editMessageText(chat,s.messageId,undefined,'✅ '+nameOf(ctx)+' caught '+p.name+'!\nType: '+p.type+'\nHP: '+p.hp+'\n+10 coins');}catch{}
});
bot.command('battle',async ctx=>{const t=await get(ctx);if(!t.pokemon.length)return ctx.reply('Choose a starter first: /starter charmander');const wild=randomSpecies();const r=fightWild(t,wild);if(!r.ok)return ctx.reply(r.message);await save();await ctx.reply((r.won?'🏆 Victory!':'💥 Your Pokémon was defeated!')+'\nYour Pokémon: '+r.active.name+' ('+r.active.hp+'/'+r.active.maxHp+' HP)\nWild: '+wild.name+'\n\n'+r.rounds.slice(0,8).join('\n')+'\n'+(r.won?'+20 coins and +30 XP':'Heal and try again with /heal'));});
bot.command('heal',async ctx=>{const t=await get(ctx);const injured=t.pokemon.filter(p=>p.hp<p.maxHp);if(!injured.length)return ctx.reply('All your Pokémon are at full HP.');const cost=injured.length*10;if(t.coins<cost)return ctx.reply('You need '+cost+' coins to heal.');t.coins-=cost;injured.forEach(p=>p.hp=p.maxHp);await save();await ctx.reply('💊 Healed '+injured.length+' Pokémon for '+cost+' coins.');});
bot.command('infection',async ctx=>{const t=await get(ctx);const message=infectTrainer(t);if(t.infection>=40&&t.pokemon.length&&Math.random()<0.25)t.pokemon[Math.floor(Math.random()*t.pokemon.length)].infected=true;await save();await ctx.reply('🧟 Outbreak status\nTrainer infection: '+t.infection+'%\nInfected Pokémon: '+(t.pokemon.filter(p=>p.infected).map(p=>p.name).join(', ')||'None')+'\n'+message);});
bot.command('scavenge',async ctx=>{const t=await get(ctx);const r=scavenge(t);if(!r.ok)return ctx.reply(r.message);await save();await ctx.reply('🔦 '+r.message+'\nSupplies: '+t.items.supplies+' | Antidotes: '+t.items.antidotes+' | Coins: '+t.coins+' | Infection: '+t.infection+'%');});
bot.command('antidote',async ctx=>{const t=await get(ctx);const r=useAntidote(t);if(r.ok)await save();await ctx.reply(r.message);});
bot.command('curepokemon',async ctx=>{const t=await get(ctx);const r=curePokemon(t,ctx.message.text.replace(/^\/curepokemon(?:@\w+)?\s*/i,'').trim());if(r.ok)await save();await ctx.reply(r.message);});
bot.command('leaderboard',async ctx=>{const list=await allTrainers();list.sort((a,b)=>b.level-a.level||b.coins-a.coins);await ctx.reply('🏅 Top trainers\n'+(list.slice(0,10).map((t,i)=>(i+1)+'. '+t.name+' — Lv.'+t.level+', '+t.coins+' coins, '+t.pokemon.length+' Pokémon').join('\n')||'No trainers yet.'));});
bot.catch((err,ctx)=>{console.error('Telegram handler error:',err);if(ctx&&ctx.reply)ctx.reply('Something went wrong. Please try again.').catch(()=>{});});
bot.launch().then(()=>console.log('PokePlague is online.')).catch(err=>{console.error('Bot failed to start:',err.message);process.exitCode=1;});
process.once('SIGINT',()=>bot.stop('SIGINT'));process.once('SIGTERM',()=>bot.stop('SIGTERM'));
