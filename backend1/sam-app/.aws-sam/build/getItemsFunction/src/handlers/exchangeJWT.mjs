import axios from 'axios';

const exchangeCodeForTokens = async (code, redirectUri) => {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', process.env.COGNITO_CLIENT_ID);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  try {
    const response = await axios.post(
    process.env.CognitoOAuthTokenEndpoint,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Token exchange error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error('Failed to exchange authorization code for tokens');
  }
};

export const handler = async (event) => {
  try {
    // Get code from request body
    const requestBody = JSON.parse(event.body || '{}');
    const code = requestBody.code;

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Authorization code is required in request body'
        })
      };
    }

    const tokens = await exchangeCodeForTokens(code, process.env.REDIRECT_URI);

    return {
      statusCode: 200,
      body: JSON.stringify(tokens)
    };

  } catch (error) {
    console.error('Lambda execution error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
};