<template>
  <b-container>
    <b-row>
      <b-col>
        <b-button v-on:click="getRuns">
          <!-- <b-form-select
            :value="row.value"
            v-on:change="getSelectedItem($event, row)"
            :options="profiles"
          ></b-form-select> -->
          <b-icon
            icon="arrow-clockwise"
            v-bind:animation="loading"
            font-scale="1"
          ></b-icon>
        </b-button>
        Request Data For
      </b-col>
      <b-col>
        <b-row>
          <b-col>
            From
          </b-col>
          <b-col>
            <b-form-datepicker
              id="datepicker"
              v-model="start"
              class="mb-2"
            ></b-form-datepicker>
          </b-col>
        </b-row>

        <b-row>
          <b-col>
            To
          </b-col>
          <b-col>
            <b-form-datepicker
              id="datepicker"
              v-model="stop"
              class="mb-2"
            ></b-form-datepicker>
          </b-col>
        </b-row>
      </b-col>
    </b-row>

    <div>
      <b-table hover :items="data" :fields="tableFields">
        <template v-slot:cell(Download)="row">
          <b-button
            size="sm"
            id="download"
            @click="download(row.item, row.index, $event.target)"
            class="mr-2"
          >
            DOWNLOAD
          </b-button>
        </template>
      </b-table>
    </div>
  </b-container>
</template>

<script>
import { mapState } from "vuex";
import Amplify from "@aws-amplify/core";

const Logger = Amplify.Logger;
Logger.LOG_LEVEL = "DEBUG"; // to show detailed logs from Amplify library
const logger = new Logger("picker");

export default {
  data() {
    return {
      tableFields: ["SerialId", "Start", "Stop", "Download"],
      data: null,
      loading: null,
      start: "",
      stop: ""
    };
  },
  methods: {
    download(item) {
      var unitEndPoint =
        process.env.VUE_APP_API_ROOT +
        "/dev/tenant/runs/" +
        item.SerialId +
        "/data";
      logger.debug(unitEndPoint);
      logger.debug(item);

      this.$http
        .get(unitEndPoint, { params: { start: item.Start } })
        .then(response => {
          logger.debug(response);
          let p = JSON.parse(response.data.Data);

          let headers = {
            Time: "Time",
            GC_PID_VALUE: "GC PID Value",
            TVOC_PID_VALUE: "TVOC PID Value",
            SEQUENCE_OPERATION_STEP: "Sequence Step"
          };

          let start = new Date(p[0].RawTime);
          logger.debug(start.toISOString());
          this.exportCSVFile(
            headers,
            p,
            item.SerialId + "-" + start.toISOString()
          );
        });
    },
    convertToCSV(objArray) {
      var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
      var str = "";

      for (var i = 0; i < array.length; i++) {
        var line = "";
        for (var index in array[i]) {
          if (line != "") line += ",";

          line += array[i][index];
        }

        str += line + "\r\n";
      }

      return str;
    },
    exportCSVFile(headers, items, fileTitle) {
      if (headers) {
        items.unshift(headers);
      }

      // Convert Object to JSON
      var jsonObject = JSON.stringify(items);

      var csv = this.convertToCSV(jsonObject);

      var exportedFilenmae = fileTitle + ".csv" || "export.csv";

      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
      } else {
        var link = document.createElement("a");
        if (link.download !== undefined) {
          // feature detection
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", exportedFilenmae);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    },
    fetch: function() {
      try {
        logger.debug("Fetching data");
        this.loading = "spin";
        this.info = null;
        this.$http.defaults.headers.common["Authorization"] = this.token;

        this.$http
          .get(process.env.VUE_APP_API_ROOT + "/dev/tenant/serials")
          .then(response => {
            for (const tmp of response.data) {
              this.$store.dispatch("maka/newSerial", { serial: tmp.SerialId });
            }
          });
      } catch (err) {
        logger.debug("error ", err);
      }
    },
    getRuns: function() {
      try {
        logger.debug("Fetching data");
        logger.debug(this.serials);
        this.loading = "spin";
        this.$http.defaults.headers.common["Authorization"] = this.token;
        this.data = [];
        let from = new Date(this.start + " 00:00:00");
        let to = new Date(this.stop + " 00:00:00");

        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 0);

        logger.debug("from " + this.start);
        logger.debug("to " + this.stop);
        logger.debug(from);
        logger.debug(to);
        logger.debug(from.toISOString());
        logger.debug(to.toISOString());

        for (const serial of this.serials) {
          this.$http
            .get(
              process.env.VUE_APP_API_ROOT +
                "/dev/tenant/runs/" +
                serial +
                "/list",
              {
                params: { from: from.toISOString(), to: to.toISOString() }
              }
            )
            .then(response => {
              this.loading = null;

              logger.debug(response);

              for (const s of response.data) {
                let tmp = {
                  SerialId: serial,
                  Start: s.start
                  // Stop: s.stop
                };
                this.data.push(tmp);
              }

              // logger.debug("control ", response.data);
            });
        }
      } catch (err) {
        logger.debug("error ", err);
      }
    }
  },
  mounted() {
    const date = new Date();
    this.datewindow =
      "" + date.getFullYear() + "/" + date.getMonth() + "/" + date.getDate();
    this.fetch()
  },
  computed: {
    ...mapState({
      serials: state => state.maka.serials,
      token: state => state.auth.user.signInUserSession.idToken.jwtToken
    })
  }
};
</script>
