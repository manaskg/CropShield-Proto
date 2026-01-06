
import { WeatherData } from '../types';

// WMO Weather interpretation codes (simplified) with localization
function getWeatherCondition(code: number, lang: string): string {
  const isHindi = lang === 'hi';
  const isBengali = lang === 'bn';

  if (code === 0) return isHindi ? 'साफ़ आसमान' : isBengali ? 'পরিষ্কার আকাশ' : 'Clear sky';
  if (code >= 1 && code <= 3) return isHindi ? 'आंशिक बादल' : isBengali ? 'আংশিক মেঘলা' : 'Partly cloudy';
  if (code >= 45 && code <= 48) return isHindi ? 'कोहरा' : isBengali ? 'কুয়াশা' : 'Foggy';
  if (code >= 51 && code <= 67) return isHindi ? 'बारिश' : isBengali ? 'বৃষ্টি' : 'Rain';
  if (code >= 71 && code <= 77) return isHindi ? 'बर्फबारी' : isBengali ? 'তুষারপাত' : 'Snow';
  if (code >= 80 && code <= 82) return isHindi ? 'बारिश की बौछारें' : isBengali ? 'বৃষ্টির ঝাপটা' : 'Rain showers';
  if (code >= 95 && code <= 99) return isHindi ? 'आंधी-तूफान' : isBengali ? 'বজ্রসহ বৃষ্টি' : 'Thunderstorm';
  return isHindi ? 'अज्ञात' : isBengali ? 'অজানা' : 'Unknown';
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export const getLocalWeather = async (lang: string = 'en'): Promise<WeatherData | undefined> => {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported");
    return undefined;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Updated to use the 'current' parameter which supports humidity and wind
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m`
          );
          
          if (!response.ok) {
            throw new Error('Weather fetch failed');
          }

          const data = await response.json();
          const current = data.current;
          
          if (!current) {
             throw new Error('No current weather data');
          }

          const condition = getWeatherCondition(current.weather_code, lang);
          // Check against the English keywords for internal logic (rainy check)
          const conditionEn = getWeatherCondition(current.weather_code, 'en');
          const isRainy = conditionEn.toLowerCase().includes('rain') || conditionEn.toLowerCase().includes('shower') || conditionEn.toLowerCase().includes('thunder');

          resolve({
            temperature: current.temperature_2m,
            condition: condition,
            isRainy: isRainy,
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            windDirection: getWindDirection(current.wind_direction_10m),
            locationName: "Current Location",
            latitude: latitude,
            longitude: longitude
          });
        } catch (error) {
          console.error("Error fetching weather:", error);
          resolve(undefined);
        }
      },
      (error) => {
        console.warn("Geolocation permission denied or error:", error);
        resolve(undefined);
      }
    );
  });
};
