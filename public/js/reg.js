function reg() {
    var username = document.getElementById('newLog').value;
    var password = document.getElementById('pass1').value;
    var password2 = document.getElementById('pass2').value;

    if (password === password2) {
        fetch('/register', {
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
            // Обработка успешной регистрации
            console.log('Пользователь зарегистрирован:', data);
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
            // Обработка ошибок при регистрации
            console.error('Ошибка при регистрации:', error);
            var err2 = document.getElementById('err2')
            err2.innerHTML = `<p style="color:red">Пользователь с таким логином уже зарегестрироавн</p>`
        });
    } else {
        alert('Пароли не совпадают');
    }
}
