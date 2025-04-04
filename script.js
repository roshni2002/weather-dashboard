const apiKey = "F4TVF5S69L2HBRNUJNLFL8MGX";
let windChart;

async function fetchWeather(location = "") {
    if (!location) {
        location = document.getElementById("locationInput").value || "Delhi";
    }

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&elements=datetime,temp,tempmin,tempmax,precip,precipprob,humidity,conditions,icon,windspeed,windgust,winddir&include=hours,current&key=${apiKey}&contentType=json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Invalid location");
        }
        const data = await response.json();
        const current = data.currentConditions;

        // Update the location title in the current weather section
        document.getElementById("current-location").innerText = `Current Weather for ${location}`;

        // Set background based on conditions
        setDynamicBackground(current.conditions);

        document.getElementById("temp").innerText = document.getElementById("showTemp").checked ? current.temp : "Hidden";
        document.getElementById("wind").innerText = document.getElementById("showWind").checked ? current.windspeed : "Hidden";
        document.getElementById("gust").innerText = document.getElementById("showGust").checked ? current.windgust ?? "N/A" : "Hidden";

        document.getElementById("precip").innerText = `${current.precip ?? 0} mm`;
        document.getElementById("precipProb").innerText = `${current.precipprob ?? 0}%`;
        document.getElementById("humidity").innerText = `${current.humidity ?? 0}%`;
        document.getElementById("conditions").textContent = current.conditions ?? "N/A";

        // Handle Wind Direction and Compass Rotation
        if (current.winddir !== undefined) {
            document.getElementById("winddir").innerText = `${getCompassDirection(current.winddir)} (${current.winddir}°)`;
            document.getElementById("windCompass").style.transform = `rotate(${current.winddir}deg)`;
            document.getElementById("windCompass").style.display = "block";
        } else {
            document.getElementById("winddir").innerText = "N/A";
            document.getElementById("windCompass").style.display = "none";
        }

        const hours = data.days[0].hours;
        updateWindTable(hours);
        updateWindChart(hours);
        updateForecast(data.days.slice(0, 5));
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("Invalid location. Please try again.");
    }
}

function setDynamicBackground(condition) {
    const lower = condition.toLowerCase();

    if (lower.includes("rain")) {
        document.body.style.backgroundImage = "url('images/rainy.jpg')";
    } else if (lower.includes("cloud")) {
        document.body.style.backgroundImage = "url('images/cloudy.jpg')";
    } else if (lower.includes("snow")) {
        document.body.style.backgroundImage = "url('images/snowy.jpg')";
    } else if (lower.includes("clear") || lower.includes("sunny")) {
        document.body.style.backgroundImage = "url('images/sunny.jpg')";
    } else {
        document.body.style.backgroundImage = "url('images/default.jpg')";
    }

    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
}

function updateWindTable(hours) {
    const tbody = document.getElementById("windTableBody");
    tbody.innerHTML = "";

    hours.slice(0, 24).forEach(hour => {
        let time = hour.datetime.includes("T") ? hour.datetime.split("T")[1] : hour.datetime;
        tbody.innerHTML += `
            <tr>
                <td>${time}</td>
                <td>${hour.windspeed ?? "N/A"} km/h</td>
                <td>${hour.windgust ?? "N/A"} km/h</td>
            </tr>
        `;
    });
}

function updateWindChart(hours) {
    const ctx = document.getElementById("windChart").getContext("2d");
    const labels = hours.slice(0, 24).map(h => h.datetime.includes("T") ? h.datetime.split("T")[1] : h.datetime);
    const windSpeeds = hours.slice(0, 24).map(h => h.windspeed);
    const windGusts = hours.slice(0, 24).map(h => h.windgust);

    if (windChart) windChart.destroy();

    const isLight = document.body.classList.contains("light-mode");

    windChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Wind Speed (km/h)',
                    data: windSpeeds,
                    borderColor: '#ff0000', // Red line color
                    backgroundColor: 'rgba(255, 0, 0, 0.1)', // Light red fill area
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Wind Gust (km/h)',
                    data: windGusts,
                    borderColor: '#00897b', // Green line color
                    backgroundColor: 'rgba(0, 137, 123, 0.1)', // Light green fill area
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: isLight ? '#111' : 'white' }
                }
            },
            scales: {
                x: {
                    ticks: { color: isLight ? '#111' : 'white' }
                },
                y: {
                    ticks: { color: isLight ? '#111' : 'white' }
                }
            }
        }
    });
}

function updateForecast(days) {
    const emojiMap = {
        "clear-day": "☀️", "clear-night": "🌕", "partly-cloudy-day": "⛅", "partly-cloudy-night": "☁️",
        "rain": "🌧️", "snow": "❄️", "wind": "💨", "fog": "🌫️", "cloudy": "☁️", "hail": "🌨️",
        "thunderstorm": "⛈️", "tornado": "🌪️", "clear": "☀️", "partly-cloudy": "⛅"
    };

    const container = document.getElementById("forecastContainer");
    container.innerHTML = "";

    days.forEach(day => {
        const card = document.createElement("div");
        card.className = "forecast-card";

        const image = new Image();
        const iconName = day.icon.toLowerCase();
        const iconUrl = `https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/1st%20Set/color/${iconName}.png`;
        image.src = iconUrl;
        image.alt = day.conditions;
        image.onerror = () => {
            image.remove();
            const emoji = document.createElement("div");
            emoji.className = "weather-emoji";
            emoji.innerText = emojiMap[iconName] || "❓";
            card.querySelector(".icon-container").appendChild(emoji);
        };

        card.innerHTML = `
            <h3>${day.datetime}</h3>
            <div class="icon-container"></div>
            <p>🌡️ Min: ${day.tempmin}°C | Max: ${day.tempmax}°C</p>
            <p>💨 Wind: ${day.windspeed} km/h</p>
            <p>🌬️ Gust: ${day.windgust ?? "N/A"} km/h</p>
            <p>☁️ ${day.conditions}</p>
        `;

        card.querySelector(".icon-container").appendChild(image);
        container.appendChild(card);
    });
}

function getCompassDirection(degrees) {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    document.body.classList.toggle("dark-mode");
    const event = new Event("themeChange");
    window.dispatchEvent(event);
}

function exportForecastToCSV() {
    const cards = document.querySelectorAll('.forecast-card');
    let csv = "Date,Min Temp,Max Temp,Wind,Gust,Conditions\n";
    cards.forEach(card => {
        const lines = card.innerText.trim().split("\n");
        csv += `${lines[0]},${lines[2].split('|')[0].split(':')[1].trim()},${lines[2].split('|')[1].split(':')[1].trim()},${lines[3].split(':')[1].trim()},${lines[4].split(':')[1].trim()},${lines[5].split(':')[1].trim()}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "forecast.csv";
    link.click();
}

function exportForecastToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("5-Day Forecast", 10, 10);

    const cards = document.querySelectorAll('.forecast-card');
    let y = 20;
    cards.forEach(card => {
        const lines = card.innerText.trim().split("\n");
        lines.forEach(line => {
            doc.text(line, 10, y);
            y += 7;
        });
        y += 5;
    });

    doc.save("forecast.pdf");
}

function detectLocationAndFetch() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
                fetchWeather(coords);
            },
            () => fetchWeather()
        );
    } else {
        fetchWeather();
    }
}

window.onload = detectLocationAndFetch;

window.addEventListener("themeChange", () => {
    fetchWeather(document.getElementById("locationInput").value);
});
