// vue.config.js
module.exports = {
  transpileDependencies: [/\bvue-awesome\b/],
  devServer: {
    proxy: 'https://api.hkfcloud.net/'
  }
};
