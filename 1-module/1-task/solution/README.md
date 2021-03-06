# Порядок вывода сообщений в консоль
 
Понимание того, как именно выполняется тот или иной код на Javascript - чрезвычайно важное качество, 
отличающее действительно хороших разработчиков.

Выполнение любой программы на Javascript "раскладывается" на итерации событийного цикла. В данной 
задаче у всех таймеров и интервалов установлена одинаковая ненулевая задержка в 10 мс, это сделано 
для того, чтобы нам проще было "выполнять" код, подразумевая, что коллбеки всех операций будут 
выполняться в том порядке, в котором и были созданы. В реальной жизни операции имеют разное время 
выполнения, разную сложность и иногда даже разный приоритет, но принципиально это ничего не меняет.

Ключ к пониманию происходящего поможет концепция очередей задач и микрозадач. В очередь задач 
помещаются операции, коллбеки от которых будут выполнены на следующих итерациях событийного цикла 
(`setTimeout`, `fs.readFile` и т.д.), а в очередь микрозадач - асинхронные операции, выполнение 
коллбеков которых произойдет в конце текущей итерации, после синхронного кода. Это, например: 
`Promise`, `process.nextTick`.

Таким образом, любой код можно мысленно разложить на итерации событийного цикла.

Давайте приступим к разбору исходного кода.

Для выполнения кода представим две очереди - два массива для задач (`tasks = []`) и микрозадач 
(`microtasks = []`).

Начинается первая итерация событийного цикла, ее иницировал процесс Node.JS.
На строке 1 мы видим операцию `setInterval`, в результате которой через каждые 10мс в консоль будет 
выводиться имя `"James"`. Мы знаем, что коллбек этой операции не будет выполнен сразу же, а будет 
добавлен в очередь задач.
```js
tasks = [setInterval];
microtasks = [];
 ``` 

Далее на строке 5 операция `setTimeout`, коллбек которой также попадет в очередь задач после 
`setInterval`. Сам код внутри коллбека `setTimeout` мы рассмотрим когда он будет вызван.
```js
tasks = [setInterval, setTimeout];
microtasks = [];
```
К текущему же моменту мы выполнили весь синхронный код, который был, очередь `microtasks` пуста, 
поэтому происходит завершение текущей итерации событийного цикла.

Первая задача в очереди задач начинает собой следующую итерацию событийного цикла. В данном случае 
будет выполнена функция, переданная в `setInterval`. Мы видим, что в результате в консоль попадет 
строка `"James"`, после этого итерация будет завершена. Коллбек операции `setInterval` попадет вновь
в конец очереди `tasks`.

```js
tasks = [setTimeout, setInterval];
microtasks = [];

// -- console
// James
```

Каждая новая итерация начинается с очередной задачи в очереди задач, на данный момент мы видим там 
коллбек функции `setTimeout`.

Первым делом в этой функции создается объект `Promise`. В процессе создания функция, которая 
передается в конструктор - выполняется синхронно, т.е. в консоль попадет строка `"Richard"`, а 
коллбек метода `.then` попадет в очередь `microtasks`. Код, который следует за объявлением коллбека 
`.then` и выводит в консоль `"John"` - синхронный. 

```js
tasks = [setInterval];
microtasks = [Promise.then];

// -- console
// James
// Richard
// John
```

Теперь, прежде чем проверить очередь `tasks` процесс проверит, пуста ли очередь `microtasks`. 
**Переход к следующей итерации событийного цикла не произойдет пока выполняется синхронный код или 
пока в очереди `microtasks` что-то есть!**

Мы видим, что в процессе выполнения коллбека функции `Promise.then` в консоль будет выведено имя 
`Robert`, а также в очередь задач попадет новый таймер.

```js
tasks = [setInterval, setTimeout];
microtasks = [];

// -- console
// James
// Richard
// John
// Robert
```

По аналогии с предыдущими шагами мы знаем, что в данный момент произойдет завершение текущей 
итерации, и функции из очереди `tasks` будут вызваны на следующих итерациях. Таким образом в консоли
мы увидим следующий вывод:

```js
// -- console
// James
// Richard
// John
// Robert
// James
// Michael
```
