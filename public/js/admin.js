//проверка на лог
function getProtectedResource() {
    var token = localStorage.getItem('token');
    fetch('/protected', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Требуется аутентификация');
        })
        .then(data => {
            // Обработка ответа от защищенного ресурса
            console.log('Защищенный ресурс:', data);
            var role = localStorage.getItem('role');
            if (role == 1) {

            }
            else if (role == 0) {
                console.error('Вы не админ!', error.message);
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            // Перенаправление на index.html в случае ошибки
            console.error('Ошибка при получении защищенного ресурса:', error.message);
            window.location.href = 'index.html';
        });
}
/*=================================СТАТИСТИКА====================================*/

/*-----ОТГРУЗКА СТАТИСТИКИ------*/
function renderStat() {
    var root = document.getElementById('root')
    root.innerHTML = `
    <main class="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4">
        <h1 class="h2" align='center'>Статистика</h1>
        <div class="card">
            <h5 class="card-header">Участников олимпиад</h5>
            <div class="card-body">
                <h5 class="card-title">?</h5>
            </div>
        </div>
        <div id='root2'></div>
    </main>
            `
    var root2 = document.getElementById('root2')
    root2.innerHTML = `
    <div class="row my-4">
    <div class="col-12 col-md-6 col-lg-6 mb-4 mb-lg-0">
        <div class="card">
            <h5 class="card-header">Не придумал</h5>
            <div class="card-body">
              <h5 class="card-title">?: </h5>
              <h5 class="card-title">?:</h5>
              <h5 class="card-title">?:</h5>
            </div>
          </div>
    </div>
    <div class="col-12 col-md-6 col-lg-6 mb-4 mb-lg-0">
        <div class="card">
            <h5 class="card-header">Не придумал</h5>
            <div class="card-body">
              <h5 class="card-title"></h5>
            </div>
          </div>
    </div>
  </div>    
    `
}

/*=================================ОЛИМПИАДЫ====================================*/

/*-----ОТГРУЗКА ОЛИМПИАД------*/
async function renderEvent() {
    var root = document.getElementById('root')
    root.innerHTML = `
    <main class="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4" id='mainn'>
    <h1 class="h2" align='center'>Олимпиады</h1>
       <table id='' class='table table-bordered container'>
       <thead>
         <tr>
           <th scope="col">id</th>
           <th scope="col">Название</th>
           <th scope="col">Описание</th>
           <th scope="col">Дата начала</th>
           <th scope="col">Дата конца</th>
           <th scope="col">Дата старта рег</th>
           <th scope="col">Дата окончания рег</th>
           <th scope="col">Статус</th>
           <th scope="col">Тип</th>
           <th style="width: 5%;" scope="col">Ссылка(если надо)</th>
           <th scope="col">Кэфф</th>
           <th scope="col"></th>
         </tr>
       </thead>
         <tbody id='tableAd'>
         </tbody>  
       
    </div>
 </main>
    `;

    try {
        const events = await getAllOlimp();
        renderEventsTable(events);
    } catch (error) {
        console.error(error);
    }
}

function renderEventsTable(events) {
    var tableBody = document.getElementById('tableAd');

    events.forEach(event => {
        var row = document.createElement('tr');

        // Заполняем ячейки строки данными о мероприятии
        row.innerHTML = `
            <td data-id="${event.id}">${event.id}</td>
            <td data-name="${event.id}">${event.name}</td>
            <td data-description="${event.id}">${event.descr}</td>
            <td data-start-date="${event.id}">${event.start_date}</td>
            <td data-end-date="${event.id}">${event.end_date}</td>
            <td data-reg-start="${event.id}">${event.reg_start}</td>
            <td data-reg-end="${event.id}">${event.reg_end}</td>
            <td id="editCellId" onclick="editCell(this)" data-status="${event.id}">${event.reg_status}</td>
            <td data-flag="${event.id}">${event.flag}</td>
            <td data-link="${event.id}">${event.link}</td>
            <td data-link="${event.id}">${event.coef}</td>
            <td><button class="btn btn-secondary" onclick="deleteEvent(${event.id})">Удалить</button></td>
        `;

        // Добавляем строку в таблицу
        tableBody.appendChild(row);
    });
    var mainn = document.getElementById('mainn')
    mainn.innerHTML +=
        `                             
  <div class='container' align='center'> 
    <button data-gid="2" data-target="#exampleModal2" data-toggle="modal" class="container btn-secondary btn" style="width: 5rem; color: dark">+</button>
  </div>`
}

