const defaultCity = 'Austin'; // Replace with a valid city name

let currentUnit = 'imperial'; // Global unit variable


document.getElementById('search-button').addEventListener('click', function () {
    const city = document.getElementById('city-input').value;
    if (city) {
        fetchWeatherData(city);
    } else {
        alert("Please enter a city name.");
    }
});


window.onload = function () {
    currentUnit = localStorage.getItem('preferredUnit') || 'imperial';
    initializeUnitToggle(currentUnit);
    loadUserLocationWeather(currentUnit);
    generateCityLinks();
    displaySearchHistory();
};

function initializeUnitToggle() {
    document.getElementById('unit-toggle').setAttribute('data-unit', currentUnit);
    document.getElementById('unit-toggle').textContent = currentUnit === 'metric' ? 'Metric' : 'Imperial';
    console.log("Unit changed to:", currentUnit); // Add this line for debugging

    document.getElementById('unit-toggle').addEventListener('click', function () {
        currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';

        this.setAttribute('data-unit', currentUnit);
        this.textContent = currentUnit === 'metric' ? 'Metric' : 'Imperial';

        localStorage.setItem('preferredUnit', currentUnit);
        updateApplicationForUnit();
    });
}

function updateApplicationForUnit() {
    const lastSearchedCity = localStorage.getItem('lastSearchedCity')
    fetchWeatherData(lastSearchedCity, currentUnit);
    generateCityLinks();
    displaySearchHistory();
}

function loadUserLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
        }, error => {
            console.error('Error:', error);
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('error-message').textContent = 'Unable to retrieve your location for weather information.';
            fetchWeatherData(defaultCity, currentUnit);
        });
    } else {
        console.log('Geolocation is not supported by this browser.');
        fetchWeatherData(defaultCity, currentUnit);
    }
}

function fetchWeatherData(city = defaultCity, unit = currentUnit) {
    showLoadingIndicator();
    const apiKey = 'de0b781cf9227d6db6916820dd85db21';
    const encodedCity = encodeURIComponent(city);
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&units=${currentUnit}`;


    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.cod && data.cod !== '200') {
                throw new Error(data.message || 'Failed to fetch weather data');
            }
            displayCurrentWeather(data);
            displayForecast(data);
            updateSearchHistory(city);
            hideLoadingIndicator();
        })

        .catch(error => {
            console.error('Error:', error);
            displayErrorMessage(error.message || 'An error occurred');
            hideLoadingIndicator();
        });
}


function displayCurrentWeather(data) {
    const isCurrentWeather = !Array.isArray(data.list);
    const weatherData = isCurrentWeather ? data : data.list[0];
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const windSpeedUnit = currentUnit === 'metric' ? 'm/s' : 'MPH';
    const windSpeed = currentUnit === 'metric' ? weatherData.wind.speed : (weatherData.wind.speed * 2.23694).toFixed(1);
    const weatherHtml = `
        <h2>Current Weather in ${isCurrentWeather ? data.name : data.city.name}</h2>
        <p><strong>Date:</strong> ${new Date(isCurrentWeather ? data.dt * 1000 : weatherData.dt_txt).toLocaleDateString()}</p>
        <p><strong>Temperature:</strong> ${weatherData.main.temp} ${tempUnit}</p>
        <p><strong>Humidity:</strong> ${weatherData.main.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${windSpeed} ${windSpeedUnit}</p>
        <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png" alt="Weather icon">
    `;
    document.getElementById('current-weather').innerHTML = weatherHtml;
}



function displayForecast(data) {
    let forecastHtml = '<h2>5-Day Forecast</h2>';
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const windSpeedUnit = currentUnit === 'metric' ? 'm/s' : 'MPH';

    // Start from the next day's data, assuming the first item in the list is today's weather
    // If the first item in the list starts at a time indicating today, skip 8 intervals ahead
    let startIndex = data.list[0].dt_txt.indexOf("00:00:00") !== -1 ? 8 : 1;

    for (let i = startIndex; i < data.list.length; i += 8) { // Increment by 8 for every 24 hour period
        const dayForecast = data.list[i];
        const windSpeed = currentUnit === 'metric' ? dayForecast.wind.speed : (dayForecast.wind.speed * 2.23694).toFixed(1);

        forecastHtml += `
            <div class="forecast-item">
                <h3>${new Date(dayForecast.dt_txt).toLocaleDateString()}</h3>
                <img src="https://openweathermap.org/img/wn/${dayForecast.weather[0].icon}.png" alt="Weather icon">
                <p>Temp: ${dayForecast.main.temp} ${tempUnit}</p>
                <p>Humidity: ${dayForecast.main.humidity}%</p>
                <p>Wind Speed: ${windSpeed} ${windSpeedUnit}</p>
            </div>
        `;
    }
    document.getElementById('forecast').innerHTML = forecastHtml;
}

function updateSearchHistory(city) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    if (!history.includes(city)) {
        history.push(city);
        if (history.length > 5) {
            history = history.slice(-5);
        }
        localStorage.setItem('searchHistory', JSON.stringify(history));
    }
    displaySearchHistory();
}


function displaySearchHistory() {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    let historyHtml = '<h3>Search History</h3>';
    history.forEach(city => {
        historyHtml += `<button class="history-btn" onclick="fetchWeatherData('${city}', '${currentUnit}')">${city}</button>`;
    });
    document.getElementById('search-history').innerHTML = historyHtml;
}



// Function to generate links for top cities
function generateCityLinks() {
    const topWorldCities = ['Tokyo', 'Paris', 'London', 'Sidney', 'Rome'];
    let worldCitiesHtml = topWorldCities.map(city =>
        `<a href="#" onclick="fetchWeatherData('${city}', '${currentUnit}')">${city}</a>`
    ).join('');
    document.querySelector('#quick-links .links-container.world').innerHTML = worldCitiesHtml;
}
generateCityLinks();

document.getElementById('theme-toggle').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    this.classList.toggle('dark-mode-active');
    this.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
});

const preferredUnit = localStorage.getItem('preferredUnit') || 'metric';
document.getElementById('unit-toggle').setAttribute('data-unit', preferredUnit);
document.getElementById('unit-toggle').textContent = preferredUnit === 'metric' ? 'Imperial' : 'Metric';
fetchWeatherData(defaultCity, preferredUnit);

function fetchWeatherByCoordinates(lat, lon) {
    const apiKey = 'de0b781cf9227d6db6916820dd85db21';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.cod !== 200) {
                throw new Error('Failed to fetch weather data');
            }
            displayCurrentWeather(data);

        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
}

function displayErrorMessage(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-message').style.display = 'block';
}
function showLoadingIndicator() {
    document.getElementById('loading-indicator').style.display = 'block';
}

function hideLoadingIndicator() {
    document.getElementById('loading-indicator').style.display = 'none';
}



