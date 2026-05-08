const axios = require('axios');

async function checkApi() {
  try {
    const response = await axios.get('http://localhost:3001/api/flash-sales?status=active');
    console.log('API_RESPONSE_START');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('API_RESPONSE_END');
  } catch (err) {
    console.error('API_ERROR:', err.message);
    if (err.response) {
      console.error('DATA:', err.response.data);
    }
  }
}

checkApi();
