'use strict';
/* Слова первого месяца и подборка видео. Формат слова: английский|перевод|пример */
const RAW_WORDS = `
#Люди
I|я|I am here.
you|ты, вы|You are my friend.
he|он|He is a student.
she|она|She is at home.
it|оно, это|It is a book.
we|мы|We are friends.
they|они|They are happy.
man|мужчина|The man is old.
woman|женщина|The woman is a teacher.
boy|мальчик|The boy is small.
girl|девочка, девушка|The girl is happy.
friend|друг|He is my friend.
#Главные глаголы
be|быть|I want to be a teacher.
have|иметь|I have a friend.
do|делать|I do my homework.
go|идти, ехать|I go to school.
want|хотеть|I want water.
like|нравиться, любить|I like tea.
know|знать|I know this word.
see|видеть|I see a house.
say|сказать|Say your name.
get|получать|I get a book.
make|делать, создавать|I make coffee.
come|приходить|Come here.
#Вежливые слова
hello|привет, здравствуйте|Hello, my name is Tom.
goodbye|до свидания|Goodbye, see you tomorrow.
please|пожалуйста (в просьбе)|Help me, please.
thank you|спасибо|Thank you for the book.
sorry|извините|Sorry, I am late.
yes|да|Yes, I am.
no|нет|No, thank you.
good|хороший|It is a good book.
bad|плохой|It is a bad idea.
name|имя|My name is Anna.
okay|хорошо, ладно|Okay, I understand.
welcome|добро пожаловать|Welcome to my house.
#Семья
family|семья|I love my family.
mother|мать, мама|My mother is a teacher.
father|отец, папа|My father works here.
brother|брат|I have a brother.
sister|сестра|My sister is young.
son|сын|He is my son.
daughter|дочь|She is my daughter.
child|ребёнок|The child is happy.
parent|родитель|My parents are at home.
husband|муж|Her husband is a doctor.
wife|жена|His wife is a teacher.
baby|младенец, малыш|The baby is sleeping.
#Числа
one|один|I have one brother.
two|два|I have two sisters.
three|три|Three books are on the table.
four|четыре|There are four rooms.
five|пять|I work five days a week.
six|шесть|It is six o'clock.
seven|семь|I get up at seven.
eight|восемь|The lesson starts at eight.
nine|девять|I have nine questions.
ten|десять|Ten students are here.
eleven|одиннадцать|It is eleven o'clock.
twelve|двенадцать|There are twelve months in a year.
#Вопросы и указатели
this|этот, это|This is my book.
that|тот, то|That is my house.
here|здесь|I am here.
there|там|The shop is there.
what|что, какой|What is your name?
who|кто|Who is that man?
where|где, куда|Where do you live?
when|когда|When is the lesson?
why|почему|Why are you sad?
how|как|How are you?
which|который, какой из|Which book do you want?
because|потому что|I am happy because you are here.
#Дом
house|дом (здание)|The house is big.
home|дом (где живёшь)|I am at home.
room|комната|My room is small.
door|дверь|Open the door.
window|окно|Close the window.
table|стол|The book is on the table.
chair|стул|Sit on the chair.
bed|кровать|The bed is new.
kitchen|кухня|Mother is in the kitchen.
bathroom|ванная|Where is the bathroom?
floor|пол; этаж|The bag is on the floor.
wall|стена|The picture is on the wall.
#Еда и напитки
food|еда|I like this food.
water|вода|I drink water.
bread|хлеб|I eat bread.
milk|молоко|The baby drinks milk.
tea|чай|I want tea, please.
coffee|кофе|I drink coffee in the morning.
apple|яблоко|It is a red apple.
meat|мясо|He doesn't eat meat.
egg|яйцо|I have an egg.
rice|рис|We eat rice.
cheese|сыр|I like cheese.
sugar|сахар|Tea with sugar, please.
#Какой? Часть 1
big|большой|It is a big city.
small|маленький|My room is small.
new|новый|I have a new phone.
old|старый|It is an old house.
young|молодой|She is young.
hot|горячий, жаркий|The tea is hot.
cold|холодный|It is cold today.
happy|счастливый|I am happy.
sad|грустный|Why are you sad?
easy|лёгкий, простой|English is easy.
difficult|трудный|This question is difficult.
beautiful|красивый|It is a beautiful day.
#Время
time|время|I don't have time.
day|день|Have a good day.
night|ночь|Good night.
morning|утро|Good morning.
evening|вечер|I study in the evening.
week|неделя|I work five days a week.
month|месяц|This month is cold.
year|год|I am twenty years old.
today|сегодня|Today is Monday.
tomorrow|завтра|See you tomorrow.
yesterday|вчера|Yesterday was Sunday.
now|сейчас|I am busy now.
#Каждый день
eat|есть, кушать|I eat breakfast at eight.
drink|пить|I drink tea.
sleep|спать|I sleep at night.
work|работать|I work every day.
study|учиться, изучать|I study English.
read|читать|I read books.
write|писать|Write your name.
speak|говорить|I speak English.
listen|слушать|Listen to me.
watch|смотреть|I watch films.
play|играть|We play games.
live|жить|I live in a big city.
#Учёба
school|школа|The school is near my house.
university|университет|I study at university.
student|студент, ученик|I am a student.
teacher|учитель|My teacher is good.
book|книга|This book is interesting.
lesson|урок|The lesson starts at nine.
question|вопрос|I have a question.
answer|ответ|I know the answer.
word|слово|What is this word?
language|язык|English is a language.
exam|экзамен|I have an exam tomorrow.
class|класс, занятие|I have a class today.
#Город
city|город|I live in a big city.
street|улица|This street is long.
shop|магазин|The shop is open.
bank|банк|She works in a bank.
hospital|больница|He is in hospital.
park|парк|We walk in the park.
restaurant|ресторан|This restaurant is good.
station|станция, вокзал|Where is the station?
airport|аэропорт|I am at the airport.
hotel|отель|The hotel is new.
office|офис|He is at the office.
country|страна|It is a big country.
#Маленькие слова
in|в|I am in the room.
on|на|The book is on the table.
at|у, в (точка)|I am at home.
to|к, в (направление)|I go to school.
from|из, от|She is from London.
with|с|I live with my family.
without|без|Tea without sugar.
for|для|This book is for you.
about|о, про|A book about animals.
and|и|Tea and coffee.
but|но|I am tired but happy.
or|или|Tea or coffee?
#Действия. Часть 2
give|давать|Give me the book.
take|брать|Take this bag.
buy|покупать|I buy food.
sell|продавать|They sell books.
open|открывать|Open the window.
close|закрывать|Close the door.
start|начинать|We start at nine.
finish|заканчивать|I finish work at six.
help|помогать|Can you help me?
need|нуждаться|I need water.
think|думать|I think it is good.
understand|понимать|I don't understand.
#Одежда и цвета
clothes|одежда|I buy new clothes.
shirt|рубашка|The shirt is white.
shoes|обувь, туфли|My shoes are old.
jacket|куртка|Take your jacket.
hat|шапка, шляпа|I have a black hat.
bag|сумка|My bag is big.
red|красный|A red apple.
blue|синий|The sky is blue.
green|зелёный|Green tea.
black|чёрный|Black coffee.
white|белый|A white wall.
yellow|жёлтый|The sun is yellow.
#Тело
body|тело|Sport is good for your body.
head|голова|I have a hat on my head.
face|лицо|She has a beautiful face.
eye|глаз|Her eyes are green.
ear|ухо|I have two ears.
nose|нос|My nose is cold.
mouth|рот|Open your mouth.
hand|рука (кисть)|Give me your hand.
arm|рука (от плеча)|My arm is long.
leg|нога|He has long legs.
foot|ступня|My foot is small.
heart|сердце|She has a good heart.
#Как часто
always|всегда|I always drink tea.
usually|обычно|I usually get up at seven.
often|часто|We often play games.
sometimes|иногда|I sometimes watch films.
never|никогда|He never eats meat.
very|очень|It is very cold.
also|также, тоже|I also like coffee.
only|только|I have only one question.
again|снова, ещё раз|Say it again, please.
together|вместе|We study together.
early|рано|I get up early.
late|поздно|Sorry, I am late.
#Транспорт и поездки
car|машина|He has a new car.
bus|автобус|I go to school by bus.
train|поезд|The train is fast.
plane|самолёт|The plane is big.
bike|велосипед|I have a bike.
ticket|билет|I need a ticket.
road|дорога|The road is long.
trip|поездка|Have a good trip.
drive|водить машину|She can drive.
walk|идти пешком, гулять|I walk to school.
travel|путешествовать|I want to travel.
arrive|прибывать|The train arrives at six.
#Работа
job|работа (место)|I need a job.
money|деньги|I don't have money.
boss|начальник|My boss is busy.
company|компания|It is a big company.
meeting|встреча, совещание|I have a meeting at ten.
computer|компьютер|I work on a computer.
phone|телефон|Where is my phone?
email|электронное письмо|I write an email.
problem|проблема|We have a problem.
idea|идея|It is a good idea.
plan|план|I have a plan.
business|бизнес, дело|He has a small business.
#Какой? Часть 2
fast|быстрый|The car is fast.
slow|медленный|The bus is slow.
long|длинный, долгий|It is a long road.
short|короткий|The lesson is short.
cheap|дешёвый|The ticket is cheap.
expensive|дорогой|This hotel is expensive.
important|важный|It is an important exam.
interesting|интересный|The film is interesting.
boring|скучный|This book is boring.
free|свободный; бесплатный|Are you free today?
busy|занятой|I am busy now.
ready|готовый|I am ready.
#Погода и природа
weather|погода|The weather is good.
sun|солнце|The sun is hot.
rain|дождь|I don't like rain.
snow|снег|The snow is white.
wind|ветер|The wind is cold.
sky|небо|The sky is blue.
sea|море|I love the sea.
river|река|The river is long.
mountain|гора|It is a big mountain.
tree|дерево|The tree is old.
flower|цветок|A beautiful flower.
animal|животное|I like animals.
#Чувства и общение
love|любить|I love my family.
hate|ненавидеть|I hate cold weather.
feel|чувствовать|I feel good.
hope|надеяться|I hope you are okay.
remember|помнить|I remember this word.
forget|забывать|I often forget names.
wait|ждать|Wait for me.
meet|встречать, знакомиться|Nice to meet you.
call|звонить, звать|Call me tomorrow.
ask|спрашивать, просить|Can I ask a question?
tell|рассказывать кому-то|Tell me about your family.
show|показывать|Show me the picture.
#Сколько
many|много (можно посчитать)|I have many friends.
much|много (нельзя посчитать)|I don't have much time.
a lot|много|I read a lot.
few|мало (можно посчитать)|I have few books.
little|мало; маленький|I have little time.
some|несколько, немного|I want some water.
any|какой-нибудь, сколько-нибудь|Do you have any questions?
all|все, всё|All students are here.
every|каждый|I study every day.
more|больше|I want more tea.
less|меньше|I have less time today.
enough|достаточно|I have enough money.
#Числа и даты
hundred|сто|One hundred words.
thousand|тысяча|A thousand words.
first|первый|It is my first lesson.
second|второй; секунда|This is my second year.
last|последний, прошлый|The last question.
next|следующий|See you next week.
hour|час|I study for one hour.
minute|минута|Wait a minute.
half|половина|Half an hour.
number|номер, число|What is your phone number?
date|дата|What is the date today?
birthday|день рождения|Today is my birthday.
#Еда. Часть 2
breakfast|завтрак|I have breakfast at eight.
lunch|обед|We have lunch together.
dinner|ужин|Dinner is ready.
fruit|фрукты|I eat fruit every day.
vegetable|овощ|I like vegetables.
chicken|курица|Chicken with rice.
fish|рыба|She doesn't like fish.
soup|суп|The soup is hot.
salt|соль|I need salt.
juice|сок|Apple juice, please.
hungry|голодный|I am hungry.
thirsty|хочет пить|I am thirsty.
#Состояния
tired|уставший|I am tired today.
angry|злой|Why are you angry?
afraid|боится, испуган|I am afraid of exams.
sick|больной|He is sick today.
fine|в порядке, хорошо|I am fine, thank you.
sure|уверенный|Are you sure?
right|правильный; правый|You are right.
wrong|неправильный|This answer is wrong.
glad|рад|I am glad to see you.
lucky|везучий|You are lucky.
alone|один, в одиночестве|I live alone.
funny|смешной|This film is funny.
#Действия. Часть 3
sit|сидеть|Sit here, please.
stand|стоять|Stand up.
run|бегать|I run every morning.
stop|останавливать, останавливаться|Stop the car.
turn|поворачивать|Turn right.
put|класть|Put the book on the table.
bring|приносить|Bring me water, please.
send|отправлять|Send me an email.
pay|платить|I pay for the ticket.
wash|мыть|Wash your hands.
cook|готовить еду|I cook dinner.
clean|убирать; чистый|I clean my room.
#Отдых
music|музыка|I listen to music.
movie|фильм|This movie is interesting.
game|игра|It is a good game.
song|песня|I like this song.
picture|картина, фото|A beautiful picture.
video|видео|I watch a video.
news|новости|I read the news.
story|история, рассказ|Tell me a story.
team|команда|We are a good team.
sport|спорт|I like sport.
hobby|хобби|My hobby is music.
fun|веселье, весело|English is fun.
#Слова-помощники
can|мочь, уметь|I can speak English.
must|должен, обязан|I must study.
should|следует|You should sleep more.
will|буду, будет (будущее)|I will call you tomorrow.
maybe|может быть|Maybe tomorrow.
really|действительно, очень|It is really good.
of course|конечно|Of course, I can help.
still|всё ещё|I am still at work.
already|уже|I already know this word.
just|только что; просто|I just want tea.
then|потом, тогда|We eat and then we study.
so|поэтому; так|I am tired, so I sleep.
`;

