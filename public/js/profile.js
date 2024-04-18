var userID = 0

function onLoad() {
    var token = localStorage.getItem('token');

    if (token) {
        fetch('/user-info', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Ошибка при получении информации о пользователе');
            })
            .then(data => {
                console.log('Информация о пользователе:', data);
                userID = data.user_id
                globalRaiting()
                var userName = document.getElementById('userName')
                userName.innerText = data.username;

                var userRaiting = document.getElementById('userRaiting')
                userRaiting.innerText = data.raiting;

                var olimpList = document.getElementById('olimpList')

                renderUserOlympiads(data.user_id, localStorage.getItem('username'))
                    .then(olympiads => {
                        console.log('Олимпиады пользователя:', olympiads);
                    })
                    .catch(error => console.error('Ошибка при получении олимпиад пользователя:', error));

            })
            .catch(error => {
                console.error(error.message);
                globalRaiting()
            });
    }
}

function globalRaiting() {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'user_id': userID })
    };

    // fetch('/calculate-user-rating', requestOptions)
    //     .then(response => {
    //         if (!response.ok) {
    //             throw new Error('Ошибка сети');
    //         }
    //         return response.json();
    //     })
    //     .then(data => {
    //         // Обработка ответа от сервера
    //         console.log('Общий рейтинг пользователя:', data.overall_rating);
    //     })
    //     .catch(error => {
    //         // Обработка ошибок
    //         console.error('Ошибка:', error.message);
    //     });
}

async function renderUserRating(user_id) {
    try {
        const overallRating = await fetchUserRating(user_id);

        // Дополнительная обработка данных, например, отображение на странице
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

async function fetchUserRating(user_id) {
    try {
        const response = await fetch(`/userRaiting/${user_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении рейтинга пользователя');
        }

        const ratingData = await response.json();
        return ratingData; // Возвращаем данные о рейтинге и месте пользователя
    } catch (error) {
        throw new Error(`Ошибка при получении рейтинга пользователя: ${error.message}`);
    }
}

// Вместо username передаем user_id
async function renderUserOlympiads(user_id, user_name) {
    try {
        // Получаем олимпиады пользователя
        const response = await fetch(`/userOlympiads/${user_name}`);
        if (!response.ok) {
            throw new Error('Ошибка при выполнении запроса');
        }
        const olympiads = await response.json();

        // Получаем элемент, в который будем вставлять олимпиады
        const olimpList = document.getElementById('olimpList');

        // Очищаем содержимое, чтобы избежать дублирования
        olimpList.innerHTML = '';

        // Добавляем каждую олимпиаду в список
        olympiads.forEach(async olympiad => {
            // Получаем информацию о рейтинге и месте пользователя для текущей олимпиады
            const ratingResponse = await fetch(`/getRating/${olympiad.id}/${user_id}`);
            const ratingData = await ratingResponse.json();

            // Создаем элемент для отображения олимпиады
            const previewItem = document.createElement('div');
            previewItem.classList.add('preview-item');

            const previewThumbnail = document.createElement('div');
            previewThumbnail.classList.add('preview-thumbnail');
            previewThumbnail.innerHTML = '<div class="preview-icon bg-success"></div>';

            const previewItemContent = document.createElement('div');
            previewItemContent.classList.add('preview-item-content', 'd-sm-flex', 'flex-grow');

            const flexGrow = document.createElement('div');
            flexGrow.classList.add('flex-grow');

            const previewSubject = document.createElement('h2');
            previewSubject.classList.add('preview-subject');
            previewSubject.textContent = olympiad.name;

            const previewScore = document.createElement('span');
            previewScore.classList.add('preview-score');
            previewScore.textContent = `Баллы: ${olympiad.result}`;
            previewScore.innerHTML += `<br><br>`

            const ratingInfo = document.createElement('span');
            ratingInfo.classList.add('rating-info');
            ratingInfo.textContent = `Место в рейтинге: ${ratingData[0].raiting_id}`;


            flexGrow.appendChild(previewSubject);
            flexGrow.appendChild(previewScore);
            flexGrow.appendChild(ratingInfo);
            previewItemContent.appendChild(flexGrow);
            previewItem.appendChild(previewThumbnail);
            previewItem.appendChild(previewItemContent);

            const row = document.createElement('div');
            row.classList.add('row');
            row.innerHTML = `
                <div class="col-12">
                    <div class="preview-list">
                        ${previewItem.outerHTML}
                    </div>
                </div>
            `;
            olimpList.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка:', error);
        // Обработка ошибки
    }
}

function addCodeForceAccount() {
    var codeForceInput = document.getElementById('codeForceInput').value;
    if (codeForceInput) {
        // Создаем объект с данными для отправки на сервер
        var data = { username: codeForceInput };

        // Отправляем POST-запрос на сервер
        fetch('/codeForce', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                // Проверяем статус ответа  
                if (response.ok) {
                    // Если успешно, выводим сообщение об успешном добавлении аккаунта
                    alert('Аккаунт успешно добавлен');
                } else {
                    // Если произошла ошибка, выводим сообщение об ошибке
                    alert('Произошла ошибка при добавлении аккаунта');
                }
            })
            .catch(error => {
                // В случае ошибки выводим сообщение об ошибке
                console.error('Произошла ошибка:', error);
                alert('Произошла ошибка при добавлении аккаунта');
            });
    } else {
        // Если введено пустое значение, выводим сообщение об ошибке
        alert('Введите имя пользователя');
    }
}


//выход
function logout() {
    // Очистка токена из localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');

    // Перенаправление на страницу выхода или на главную страницу
    window.location.href = '/'; // Перенаправляем на главную страницу
}

window.onload = onLoad;