async function getAllOlimp() {
    // Получаем роль из localStorage
    var role = localStorage.getItem('role');
    // Получаем токен из localStorage
    var token = localStorage.getItem('token');

    // Определяем заголовки запроса
    var headers = {
        'Content-Type': 'application/json',
    };

    // Если есть роль, добавляем её в заголовки
    if (role) {
        headers['Role'] = role;
    }

    // Если есть токен, добавляем его в заголовки
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    try {
        // Отправляем GET-запрос на сервер для получения данных о событиях
        const response = await fetch('/events', {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении данных о событиях');
        }

        const data = await response.json();
        // Возвращаем данные
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

function editCell(cell) {
    cell.setAttribute('onclick', '')
    // Получаем текущий текст ячейки
    const currentValue = cell.innerText;
    // Создаем выпадающий список
    const select = document.createElement('select');
    // Добавляем опции в список
    const options = ['Ожидается', 'Идёт', 'Закончена'];
    options.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.innerText = optionText;
        select.appendChild(option);
    });
    // Помещаем список в ячейку
    cell.innerHTML = '';
    cell.appendChild(select);
    // Выбираем текущее значение в списке
    select.value = currentValue;
    // Добавляем обработчик события изменения значения
    select.addEventListener('change', () => {
        // Получаем id строки (предполагая, что id хранится в data-id атрибуте)
        const rowId = cell.parentElement.querySelector('[data-status]').getAttribute('data-status');

        // Получаем новое значение из выпадающего списка
        const newValue = select.value;

        // Отправляем fetch запрос на сервер для обновления значения
        fetch(`/updateOlympiadCell/${rowId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                columnName: 'reg_status', // Имя поля, которое вы хотите обновить (например, 'status')
                newValue: newValue // Новое значение поля
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при обновлении значения');
                }
                // Если запрос выполнен успешно, возвращаем обновленное значение
                return response.json();
            })
            .then(data => {
                // Заменяем список обратно на текстовое значение
                cell.innerText = newValue;
                // Восстанавливаем обработчик события клика на ячейке
                cell.setAttribute('onclick', 'editCell(this)');
            })
            .catch(error => {
                console.error('Ошибка:', error);
                // В случае ошибки вы можете предпринять необходимые действия (например, отобразить сообщение об ошибке)
            });
    });
}




/*-----ДОБАВЛЕНИЕ ОЛИМПИАД------*/
function toggleInput() {
    var select = document.getElementById('selectParam');
    var selectedValue = select.value;
    var inputContainer = document.getElementById('inputContainer');

    // Проверяем выбранный параметр
    if (selectedValue === 'notMine') {
        inputContainer.innerHTML = '<input id="linkInput" style="width: 400px;" type="text" id="oplimpHREF" placeholder="Введите ссылку на сайт с олимпиадой...">';
    } else {
        // Удаляем input
        inputContainer.innerHTML = '';
    }
}

async function addOlympiad() {
    var role = localStorage.getItem('role');
    var token = localStorage.getItem('token');

    const name = document.querySelector('input[data-name="name"]').value;
    const descr = document.querySelector('textarea[data-name="descr"]').value;
    const cf = document.querySelector('input[data-name="cf"]').value;
    const startDate = document.querySelector('input[data-name="startDate"]').value;
    const endDate = document.querySelector('input[data-name="endDate"]').value;
    const regStartDate = document.querySelector('input[data-name="regStartDate"]').value;
    const regEndDate = document.querySelector('input[data-name="regEndDate"]').value;
    var link = ""

    var select = document.getElementById('selectParam');
    var selectedValue = select.value;
    if (selectedValue == "Mine") {
        var flag = "Своя"
        link="null"
    }
    else if (selectedValue == "notMine") {
        var flag = "Чужая"
        link = document.getElementById('linkInput').value
    }

    // Отправляем данные на сервер
    try {
        const response = await fetch('/add-olympiad', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Role': role,
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                name,
                descr,
                startDate,
                endDate,
                regStartDate,
                regEndDate,
                flag,
                cf,
                link
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка при добавлении олимпиады');
        }

        // Обработка успешного ответа
        $('#exampleModal2').modal('hide'); // Скрыть модальное окно после успешного добавления
        renderEvent();
    } catch (error) {
        console.error(error);

        var olimpAddErr = document.getElementById('olimpAddErr')
        olimpAddErr.innerHTML = `<p style="color: red">Заполните все поля</p>`
    }
}

/*-----УДАЛЕНИЕ ОЛИМПИАД------*/
async function deleteEvent(eventId) {
    var role = localStorage.getItem('role');
    var token = localStorage.getItem('token');

    try {
        const response = await fetch(`/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
                'Role': role
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при удалении олимпиады');
        }

        // Обновление списка олимпиад после успешного удаления
        renderEvent();
    } catch (error) {
        console.error(error);
    }
}

/*=================================РЕДАКТОР ОЛИМПИАД====================================*/

async function renderEditOlimp() {
    var root = document.getElementById('root')
    root.innerHTML = `
    <main class="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4" id='mainn'>
    <h1 class="h2" align='center'>Олимпиады</h1>
       <table id='' class='table table-bordered container'>
       <thead>
         <tr>
           <th scope="col">id</th>
           <th scope="col">Название</th>
           <th scope="col">Описание</th>
           <th scope="col">Дата начала</th>
           <th scope="col">Дата конца</th>
           <th scope="col">Дата старта рег</th>
           <th scope="col">Дата окончания рег</th>
           <th scope="col">Статус</th>
           <th scope="col">Тип</th>
           <th scope="col">Ссылка</th>
           <th scope="col"></th>
         </tr>
       </thead>
         <tbody id='tableAd'>
         </tbody>  
       
    </div>
 </main>
    `;

    try {
        const events = await getOlimpForEdit();
        renderEditOlimpTable(events);
    } catch (error) {
        console.error(error);
    }
}

function renderEditOlimpTable(events) {
    var tableBody = document.getElementById('tableAd');

    events.forEach(event => {
        var row = document.createElement('tr');

        // Заполняем ячейки строки данными о мероприятии
        row.innerHTML = `
            <td data-id="${event.id}">${event.id}</td>
            <td data-name="${event.id}">${event.name}</td>
            <td data-description="${event.id}">${event.descr}</td>
            <td data-start-date="${event.id}">${event.start_date}</td>
            <td data-end-date="${event.id}">${event.end_date}</td>
            <td data-reg-start="${event.id}">${event.reg_start}</td>
            <td data-reg-end="${event.id}">${event.reg_end}</td>
            <td data-status="${event.id}">${event.reg_status}</td>
            <td data-flag="${event.id}">${event.flag}</td>
            <td data-link="${event.id}">${event.link}</td>
            <td><button class="btn btn-secondary" onclick="openEditer(${event.id})">Редактировать</button></td>
        `;

        // Добавляем строку в таблицу
        tableBody.appendChild(row);
    });
}

async function getOlimpForEdit() {
    // Получаем роль из localStorage
    var role = localStorage.getItem('role');
    // Получаем токен из localStorage
    var token = localStorage.getItem('token');

    // Определяем заголовки запроса
    var headers = {
        'Content-Type': 'application/json',
    };

    // Если есть роль, добавляем её в заголовки
    if (role) {
        headers['Role'] = role;
    }

    // Если есть токен, добавляем его в заголовки
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    try {
        // Отправляем GET-запрос на сервер для получения данных о событиях
        const response = await fetch('/getOlimpForEdit', {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении данных о событиях');
        }

        const data = await response.json();
        // Возвращаем данные
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

function openEditer(id) {
    console.log('ol_id=', id);
    root = document.getElementById('root');
    // Вызываем fetchOlympiadById для получения данных об олимпиаде
    fetchOlympiadById(id)
        .then(data => {
            // Полученные данные передаем в функцию для отображения
            renderOlympiadData(data);
        })
        .catch(error => {
            console.error('Ошибка при получении данных об олимпиаде:', error);
            // В случае ошибки выводим сообщение или выполняем необходимые действия
        });
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

function renderOlympiadData(data) {
    var olimpId = data.id

    root.innerHTML = `
    <button onclick="renderEditOlimp()" style="margin-left: 320px; margin-top: 10px" class="btn btn-secondary">Назад</button>
    <main class="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4" id='mainn'>
    <p class="h2" align='center'>${data.name}</p>
       <table id='' class='table table-bordered container'>
       <thead>
         <tr>
           <th scope="col">Номер</th>
           <th scope="col">Название задания</th>
           <th scope="col">Описание задания</th>
           <th scope="col">Ожидаемый ответ</th>
           <th scope="col">Кол/во баллов за задание</th>
           <th scope="col"></th>
         </tr>
       </thead>
         <tbody id='tableAd'>
         </tbody>  
       
    </div>
 </main>
    `

    var tableBody = document.getElementById('tableAd')

    const token = localStorage.getItem('token');
    // Создаем объект Headers и добавляем заголовок "Authorization" с токеном
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token}`);

    fetch(`/olympiads/${data.id}/tasks`, {
        method: 'GET',
        headers: headers
    })
        .then(response => response.json()) // Извлекаем JSON из ответа
        .then(tasks => {
            // Отображаем задания в таблице
            tasks.forEach((task, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${task.name}</td>
                    <td>${task.descr}</td>
                    <td>${task.answer}</td>
                    <td>${task.points}</td>
                    <td><button onclick="delTask(${task.task_id},${olimpId})" class="btn btn-danger">Удалить</button></td>
                `;
                document.getElementById('tableAd').appendChild(row);
            });
            var mainn = document.getElementById('mainn')
            mainn.innerHTML +=
                `                             
            <div class='container' align='center'> 
                <button data-gid="2" data-target="#exampleModal3" data-toggle="modal" class="container btn-secondary btn" style="width: 5rem; color: dark">+</button>
            </div>`

            var sendTaskBut = document.getElementById('sendTaskBut')
            sendTaskBut.setAttribute('onclick', 'addTask(' + olimpId + ')')
        })
        .catch(error => {
            console.error('Произошла ошибка при получении заданий:', error);
            // Дополнительная обработка ошибок при получении заданий
        });
}

function addTask(ol_id) {
    var taskDescr = document.getElementById('taskDescr').value
    var taskName = document.getElementById('taskName').value
    var taskAnswer = document.getElementById('taskAnswer').value
    var taskPoint = document.getElementById('taskPoint').value

    // Создаем объект с данными задания
    const taskData = {
        olimp_id: ol_id, // Замените на соответствующий ID олимпиады
        name: taskName,
        descr: taskDescr,
        answer: taskAnswer,
        points: parseInt(taskPoint) // Преобразуем значение в число
    };

    // Преобразование данных задания в формат JSON
    const requestData = JSON.stringify(taskData);

    // Опции запроса
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: requestData
    };

    // Отправка запроса на сервер
    fetch('/tasks', options)
        .then(response => {
            // Проверка статуса ответа
            if (!response.ok) {
                throw new Error('Ошибка HTTP: ' + response.status);
            }
            // Если задание успешно добавлено, выводим сообщение об успешном добавлении
            console.log('Задание успешно добавлено');
            document.getElementById('taskDescr').value = ``
            document.getElementById('taskName').value = ``
            document.getElementById('taskAnswer').value = ``
            document.getElementById('taskPoint').value = ``
            $('#exampleModal3').modal('hide');
            openEditer(ol_id)
        })
        .catch(error => {
            // Обработка ошибок
            console.error('Произошла ошибка при добавлении задания:', error.message);
        });
}

