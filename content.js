/* TripTalk: reviewed, local-first phrase and conversation library. */
(function () {
  const scenes = [
    {id:'airport',name:'机场与入境',short:'机场入境',en:'AIRPORT',icon:'plane',color:'#5376d8',tint:'#edf2ff',desc:'从值机柜台，到顺利取到行李'},
    {id:'hotel',name:'酒店与住宿',short:'酒店住宿',en:'HOTEL',icon:'bed',color:'#b68b60',tint:'#f7f0e8',desc:'入住、寄存、房间需求，一句句说清楚'},
    {id:'food',name:'餐厅与咖啡',short:'餐厅用餐',en:'DINING',icon:'utensils',color:'#d28a62',tint:'#fcf0e8',desc:'吃到想吃的，也说清楚自己的偏好'},
    {id:'shopping',name:'商场与购物',short:'商场购物',en:'SHOPPING',icon:'bag',color:'#9b83c1',tint:'#f3eefb',desc:'随便看看，试穿一下，买得明白'},
    {id:'spa',name:'SPA 与按摩',short:'SPA 按摩',en:'WELLNESS',icon:'flower',color:'#79a88e',tint:'#ecf5ef',desc:'约好两个人的放松时间'},
    {id:'transport',name:'交通与问路',short:'交通问路',en:'GETTING AROUND',icon:'train',color:'#6f9eab',tint:'#eaf4f7',desc:'确认方向，让每一程都更安心'},
    {id:'help',name:'问题与求助',short:'紧急求助',en:'GET HELP',icon:'shield',color:'#c77a76',tint:'#fcf0ee',desc:'需要帮助时，把最重要的事情说清楚'},
    {id:'forms',name:'入境表格辅助',short:'表格辅助',en:'TRAVEL NOTES',icon:'document',color:'#8c9bb5',tint:'#eef2f8',desc:'看懂关键字段，按真实信息填写'}
  ];
  const phrases = [], tasks = [], lookup = new Map();
  function P(en,zh,scene,essential) {
    let p = lookup.get(en);
    if (!p) { p={id:'p'+(phrases.length+1),en,zh,scenes:[scene],essential:!!essential}; phrases.push(p); lookup.set(en,p); }
    else { if(!p.scenes.includes(scene)) p.scenes.push(scene); if(essential)p.essential=true; }
    return p.id;
  }
  function T(scene,id,title,desc,lines,extras,tip,keywords) {
    const dialogue=lines.map(l=>({me:l[0],en:l[1],zh:l[2]}));
    const keys=lines.filter(l=>l[0]).map(l=>P(l[1],l[2],scene));
    const variants=(extras||[]).map(group=>({title:group[0],ids:group.slice(1).map(l=>P(l[0],l[1],scene))}));
    tasks.push({id,scene,title,desc,dialogue,keys:[...new Set(keys)],variants,tip:tip||'',keywords:keywords||''});
  }
  [
    ['Excuse me.','打扰一下。','general'],
    ['Could you help me, please?','可以帮我一下吗？','general'],
    ['I’d like this one, please.','我想要这个，谢谢。','general'],
    ['Do you have any available?','请问还有吗？','general'],
    ['Where are the toilets, please?','请问洗手间在哪里？','general'],
    ['How much is this?','这个多少钱？','general'],
    ['Sorry, I don’t understand.','不好意思，我没有听懂。','general'],
    ['Could you say that again, please?','可以再说一遍吗？','general'],
    ['Could you speak more slowly, please?','可以说慢一点吗？','general'],
    ['Could you write that down, please?','可以帮我写下来吗？','general'],
    ['No, thank you.','不用了，谢谢。','general'],
    ['Can I pay by card?','可以刷卡吗？','general'],
    ['I’d like to check in. I have a reservation under [name].','我想办理入住，预订姓名是［姓名］。','hotel'],
    ['Could we leave our luggage here?','我们可以把行李寄存在这里吗？','hotel'],
    ['A table for two, please.','你好，两位用餐。','food'],
    ['I’ll have this one, please.','我要这道，谢谢。','food'],
    ['Could we have the bill, please?','请帮我们结账。','food'],
    ['Could you make it mild, please?','可以做成微辣吗？','food'],
    ['I’m just looking, thank you.','我先随便看看，谢谢。','shopping'],
    ['Can I try this on?','我可以试穿吗？','shopping'],
    ['Could I try one size up?','我可以试试大一码吗？','shopping'],
    ['Where can I check in for flight [flight number]?','请问［航班号］在哪里办理值机？','airport'],
    ['Could we sit together, please?','可以安排我们坐在一起吗？','airport'],
    ['Where is gate [gate number]?','请问［登机口号码］在哪里？','airport'],
    ['I’d like to book a massage for two people.','我想预约两个人的按摩。','spa'],
    ['Can we both start at the same time?','我们两个人可以同时开始吗？','spa'],
    ['Could you show me on the map?','可以在地图上指给我看吗？','transport'],
    ['Does this train go to the city centre?','这班车去市中心吗？','transport'],
    ['I need a doctor.','我需要看医生。','help'],
    ['Please call an ambulance.','请叫救护车。','help'],
    ['I’m allergic to peanuts.','我对花生过敏。','help'],
    ['I’ve lost my passport.','我的护照丢了。','help']
  ].forEach(a=>P(...a,true));

  T('airport','check-in','找到柜台，办理值机','航站楼 · 护照 · 在线值机',[
    [true,'Hi, I’m checking in for flight [flight number].','你好，我要办理［航班号］的值机。'],
    [false,'Sure. May I see your passport, please?','好的。请出示您的护照。'],
    [true,'Here’s my passport and booking confirmation.','这是我的护照和预订确认单。'],
    [false,'Thank you. How many bags are you checking in?','谢谢。您有几件行李要托运？'],
    [true,'We have two bags to check.','我们有两件行李要托运。']
  ],[['先找柜台',['Where can I check in for flight [flight number]?','请问［航班号］在哪里办理值机？'],['Which terminal does my flight depart from?','我的航班从哪个航站楼出发？'],['Is this the check-in counter for [airline]?','这是［航空公司］的值机柜台吗？']],['我已经在线值机了',['I’ve already checked in online. Where can I drop off my bag?','我已在线值机，在哪里托运行李？']]],'准备好护照和订单；航班号可直接指给工作人员看。','飞机 航空公司 机票 柜台 terminal check in');
  T('airport','baggage-seat','托运行李，安排座位','超重 · 随身行李 · 两人坐一起',[
    [true,'Could we sit together, please?','可以安排我们坐在一起吗？'],
    [false,'Of course. Please put your bag on the scale.','当然。请把行李放到秤上。'],
    [false,'Your bag is two kilos over the limit.','您的行李超重两公斤。'],
    [true,'Can I rearrange my luggage here?','我可以在这里重新整理行李吗？']
  ],[['行李额度',['Can I take this bag as carry-on luggage?','这个包可以随身带上飞机吗？'],['How much is it over the limit?','超重了多少？'],['How much is the excess baggage fee?','超重行李费是多少？']],['座位偏好',['Could I have a window seat, please?','可以给我一个靠窗座位吗？'],['Could I have an aisle seat, please?','可以给我一个靠过道的座位吗？']]],'carry-on 是随身行李，checked baggage 是托运行李。','重量 公斤 超重 靠窗 过道 一起');
  T('airport','security','听懂安检要求','托盘 · 电脑 · 随身物品',[
    [false,'Please empty your pockets and put your belongings in the tray.','请清空口袋，把随身物品放进托盘。'],
    [true,'Do I need to take my laptop out of my bag?','我需要把电脑从包里拿出来吗？'],
    [false,'Yes, please. Could you open your bag?','是的，请拿出来。可以打开您的包吗？'],
    [true,'Of course.','当然可以。']
  ],[['不确定时先问',['Do I need to take off my shoes?','我需要脱鞋吗？'],['Do I need to take off my jacket?','我需要脱外套吗？'],['Is this allowed in my carry-on bag?','这个可以放在随身行李里吗？']]],'不同机场要求可能不同，按现场指示操作。','安检 脱鞋 外套 笔记本 电脑');
  T('airport','boarding','找登机口，确认时间','登机牌 · 登机时间 · 登机口变更',[
    [true,'Where is gate [gate number]?','请问［登机口号码］在哪里？'],
    [false,'Go straight, then turn right.','直走，然后右转。'],
    [true,'What time does boarding start?','几点开始登机？'],
    [false,'Boarding starts at seven thirty.','七点半开始登机。']
  ],[['登机口可能变了',['Has the gate changed? What’s the new gate number?','登机口换了吗？新的登机口是几号？'],['Is this the gate for the flight to Penang?','这是飞往槟城的航班登机口吗？'],['Has boarding started yet?','已经开始登机了吗？']],['没听清数字',['Could you write down the gate number and boarding time, please?','可以写下登机口号码和登机时间吗？'],['Could you point it out on my boarding pass?','可以在登机牌上指给我看吗？']]],'boarding time 是登机时间，departure time 是起飞时间。','登机 时间 飞槟城 gate');
  T('airport','flight-change','航班延误或取消','新时间 · 错过转机 · 后续安排',[
    [true,'Is the flight delayed?','航班延误了吗？'],
    [false,'Yes. The new departure time is nine p.m.','是的。新的起飞时间是晚上九点。'],
    [true,'I have a connecting flight. Will I still be able to make it?','我后面还有转机，还来得及吗？'],
    [false,'Please speak to the staff at the transfer desk.','请咨询转机柜台的工作人员。']
  ],[['行程发生变化',['What’s the updated departure time?','更新后的起飞时间是几点？'],['I’ve missed my connecting flight. Could you help me with the next steps?','我错过了转机航班，可以帮我看看接下来怎么办吗？'],['My flight has been cancelled. What are my options?','我的航班取消了，有哪些后续安排可以选择？']]],'先确认新的航班信息，再询问可选择的安排。','延误 晚点 取消 误机');
  T('airport','transfer','转机与行李直挂','转机柜台 · 入境 · 重新托运',[
    [true,'I’m connecting to a flight to Langkawi. Where should I go?','我要转乘去兰卡威的航班，应该往哪里走？'],
    [false,'Follow the signs for transfers.','请跟着转机标识走。'],
    [true,'Do I need to collect my luggage and check it in again?','我需要提取行李，再重新托运吗？'],
    [false,'Let me check your baggage tag.','让我看一下您的行李托运凭条。']
  ],[['把流程问清楚',['Where is the transfer desk?','转机服务柜台在哪里？'],['Do I need to go through immigration here?','我需要在这里办理入境吗？'],['Is my luggage checked through to my final destination?','我的行李会直挂到最终目的地吗？'],['Where can I get the boarding pass for my next flight?','在哪里领取下一程登机牌？']]],'是否入境、提取行李及重新托运，要让工作人员按你的机票确认。','转机 联程 直挂 兰卡威');
  T('airport','immigration','回答入境问题','旅行目的 · 天数 · 酒店 · 回程票',[
    [false,'What’s the purpose of your visit?','您此次来访的目的是什么？'],
    [true,'I’m here on holiday.','我来旅游。'],
    [false,'How long will you be staying?','您准备停留多久？'],
    [true,'I’ll be staying for eight days.','我会停留八天。'],
    [false,'Where will you be staying?','您住在哪里？'],
    [true,'I’ll be staying at [hotel]. Here’s my hotel booking.','我会住在［酒店］。这是酒店预订。']
  ],[['回程和同行人',['Yes, here’s my return flight booking.','有的，这是我的回程机票预订。'],['I’m travelling with a friend.','我和朋友一起旅行。']]],'回答中的天数、酒店和同行关系均为例句，请替换成真实信息。','海关 旅游 入境 马来西亚 八天 护照');
  T('airport','baggage-claim','取行李与行李问题','转盘 · 行李未到 · 行李损坏',[
    [true,'Which carousel is for flight [flight number]?','［航班号］的行李在哪个转盘？'],
    [false,'Carousel number five.','五号转盘。'],
    [true,'My suitcase hasn’t arrived. Where can I report it?','我的行李箱没有到，在哪里可以登记？'],
    [false,'Could you describe your suitcase?','可以描述一下您的行李箱吗？'],
    [true,'It’s a large black suitcase. Here’s my baggage tag.','是一个大号黑色行李箱。这是行李托运凭条。']
  ],[['需要工作人员帮助',['Where is the baggage claim area?','行李提取区在哪里？'],['My suitcase was damaged. Could you help me report it?','我的行李箱损坏了，可以帮我登记吗？']]],'保留行李托运凭条，描述颜色、大小和明显标记。','丢行李 没到 提取 转盘 损坏');

  T('hotel','hotel-check-in','办理入住，核对订单','预订姓名 · 订单 · 入住人数与晚数',[
    [true,'I’d like to check in. I have a reservation under [name].','我想办理入住，预订姓名是［姓名］。'],
    [false,'May I see your passports, please?','可以看一下你们的护照吗？'],
    [true,'Here are our passports and booking confirmation.','这是我们的护照和预订确认单。'],
    [false,'Two guests for three nights, is that right?','两位入住三晚，对吗？'],
    [true,'Yes, that’s right.','对，没错。']
  ],[['订单信息有误',['Actually, we’re staying for two nights, not three.','其实我们住两晚，不是三晚。'],['The booking is for two guests, not one.','预订的是两位，不是一位。']],['说明预订渠道',['I booked through Agoda.','我通过 Agoda 预订的。'],['I booked through Trip.com.','我通过 Trip.com 预订的。'],['I booked through Booking.com.','我通过 Booking.com 预订的。']]],'姓名请使用订单上的英文或拼音；实际入住晚数按订单回答。','入住 预订 护照 booking check in');
  T('hotel','room-preference','床型和房间偏好','双床 · 大床 · 安静 · 无烟房',[
    [false,'Would you prefer one double bed or two single beds?','你们想要一张双人床，还是两张单人床？'],
    [true,'We’d like two single beds, please.','我们想要两张单人床。'],
    [true,'Could we have a quiet room, please?','可以安排一间安静的房间吗？'],
    [false,'I’ll check what’s available.','我看看有哪些房间。']
  ],[['其他偏好',['We’d like one double bed, please.','我们想要一张双人床。'],['Could we have a room on a higher floor, if possible?','如果可以，能安排高一点的楼层吗？'],['Could we have a non-smoking room, please?','可以安排无烟房吗？']]],'twin 通常是双床；double 通常是一张双人床。直接说床的数量最清楚。','双床 大床 安静 高楼层 无烟');
  T('hotel','hotel-payment','房费、押金与额外费用','已在线付款 · 预授权 · 升级费用',[
    [false,'We require a deposit.','我们需要收取押金。'],
    [true,'How much is the deposit?','押金是多少？'],
    [false,'Two hundred ringgit.','两百林吉特。'],
    [true,'I’ve already paid for the room online. Are there any additional charges?','我已经在网上付过房费了，还有其他费用吗？']
  ],[['付钱之前问清楚',['Can I pay by card?','可以刷卡吗？'],['When will the deposit be refunded or the hold released?','押金什么时候退回，或预授权什么时候解除？'],['How much extra would that cost per night?','那每晚需要额外多少钱？']]],'例句中的金额仅供练习。deposit 是押金；hold 可指银行卡预授权冻结。','押金 预授权 额外收费 房费 升级');
  T('hotel','hotel-info','早餐、退房时间和 Wi-Fi','早餐地点 · 两张房卡 · 上网',[
    [true,'Is breakfast included in our booking?','我们的预订包含早餐吗？'],
    [false,'Yes. It’s served from seven to ten on the second floor.','包含。早上七点到十点，在二楼供应。'],
    [true,'What time is check-out?','几点前需要退房？'],
    [false,'Check-out is at noon.','中午十二点退房。']
  ],[['入住时顺便问',['What time is breakfast served, and where?','早餐几点供应？在哪里吃？'],['How do I connect to the Wi-Fi?','怎么连接 Wi-Fi？'],['Could we have two key cards, please?','可以给我们两张房卡吗？']]],'时间和地点请以酒店实际答复为准。','早餐 wifi 无线网 房卡 退房时间');
  T('hotel','early-check-in','提前入住与行李寄存','到得太早 · 暂存行李 · 取回时间',[
    [true,'Is early check-in possible?','可以提前入住吗？'],
    [false,'Your room isn’t ready yet. Check-in starts at three p.m.','房间还没准备好，下午三点开始入住。'],
    [true,'Could we leave our luggage here?','我们可以把行李寄存在这里吗？'],
    [false,'Of course. Please keep this luggage tag.','当然，请保管好这张行李牌。']
  ],[['晚点回来',['What time should we come back?','我们几点回来比较合适？'],['Is there an extra charge for early check-in?','提前入住需要额外收费吗？'],['Can we leave our luggage here after check-out?','退房后可以在这里寄存行李吗？']]],'寄存后保留行李牌，贵重物品随身携带。','早到 提前 行李寄存 luggage');
  T('hotel','room-problem','房间有问题，联系前台','空调 · 热水 · 噪音 · 房卡',[
    [true,'Hi, this is room [room number]. The air conditioning isn’t working.','你好，这里是［房号］，空调不能用。'],
    [false,'We’ll send someone up to check it.','我们会派人上去检查。'],
    [true,'How long will it take?','大概需要多久？'],
    [false,'About ten minutes.','大概十分钟。']
  ],[['换成你的实际问题',['There’s no hot water.','没有热水。'],['My key card isn’t working.','我的房卡刷不开。'],['Could we have two more towels, please?','可以再给我们两条毛巾吗？'],['The room is quite noisy. Would it be possible to change rooms?','房间比较吵，可以换一间吗？']]],'电话开头先报房号，会更容易得到帮助。','空调坏了 热水 房卡 毛巾 吵 换房');
  T('hotel','check-out','退房与核对账单','延迟退房 · 账单 · 押金',[
    [true,'I’d like to check out, please.','我想办理退房。'],
    [false,'What’s your room number?','您的房号是多少？'],
    [true,'Room [room number]. Could I see the bill, please?','［房号］。可以看一下账单吗？'],
    [false,'Of course. Here it is.','当然，给您。']
  ],[['时间和费用',['Is late check-out possible?','可以延迟退房吗？'],['Is there an extra charge?','需要额外收费吗？'],['Could you explain this charge, please?','可以解释一下这笔费用吗？']]],'退房前可先确认延迟退房是否收费。','退房 延迟 账单');

  T('food','table','进店找座位与等位','两人用餐 · 预订 · 室内外',[
    [true,'A table for two, please.','你好，两位用餐。'],
    [false,'Do you have a reservation?','你们有预订吗？'],
    [true,'No, we don’t. How long is the wait?','没有。大概要等多久？'],
    [false,'About fifteen minutes.','大约十五分钟。']
  ],[['座位与预订',['Yes, we have a reservation under [name].','有的，预订姓名是［姓名］。'],['Could we sit inside, please?','我们可以坐室内吗？'],['Could we sit outside, please?','我们可以坐室外吗？']]],'a table for two 是“两人桌”，不是两张桌子。','入座 等位 排队 两位 室内 室外');
  T('food','menu','看菜单，询问推荐','推荐菜 · 食材 · 两人分量',[
    [true,'Could we see the menu, please?','可以给我们看一下菜单吗？'],
    [false,'Of course. Here are your menus.','当然，这是你们的菜单。'],
    [true,'What would you recommend?','你有什么推荐的吗？'],
    [false,'The chicken rice is very popular.','鸡饭很受欢迎。'],
    [true,'Would one portion be enough for two of us to share?','点一份够我们两个人分着吃吗？']
  ],[['看不懂菜名时',['Do you have an English menu?','有英文菜单吗？'],['Do you have a menu with pictures?','有带图片的菜单吗？'],['What’s in this dish?','这道菜里面有什么食材？'],['Could we have a few more minutes, please?','可以再给我们几分钟吗？']]],'不会念菜名时，可以指着菜单询问。','菜单 推荐 分量 食材 看不懂');
  T('food','order','点餐与共享菜品','指菜单 · 数量 · 小盘子',[
    [false,'Are you ready to order?','可以点餐了吗？'],
    [true,'I’ll have this one, please.','我要这道，谢谢。'],
    [false,'Sure. Anything else?','好的，还需要别的吗？'],
    [true,'Yes, one of these to share, please.','要，再来一份这个，我们一起分着吃。'],
    [false,'Of course. Anything to drink?','当然。喝点什么？'],
    [true,'Just water for us, thanks. That’s all.','我们喝水就好，就这些，谢谢。']
  ],[['一起分着吃',['We’re going to share these dishes.','这几道菜我们一起吃。'],['Could we have two small plates, please?','可以给我们两个小盘子吗？']],['换一种饮料',['Two iced coffees, please.','请给我们两杯冰咖啡。']],['暂时点这些',['That’s all for now, thank you.','暂时就这些，谢谢。']]],'配合指菜单，this one 就能表达要哪一道菜。','点菜 点餐 共享 盘子 数量');
  T('food','preferences','辣度、配料与饮料','微辣 · 不放香菜 · 少冰少糖',[
    [true,'Is this spicy?','这道菜辣吗？'],
    [false,'A little. We can make it less spicy.','有一点，我们可以做得不那么辣。'],
    [true,'Could you make it mild, please?','可以做成微辣吗？'],
    [true,'And two glasses of water, please. No ice.','再给我们两杯水，不要冰。']
  ],[['食物偏好',['Can you make it without any chilli?','可以完全不放辣椒吗？'],['No coriander, please.','请不要放香菜。'],['Could we have the sauce on the side?','可以把酱汁单独放吗？']],['饮料偏好',['No ice, please.','请不要冰。'],['Less ice, please.','请少冰。'],['No added sugar, please.','请不要额外加糖。'],['Less sugar, please.','请少糖。']]],'mild 是微辣；完全不放辣椒要明确说 without any chilli。','忌口 香菜 不辣 辣椒 酱汁 少糖 无糖 少冰 去冰 水');
  T('food','allergy-food','明确说明食物过敏','过敏原 · 配料 · 交叉接触',[
    [true,'I’m allergic to peanuts.','我对花生过敏。'],
    [true,'Does this contain any peanuts or peanut oil?','这道菜含花生或花生油吗？'],
    [false,'Let me check with the kitchen.','我去向厨房确认一下。'],
    [true,'Do you use the same equipment for anything with peanuts?','你们会用同一套设备处理含花生的食物吗？']
  ],[['替换过敏原',['I’m allergic to shellfish.','我对贝类或甲壳类海鲜过敏。'],['I have a severe food allergy.','我有严重的食物过敏。']]],'过敏必须明确说 allergic。过敏与不喜欢某种食物不能混用。','过敏 花生油 海鲜 食物过敏');
  T('food','during-meal','用餐中需要帮助','催菜 · 上错菜 · 餐具 · 收盘',[
    [true,'Excuse me. We’re still waiting for our chicken rice. Could you check on it, please?','打扰一下，我们的鸡饭还没上，可以帮忙看一下吗？'],
    [false,'I’ll check with the kitchen.','我去厨房确认一下。'],
    [true,'Could we have some more napkins, please?','可以再给我们一些纸巾吗？'],
    [false,'Of course.','当然可以。']
  ],[['其他需求',['Could I have a spoon, please?','可以给我一把勺子吗？'],['Could I have a fork, please?','可以给我一把叉子吗？'],['Could I have a pair of chopsticks, please?','可以给我一双筷子吗？'],['Sorry, I don’t think this is what we ordered.','不好意思，这好像不是我们点的。'],['I’m still working on it, thank you.','我还没吃完，谢谢。']]],'服务员来收盘时，I’m still working on it 表示还在吃。','催菜 上错菜 收盘 没吃完 筷子 纸巾');
  T('food','takeaway','打包与外带','堂食 · 带走 · 打包盒',[
    [false,'For here or to go?','在这里吃，还是带走？'],
    [true,'To go, please.','带走，谢谢。'],
    [false,'Would you like a bag?','需要袋子吗？'],
    [true,'Yes, please.','需要，谢谢。']
  ],[['吃不完带走',['Could you pack this up for us, please?','可以帮我们把这个打包吗？'],['Could we have a takeaway container, please?','可以给我们一个打包盒吗？'],['For here, please.','在这里吃。']]],'to go 和 takeaway 都可以表达外带。','外卖 外带 打包 吃不完 堂食');
  T('food','bill','结账，核对费用','刷卡 · 分开付 · 服务费',[
    [true,'Could we have the bill, please?','请帮我们结账。'],
    [false,'Of course. Here you are.','当然，给您。'],
    [true,'Is the service charge included?','账单里已经包含服务费了吗？'],
    [false,'Yes, it’s included.','是的，已包含。'],
    [true,'Can I pay by card?','可以刷卡吗？']
  ],[['分开付或账单有误',['Can we pay separately?','我们可以分开付款吗？'],['I think we’ve been charged twice for this item. Could you check, please?','这项好像被收了两次钱，可以核对一下吗？'],['Could I have a receipt, please?','可以给我一张收据吗？']]],'bill 是账单；receipt 是付款后的收据。','买单 结账 服务费 重复收费 收据 付款');

  T('shopping','mall-directions','找店铺与商场设施','楼层 · 美食广场 · 电梯 · 洗手间',[
    [true,'Which floor is the food court on?','美食广场在几楼？'],
    [false,'It’s on the second floor, next to the supermarket.','在二楼，超市旁边。'],
    [true,'Could you show me on the directory?','可以在楼层导览图上指给我看吗？'],
    [false,'Of course. We’re here, and the food court is here.','当然。我们在这里，美食广场在这里。']
  ],[['找设施',['Where are the toilets, please?','请问洗手间在哪里？'],['Is there a lift nearby?','这附近有电梯吗？'],['Where can I find a pharmacy?','请问药店在哪里？'],['Where can I find a bookstore?','请问书店在哪里？']]],'lift 是直达电梯；escalator 是扶梯。楼层不确定时请对方指图。','商场导航 厕所 洗手间 电梯 扶梯 超市 药店 书店');
  T('shopping','browse','随便看看，说明需求','回应店员 · 颜色 · 非展示品',[
    [false,'Hi, can I help you find anything?','你好，有什么需要帮忙找的吗？'],
    [true,'I’m just looking, thank you.','我先随便看看，谢谢。'],
    [false,'Of course. Let me know if you need anything.','好的，有需要随时告诉我。'],
    [true,'Actually, do you have this in any other colours?','对了，这款还有其他颜色吗？']
  ],[['有明确需求时',['I’m looking for a pair of sandals.','我想买一双凉鞋。'],['I’m looking for a gift for a friend.','我想给朋友买一份礼物。'],['Do you have one that hasn’t been on display?','有没拿出来展示过的同款吗？']]],'I’m just looking 是自然、礼貌的逛店回应。','看看 不买 推销 颜色 礼物 凉鞋 展示');
  T('shopping','try-on','试穿与换尺码','试衣间 · 大小码 · 鞋码 · 松紧',[
    [true,'Can I try this on?','我可以试穿吗？'],
    [false,'Of course. The fitting rooms are over there.','当然，试衣间在那边。'],
    [false,'How does it fit?','穿起来合身吗？'],
    [true,'It’s a little too tight. Could I try one size up?','有一点紧，可以试试大一码吗？']
  ],[['找到合适的尺码',['Could I try one size up?','我可以试试大一码吗？'],['Could I try one size down?','我可以试试小一码吗？'],['Do you have this in a medium?','这款有 M 码吗？'],['I usually wear an EU size 38. What size should I try?','我通常穿欧码 38，应该试哪个尺码？'],['It fits well.','很合身。'],['It’s too loose.','太松了。']]],'鞋码请说明 EU / UK / US，避免只说数字造成误会。','试穿 尺码 鞋码 大一码 小一码 太紧 太松');
  T('shopping','discount','问价格与折扣','折后价 · 两件优惠 · 活动规则',[
    [true,'How much is this?','这个多少钱？'],
    [false,'It’s eighty ringgit after the discount.','折后八十林吉特。'],
    [true,'Are there any discounts if I buy two?','如果买两件，有优惠吗？'],
    [false,'Let me check for you.','我帮您查一下。']
  ],[['把优惠问清楚',['Is this on sale?','这款有打折吗？'],['Is this the price after the discount?','这是折后的价格吗？'],['Could you explain how the promotion works?','可以解释一下这个优惠活动怎么算吗？'],['Do you have anything similar at a lower price?','有没有类似但价格低一点的款式？']]],'例句价格仅供练习，付款前确认最终金额。','折扣 打折 促销 便宜 价格');
  T('shopping','decision','决定购买或礼貌不买','买下 · 考虑一下 · 暂时保留',[
    [false,'Would you like to take this one?','您想买这一件吗？'],
    [true,'I like it, but I’d like to look around first.','我挺喜欢的，不过想先逛逛。'],
    [true,'Could you hold it for me for an hour?','可以帮我保留一个小时吗？'],
    [false,'Sure. Please come back before five.','可以，请在五点前回来。']
  ],[['做出决定',['I’ll take this one, please.','我要这个。'],['I’ll take both.','这两个我都要。'],['I’ll think about it, thank you.','我再考虑一下，谢谢。'],['It’s not quite what I’m looking for, but thank you.','这款不太符合我的需求，不过还是谢谢你。']]],'请店员保留商品时，先确认最晚回来时间；有些店不能保留。','不买 考虑 买下 保留');
  T('shopping','shop-payment','付款、会员与包装','袋子 · 注册 · 礼品包装 · 收据',[
    [true,'Can I pay by card?','可以刷卡吗？'],
    [false,'Yes. Are you a member?','可以。您是会员吗？'],
    [true,'No, I’m not. I’d prefer not to sign up, thank you.','不是，我暂时不想注册，谢谢。'],
    [false,'No problem. Do you need a bag?','没问题。需要袋子吗？']
  ],[['付款时的需求',['Where can I pay?','在哪里付款？'],['No, thank you.','不用了，谢谢。'],['Could you gift-wrap this, please? Is there an extra charge?','可以做礼品包装吗？需要额外付费吗？'],['Could I have a receipt, please?','可以给我一张收据吗？']]],'不想注册会员时，礼貌说明即可。','会员 注册 包装 购物袋 付款');
  T('shopping','returns','退换货与更换尺码','购买前确认 · 期限 · 收据',[
    [true,'Can I return or exchange this if it doesn’t fit?','如果不合身，可以退换吗？'],
    [false,'You can exchange it within seven days with the receipt.','凭收据可以在七天内换货。'],
    [true,'Can I get a refund, or is it exchange only?','可以退款，还是只能换货？'],
    [false,'It’s exchange only.','只能换货。']
  ],[['已经买了想换',['How many days do I have to return it?','购买后多少天内可以退货？'],['I bought this yesterday. Could I exchange it for a larger size?','我昨天买了这个，可以换大一码吗？'],['Here’s the receipt.','这是收据。']]],'对话中的七天为示例，实际退换政策由店家确认。','退货 换货 退款 换尺码');

  T('spa','spa-book','预约双人 SPA','日期 · 时间 · 每人时长 · 同时开始',[
    [true,'I’d like to book a massage for two people.','我想预约两个人的按摩。'],
    [false,'What date and time would you prefer?','您希望预约哪天、几点？'],
    [true,'September fifth at eight p.m., for 120 minutes each.','九月五日晚上八点，每人 120 分钟。'],
    [true,'Can we both start at the same time?','我们两个人可以同时开始吗？'],
    [false,'Let me check availability for both of you.','我查一下是否能同时安排你们两位。']
  ],[['时间没有空位',['Do you have any availability at eight thirty?','八点半还有空位吗？'],['What other times are available?','还有哪些时间可以预约？'],['How much is it per person?','每人多少钱？']]],'日期沿用你之前问题中的示例；实际预约请用下方生成器替换。','预约 spa 按摩 双人 120分钟 马杀鸡 九月五日');
  T('spa','spa-arrival','选择项目与到店确认','项目菜单 · 价格 · 预订姓名',[
    [true,'Could I have a look at your treatment menu and prices, please?','可以看看项目菜单和价格吗？'],
    [false,'Of course. What kind of treatment are you interested in?','当然，您想做哪种护理？'],
    [true,'I’d like a relaxing oil massage.','我想做舒缓的精油按摩。'],
    [false,'We offer sixty, ninety and 120-minute sessions.','我们有 60、90 和 120 分钟的项目。']
  ],[['预约前发消息',['Could you send me the treatment menu and prices, please?','可以把项目菜单和价格发给我吗？']],['到店后确认',['We have a booking for two under [name].','我们以［姓名］预约了两位。'],['Does the price include all taxes and service charges?','价格包含所有税费和服务费吗？'],['Could we have a private room for two?','可以安排双人独立房间吗？']]],'先确认具体项目、每人时长和含税总价。','项目 价格 精油 房间 到店');
  T('spa','spa-pressure','按摩中调整力度','轻一点 · 重一点 · 避开部位',[
    [false,'Is the pressure okay?','这个力度可以吗？'],
    [true,'A little gentler, please.','请轻一点。'],
    [false,'Is this better?','这样好些吗？'],
    [true,'Yes, that’s better. Thank you.','是的，这样好一些，谢谢。']
  ],[['随时表达感受',['A little firmer, please.','请重一点。'],['Please avoid this area.','请避开这个部位。'],['That hurts. Please stop.','那里很疼，请停下来。'],['Could I have another towel, please?','可以再给我一条毛巾吗？']]],'不舒服时直接说出来，不用等按摩结束。','按摩力度 痛 疼 轻一点 重一点');
  T('spa','spa-change','改期与取消预约','换时间 · 取消 · 费用',[
    [true,'I have a booking under [name]. Could I change the time?','我以［姓名］预约了，可以改时间吗？'],
    [false,'What time would you like to change it to?','您想改到几点？'],
    [true,'Would nine p.m. be possible?','晚上九点可以吗？'],
    [false,'Let me check for you.','我帮您查一下。']
  ],[['取消预约',['I’d like to cancel my booking, please.','我想取消预约。'],['Is there a cancellation fee?','有取消费用吗？'],['Could you send me a confirmation, please?','可以给我发一份确认信息吗？']]],'修改时间后，确认日期、人数和项目是否一并保留。','改期 取消 预约 更改');

  T('transport','directions','问路与看地图','方向 · 地标 · 步行距离',[
    [true,'Excuse me. How do I get to the city centre?','打扰一下，去市中心怎么走？'],
    [false,'Go straight and turn left at the traffic lights.','直走，在红绿灯处左转。'],
    [true,'Could you show me on the map?','可以在地图上指给我看吗？'],
    [false,'Of course. It’s about ten minutes on foot.','当然，步行大概十分钟。']
  ],[['确认距离和方向',['Is it within walking distance?','可以步行到达吗？'],['Am I going the right way?','我走的方向对吗？'],['Is it on the left or on the right?','是在左边还是右边？']]],'听不懂路线时，请对方在你的地图上指一下。','地图 方向 迷路 步行 问路');
  T('transport','taxi','打车与确认目的地','酒店地址 · 上车点 · 费用',[
    [true,'Could you take us to [hotel], please?','请送我们去［酒店］。'],
    [false,'Do you have the address?','你们有地址吗？'],
    [true,'Yes, here’s the address.','有的，这是地址。'],
    [false,'It should take about twenty minutes.','大约需要二十分钟。']
  ],[['上车前确认',['Are you our Grab driver?','您是我们叫的 Grab 司机吗？'],['Where is the pickup point?','上车点在哪里？'],['Does the fare include tolls?','车费包含过路费吗？'],['Please stop here.','请在这里停车。']]],'上车前核对车辆和司机信息，出示酒店英文地址。','打车 出租车 Grab 上车点 接车');
  T('transport','public-transport','乘车、买票与下车','公交 · 地铁 · 方向 · 换乘',[
    [true,'Does this train go to the city centre?','这班车去市中心吗？'],
    [false,'No. You need the train on the other platform.','不去，您需要乘对面站台的车。'],
    [true,'Where can I buy a ticket?','在哪里可以买票？'],
    [false,'At the ticket machine over there.','在那边的售票机。']
  ],[['确认路线',['Do I need to change trains?','我需要换乘吗？'],['Which stop should I get off at?','我应该在哪一站下车？'],['Two tickets to [destination], please.','请给我两张去［目的地］的票。']]],'先确认目的地和方向，再确认站台及换乘。','公交 巴士 地铁 买票 下车 换乘');

  T('help','medical','身体不舒服，需要就医','求助 · 症状 · 急救',[
    [true,'I need a doctor.','我需要看医生。'],
    [false,'What seems to be the problem?','您哪里不舒服？'],
    [true,'I have a stomach ache.','我肚子疼。'],
    [false,'How long have you had it?','持续多久了？'],
    [true,'Since this morning.','从今天早上开始。']
  ],[['紧急求助',['Please call an ambulance.','请叫救护车。'],['I’m having trouble breathing.','我呼吸困难。'],['I have a severe food allergy.','我有严重的食物过敏。']],['说明常见症状',['I have a fever.','我发烧了。'],['I feel dizzy.','我感到头晕。']]],'需要立即帮助时，直接使用大字展示或请附近的人联系当地急救服务。','医院 医生 生病 肚子疼 发烧 救护车 急救');
  T('help','lost-items','证件或物品丢失','护照 · 手机 · 警察 · 登记',[
    [true,'I’ve lost my passport.','我的护照丢了。'],
    [false,'When did you last see it?','您最后一次看到它是什么时候？'],
    [true,'I last saw it at the hotel this morning.','今天早上在酒店是我最后一次看到它。'],
    [false,'Let’s contact the hotel first.','我们先联系酒店。']
  ],[['请求协助',['Where is the nearest police station?','最近的警察局在哪里？'],['I’d like to report a lost item.','我想登记遗失物品。'],['Could you help me contact my embassy or consulate?','可以帮我联系使领馆吗？'],['I’ve lost my phone.','我的手机丢了。']]],'描述遗失的时间和地点，并提供能联系到你的方式。','护照丢了 手机丢了 报警 警察 使馆');

  const notes=[
    {en:'Country of residence',zh:'通常居住的国家／地区',body:'填写平时生活的国家／地区，不是本次旅行目的地，也不一定等于国籍。例如平时在中国生活、去马来西亚旅游，居住国通常填写 China。'},
    {en:'Nationality / Citizenship',zh:'国籍',body:'按本次旅行使用的护照及表格要求填写。它与 Country of residence 是不同信息。'},
    {en:'Date of arrival / Date of departure',zh:'抵达日期／离境日期',body:'按目的地当地日期核对航班，特别注意跨夜航班。'},
    {en:'Last port of embarkation',zh:'抵达前最后出发地',body:'核对进入目的地之前最后一段行程的出发地。转机时尤其要注意，按官方表格说明和选项填写。'},
    {en:'Accommodation / Address',zh:'住宿／地址',body:'从真实酒店订单核对英文酒店名、完整地址、州／城市和邮编。不要把机场地址当作住宿地址。'},
    {en:'Boarding time / Departure time',zh:'登机时间／起飞时间',body:'Boarding time 是登机时间；Departure time 是起飞时间。还需留意登机口关闭时间。'},
    {en:'Twin room / Double room',zh:'双床房／双人床房',body:'通常 twin room 是两张单人床，double room 是一张双人床。口头确认可用 two single beds / one double bed。'},
    {en:'Deposit / Pre-authorisation',zh:'押金／预授权',body:'押金可能是实际收款，预授权通常是暂时占用银行卡额度。询问何时退回或解除，并核对酒店实际规则。'}
  ];
  // Focus: educated learners rebuilding conversational fluency.
  ['Do you have any available?','I’d like this one, please.','No, thank you.','How much is this?','Could we have the bill, please?'].forEach(en=>{const p=lookup.get(en);if(p)p.essential=false;});
  [
    ['Sorry, I didn’t catch that.','不好意思，刚才没听清。','general'],
    ['We’re still deciding. Could we have another minute?','我们还在选，可以再给一点时间吗？','food'],
    ['Could we get the bill, please?','麻烦帮我们结一下账。','food'],
    ['That works for us.','这个安排我们可以。','general'],
    ['Is breakfast included in our booking?','我们的预订包含早餐吗？','hotel']
  ].forEach(a=>P(...a,true));
  const expressionNotes = {
    'Sorry, I didn’t catch that.':{label:'没听清时的自然接话',note:'catch 在这里是“听清、听懂”。适合对方刚说完，而你漏听了一部分；语气比直接说 What? 更柔和。',alt:'Sorry, what was that?',altZh:'不好意思，刚才说什么？'},
    'Could we get the bill, please?':{label:'把整块表达记下来',note:'get the bill 是常见口语搭配；原来的 have the bill 也自然。马来西亚常用 bill，美式英语也常说 check。',alt:'Could we have the bill, please?',altZh:'麻烦结一下账。'},
    'We’re still deciding. Could we have another minute?':{label:'被问到 Are you ready to order?',note:'still deciding 表示还没选好；another minute 不要求精确一分钟，只是礼貌地再要一点时间。',alt:'We need a little more time, thanks.',altZh:'我们还需要一点时间，谢谢。'},
    'That works for us.':{label:'对方提出时间或安排后',note:'works for us 表示“对我们来说合适”。可以接在时间、座位或预约建议之后。一个人时说 That works for me.',alt:'Sounds good, thank you.',altZh:'可以，谢谢。'},
    'I’m just looking, thank you.':{label:'逛店时的轻松回应',note:'也可以用 browsing，表示随便逛逛。句尾 thanks 就很自然，不需要解释为什么不买。',alt:'Just browsing, thanks.',altZh:'随便看看，谢谢。'},
    'I’ll have this one, please.':{label:'点餐时的高频搭配',note:'I’ll have… 是点餐常用句块；this one 可以配合指菜单。两人一起点时可用 We’ll have…',alt:'I’ll go for the chicken rice.',altZh:'我选鸡饭。'},
    'A table for two, please.':{label:'自然的省略句',note:'进餐厅时不用凑成完整句。也可以说 Hi, just the two of us.，表示只有你们两位。',alt:'Hi, do you have a table for two?',altZh:'你好，请问有两人位吗？'},
    'Can I try this on?':{label:'记住 try on 这个搭配',note:'试穿用 try on；如果用 it，位置是 try it on。试穿后常会听到 How does it fit?',alt:'Could I try this in a medium?',altZh:'可以试试这款的 M 码吗？'},
    'Could I try one size up?':{label:'不必先报具体尺码',note:'one size up / down 是大一码／小一码。可以先说明 It’s a bit tight.，再提出换码。',alt:'Do you have this in a larger size?',altZh:'这款有大一点的尺码吗？'},
    'Could we sit together, please?':{label:'同行出行常用',note:'we 表示你和同行人；Could we… 是提出请求的自然开头。也可直接询问相邻座位。',alt:'Are there two seats together?',altZh:'有两个连在一起的座位吗？'},
    'Could we leave our luggage here?':{label:'不必逐字翻译“寄存”',note:'leave our luggage here 就能自然表达把行李留在这里。可加 for a few hours 说明时长。',alt:'Could you hold our bags until this afternoon?',altZh:'可以帮我们保管行李到今天下午吗？'},
    'I’d like to book a massage for two people.':{label:'预约用 book，预订状态用 booking',note:'I’d like to book… 适合开始预约；到店可说 We have a booking under…，under 后接预订姓名。',alt:'Do you have any slots for two this evening?',altZh:'今晚还有可以安排两位的时段吗？'},
    'Can we both start at the same time?':{label:'把容易遗漏的需求说清楚',note:'both 明确指两个人都；“一起预约”并不一定表示“同时开始”，这一句能确认清楚。',alt:'Could you fit both of us in at eight?',altZh:'八点能同时安排我们两位吗？'},
    'Could you show me on the map?':{label:'听路线困难时换一种沟通方式',note:'show me on the map 是完整句块。商场导览图则可换成 on the directory。',alt:'Could you point it out on the map?',altZh:'可以在地图上指出来吗？'},
    'Could you make it mild, please?':{label:'mild 仍可能有一点辣',note:'如果完全不吃辣，明确说 without any chilli。less spicy 表示比原本少辣一些。',alt:'Could you make it less spicy?',altZh:'可以做得不那么辣吗？'},
    'Can I pay by card?':{label:'结账时直接问就自然',note:'by card 表示用银行卡付款，不需要逐字翻译成 swipe the card。想确认是否收卡可问 Do you take cards?',alt:'Do you take cards?',altZh:'你们收银行卡吗？'},
    'Is breakfast included in our booking?':{label:'确认是否含早',note:'included 指房价里已经包含，比问 Is breakfast free? 更准确；如果没有包含，可以接着问 How much is it per person?',alt:'Does our booking include breakfast?',altZh:'我们的预订含早餐吗？'},
    'I’m still working on it, thank you.':{label:'服务员来收盘时',note:'这句话在餐桌上表示“我还没吃完”。是情境中的固定用法，不是在说你正在工作。',alt:'I’m not quite finished yet, thanks.',altZh:'我还没吃完，谢谢。'}
  };
  const taskNotes = {
    'check-in':['I’ve already checked in online.','already + 现在完成时，自然说明你已经做过的步骤。bag drop 是托运行李柜台的常见标识。'],
    'baggage-seat':['Could we sit together?','先说核心需求即可。aisle seat 是过道座位，aisle 中的 s 不发音。'],
    'security':['Do I need to…?','确认自己是否需要做某事，比直接问 Should I…? 更贴合流程要求。'],
    'boarding':['Has boarding started yet?','yet 表示“到现在是否已经”。注意 boarding 与 departure 的区别。'],
    'flight-change':['Will I still be able to make it?','make it 在这里指“赶得上”，不需要逐字说 arrive on time for my next flight。'],
    'transfer':['Is my luggage checked through?','checked through 是行李直挂的常用搭配。询问时可补充最终目的地。'],
    'immigration':['I’m here on holiday.','简短、清楚即可。on holiday 偏英式，on vacation 偏美式，两种都能理解。'],
    'baggage-claim':['My suitcase hasn’t arrived.','现在完成时表达“到现在还没到”。carousel 是行李转盘，baggage claim 是提取区。'],
    'hotel-check-in':['I have a reservation under…','under + 姓名，表示用这个名字预订。入住开场不需要逐字翻译“办理手续”。'],
    'room-preference':['If possible…','提出偏好时加 if possible，表达“如果能安排的话”，语气自然且不强硬。'],
    'hotel-payment':['Are there any additional charges?','确认是否还有额外收费；hold released 指银行卡预授权解除。'],
    'hotel-info':['Is breakfast included?','included 常用于确认价格里是否包含某项服务，比问 Is breakfast free? 更准确。'],
    'early-check-in':['Could you hold our bags?','hold 在这里是帮忙保管。luggage 不可数；具体几件行李可说 bags。'],
    'room-problem':['The air conditioning isn’t working.','isn’t working 是设备无法正常使用的通用表达；不用先判断是否已经“坏了”。'],
    'check-out':['Could you explain this charge?','核对不明费用时先请对方解释，比直接指责收费错误更容易推进对话。'],
    'table':['Just the two of us.','店员问 How many? 时的自然回答。How long is the wait? 则用来询问等位时间。'],
    'menu':['What would you recommend?','比直接问 Which is delicious? 更自然。可接 We’d like something local. 说明偏好。'],
    'order':['I’ll have… / We’ll go for…','都是点餐常用开头。不需要每次都使用正式的 I would like to order…'],
    'preferences':['Could we get the sauce on the side?','on the side 表示单独放在旁边，适合酱汁、沙拉酱等。'],
    'allergy-food':['I’m allergic to…','食物过敏应直接、明确；不使用 I don’t like… 代替。'],
    'during-meal':['Could you check on it?','check on 是看看进展／情况。催菜可先说 We’re still waiting for…'],
    'takeaway':['For here or to go?','常听到的省略问句。takeaway 常见于英式英语，to go 也很常见。'],
    'bill':['Could we get the bill?','轻松自然的结账表达；have the bill 同样正确。英式常用 bill，美式也常说 check。'],
    'mall-directions':['Could you point it out?','point out 是指出位置；结合 on the directory 让对方直接指楼层图。'],
    'browse':['Just browsing, thanks.','店员询问需求时，这个省略句足够礼貌自然。'],
    'try-on':['It’s a bit tight.','a bit 比较口语，程度轻于 too tight；one size up / down 表示大／小一码。'],
    'discount':['Is that with the discount?','相当于“这是折后价吗？”上下文清楚时，可以使用更简短的表达。'],
    'decision':['I’ll think about it.','礼貌表示暂时不买。若决定买下，用 I’ll take it. 就很自然。'],
    'shop-payment':['I’m good without a bag, thanks.','表示不需要袋子；直接说 No bag, thanks. 也自然。注意上下文明确后再用 I’m good。'],
    'returns':['Is it exchange only?','确认是只能换货，还是也能退款。refund 与 exchange 不要混淆。'],
    'spa-book':['Could you fit both of us in?','fit someone in 指在预约安排中腾出时间接待某人。写消息时也可以用清晰的 book for two。'],
    'spa-arrival':['We have a booking under…','到店确认用 booking under + 姓名；预约项目通常叫 treatment。'],
    'spa-pressure':['A little gentler, please.','现场的短句就很自然，不需要完整说出 Could you massage me more gently?'],
    'spa-change':['Could we move it to nine?','双方已经明确在谈预约时，move it to + 时间 是很自然的改约表达。'],
    'directions':['Am I heading the right way?','heading 表示正朝某个方向走；适合途中向路人确认方向。'],
    'taxi':['Could you drop us off here?','drop someone off 表示让某人在某处下车，是打车时常用的搭配。'],
    'public-transport':['Which stop should I get off at?','get on / get off 适用于公交和火车；出租车通常用 get in / get out。'],
    'medical':['I’ve been feeling dizzy.','描述一段时间内持续不舒服。紧急时优先直接说 I need a doctor.'],
    'lost-items':['I last saw it…','帮助对方缩小查找范围，用最后看见物品的时间和地点接下去。']
  };
  tasks.forEach(t=>{t.languageNote=taskNotes[t.id]||null;});
  window.TT={scenes,phrases,tasks,notes,expressionNotes,essentialIds:phrases.filter(p=>p.essential).map(p=>p.id),version:'1.0.0'};
})();
