const config = {
  // To get the AWS Credentials, you need to configure
  // the Auth module with your Cognito Federated Identity Pool
  Auth: {
    identityPoolId: process.env.VUE_APP_IDENTITY_POOL_ID,
    region: process.env.VUE_APP_AWS_REGION,
    userPoolId: process.env.VUE_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.VUE_APP_USER_POOL_WEB_CLIENT_ID,
    mandatorySignIn: true,
    clientMetadata: { app: "cognito-vue-bootstrap" }
  },
  Analytics: {
    disabled: true,
    autoSessionRecord: true,
    AWSPinpoint: {
      appId: process.env.VUE_APP_PINPOINT_APP_ID,
      region: process.env.VUE_APP_AWS_REGION
    }
  }
};

export default config;
