function checkRole() {
    var navBut = document.getElementById('navBut')
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
                navBut.innerHTML = `
                <button class="btn btn-secondary" onclick="window.location.href='./admin.html';">Админская Панель</button>
                `
            }
            else if (role == 0) {
                navBut.innerHTML = `
                <button class="btn btn-secondary" onclick="window.location.href='./profile/index.html';">Профиль</button>
                `
            }
        })
        .catch(error => {
            console.error('Ошибка при получении защищенного ресурса:', error.message);
        });
}

async function getAllOlimps() {
    try {
        const olimpiads = await fetchOlimpiads();
        renderOlimpiads(olimpiads);
    } catch (error) {
        console.error(error);
    }
}

async function fetchOlimpiads() {
    var token = localStorage.getItem('token');
    var role = localStorage.getItem('role');

    var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Role': role
    };

    try {
        const response = await fetch('/eventsNow', {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении данных олимпиад');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

function renderOlimpiads(olimpiads) {
    var allOlimps = document.getElementById('allOlimps');

    olimpiads.forEach(olimpiad => {
        var div = document.createElement('div');
        div.className = 'col-md-6';
        div.innerHTML = `
            <div onclick="startOlimp(${olimpiad.id})" class="border rounded-1 border-700 h-100 features-items">
                <div class="p-5" id="ol_info_${olimpiad.id}"> 
                    <img src="assets/img/gallery/py.png" alt="Olimpiad" style="width:48px;height:48px;" />
                    <h2 class="pt-2 lh-base">${olimpiad.name}</h2>
                    <p class="mb-0">${olimpiad.descr}</p>
                    <hr>
                    <h3 class="pt-1 lh-base">Регистрация: до ${olimpiad.reg_end.replaceAll('-', '.').split('.').reverse().join('.')}</h3>
                    <h3 class="pt-1 lh-base">Дата проведения: ${olimpiad.start_date.replaceAll('-', '.').split('.').reverse().join('.')} - ${olimpiad.end_date.replaceAll('-', '.').split('.').reverse().join('.')}</h3>
                </div>
            </div>
        `;
        allOlimps.appendChild(div);
        if(olimpiad.link!="null"){
            document.getElementById('ol_info_'+olimpiad.id).innerHTML+=`<hr><h3 class="pt-1 lh-base">Ссылка:</h3><p>${olimpiad.link}</p>`
            document.getElementById('ol_info_'+olimpiad.id).parentElement.onclick = function() {
                window.location.href = `${olimpiad.link}`;
              }
        }
    });
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

function startOlimp(ol_id) {
    window.location.replace('./startOlimp.html?' + ol_id)
}

// Функция для отображения пользователей
function renderUsersRaitingTable(users) {
    var i = 1;
    var tbody = document.getElementById('tbody')
    users.forEach(user => {
        tbody.innerHTML += `<tr style="color: white;"><td>${i}</td><td>${user.username}</td><td>${user.raiting}</td></tr>`;
        i++;
    });
}

window.onload = function () {
    getAllOlimps();
    checkRole();
    renderUsers();
};
