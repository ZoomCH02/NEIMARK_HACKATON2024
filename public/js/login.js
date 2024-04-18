function login() {
    var username = document.getElementById('userName').value;
    var password = document.getElementById('pass').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            'username': username, 
            'password': password 
        })
    })
    .then(response => response.json())
    .then(data => {
        // Обработка успешного входа
        console.log('Пользователь вошел:', data);
        // Добавление токена в localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        if(data.role==1){
            window.location.href = '/admin.html'; 
        }
        else if (data.role==0){
            window.location.href = '/profile/index.html'; 
        }
    })
    .catch(error => {
        // Обработка ошибок при входе
        console.error('Ошибка при входе:', error);
        var err = document.getElementById('err')
        err.innerHTML = `<p style="color:red">Неверный логин/пароль</p>`
    });
}
