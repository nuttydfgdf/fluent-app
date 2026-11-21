/* Content packs (AI-generated). Each item: [English text, Thai meaning].
   IMPORTANT: only APPEND new items to the end of a pack — ids are based on position. */
window.PACKS = [
  { id: 'standup', title: 'Daily Stand-up', items: [
    ['Yesterday I worked on the login API.', 'เมื่อวานผมทำ API ล็อกอิน'],
    ["Today I'm planning to finish the code review.", 'วันนี้ตั้งใจว่าจะรีวิวโค้ดให้เสร็จ'],
    ["I'm blocked on the staging environment.", 'ผมติดอยู่ที่ environment staging'],
    ['I should be done by the end of the day.', 'น่าจะเสร็จภายในสิ้นวัน'],
    ['It took longer than I expected.', 'ใช้เวลานานกว่าที่คิดไว้'],
    ['No blockers on my side.', 'ฝั่งผมไม่มีอะไรติดขัด'],
    ["I'll follow up with you after this call.", 'เดี๋ยวผมตามคุยกับคุณหลังคอลนี้'],
    ["Quick update from me. Yesterday I fixed the timeout issue, and today I'll start on the new dashboard. No blockers.", 'อัปเดตสั้นๆ เมื่อวานแก้ปัญหา timeout แล้ว วันนี้จะเริ่มทำ dashboard ใหม่ ไม่มีอะไรติด']
  ] },
  { id: 'help', title: 'Asking for Help', items: [
    ['Could you take a quick look at this?', 'ช่วยดูอันนี้ให้หน่อยได้ไหม'],
    ['Do you have a minute to help me with something?', 'มีเวลาสักครู่ช่วยผมเรื่องหนึ่งไหม'],
    ['Could you walk me through how this works?', 'ช่วยอธิบายทีละขั้นว่าอันนี้ทำงานยังไงได้ไหม'],
    ["I'm not sure I understand the requirement.", 'ผมไม่แน่ใจว่าเข้าใจ requirement ถูกไหม'],
    ['Is there any documentation I can read?', 'มีเอกสารให้อ่านไหม'],
    ['Would you mind pairing with me for ten minutes?', 'รบกวน pair กับผมสักสิบนาทีได้ไหม'],
    ['Thanks, that really helps.', 'ขอบคุณ ช่วยได้เยอะเลย']
  ] },
  { id: 'bug', title: 'Bugs & Incidents', items: [
    ['I can reproduce the issue on my machine.', 'ผมทำให้เกิดปัญหาซ้ำได้บนเครื่องผม'],
    ['It only happens under heavy load.', 'มันเกิดเฉพาะตอนโหลดหนัก'],
    ['I think the root cause is a race condition.', 'ผมคิดว่าต้นเหตุคือ race condition'],
    ["Here's what I've tried so far.", 'นี่คือสิ่งที่ผมลองไปแล้ว'],
    ['The logs show a timeout error.', 'log แสดง error แบบ timeout'],
    ["I'll roll back the change for now.", 'ตอนนี้ผมจะ rollback การเปลี่ยนแปลงก่อน'],
    ['Let me share my screen.', 'ขอแชร์หน้าจอนะ'],
    ["We're seeing elevated error rates since the last deployment. I'm looking into it now and will update you in thirty minutes.", 'error สูงขึ้นตั้งแต่ deploy ครั้งล่าสุด ตอนนี้กำลังตรวจสอบ และจะอัปเดตภายในครึ่งชั่วโมง']
  ] },
  { id: 'pushback', title: 'Polite Push Back', items: [
    ["I see your point, but I'm a bit concerned about the timeline.", 'เข้าใจที่คุณพูด แต่ผมกังวลเรื่อง timeline นิดหน่อย'],
    ['Could we consider an alternative approach?', 'เราลองพิจารณาแนวทางอื่นได้ไหม'],
    ["I'd prefer to stay with the current design for now.", 'ตอนนี้ผมอยากใช้ดีไซน์เดิมไปก่อน'],
    ["That might be risky, because we don't have enough tests.", 'อาจเสี่ยง เพราะเรามี test ไม่พอ'],
    ['Can we push this to the next sprint?', 'เลื่อนไป sprint หน้าได้ไหม'],
    ["I don't think we can make it by Friday.", 'ผมไม่คิดว่าจะทันวันศุกร์'],
    ["Let's discuss the trade-offs.", 'มาคุยเรื่อง trade-off กันเถอะ']
  ] },
  { id: 'repair', title: 'Repair Phrases (กู้สถานการณ์)', items: [
    ['Sorry, could you say that again?', 'ขอโทษ ช่วยพูดอีกครั้งได้ไหม'],
    ['Could you speak a little slower, please?', 'ช่วยพูดช้าลงนิดนึงได้ไหม'],
    ['Let me rephrase that.', 'ขอพูดใหม่อีกแบบนะ'],
    ['What I mean is, we need more time.', 'ที่ผมหมายถึงคือ เราต้องการเวลาเพิ่ม'],
    ['Sorry, I lost my train of thought.', 'ขอโทษ ผมลืมว่าจะพูดอะไร'],
    ["What I'm trying to say is, the design needs to change.", 'สิ่งที่ผมพยายามจะบอกคือ ดีไซน์ต้องเปลี่ยน'],
    ['Just to make sure I understood, you want me to update the API?', 'ขอยืนยันว่าเข้าใจถูกนะ คุณอยากให้ผมอัปเดต API ใช่ไหม'],
    ['Give me a second to think about it.', 'ขอเวลาคิดสักครู่']
  ] },
  { id: 'small', title: 'Small Talk', items: [
    ["How's it going?", 'เป็นไงบ้าง'],
    ['Did you have a good weekend?', 'สุดสัปดาห์เป็นยังไงบ้าง'],
    ['Thanks for joining.', 'ขอบคุณที่เข้าร่วม'],
    ["Sorry I'm late.", 'ขอโทษที่มาสาย'],
    ["I'll catch you later.", 'ไว้เจอกันนะ'],
    ['That sounds great.', 'ฟังดูดีเลย'],
    ["Let's keep in touch.", 'ติดต่อกันไว้นะ']
  ] },
  { id: 'meeting', title: 'Meetings & Wrap-up', items: [
    ['Can we go over the action items?', 'เรามาทบทวน action item กันได้ไหม'],
    ["Who's going to own this?", 'ใครจะรับผิดชอบเรื่องนี้'],
    ['Let me summarize what we agreed on.', 'ขอสรุปสิ่งที่เราตกลงกัน'],
    ['Could you send me the meeting notes?', 'ช่วยส่งบันทึกประชุมให้ผมได้ไหม'],
    ["I'll send a follow-up email.", 'เดี๋ยวผมส่งอีเมลสรุปตามไปให้'],
    ["Let's circle back on this tomorrow.", 'พรุ่งนี้มากลับมาคุยเรื่องนี้กันอีกที'],
    ['Does that make sense?', 'พอเข้าใจไหม']
  ] }
];

window.CONTENT = window.PACKS.reduce(function (acc, p) {
  p.items.forEach(function (x, i) {
    acc.push({ id: p.id + '-' + (i + 1), pack: p.id, packTitle: p.title,
      type: x[0].split(' ').length > 9 ? 'clip' : 'chunk', text: x[0], th: x[1] });
  });
  return acc;
}, []);
