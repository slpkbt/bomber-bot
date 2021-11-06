// Будем использовать телеграф. *Импорт модулей*

const { Telegraf, Markup } = require('telegraf') // реквайрим сам телеграф
const fs = require('fs')
const bomber = require('bomber-api') // собственно то, благодаря чему и будут производится "бомбардировки"


// Настройки бота

const cfg = require(`./config/config.json`) // реквайрим конфиг
const request = require(`request`)
if (!cfg.token || !cfg.adminlist) return console.log(`Формат конфига был повреждён.`) // Проверка конфига
const data = new Date() // Будем использовать для проверки новизны сообщений
const bot = new Telegraf(cfg.token) // Создаём бота

// Инициализация бота

bot.launch().then(() => {
    bot.telegram.getMe().then(x => {
        console.log(`[i] Авторизовался под ${x.username}`)
    })
})

// Главная часть бота

bot.on('message', ctx => {

    if (data > ctx.message.date * 1000) { // Проверка новизны сообщений
        return;
    }

    if (ctx.message.text == undefined || ctx.message.text == null || ctx.message.text == "") { // Проверка на наличие текста в сообщении
        return;
    }

    ctx.message.args = ctx.message.text.toLowerCase().split(" ") // Получаем аргументы сообщения

    if (ctx.message.from.is_bot) { // Игнорируем ботов
        return;
    }

    if (ctx.message.chat.id != ctx.message.from.id) { // Бот не будет работать в группах, только в лс.
        return;
    }

    let uid = ctx.message.from.id // Задаём ид пользователя в переменную uid для удобства


    if (!cfg.adminlist.includes(uid)) { // Проверяем есть ли юзер в админ листе
        return ctx.reply(`У вас недостаточно прав для использования этого бота.`)
    }

    if (ctx.message.args[0] == `/help`) {
        return ctx.reply(`
📑Команды бота:
/бомбер (номер) (кол-во кругов) - запускает бомбер на номер
/стоп (номер) - остановить бомбер на номер
/атаки - возвращает активные атаки
🤗made with ❤ by <a href="https://github.com/slpkbt">slpkbt</a>`, { parse_mode: "HTML" })
    }else
    if (ctx.message.args[0] == `/бомбер`) {
        // Проверки

        if (!ctx.message.args[1]) return ctx.reply(`❌Пример команды: /бомбер (номер) (кол-во кругов)`)
        let num = ctx.message.args[1].replace(`+`, ``).replaceAll(` `, ``).replaceAll(`-`, ``) // Номер телефона, плюсик реплейсим для нормальной отправки реквеста
        if (num.length > 12) return ctx.reply(`❌Формат номера неверен!\nПример: +799999999999\nУказывайте номер без скобок и тире!`)
        if (!ctx.message.args[2]) return ctx.reply(`❌Пример команды: /бомбер (номер) (кол-во кругов)`)
        if (!Number(ctx.message.args[2])) return ctx.reply(`❌Пример команды: /бомбер (номер) (кол-во кругов)`)

        // Отправка запроса бомберу на начало атаки
        
        request(`http://localhost:3000/attack?number=${num}&loops=${Number(ctx.message.args[2])}`, function (e, r, b) {

            if (e) {
                return ctx.reply(`❌Ошибка при отправке запроса, подробности в консоли.`)
            }

            let p = JSON.parse(b)

            if(p.success){
                return ctx.reply(`✅Получен положительный ответ от сервера!\n📑${p.text}`)
            }else{
                return ctx.reply(`❌Получен отрицательный ответ от сервера!\n📑${p.text}`)
            }

        })
    }else
    if(ctx.message.args[0] == `/атаки`){
        request(`http://localhost:3000/list`,function(e,r,b){

            if (e) {
                return ctx.reply(`❌Ошибка при отправке запроса, подробности в консоли.`)
            }
            
            let p = JSON.parse(b)

            if(!p.success){
                return ctx.reply(`❌Список активных атак пуст`)
            }else{

                let text = ``

                p.result.forEach(e=>{
                    text+=`📲${e.number}/${e.loop}/${new Date(e.startedAt).getHours() + ":" + new Date(e.startedAt).getMinutes() + ":" + new Date(e.startedAt).getSeconds()}\n` // Преобразование каждого элемента массива в нужный нам формат
                })

                return ctx.reply(`✅Формат (номер:кол-во кругов:дата запуска)\n${text}`)

            }
        })
    }else
    if(ctx.message.args[0] == `/стоп`){
        if(!ctx.message.args[1]) return ctx.reply(`❌Пример команды: /стоп (номер)`)
        let num = ctx.message.args[1].replace(`+`, ``).replaceAll(` `, ``).replaceAll(`-`, ``)
        if(!Number(num)) return ctx.reply(`❌Пример команды: /стоп (номер)`)
        request(`http://localhost:3000/stop?number=${num}`,function(e,r,b){

            if (e) {
                return ctx.reply(`❌Ошибка при отправке запроса, подробности в консоли.`)
            }
            
            let p = JSON.parse(b)

            if(!p.success){
                return ctx.reply(`❌${p.text}`)
            }else{

                return ctx.reply(`✅${p.text}`)

            }
        })
    }else{
        return ctx.reply(`❌Команда не найдена, список команд на /help`)
    }
})

