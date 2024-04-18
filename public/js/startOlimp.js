const questionsContainer = document.getElementById('questions-container');
const nextBtn = document.getElementById('next-btn');

var answer_counter = 0
var max_q = 0
var olimpId = 0
var actual_task = 0
var data_stdout = ''
var olimp_Name = ''

let userAnswers = []
let correctAns = []
let result = []
let max_points = []

// Функция для получения вопросов из базы данных
function getQuestions(olimp_id) {
    // Получаем токен из localStorage, предположим, что он хранится там под ключом "token"
    const token = localStorage.getItem('token');
    // Создаем объект Headers и добавляем заголовок "Authorization" с токеном
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token}`);

    fetch(`/olympiads/${olimp_id}/tasks`, {
        method: 'GET',
        headers: headers
    })
        .then(response => response.json())
        .then(data => {
            // Отображаем вопросы на странице
            max_q = data.length
            correctAns.push({
                answer: data[answer_counter].answer,
                point: data[answer_counter].points
            })
            root = document.getElementById('root')
            root.innerHTML = `
                    <div id="root" align="center">
                        <div class="question"><h1 align="center">${data[answer_counter].name}</h1></div>
                        <div class="descr"><h3  align="center">${data[answer_counter].descr}</h3></div>
                    </div>
                `;

            output = document.getElementById('output')
            output.setAttribute('style', 'background-color:#fff;')
            output.value = ``
            actual_task = data[answer_counter].task_id
            answer_counter++;
        })
        .catch(error => {
            console.log(error)
            window.location.replace('./login.html')
        });
}

function addAns(id) {
    userAnswers.push({
        task_id: id,
        answer: data_stdout
    })
    if (max_q == answer_counter) {
        root = document.getElementById('body')
        root.innerHTML = `
        <div class="container" style="margin-top: 200px">
            <h2 align="center">Заполните данные для сертификата</h2>
            <div class="form-group">
                <label for="exampleInputEmail1">Фамилия</label>
                <input type="email" class="form-control" id="fam" aria-describedby="emailHelp" placeholder="Фамилия">
            </div>
            <div class="form-group">
                <label for="exampleInputEmail1">Имя</label>
                <input type="email" class="form-control" id="nam" aria-describedby="emailHelp" placeholder="Имя">
            </div>
            <div class="form-group">
                <label for="exampleInputEmail1">Отчество</label>
                <input type="email" class="form-control" id="sur" aria-describedby="emailHelp" placeholder="Отчество">
            </div>
            <br><br>
            <button class="btn btn-secondary" onclick="makeSert()">Получить сертификат</button>
        </div>
        `
        addNewOpimpToUser(olimpId,localStorage.getItem('username'),checkAnswers().toString());
    }
    else {
        getQuestions(olimpId)
    }
}

async function addNewOpimpToUser(olimp_id, username, result) {
    try {
        const response = await fetch('/addNewOpimpToUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ olimp_id, username, result })
        });

        if (!response.ok) {
            throw new Error('Ошибка при выполнении запроса');
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('Ошибка:', error);
        // Обработка ошибки
    }
}

function makeSert() {
    const certificateData = {
        name: document.getElementById('nam').value,
        surname: document.getElementById('fam').value,
        otchestvo: document.getElementById('sur').value,
        result: checkAnswers().toString(),
        olimp: olimp_Name
    };
    makeCertificate(certificateData)
        .then(url => window.location.replace(url))
        .catch(error => console.error('Ошибка при создании сертификата:', error));
}

function checkAnswers() {
    for (var i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i].answer == correctAns[i].answer) {
            result.push(correctAns[i].point)
        }
        max_points.push(correctAns[i].point)
    }
    var max_point_sum = sumArray(max_points)
    var totalSum = sumArray(result);
    var balls = (totalSum * 100) / max_point_sum
    return Math.round(balls)
}

function sumArray(arr) {
    return arr.reduce((acc, curr) => acc + curr, 0);
}

function fetchOlympiadById(olympiadId) {
    return fetch(`/olympiads/${olympiadId}`)
        .then(response => {
            // Проверяем статус ответа
            if (!response.ok) {
                throw new Error('Ошибка HTTP: ' + response.status);
            }
            // Преобразуем ответ в формат JSON и возвращаем его
            return response.json();
        });
}

function changeZagolovok(data) {
    olimpName = document.getElementById('olimpName')
    olimpName.innerText = data.name
}
// Создаем редактор кода
const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/python");

// Обработчик кнопки "Run"
document.getElementById('runButton').addEventListener('click', () => {
    const code = editor.getValue();

    // Выводим сообщение "Running..." в текстовое поле вывода
    document.getElementById('output').value = 'Running...';

    // Отправляем код на сервер для выполнения
    fetch('/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
    })
        .then(response => response.json())
        .then(data => {
            // При получении ответа от сервера, выводим результат выполнения в текстовое поле вывода
            if (data.stderr) {
                document.getElementById('output').setAttribute('style', 'background-color:#ff000061;');
                document.getElementById('output').value = data.stderr;
                return;
            }
            else if (data.stdout) {
                document.getElementById('output').value = data.stdout || 'No output';
                document.getElementById('output').setAttribute('style', 'background-color:#83ff0061;');
                var root = document.getElementById('root')
                root.innerHTML += `
                <button id="next-btn" onclick="addAns(${actual_task})" class="btn btn-primary mt-4">Следующий вопрос</button>
                `
                data_stdout = data.stdout.split('\r')[0]
            }
            else {
                document.getElementById('output').value = 'No output';
                document.getElementById('output').setAttribute('style', 'background-color:#ffd1008c;');
            }
        })
        .catch(error => {
            // При ошибке выводим сообщение об ошибке
            console.error('Error:', error);
            document.getElementById('output').value = 'Error occurred while running the code';
        });
});
// Обработчик загрузки файла
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const contents = e.target.result;
        editor.setValue(contents);
    };

    reader.readAsText(file);
});

async function makeCertificate(data) {
    try {
        const response = await fetch('/api/makeCertificate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Ошибка при выполнении запроса');
        }

        const responseData = await response.json();
        return responseData.url;
    } catch (error) {
        console.error('Ошибка:', error);
        // Обработка ошибки
    }
}



// Загрузка вопросов при загрузке страницы
window.onload = () => {
    const currentUrl = window.location.href;
    const olimp_id = currentUrl.split('?')[1]
    fetchOlympiadById(olimp_id)
        .then(data => {
            // Полученные данные передаем в функцию для отображения
            olimpId = olimp_id
            olimp_Name = data.name
            changeZagolovok(data);
            getQuestions(olimp_id);
        })
        .catch(error => {
            console.error('Ошибка при получении данных об олимпиаде:', error);
            // В случае ошибки выводим сообщение или выполняем необходимые действия
        });
};