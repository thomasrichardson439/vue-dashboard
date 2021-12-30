<template>
  <b-container>
    <div>
      <b-button v-on:click="fetch">
        <b-icon
          icon="arrow-clockwise"
          v-bind:animation="loading"
          font-scale="2"
        ></b-icon>
      </b-button>
      <b-table hover :items="info" :fields="tableFields">
        <template v-slot:cell(COMMAND)="row"> </template>

        <template v-slot:cell(actions)="row">
          <b-button size="sm" @click="row.toggleDetails">
            {{ row.detailsShowing ? "Hide" : "Show" }} Details
          </b-button>
        </template>

        <template v-slot:cell(status)="row">
          {{ status(row.item.SEQUENCE_OPERATIONAL_STEP) }}
        </template>

        <template v-slot:row-details="row">
          <b-card>
            <!-- <ul>
              <li v-for="(value, key) in row.item" :key="key">
                {{ key }}: {{ value }}
              </li>
            </ul> -->

            <b-row>
              <b-col>
                Serial/IMEI:
              </b-col>
              <b-col> {{ row.item.SerialId }}/{{ row.item.IMEI }} </b-col>
            </b-row>

            <b-row>
              <b-col>
                Profile:
              </b-col>
              <b-col>
                <b-form-select
                  :value="row.item.PROFILE"
                  v-on:change="getSelectedItem($event, row)"
                  :options="profiles"
                />
              </b-col>
            </b-row>

            <b-row>
              <b-col>
                Control:
              </b-col>
              <b-col>
                <b-button
                  size="sm"
                  id="start"
                  v-bind:variant="
                    row.item.OPERATION_INSTRUCTION == 'start'
                      ? 'success'
                      : 'secondary'
                  "
                  @click="sendCommand(row.item, row.index, $event.target)"
                  class="mr-2"
                >
                  START
                </b-button>

                <b-button
                  size="sm"
                  id="stop"
                  v-bind:variant="
                    row.item.OPERATION_INSTRUCTION == 'stop'
                      ? 'success'
                      : 'secondary'
                  "
                  @click="sendCommand(row.item, row.index, $event.target)"
                  class="mr-2"
                >
                  STOP
                </b-button>

                <b-button
                  size="sm"
                  id="idle"
                  v-bind:variant="
                    row.item.OPERATION_INSTRUCTION == 'idle'
                      ? 'success'
                      : 'secondary'
                  "
                  @click="sendCommand(row.item, row.index, $event.target)"
                  class="mr-2"
                >
                  IDLE
                </b-button>
              </b-col>
            </b-row>
          </b-card>
        </template>
      </b-table>
    </div>
  </b-container>
</template>

<script>
import { mapState } from "vuex";
import Amplify from "@aws-amplify/core";
//import { component } from "vue/types/umd";
//import store from "@/store";

const Logger = Amplify.Logger;
Logger.LOG_LEVEL = "DEBUG"; // to show detailed logs from Amplify library
const logger = new Logger("dashboard");
var timerInterval;

export default {
  data() {
    return {
      tableFields: ["SerialId", "Status", "Actions"],
      info: null,
      profiles: [],
      loading: null,
      timer: null
    };
  },
  methods: {
    sendCommand(item, index, button) {
      var unitEndPoint = process.env.VUE_APP_API_ROOT + "/dev/admin/control";
      logger.debug(unitEndPoint);
      logger.debug(item);
      logger.debug({
        Command: button.id,
        SerialId: item.SerialId,
        Profile: item.PROFILE,
        IMEI: item.IMEI
      });
      item.OPERATION_INSTRUCTION = button.id;
      this.$http
        .post(unitEndPoint, {
          Command: button.id,
          SerialId: item.SerialId,
          Profile: item.PROFILE,
          IMEI: item.IMEI
        })
        .then(function(response) {
          logger.debug(response);
        });
    },
    getSelectedItem: function(newObjectState, objectId) {
      // Just a regular js function that takes 2 args
      logger.debug(newObjectState + " --- " + objectId);
      this.info[objectId.index].PROFILE = newObjectState;
      //updateObjectState(objectId, newObjectState);
    },
    fetch: function() {
      try {
        logger.debug("Fetching data");
        this.loading = "spin";
        //this.info = null;
        this.$http.defaults.headers.common["Authorization"] = this.token;
        this.$http
          .get(process.env.VUE_APP_API_ROOT + "/dev/admin/control")
          .then(response => {
            if (response == undefined || response.data == null) {
              return;
            }
            for (const x of response.data) {
              var match = false;
              for (var row of this.info) {
                if (x.SerialId == row.SerialId) {
                  x._showDetails = row._showDetails;
                  row = x;
                  match = true;
                  break;
                }
              }
              if (match == false) {
                this.info.append(x);
              }
            }
            this.info = response.data;
            this.loading = null;
            logger.debug("control ", this.info);
            for (const tmp of response.data) {
              this.$store.dispatch("maka/newSerial", { serial: tmp.SerialId });
            }
          });
        this.$http
          .get(process.env.VUE_APP_API_ROOT + "/dev/admin/profiles")
          .then(response => {
            if (response == undefined || response.data == null) {
              return;
            }
            this.profiles.length = 0;
            for (const x of response.data) {
              var choice = {};
              choice.text = x.Profile;
              choice.value = x.Profile;
              this.profiles.push(choice);
            }
            logger.debug("profiles ", this.profiles);
          });
      } catch (err) {
        logger.debug("error ", err);
      }
    },
    populateCol: function() {
      var newInfo = [];
      for (const element of this.info) {
        var tmp = element;
        tmp.Test = "";
        newInfo.push(tmp);
      }
      this.info = newInfo;
    },
    status(value) {
      switch (value) {
        case 0:
          return "IDLE";
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
          return "RUNNING";

        case 11:
        case 12:
          return "COOLING/COOLED";
        case 13:
          return "ABORT";

        default:
          return "UNKNOWN";
      }
    }
  },
  beforeDestroy() {
    logger.debug("tear down");
    clearInterval(timerInterval);
  },
  mounted() {
    try {
      this.$http.interceptors.response.use(
        function(response) {
          return response;
        },
        error => {
          if (401 === error.response.status) {
            logger.debug("TODO - issue redirect to login");
            this.$store.dispatch("auth/signOut");
            this.$router.push('signIn');
            clearInterval(timerInterval);
          } else {
            return Promise.reject(error);
          }
        }
      );
      this.$http.defaults.headers.common["Authorization"] = this.token;
      this.$http
        .get(process.env.VUE_APP_API_ROOT + "/dev/admin/control")
        .then(response => {
          if (response != undefined) {
            this.info = response.data;
          }
        });
      this.$http
        .get(process.env.VUE_APP_API_ROOT + "/dev/admin/profiles")
        .then(response => {
          if (response == undefined || response.data == null) {
            return;
          }
          this.profiles.length = 0;
          for (const x of response.data) {
            var choice = {};
            choice.text = x.Profile;
            choice.value = x.Profile;
            this.profiles.push(choice);
          }
          logger.debug("profiles ", this.profiles);
        });
    } catch (err) {
      logger.debug("error ", err);
    }

    logger.debug("start timer")
    timerInterval = setInterval(this.fetch, 30000);
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      token: state => state.auth.user.signInUserSession.idToken.jwtToken
    })
  }
};
</script>
