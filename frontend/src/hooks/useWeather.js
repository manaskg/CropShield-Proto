import { useState, useEffect } from 'react';

function getWeatherCondition(code, lang) {
  const isHindi = lang === 'hi';
  const isBengali = lang === 'bn';

  if (code === 0) return isHindi ? 'साफ़ आसमान' : isBengali ? 'পরিষ্কার আকাশ' : 'Clear sky';
  if (code >= 1 && code <= 3) return isHindi ? 'आंशिक बादल' : isBengali ? 'আংশিক মেঘলা' : 'Partly cloudy';
  if (code >= 45 && code <= 48) return isHindi ? 'कोहरा' : isBengali ? 'কুয়াশা' : 'Foggy';
  if (code >= 51 && code <= 67) return isHindi ? 'बारिश' : isBengali ? 'বৃষ্টি' : 'Rain';
  if (code >= 71 && code <= 77) return isHindi ? 'बर्फबारी' : isBengali ? 'তুষারপাত' : 'Snow';
  if (code >= 80 && code <= 82) return isHindi ? 'बारिश की बौछारें' : isBengali ? 'বৃষ্টির ঝাপটা' : 'Rain showers';
  if (code >= 95 && code <= 99) return isHindi ? 'आंधी-तूफान' : isBengali ? 'বজ্রসহ বৃষ্টি' : 'Thunderstorm';
  return isHindi ? 'साफ़' : isBengali ? 'পরিষ্কার' : 'Clear';
}

function getWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export const fetchWeather = async (lang = 'en') => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({
        temperature: 28,
        humidity: 65,
        condition: getWeatherCondition(1, lang),
        windSpeed: '12 km/h',
        windDirection: 'NE',
        isRainy: false,
      });
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m`
          );
          if (!response.ok) throw new Error('Weather fetch failed');
          const data = await response.json();
          const current = data.current;
          const isRainy = (current.weather_code >= 51 && current.weather_code <= 67) || (current.weather_code >= 80 && current.weather_code <= 82);

          resolve({
            temperature: Math.round(current.temperature_2m),
            humidity: current.relative_humidity_2m,
            condition: getWeatherCondition(current.weather_code, lang),
            windSpeed: `${Math.round(current.wind_speed_10m)} km/h`,
            windDirection: getWindDirection(current.wind_direction_10m),
            isRainy,
          });
        } catch (e) {
          resolve({
            temperature: 28,
            humidity: 65,
            condition: getWeatherCondition(1, lang),
            windSpeed: '10 km/h',
            windDirection: 'E',
            isRainy: false,
          });
        }
      },
      () => {
        // Fallback on permission denied
        resolve({
          temperature: 28,
          humidity: 65,
          condition: getWeatherCondition(1, lang),
          windSpeed: '10 km/h',
          windDirection: 'NE',
          isRainy: false,
        });
      },
      { timeout: 8000 }
    );
  });
};

export const useWeather = (lang = 'en') => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchWeather(lang).then((data) => {
      if (isMounted) {
        setWeather(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [lang]);

  return { weather, loading };
};
