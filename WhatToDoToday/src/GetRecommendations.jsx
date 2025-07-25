import React, {useState, useEffect} from 'react';

const OpenAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

function GetRecommendations() {

    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [coords, setCoords] = useState(null);
    const [weatherData, setWeatherData] = useState('');
    const [aiResponse, setAIResponse] = useState({
        weather: "",
        keyword: "",
        activities: []
    });
    const[keyword, setKeyword] = useState('');
    const[aiLoading, setAILoading] = useState(false);

    const weatherIconMap = {
        sunny: '/weather-clear.svg',
        cloudy: '/weather-few-clouds.svg',
        raining: '/weather-showers-scatter.svg',
        snowing: '/sivvus_weater_symbols_5.svg'
    };

    useEffect(() => {
        async function fetchWeather() {
            if(!coords?.latitude) return;
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
                setAIResponse(AIresult);
            } catch (error){
                console.log(error);
            }
        }
        fetchRecommendations();
    }, [weatherData]);

    useEffect(() => {
        setKeyword(aiResponse.keyword);
    }, [aiResponse]);

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
        setAILoading(true);
        if(!weatherData) return;
        try{
            const messages = [
                {role: 'system', content: `You are an activity recommender that suggests activities based on given weather data, respond with a signle JSON object eactly in this format.
                    
                    {
                        "weather": "<short description of today's weather>",
                        "keyword": "<one of these four options based on the weather, sunny, cloudy, raining, snowing>",
                        "activities": [
                            {
                            "name": "<activity name>",
                            "description": "<brief description of the activity>",
                            "location": "<where it happens, address if possible>"
                            }
                        ]
                    }`
                },
                {
                    role: 'user',
                    content:`Hello, I am in ${city}, ${province}, Here is the weather data for the day in JSON format: ${weatherData} \n Please first describe the weather for today and then 
                            recommend 5 activities suitable for today's weather, provide them with the name of the location,
                             a description of the event, and where its located. Here is the JSON format I want you to follow`
                
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
        const json = await response.json();
        console.log(json);
        const resp = json.choices[0].message.content;
        const parsedresp = JSON.parse(resp);
        return parsedresp;
    } catch (error){
        console.error('OpenAI API error:', error);
    } finally {
        setAILoading(false);
    }
}

    

    return(
        <>
        <h1 className="title-wtdt">What To do Today?</h1>
        <div className="city-province-input-container">
            <input className="city-input" type="text" value={city} onChange={handleCityChange} placeholder='Canadian city'/>
            <input className= "province-input" type="text" value={province} onChange={handleProvinceChange} placeholder='Province/Territory'/>
            <button className="gr-button" onClick={findCoordinates}>Get Recommendations!</button>
        </div>
        <div className= "weather-activities-container">
            {aiLoading ? <p>Loading response...</p> : null}
            <h2>Weather</h2>
            {keyword ? <img src={weatherIconMap[keyword]} alt={keyword} className="weather-icon"/> : null}
            <p className="weather-desc">{aiResponse.weather}</p>
            <h2>Activities</h2>
            <ul>
                {aiResponse.activities.map((a,i) => (
                    <li key= {i}>
                        <strong className="act-name">{a.name}</strong>
                        <p className="act-desc">{a.description}</p>
                        <em className="act-location">{a.location}</em>
                    </li>
                ))}
            </ul>
        </div>
        </>
    );

}

export default GetRecommendations