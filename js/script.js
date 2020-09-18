window.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('.modal');
    const btnSignIn = document.querySelector('.btn');
    const btnLogIn = document.querySelector('.btnReg');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    const headerBlock = document.querySelector('.header__block');
    const tabs = document.querySelectorAll('.tabheader__item');
    const tabsContainer = document.querySelector('.tabheader__items');
    const tabsContent = document.querySelectorAll('.tabcontent');
    const user = {};

    // Modal
    function showModalWindow() {
        modal.classList.toggle('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModalWindow() {
        modal.classList.toggle('show');
        document.body.style.overflow = '';
        emailInput.value = '';
        passwordInput.value = '';
    }

    btnSignIn.addEventListener('click', showModalWindow);

    modal.addEventListener('click', (e) => {
        if (e.target == modal || e.target.getAttribute('data-close') == '') {
            closeModalWindow();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && modal.classList.contains('show')) {
            closeModalWindow();
        }
    });

    // Implement Sign In functional
    class User {
        static async create(user) {
            const response = await fetch('https://weather-swat-app.firebaseio.com/users.json', {
                method: 'POST',
                body: JSON.stringify(user),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const json = await response.json();
            return json;
        }

        static async authWithEmailAndPassword(email, password) {
            const apiKey = 'AIzaSyBT3E6XP47datQakOrpevetuHVmpaXqouc';

            const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                }),
                headers: {
                    'Content-type': 'application/json'
                }
            });

            const json = await response.json();
            return json;
        }
    }

    function setAttr(selector) {
        document.querySelectorAll(selector).forEach((element) => {
            element.setAttribute(selector.slice(1, -1), '1');
        });
    }

    function displayFullAccess() {
        btnSignIn.textContent = user.email;
        btnSignIn.disabled = true;

        headerBlock.insertAdjacentHTML('beforeend', `
                            <div class='header__btn'>
                                <button style='position: absolute; top: 5vh; right: -10vw;' data-out class='btn'>Log Out</button>
                            </div>
                        `);

        setAttr('[data-off]');
    }

    function authFormHandler(event) {
        event.preventDefault();
        user.email = emailInput.value;

        User.authWithEmailAndPassword(user.email, passwordInput.value).then((response) => {
            if (response.idToken) {
                user.idToken = response.idToken;

                localStorage.setItem('user', JSON.stringify(user));
                displayFullAccess();
                closeModalWindow();
            } else {
                return Promise.reject(response.error.message);
            }
        })
            .catch((err) => {
                const errorContainer = document.createElement('div');
                errorContainer.classList.add('error');
                errorContainer.textContent = err;
                btnLogIn.insertAdjacentElement('beforebegin', errorContainer);
                btnLogIn.disabled = true;

                setTimeout(() => {
                    errorContainer.remove();
                    btnLogIn.disabled = false;
                }, 2000);
            });
    }

    btnLogIn.addEventListener('click', authFormHandler);

    // Implement Log Out function
    const headerContainer = document.querySelector('.header__block');

    function removeAttr(selector) {
        document.querySelectorAll(selector).forEach((element) => {
            element.setAttribute(selector.slice(1, -1), '');
        });
    }

    function logOutHandler(button) {
        localStorage.removeItem('user');
        user.idToken = '';
        user.email = '';
        button.remove();
        btnSignIn.textContent = 'Sign In';
        btnSignIn.disabled = false;
        removeAttr('[data-off]');
        tabsContainer.querySelector('.tabheader__item_active').classList.remove('tabheader__item_active');
    }

    headerContainer.addEventListener('click', (event) => {
        if (event.target.hasAttribute('data-out')) {
            logOutHandler(event.target);
        }
    });

    setTimeout(() => logOutHandler, 36000);

    // Get user input city
    const inputCity = document.querySelector('#input');
    const inputSearch = document.querySelector('#search');

    function writeCityToLocalStorage() {
        const city = inputCity.value;
        inputCity.value = ``;
        localStorage.setItem('city', city.trim());
        return city.trim();
    }

    // Weather Tabs
    function hideTabContent() {
        tabsContent.forEach((element) => {
            element.classList.add('hide');
            element.classList.remove('show', 'fade');
        });

        tabs.forEach((element) => {
            element.classList.remove('tabheader__item_active');
        });
    }

    function showTabContent(i = 0) {
        tabsContent[i].classList.add('show', 'fade');
        tabsContent[i].classList.remove('hide');
        tabs[i].classList.add('tabheader__item_active');
    }

    hideTabContent();
    showTabContent();

    tabsContainer.addEventListener('click', (event) => {
        const target = event.target;

        tabs.forEach((element, i) => {
            if (!!target.getAttribute('data-off') && (target == element || element.contains(target))) {
                hideTabContent();
                showTabContent(i);
            }
        });
    });

    // Request Weather
    const APIKEY = '7300812882b848ff9b768bb6d98efa01';
    const urlWeather = `https://api.weatherbit.io/v2.0/forecast/`;

    class Weather {
        constructor(url, city = 'Kiev', language = 'en', units = 'M') {
            this.language = language;
            this.units = units;
            this.city = city;
            this.url = url;
        }

        generateUrl() {
            this.url = `${this.url}?city=${this.city}&lang=${this.language}&units=${this.units}&key=${APIKEY}`;
        }
    }

    // Weather forecast for one day
    class CurrentWeather extends Weather {
        constructor(url, city, hours = 24, language = 'en', units = 'M') {
            super(url, city, language, units);
            this.hours = hours;
        }

        changeUrl() {
            const regExp = /\/\?/;
            const regEx = /&key/;
            super.generateUrl();
            this.url = this.url.replace(regExp, '/hourly?');
            this.url = this.url.replace(regEx, `&hours=${this.hours}&key`);
        }

        async getRequestWeather() {
            this.changeUrl();
            try {
                const response = await fetch(this.url);
                const json = await response.json();
                return json;
            } catch (error) {
                console.error(error.message);
            }
        }

        async getCurrentWeather() {
            const data = await this.getRequestWeather();
            return data;
        }
    }

    // Wether forecast a week
    class WeeklyWeather extends CurrentWeather {
        constructor(url, city, days = 7, hours = 24, language = 'en', units = 'M') {
            super(url, city = 'Kiev', hours, language, units);
            this.days = days;
        }

        changeUrl() {
            const regExp = /\/\?/;
            const regEx = /&key/;
            super.generateUrl();
            this.url = this.url.replace(regExp, '/daily?');
            this.url = this.url.replace(regEx, `&days=${this.days}&key`);
        }

        async getRequestWeather() {
            const responseWeather = await super.getRequestWeather();
            return responseWeather;
        }

        async getWeeklyWeather() {
            const data = await this.getRequestWeather();
            return data;
        }
    }

    // PrintCurrentWeather on WebPage
    function printCurrentWeather() {
        const city = localStorage.getItem('city') || undefined;
        const table = document.querySelector('.table');
        try {
            (async () => {
                const response = await new CurrentWeather(urlWeather, `${city}`).getCurrentWeather();

                const selectors = ['.second', '.third', '.fourth', '.fifth', '.sixth', '.seventh', '.eighth', '.ninth'];
                selectors.forEach((selector) => {
                    const tdAll = table.querySelectorAll(selector);
                    const data = response.data.find((item) => {
                        return item.timestamp_local.slice(11, 13) == tdAll[0].textContent;
                    });

                    const {
                        clouds,
                        vis: visibility,
                        temp: temperature,
                        app_temp: feels_like,
                        pres: pressure,
                        wind_spd,
                        wind_cdir_full,
                        rh: humidity,
                        weather: {
                            icon,
                            description: title,
                        }
                    } = data;
                    const weatherInfo = [clouds, visibility, temperature, feels_like, pressure, wind_spd, wind_cdir_full, humidity, icon, title].map((item, i) => {
                        if (i !== 6 && i !== 8 && i !== 9) {
                            return item.toFixed(0);
                        }
                        return item;
                    });
                    tdAll[1].setAttribute('title', title);
                    tdAll.forEach((_, i, arr) => {
                        if (i + 1 > tdAll.length - 1) {
                            return;
                        }
                        arr[i + 1].textContent = weatherInfo[i];
                    });
                    tdAll[9].innerHTML = `<img style="width:70%; height:70%;" src="./img/icon/${icon}.png"> `;
                });
            })();
        } catch (e) {
            console.error(e);
        }

        hideTabContent();
        showTabContent();
    }

    if (localStorage.getItem('user')) {
        user.email = JSON.parse(localStorage.getItem('user')).email;
        displayFullAccess();

        if (localStorage.getItem('city')) {
            printCurrentWeather();
        }
    }

    inputCity.addEventListener('keydown', (event) => {
        if (event.key == 'Enter') {
            writeCityToLocalStorage();
            printCurrentWeather();
        }
    });

    inputSearch.addEventListener('click', (event) => {
        if (event.target.closest('svg')) {
            writeCityToLocalStorage();
            printCurrentWeather();
        }
    });

    document.querySelector('.user_rights').addEventListener("click", function () {
        printWeekForecast();
        printTwoWeeks();
    });

    document.querySelector('.penza').addEventListener("click", function () {
        localStorage.setItem('city', 'Penza');
        printCurrentWeather();
    });

    document.querySelector('.kharkov').addEventListener("click", function () {
        localStorage.setItem('city', 'Kharkov');
        printCurrentWeather();
    });

    document.querySelector('.polotsk').addEventListener("click", function () {
        localStorage.setItem('city', 'Polotsk');
        printCurrentWeather();
    });

    // Print Weekly Weather on WebPage
    async function printWeekForecast() {
        const API_KEY_Alex = "15138addb6d24cb58360212400bc16fe";
        const response = await fetch(`https://api.weatherbit.io/v2.0/forecast/daily?city=${localStorage.getItem('city')}&key=${API_KEY_Alex}`);
        if (response.ok) {
            const json = await response.json();
            for (let i = 0; i <= 10; i++) {
                for (let j = 0; j <= 7; j++) {
                    tableElement.rows[0].cells[j + 1].innerHTML = json['data'][`${j}`]['datetime'].slice(-5);
                    tableElement.rows[1].cells[j + 1].innerHTML = json['data'][`${j}`]['clouds'];
                    tableElement.rows[2].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['vis']);
                    tableElement.rows[3].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['temp']);
                    tableElement.rows[4].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['app_max_temp']);
                    tableElement.rows[5].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['pres']);
                    tableElement.rows[6].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['wind_spd']);
                    tableElement.rows[7].cells[j + 1].innerHTML = json['data'][`${j}`]['wind_cdir_full'];
                    tableElement.rows[8].cells[j + 1].innerHTML = json['data'][`${j}`]['rh'];
                    tableElement.rows[9].cells[j + 1].innerHTML = `${getRegularDate(json['data'][`${j}`]['sunrise_ts'])} - ${getRegularDate(json['data'][`${j}`]['sunset_ts'])}`;
                    tableElement.rows[10].cells[j + 1].innerHTML = `<img style="width: 50%; height: 50%;" src="./img/icon/${json['data'][`${j}`]['weather']['icon']}.png"> `;
                };
            };
            return;
        }
        return ("Ошибка HTTP: " + response.status);
    }

    // Print 2 Week Weather on WebPage
    async function printTwoWeeks() {
        const API_KEY_Alex = "15138addb6d24cb58360212400bc16fe";

        let response = await fetch(`https://api.weatherbit.io/v2.0/forecast/daily?city=${localStorage.getItem('city')}&key=${API_KEY_Alex}`);
        if (response.ok) {
            const json = await response.json();
            for (let i = 0; i <= 10; i++) {
                for (let j = 0; j <= 13; j++) {
                    tableElementTwoWeeks.rows[0].cells[j + 1].innerHTML = json['data'][`${j}`]['datetime'].slice(-5);
                    tableElementTwoWeeks.rows[1].cells[j + 1].innerHTML = json['data'][`${j}`]['clouds'];
                    tableElementTwoWeeks.rows[2].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['vis']);
                    tableElementTwoWeeks.rows[3].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['temp']);
                    tableElementTwoWeeks.rows[4].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['app_max_temp']);
                    tableElementTwoWeeks.rows[5].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['pres']);
                    tableElementTwoWeeks.rows[6].cells[j + 1].innerHTML = Math.round(json['data'][`${j}`]['wind_spd']);
                    tableElementTwoWeeks.rows[7].cells[j + 1].innerHTML = json['data'][`${j}`]['wind_cdir_full'];
                    tableElementTwoWeeks.rows[8].cells[j + 1].innerHTML = json['data'][`${j}`]['rh'];
                    tableElementTwoWeeks.rows[9].cells[j + 1].innerHTML = `${getRegularDate(json['data'][`${j}`]['sunrise_ts'])} - ${getRegularDate(json['data'][`${j}`]['sunset_ts'])}`;
                };
            };
            return
        }
        return ("Ошибка HTTP: " + response.status);
    }

    const dateOptions = {
        hour: 'numeric',
        minute: 'numeric',
    }

    function getRegularDate(msDate) {
        const date = new Date(0);
        date.setUTCSeconds(msDate);
        return date.toLocaleString("ru", dateOptions);
    }

    const tableElement = document.querySelector(".week__forecast");
    const tableElementTwoWeeks = document.querySelector(".two__weeks__forecast");

});