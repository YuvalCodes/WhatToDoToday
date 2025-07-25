import React, {useState, useEffect} from 'react';

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
        raining: '/weather-showers-scattered.svg',
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
            const response = await fetch('/api/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    city,
                    province,
                    weatherData
                })
            });
            if(!response.ok){
                throw new Error(`Failed to get AI response: ${response.status}`);
            }
            const parsedresp = await response.json();
            return parsedresp
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