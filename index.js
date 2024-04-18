const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const { makeCerificate } = require('./pdfCert');
const { getUserStats } = require('./codeforces');
var { WebSocketServer } = require("ws")


const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key'; // Секретный ключ для подписи JWT

// Создание подключения к базе данных SQLite
const db = new sqlite3.Database('db.db');

const upload = multer({ dest: 'uploads/' });


app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/certificate', express.static(path.join(__dirname, 'certificates')));

var ws = new WebSocketServer({ port: 9000 })

ws.on("connection", (client) => {
    console.log("New connection ")
    db.all(`SELECT * FROM "message"`, (err, rows) => {
        rows.forEach(row => {
            var data = JSON.stringify({
                user: row.username,
                msg: row.msg,
                date: row.data
            })
            client.send(data)
        })
    })
    client.on("message", (data) => {
        data = JSON.parse(Buffer.from(data).toString())
        ws.clients.forEach(sock => {
            sock.send(JSON.stringify(data))
        })
        db.run(`INSERT INTO "message" (username, msg, data) VALUES ("${data.user}",'${data.msg}','${data.date}')`, (err) => {
            console.log(err)
        })
    })
})

/*=================================АВТОРИЗАЦИЯ====================================*/
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Проверяем существует ли пользователь с таким именем
    db.get(`
        SELECT * FROM Users WHERE username = ?
    `, [username], (err, existingUser) => {
        if (err) {
            console.error(err);
            res.status(500).send('Ошибка при проверке существующего пользователя');
        } else {
            if (existingUser) {
                // Пользователь уже существует, поэтому отправляем ошибку
                res.status(400).send('Пользователь с таким именем уже существует');
            } else {
                // Пользователь с таким именем не найден, выполняем регистрацию
                db.run(`
                    INSERT INTO Users (username, password, role, raiting)
                    VALUES (?, ?, ?, ?)
                `, [username, password, 0, 0], function (err) {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Ошибка при регистрации пользователя');
                    } else {
                        const token = jwt.sign({ username, role: 'user' }, SECRET_KEY);
                        db.run(`
                            UPDATE Users SET jwt = ? WHERE username = ?
                        `, [token, username], () => {
                            res.status(200).send({ token, role: '0', username: username });
                        });
                    }
                });
            }
        }
    });
});

// Вход пользователя
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`
        SELECT * FROM Users WHERE username = ? AND password = ?
    `, [username, password], (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).send('Ошибка при входе пользователя');
        } else if (!row) {
            res.status(401).send('Неверные учетные данные');
        } else {
            const token = jwt.sign({ username, role: row.role }, SECRET_KEY);
            db.run(`
                UPDATE Users SET jwt = ? WHERE username = ?
            `, [token, username], () => {
                res.status(200).send({ token, role: row.role, username: username });
            });
        }
    });
});

// Проверка аутентификации
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).send('Требуется аутентификация');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).send('Неверный токен аутентификации');
        req.user = user;
        next();
    });
}

app.get('/user-info', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send('Требуется токен аутентификации');
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error(err);
            return res.status(403).send('Неверный токен аутентификации');
        }

        const { username } = decoded;

        db.get(`
            SELECT * FROM Users WHERE username = ?
        `, [username], (err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Ошибка при получении информации о пользователе');
            }

            if (!user) {
                return res.status(404).send('Пользователь не найден');
            }

            // Пользователь найден, возвращаем информацию о нем
            res.status(200).send({ username: user.username, role: user.role, raiting: user.raiting, user_id: user.user_id });
        });
    });
});

// Защищенный ресурс, доступный только аутентифицированным пользователям
app.get('/protected', authenticateToken, (req, res) => {
    res.send('Защищенный ресурс');
});

/*=================================ОЛИМПИАДЫ====================================*/
app.get('/events', (req, res) => {
    db.all(`
        SELECT * FROM Olympiads
    `, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении данных из таблицы Events');
        }

        // Если данных нет, отправляем пустой массив
        if (!rows || rows.length === 0) {
            return res.status(404).send('Данные в таблице Events не найдены');
        }

        // Отправляем данные из таблицы Events
        res.status(200).json(rows);
    });
});

