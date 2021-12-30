import Amplify from "@aws-amplify/core";

const Logger = Amplify.Logger;
Logger.LOG_LEVEL = "DEBUG"; // to show detailed logs from Amplify library
const logger = new Logger("store:maka");

// initial state
const state = {
  serials: new Set()
};

const getters = {
  serials: state => {
    return state.serials;
  }
};

const mutations = {
  setAddSerial(state, newSerial) {
    if (!(state.serials instanceof Set)) {
      logger.debug("initializing serial set");
      state.serials = new Set();
    }
    state.serials.add(newSerial);
  }
};

const actions = {
  newSerial: async (context, params) => {
    logger.debug("serial ", params.serial);
    context.commit("setAddSerial", params.serial);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
