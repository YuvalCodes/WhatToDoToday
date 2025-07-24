import React, {useState, useEffect} from 'react';

const OpenAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

function GetRecommendations() {

    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [coords, setCoords] = useState({});
    const [weatherData, setWeatherData] = useState('');
    const [aiResponse, setAIResponse] = useState('');

    useEffect(() => {
        async function fetchWeather() {
            if(!coords) return;
            try{
                const data = await getWeatherData(coords.latitude, coords.longitude);
                setWeatherData(JSON.stringify(data));
            } catch (error){
                console.log(error);
            }
        }
        fetchWeather();
    }, [coords])

    useEffect(() =>  {
        async function fetchRecommendations(){
            if(!weatherData) return;
            try {
                const AIresult = await getRecommendations();
                const reply = AIresult.choices?.[0]?.message?.content;
                setAIResponse(reply);
            } catch (error){
                console.log(error);
            }
        }
        fetchRecommendations();
    }, [weatherData]);

    function handleCityChange(event){
        setCity(event.target.value)
    };

    function handleProvinceChange(event){
        setProvince(event.target.value)
    };

    const findCoordinates = async() => {
        const name = `${city}`;
        const param = new URLSearchParams({
            name,
            count: "100",
            language: "en",
            format: "json",
            countryCodes: "CA"
        }).toString();
        try{
            const results = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${param}`);
            if(!results.ok){
                throw new Error(`Failed to find coordinates ${results.status}`);
            }
            const data = await results.json();
            if(data.results && data.results.length > 0){
                const match = data.results.find(item => item.admin1?.toLowerCase() === province.toLowerCase());

                if(match) {
                    console.log(match);
                    const latitude = match.latitude;
                    const longitude = match.longitude;
                    setCoords({latitude, longitude});
                } else {
                    console.log("no match")
                    setCoords(null);
                }
            } else {
                setCoords(null);
            }
        } catch (err){
            console.log(err);
        }
    }

    async function getWeatherData(latitude,longitude){
        const hParams = ['temperature_2m',
    'relative_humidity_2m',
    'dew_point_2m',
    'apparent_temperature',
    'precipitation_probability',
    'precipitation',
    'weather_code',
    'cloud_cover',
    'cloud_cover_low',
    'cloud_cover_mid',
    'cloud_cover_high',
    'visibility'
    ].join(',');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${hParams}&forecast_days=1&timezone=auto`;
        try{
            const result = await fetch(url);
            if(!result.ok){
                throw new Error("Failed to Retrieve Weather Data for given Coordinates");
            }
            const data = await result.json();
            return data;
        } catch (error){
            console.log(error);
        }
    }

    async function getRecommendations() {
        if(!weatherData) return;
        try{
            const messages = [
                {role: 'system', content: 'You are an activity recommender that suggests activities based on given weather data.'},
                {
                    role: 'user',
                    content:`Hello, I am in ${city}, ${province}, Here is the weather data for the day in JSON format: ${weatherData} \n Please first describe the weather for today and then 
                            recommend 5 activities suitable for today's weather, provide them with the name of the location,
                             a description of the event, and where its located.`
                
                }
            ];
            const APIBody = {
                model: "o4-mini",
                messages,
                temperature: 1
        };
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OpenAI_API_KEY}`
            },
            body: JSON.stringify(APIBody)
        });
        const result = await response.json();
        return result;
    } catch (error){
        console.error('OpenAI API error:', err);
    }
}

    

    return(
        <div className="city-province-input-container">
            <input type="text" value={city} onChange={handleCityChange}/>
            <input type="text" value={province} onChange={handleProvinceChange}/>
            <button onClick={findCoordinates}>Get Recommendations!</button>
            <p>{aiResponse}</p>
        </div>
    )

}

export default GetRecommendations