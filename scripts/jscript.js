// Define DEFAULT_CITY globally
const DEFAULT_CITY = 'Austin';

document.getElementById('search-button').addEventListener('click', function () {
    const city = document.getElementById('city-input').value;
    const unit = document.getElementById('unit-toggle').getAttribute('data-unit');
    fetchWeatherData(city, unit);
});

function fetchWeatherData(city, unit) {
    const apiKey = '9ad8154b296d191a807e5147e8cb2afd';
    const encodedCity = encodeURIComponent(city || 'Austin'); // Replace 'New York' with your chosen default city
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&units=${unit}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.cod && data.cod !== '200') {
                throw new Error(data.message || 'Failed to fetch weather data');
            }
            displayCurrentWeather(data, unit);
            displayForecast(data, unit);
            updateSearchHistory(city);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message || 'An error occurred');
        });
}

function displayCurrentWeather(data, unit) {
    if (!data || !data.main || !data.wind || !data.weather) {
        console.error('Invalid data structure for current weather');
        return;
    }

    const tempUnit = unit === 'metric' ? '°C' : '°F';
    const windSpeedUnit = unit === 'metric' ? 'm/s' : 'mph';
    const windSpeed = unit === 'metric' ? data.wind.speed : (data.wind.speed * 2.23694).toFixed(1);

    const weatherHtml = `
        <h2>Current Weather in ${data.name}</h2>
        <p><strong>Date:</strong> ${new Date(data.dt * 1000).toLocaleDateString()}</p>
        <p><strong>Temperature:</strong> ${data.main.temp} ${tempUnit}</p>
        <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${windSpeed} ${windSpeedUnit}</p>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="Weather icon">
    `;
    document.getElementById('current-weather').innerHTML = weatherHtml;
}


function displayForecast(data, unit) {
    console.log('Forecast data:', data); // Add this line to inspect the data structure
    if (!data || data.length === 0) {
        console.error('No forecast data available');
        return;
    }

    let forecastHtml = '<h2>5-Day Forecast</h2>';
    const tempUnit = unit === 'metric' ? '°C' : '°F';
    const windSpeedUnit = unit === 'metric' ? 'm/s' : 'MPH';

    for (let i = 0; i < Math.min(data.length, 5); i++) { // Limit to 5 days
        const dayForecast = data[i];
        const windSpeed = unit === 'metric' ? dayForecast.wind_speed : (dayForecast.wind_speed * 2.23694).toFixed(1);

        forecastHtml += `
            <div class="forecast-item">
                <h3>${new Date(dayForecast.dt * 1000).toLocaleDateString()}</h3>
                <img src="https://openweathermap.org/img/wn/${dayForecast.weather[0].icon}.png" alt="Weather icon">
                <p>Temp: ${dayForecast.temp.day} ${tempUnit}</p>
                <p>Humidity: ${dayForecast.humidity}%</p>
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

    }
    displaySearchHistory();
}

function displaySearchHistory() {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    let historyHtml = '<h3>Search History</h3>';
    let unit = document.getElementById('unit-toggle').getAttribute('data-unit'); // Get the current unit
    history.forEach(city => {
        // Correctly use fetchCurrentWeather for current weather
        historyHtml += `<button class="history-btn" onclick="fetchCurrentWeather('${city}', '${unit}')">${city}</button>`;
    });
    document.getElementById('search-history').innerHTML = historyHtml;
}

function fetchCurrentWeather(city, unit) {
    const apiKey = '9ad8154b296d191a807e5147e8cb2afd'; // Secure your API key
    const encodedCity = encodeURIComponent(city);
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodedCity}&limit=1&appid=${apiKey}`;

    fetch(geocodingUrl)
        .then(response => response.json())
        .then(locations => {
            if (locations.length > 0) {
                const { lat, lon } = locations[0];
                fetchWeatherByCoordinates(lat, lon, unit);
            } else {
                throw new Error('Location not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message || 'An error occurred during geocoding.');
        });
}



// Function to generate links for top cities
function generateCityLinks() {
    const topUSACities = ['Austin', 'New York', 'Los Angeles', 'Chicago', 'Seattle'];
    const topWorldCities = ['Tokyo', 'Paris', 'London', 'Sidney', 'Rome'];

    let usaCitiesHtml = topUSACities.map(city => `<a href="#" onclick="fetchWeatherData('${city}')">${city}</a>`).join('');
    let worldCitiesHtml = topWorldCities.map(city => `<a href="#" onclick="fetchWeatherData('${city}')">${city}</a>`).join('');

    document.querySelector('#quick-links .links-container.usa').innerHTML = usaCitiesHtml;
    document.querySelector('#quick-links .links-container.world').innerHTML = worldCitiesHtml;
}

generateCityLinks();

document.getElementById('theme-toggle').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    this.classList.toggle('dark-mode-active');
    this.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
});

document.getElementById('unit-toggle').addEventListener('click', function () {
    const currentUnit = this.getAttribute('data-unit');
    const newUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    this.setAttribute('data-unit', newUnit);
    this.textContent = newUnit === 'metric' ? 'Imperial' : 'Metric';
    localStorage.setItem('preferredUnit', newUnit);

    const city = document.getElementById('city-input').value;
    if (city) fetchWeatherData(city, newUnit);
});

const preferredUnit = localStorage.getItem('preferredUnit') || 'metric';
document.getElementById('unit-toggle').setAttribute('data-unit', preferredUnit);
document.getElementById('unit-toggle').textContent = preferredUnit === 'metric' ? 'Imperial' : 'Metric';
fetchWeatherData('DefaultCity', preferredUnit);

function fetchWeatherByCoordinates(lat, lon, unit) {
    const apiKey = '9ad8154b296d191a807e5147e8cb2afd';
    // Use One Call API to get both current weather and forecast
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${apiKey}&units=${unit}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.cod !== 200) {
                throw new Error('Failed to fetch weather data');
            }
            // The One Call API response includes current weather as `data.current`
            // and daily forecast as an array in `data.daily`
            displayCurrentWeather(data.current, unit); // You might need to adjust this function for the new data structure
            displayForecast(data.daily, unit); // This will need to be a new function or an adjusted version of your existing displayForecast
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
}


function loadUserLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const unit = document.getElementById('unit-toggle').getAttribute('data-unit');
            fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude, unit);
        }, error => {
            console.error('Error:', error);
            alert('Unable to retrieve your location for weather information.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

window.onload = () => {
    const unit = document.getElementById('unit-toggle').getAttribute('data-unit');

    // Fetch weather data for the default city
    fetchWeatherData(DEFAULT_CITY, unit);

    // Load user location weather if geolocation is supported
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude, unit);
        }, error => {
            console.error('Error:', error);
            alert('Unable to retrieve your location for weather information.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
};