function delTask(task_id, ol_id) {
    fetch(`/tasks/${task_id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
            // Здесь могут быть добавлены заголовки аутентификации, если требуется
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка удаления задания');
            }
            openEditer(ol_id)
        })
        .catch(error => {
            console.error('Ошибка:', error.message);
        });
}


/*=================================АДМИНЫ====================================*/

/*-----ОТГРУЗКА АДМИНОВ------*/
async function renderAdmin() {
    var root = document.getElementById('root')

    root.innerHTML = `
    <main class="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4">
    <h1 class="h2" align='center'>Добавление/удаление админов</h1>
    <table id='' class='table table-bordered'>
    <thead>
      <tr>
        <th scope="col">id</th>
        <th scope="col">Логин</th>
        <th scope="col">Роль</th>
        <th scope="col"></th>
      </tr>
    </thead>
    <tbody id='tableAd'>
    </tbody>
    </table>
    </main> 
    `

    try {
        const admins = await getAdmins();
        renderAdminsTable(admins);
    } catch (error) {
        console.error(error);
    }
}

function renderAdminsTable(admins) {
    var tableBody = document.getElementById('tableAd');

    admins.forEach(admin => {
        var row = document.createElement('tr');

        // Заполняем ячейки строки данными о мероприятии
        row.innerHTML = `
            <td data-type='id'">${admin.user_id}</td>
            <td>${admin.username}</td>
            <td>Админ</td>
            <td data-id='${admin.user_id}'><button onclick="delAdmin(event)" class="btn btn-secondary">Удалить</button></td>
        `;

        // Добавляем строку в таблицу
        tableBody.appendChild(row);
    });
}

async function getAdmins() {
    // Получаем токен из localStorage
    var token = localStorage.getItem('token');
    // Получаем роль из localStorage
    var role = localStorage.getItem('role');

    // Определяем заголовки запроса
    var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Role': role
    };

    try {
        // Отправляем GET-запрос на сервер для получения данных администраторов
        const response = await fetch('/admins', {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении данных администраторов');
        }

        const data = await response.json();
        // Возвращаем данные
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

function delAdmin(event) {
    adminId = event.target.parentElement.dataset['id']
    console.log('Айди админа: ', adminId)
}


/*=================================СТАТИСТИКА====================================*/
function renderUsers() {
    fetch('/usersByRaiting')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка получения данных пользователей');
            }
            return response.json();
        })
        .then(users => {
            // Обработка полученных данных пользователей
            renderUsersRaitingTable(users);
        })
        .catch(error => console.error('Ошибка:', error));
}

// Функция для отображения пользователей
function renderUsersRaitingTable(users) {
    // Создаем HTML-разметку для таблички с пользователями
    var root = document.getElementById('root')
    root.innerHTML = `
    <main class="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4">
    <h1 class="h2" align='center'>Рейтинг Участников</h1>
    <table id='' class='table table-bordered'>
    <thead>
      <tr>
        <th scope="col">id</th>
        <th scope="col">Логин</th>
        <th scope="col">Рейтинг</th>
      </tr>
    </thead>
    <tbody id='tableAd'>
    </tbody>
    </table>
    </main> 
    `;

    // Перебираем всех пользователей и добавляем их в таблицу
    var tbody = document.getElementById('tableAd')
    tbody.innerHTML += `<tr>`
    users.forEach(user => {
        tbody.innerHTML += `<td>${user.user_id}</td><td>${user.username}</td><td>${user.raiting}</td>`;
    });
    tbody.innerHTML += `</tr>`
}

//выход
function logout() {
    // Очистка токена из localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');

    // Перенаправление на страницу выхода или на главную страницу
    window.location.href = 'index.html'; // Перенаправляем на главную страницу
}

window.onload = function () {
    getProtectedResource()
    renderStat();
};