app.get('/eventsNow', (req, res) => {
    db.all(`
        SELECT * FROM Olympiads WHERE reg_status="Идёт"
    `, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении данных из таблицы Events');
        }

        // Если данных нет, отправляем пустой массив
        if (!rows || rows.length === 0) {
            return res.status(404).send('Данные в таблице Events не найдены');
        }

        // Отправляем данные из таблицы Events
        res.status(200).json(rows);
    });
});

// Маршрут для добавления олимпиады
app.post('/add-olympiad', authenticateToken, (req, res) => {
    const { name, descr, startDate, endDate, regStartDate, regEndDate, flag, cf, link } = req.body;

    // Проверяем, что все данные были переданы
    if (!name || !descr || !startDate || !endDate || !regStartDate || !regEndDate) {
        return res.status(400).send('Все поля должны быть заполнены');
    }

    if (!link) {
        link = "null"
    }

    // Выполняем запрос к базе данных для добавления новой олимпиады
    db.run(`
        INSERT INTO Olympiads (name, descr, start_date, end_date, reg_start, reg_end, reg_status, flag, coef, link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, descr, startDate, endDate, regStartDate, regEndDate, 'Ожидается', flag, parseFloat(cf), link], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при добавлении олимпиады в базу данных');
        }

        // Отправляем успешный ответ
        res.status(200).send('Олимпиада успешно добавлена');
    });
});

// Маршрут для удаления олимпиады
app.delete('/events/:id', authenticateToken, (req, res) => {
    const eventId = req.params.id;

    // Выполняем запрос к базе данных для удаления олимпиады
    db.run(`
        DELETE FROM Olympiads WHERE id = ?
    `, [eventId], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при удалении олимпиады из базы данных');
        }

        // Проверяем, была ли удалена хотя бы одна запись
        if (this.changes === 0) {
            return res.status(404).send('Олимпиада не найдена');
        }

        // Отправляем успешный ответ
        res.status(200).send('Олимпиада успешно удалена');
    });
});


/*=================================РЕДАКТОР ОЛИМПИАД====================================*/
app.get('/getOlimpForEdit', authenticateToken, (req, res) => {
    db.all(`
        SELECT * FROM Olympiads WHERE flag="Своя"
    `, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении данных из таблицы Events');
        }

        // Если данных нет, отправляем пустой массив
        if (!rows || rows.length === 0) {
            return res.status(404).send('Данные в таблице Events не найдены');
        }

        // Отправляем данные из таблицы Events
        res.status(200).json(rows);
    });
});

// Маршрут для получения данных об олимпиаде по ID
app.get('/olympiads/:id', (req, res) => {
    const olympiadId = req.params.id;

    // Выполняем запрос к базе данных для получения данных об олимпиаде по ID
    db.get(`
        SELECT * FROM Olympiads WHERE id = ?
    `, [olympiadId], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении данных об олимпиаде');
        }

        // Проверяем, найдена ли олимпиада
        if (!row) {
            return res.status(404).send('Олимпиада не найдена');
        }

        // Отправляем данные об олимпиаде
        res.status(200).json(row);
    });
});

app.get('/olympiads/:id/tasks', authenticateToken, (req, res) => {
    const olympiadId = req.params.id; // Изменение здесь
    console.log(req.params.id); // Убедитесь, что правильно получили параметр
    const sql = `SELECT * FROM Tasks WHERE olimp_id = ?`;
    db.all(sql, [olympiadId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при выполнении запроса к базе данных' });
        }

        // Возвращаем список заданий в формате JSON
        console.log(rows);
        res.json(rows);
    });
});


app.post('/tasks', (req, res) => {
    const { olimp_id, name, descr, answer, points } = req.body;

    // Проверка наличия всех необходимых данных
    if (!olimp_id || !name || !descr || !answer || !points) {
        return res.status(400).json({ error: 'Не все поля были предоставлены' });
    }

    // Вставка задания в базу данных
    const sql = `INSERT INTO Tasks (olimp_id, name, descr, answer, points) VALUES (?, ?, ?, ?, ?)`;
    const values = [olimp_id, name, descr, answer, points];

    db.run(sql, values, function (err) {
        if (err) {
            return res.status(500).json({ error: 'Произошла ошибка при добавлении задания в базу данных' });
        }

        // Отправка ответа о успешном добавлении задания
        res.status(201).json({ message: 'Задание успешно добавлено' });
    });
});

// Маршрут для удаления задания по task_id
app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    // Выполняем запрос к базе данных для удаления задания по task_id
    db.run(`
        DELETE FROM Tasks WHERE task_id = ?
    `, [taskId], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при удалении задания из базы данных');
        }

        // Проверяем, было ли удалено хотя бы одно задание
        if (this.changes === 0) {
            return res.status(404).send('Задание не найдено');
        }

        // Отправляем успешный ответ
        res.status(200).send('Задание успешно удалено');
    });
});

/*=================================РЕЙТИНГ ПОЛЬЗОВАТЕЛЕЙ====================================*/
// Маршрут для получения данных пользователей
app.get('/usersByRaiting', (req, res) => {
    db.all(`
        SELECT * FROM Users ORDER BY raiting DESC
    `, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении данных пользователей');
        }
        // Отправляем данные пользователей
        res.status(200).json(rows);
    });
});


/*=================================ПРОВЕРКА ФАЙЛА ПОЛЬЗОВАТЕЛЯ====================================*/
app.post('/upload', upload.single('file'), (req, res) => {
    const language = 'python3'; // Язык программирования
    const filePath = req.file.path; // Путь к загруженному файлу

    // Выполнение кода пользователя
    exec(`python ${filePath}`, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).send(err);
        }
        // Проверка stdout с ожидаемым выводом
        // ...
        res.send(stdout);
    });
});

// Установка ограничений по времени и памяти
app.post('/run', (req, res) => {
    const code = req.body.code; // Код пользователя
    const language = 'python3'; // Язык программирования

    // Ограничения по времени и памяти
    const options = {
        timeout: 1000, // 1 секунда
        maxBuffer: 64 * 1024 * 1024, // 64 Мб
    };

    // Запуск процесса с ограничениями
    const childProcess = spawn('python', ['-c', code], options);

    let stdout = '';
    let stderr = '';

    // Обработка вывода и ошибок
    childProcess.stdout.on('data', (data) => {
        stdout += data;
    });

    childProcess.stderr.on('data', (data) => {
        stderr += data;
    });

    childProcess.on('close', (code) => {
        // Отправка результатов обратно клиенту
        res.send({ stdout, stderr, exitCode: code });
    });
});

app.post("/api/makeCertificate", async (req, res) => {
    try {
        const data = req.body;
        console.log(data);
        const url = await makeCerificate(data.name, data.surname, data.otchestvo, data.result, data.olimp);
        res.json({ url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


/*=================================ЗАПИСЬ РЕЗУЛЬТАТОВ ОБ ОЛИМПИАДЕ====================================*/

app.post('/addNewOpimpToUser', (req, res) => {
    const { username, olimp_id, result } = req.body;

    // Проверка наличия всех необходимых данных
    if (!username || !olimp_id || !result) {
        return res.status(400).json({ error: 'Не все поля были предоставлены' });
    }

    // Поиск user_id по email в базе данных
    const sqlSelectUser = `SELECT user_id FROM Users WHERE username = ?`;
    db.get(sqlSelectUser, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Произошла ошибка при поиске пользователя по email' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Пользователь с указанным email не найден' });
        }

        const user_id = row.user_id;

        // Вставка результата в базу данных
        const sqlInsertResult = `INSERT INTO User_Results (user_id, olymp_id, result) VALUES (?, ?, ?)`;
        const values = [user_id, olimp_id, result];
        db.run(sqlInsertResult, values, function (err) {
            if (err) {
                return res.status(500).json({ error: 'Произошла ошибка при добавлении результата в базу данных' });
            }

            // Отправка ответа о успешном добавлении результата
            res.status(201).json({ message: 'Результат успешно добавлен' });
        });
    });
});

app.get('/userOlympiads/:username', (req, res) => {
    const { username } = req.params;

    // Поиск user_id по username в базе данных
    const sqlSelectUser = `SELECT user_id FROM Users WHERE username = ?`;
    db.get(sqlSelectUser, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Произошла ошибка при поиске пользователя' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Пользователь с указанным username не найден' });
        }

        const user_id = row.user_id;

        // Поиск всех олимпиад пользователя по user_id в базе данных
        const sqlSelectOlympiads = `SELECT o.id, o.name, r.result FROM Olympiads o 
                                    JOIN User_Results r ON o.id = r.olymp_id
                                    WHERE r.user_id = ?`;
        db.all(sqlSelectOlympiads, [user_id], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Произошла ошибка при поиске олимпиад пользователя' });
            }

            // Отправка найденных олимпиад пользователя
            res.status(200).json(rows);
        });
    });
});

app.get('/getRating/:table_id/:user_id', (req, res) => {
    const table_id = req.params.table_id; // Получаем идентификатор таблицы из запроса
    const user_id = req.params.user_id; // Получаем идентификатор пользователя из запроса

    console.log('ПРИШЛО' + table_id + '   ' + user_id)

    // SQL-запрос для выборки данных из таблицы рейтинга
    const sql = `SELECT * FROM Rating_${table_id} WHERE user_id = ?`;

    // Выполняем SQL-запрос с переданными параметрами
    db.all(sql, [user_id], function (err, rows) {
        if (err) {
            console.error(`Ошибка при выполнении запроса: ${err.message}`);
            res.status(500).json({ error: 'Ошибка при выполнении запроса' });
            return; // Возвращаемся, чтобы избежать отправки ответа дважды
        }

        console.log(`Данные из таблицы рейтинга для пользователя ${user_id} успешно получены`);
        console.log(rows);

        // Возвращаем полученные данные
        res.status(200).json(rows);
    });
});


/*=================================ОТГРУЗКА ОБЩЕГО РЕЗА ЮЗЕРА====================================*/

// Обработчик запроса для расчета общего рейтинга пользователя
app.post('/calculate-user-rating', (req, res) => {
    const { user_id } = req.body;
    console.log(user_id)

    // Проверка наличия user_id в запросе
    if (!user_id) {
        return res.status(400).send('Не указан user_id');
    }

    // Расчет общего рейтинга пользователя
    calculateUserRating(user_id)
        .then(overallRating => {
            res.status(200).json({ user_id, overall_rating: overallRating });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Ошибка при расчете общего рейтинга пользователя');
        });
});


// Расчет общего рейтинга пользователя
function calculateUserRating_old(user_id) {
    return new Promise((resolve, reject) => {
        var name = "Rating_7"
        // Получение имени таблицы рейтинга, в которой содержится пользователь
        db.get(`
            SELECT name
            FROM sqlite_master
            WHERE type='table' AND name LIKE 'Rating_%' AND EXISTS (
                SELECT 1 FROM ${name} WHERE user_id = ?
            )
        `, [user_id], (err, table) => {
            if (err) {
                console.error(err);
                reject('Ошибка при получении имени таблицы рейтинга');
            } else if (!table) {
                reject('Таблица рейтинга для данного пользователя не найдена');
            } else {
                const ratingTableName = table.name;
                // Запрос к базе данных для получения данных о пользователе и его результатов
                db.all(`
                    SELECT raiting_id, rating
                    FROM ${ratingTableName}
                    WHERE user_id = ?
                `, [user_id], (err, results) => {
                    if (err) {
                        console.error(err);
                        reject('Ошибка при получении результатов пользователя');
                    } else {
                        // Расчет общего рейтинга
                        let overallRating = 0;
                        const numberOfParticipants = results.length;
                        results.forEach((result, index) => {
                            const position = index + 1; // Используем порядковый номер результата в выборке
                            const coefficient = 1; // Здесь можно установить свой коэффициент
                            const rating = ((numberOfParticipants - position + 1) * coefficient) / numberOfParticipants;
                            overallRating += rating;
                            console.log('numberOfParticipants: ' + numberOfParticipants);
                            console.log('position: ' + position);
                            console.log('TOTAL RAIT: ' + overallRating);
                        });

                        resolve(overallRating);
                    }
                });
            }
        });
    });
}



app.put('/updateOlympiadCell/:id', (req, res) => {
    const id = req.params.id; // Получаем идентификатор строки из запроса
    const { columnName, newValue } = req.body; // Получаем имя поля и новое значение из тела запроса
    console.log(columnName, newValue, id)

    // SQL-запрос для обновления значения в базе данных
    const sql = `UPDATE Olympiads SET ${columnName} = ? WHERE id = ?`;

    // Выполняем SQL-запрос с переданными параметрами
    db.run(sql, [newValue, id], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Ошибка при обновлении значения в базе данных' });
        }
        console.log(`Row ${id} updated successfully`);

        // Если новое значение равно "Закончена", вызываем запрос на создание и заполнение таблицы рейтинга
        if (newValue === "Закончена") {
            // Создаем таблицу рейтинга для конкретной олимпиады
            const createTableSql = `
                CREATE TABLE IF NOT EXISTS Rating_${id} (
                    raiting_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    rating INTEGER NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES Users(id)
                )
            `;

            // Выполняем SQL-запрос для создания таблицы рейтинга
            db.run(createTableSql, [], function (err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Ошибка при создании таблицы рейтинга' });
                }
                console.log(`Таблица рейтинга для олимпиады ${id} успешно создана`);

                var rait = 10;

                // Заполняем таблицу рейтинга результатами пользователей из таблицы User_Results
                const fillTableSql = `
                    INSERT INTO Rating_${id} (user_id, rating)
                    SELECT user_id, result 
                    FROM User_Results 
                    WHERE olymp_id = ?
                    ORDER BY result DESC
                `;

                // Выполняем SQL-запрос для заполнения таблицы рейтинга
                db.run(fillTableSql, [id], function (err) {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).json({ error: 'Ошибка при заполнении таблицы рейтинга' });
                    }
                    console.log(`Таблица рейтинга для олимпиады ${id} успешно заполнена`);
                    addUsersRaiting(id)
                });

            });
        }

        // Возвращаем успешный статус и новое значение в JSON формате
        res.status(200).json({ id: id, columnName: columnName, newValue: newValue });
    });
});

function addUsersRaiting(id) {
    db.all(`SELECT * FROM Rating_${id}`, function (err, rows) {
        if (err) {
            console.log(err)
            return
        } else {
            db.get(`SELECT coef FROM Olympiads WHERE id=${id}`, function (err, coef) {
                if (err) {
                    console.log('db.get(`SELECT coef FROM Olympiads WHERE id=${id}`, function (err, coef)')
                    return;
                }
                rows.forEach(row => {
                    var position = row.raiting_id
                    var numberOfParticipants = rows.length
                    var coefficient = coef.coef
                    console.log('-----------')
                    console.log(position)
                    console.log(numberOfParticipants)
                    console.log(coefficient)
                    var rait = ((numberOfParticipants - position + 1) * coefficient) / numberOfParticipants;
                    console.log('-----------')
                    console.log(rait)
                    console.log(rait+1)

                    db.run("UPDATE Users SET raiting = raiting + ? WHERE user_id=?", [rait, row.user_id], (err) => {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            console.log('Рейтинг пользователю ' + row.user_id + ' успешно добавлен')
                        }
                    })
                })
            })
        }
    })
}

app.get('/userRaiting/:id', (req, res) => {
    const id = req.params.id;

    db.all('SELECT * FROM Users WHERE user_id=?', [id], (rows, err) => {
        if (err) {
            return res.status(400).json({ error: 'Не указано имя пользователя' });
        }
        else {
            res.status(200).json(rows);
        }
    })
})

app.post('/codeForce', async (req, res) => {
    try {
        // Проверяем, есть ли имя пользователя в теле запроса
        if (!req.body.username) {
            return res.status(400).json({ error: 'Не указано имя пользователя' });
        }

        // Извлекаем имя пользователя из тела запроса
        const username = req.body.username;

        // Получаем статистику пользователя с указанным именем
        const data = await getUserStats(username);

        // Отправляем данные клиенту в качестве ответа
        res.status(200).json(data);
    } catch (error) {
        console.error(`Произошла ошибка при получении статистики пользователя: ${error}`);
        res.status(500).json({ error: 'Ошибка при получении статистики пользователя' });
    }
});




/*=================================АДМИНЫ====================================*/

app.get('/admins', authenticateToken, (req, res) => {
    const { role } = req.headers;

    // Проверяем роль пользователя
    if (role !== '1') {
        return res.status(403).send('Доступ запрещен. Необходима роль администратора.');
    }

    // Запрос к базе данных для получения всех пользователей с ролью администратора
    db.all(`
        SELECT * FROM Users WHERE role = 1
    `, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении данных администраторов');
        }

        // Если данных нет, отправляем пустой массив
        if (!rows || rows.length === 0) {
            return res.status(404).send('Администраторы не найдены');
        }

        // Отправляем данные администраторов
        res.status(200).json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