const STAGES = [
 {note:'Обычные фильмы и аниме на слух ты пока почти не поймёшь, и это нормально. Смотри то, что сделано для начинающих, а любимое аниме оставь на одну серию в неделю для удовольствия.',
  items:[['Extra English','YouTube','учебный ситком: простые фразы, чёткая речь, английские субтитры','Extra English episode 1'],
         ['Peppa Pig','YouTube','детский мультсериал и лучший тренажёр бытовых фраз','Peppa Pig English full episodes'],
         ['Easy English','YouTube','уличные интервью с субтитрами','Easy English street interviews'],
         ['Аниме, которое знаешь наизусть','Аниме','в английском дубляже с английскими субтитрами. Сюжет ты помнишь, поэтому поймёшь больше'],
         ['Minecraft, Stardew Valley','Игры','переведи игры и телефон на английский интерфейс']]},
 {note:'Простые сюжеты с чёткой речью. Цель этапа — понимать половину без пауз.',
  items:[['My Neighbor Totoro, Kiki\'s Delivery Service','Аниме','фильмы студии Ghibli в английском дубляже: мало слов, простые диалоги'],
         ['Avatar: The Last Airbender','Сериал','чёткая речь и простая лексика'],
         ['Friends','Сериал','бытовые диалоги, смотри с английскими субтитрами'],
         ['Rachel\'s English','YouTube','американское произношение','Rachel\'s English pronunciation'],
         ['6 Minute English','Подкаст','короткие выпуски BBC с текстом','BBC 6 Minute English'],
         ['Pokémon, The Sims','Игры','много повторяющихся простых фраз']]},
 {note:'Переходишь на настоящий контент для носителей. Английские субтитры пока оставляй.',
  items:[['Death Note, Fullmetal Alchemist: Brotherhood, Spy x Family','Аниме','в английском дубляже'],
         ['Brooklyn Nine-Nine, The Good Place, Modern Family','Сериалы','живая разговорная речь'],
         ['Kurzgesagt, TED-Ed, Vox','YouTube','короткие научные и объясняющие видео','Kurzgesagt In a Nutshell'],
         ['Luke\'s English Podcast, All Ears English','Подкасты','длинная естественная речь о языке и жизни'],
         ['Life is Strange, Firewatch, Detroit: Become Human','Игры','сюжетные игры с субтитрами']]},
 {note:'Академический английский и скорость экзамена. Так будут звучать пары в магистратуре.',
  items:[['TED Talks, CrashCourse, Veritasium','YouTube','академическая лексика','TED Talks'],
         ['MIT OpenCourseWare','YouTube','лекции по твоей специальности','MIT OpenCourseWare lecture'],
         ['NPR Up First, The Daily','Подкасты','новости на естественной скорости'],
         ['The Social Network, Interstellar','Фильмы','пробуй без субтитров'],
         ['Новые тайтлы сразу в дубляже','Аниме','без субтитров, с первого просмотра'],
         ['Disco Elysium, Baldur\'s Gate 3','Игры','много текста и сложных диалогов']]}
];

const LESSONS = [];
