export default async function handler (req,res) {

    const apiKey = process.env.OPENAI_API_KEY;

    if (req.method !== 'POST'){
        return res.status(405).json({error: 'Method not allowed'});
    }

    const {city, province, weatherData } = req.body;

    const messages = [
        {
            role: 'system', 
            content: `You are an activity recommender that suggests activities based on given weather data, respond with a signle JSON object eactly in this format.
         
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

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "o4-mini",
        messages,
        temperature: 1
      })
    });

    const data = await response.json();
    const message = data.choices[0].message.content;
    const parsed = JSON.parse(message);
    return res.status(200).json(parsed);
} catch (err){
    console.error("Backend OpenAI error:", err);
    return res.status(500).json({ error: "Failed to fetch AI response" });
}
}